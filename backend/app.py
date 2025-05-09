from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import pickle
import os                                   # ← added

app = Flask(__name__)
CORS(app)

# ───────────────────────────────────────────
# Load trained model + feature columns
# ───────────────────────────────────────────
model, model_columns = pickle.load(open("model.sav", "rb"))

# Tenure-bin labels (same as training)
tenure_labels = [f"{i} - {i + 11}" for i in range(1, 72, 12)]


@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()

        # ───── Extract incoming values ─────
        contract       = data.get("Contract")
        paperless      = data.get("PaperlessBilling")
        payment_method = data.get("PaymentMethod")
        tenure         = int(data.get("tenure"))
        gender         = data.get("Gender")
        age            = int(data.get("Age"))

        # SeniorCitizen flag
        senior = 1 if age >= 60 else 0

        # ───── Build a single-row DataFrame ─────
        new_df = pd.DataFrame([{
            "Contract":        contract,
            "PaperlessBilling": paperless,
            "PaymentMethod":    payment_method,
            "tenure":           tenure,
            "gender":           gender,
            "SeniorCitizen":    senior
        }])

        # tenure → tenure_group
        new_df["tenure_group"] = pd.cut(
            new_df.tenure, range(1, 80, 12), right=False, labels=tenure_labels
        )
        new_df.drop(columns=["tenure"], inplace=True)

        # One-hot encode & align columns
        final_df = pd.get_dummies(new_df)
        X_input  = final_df.reindex(columns=model_columns, fill_value=0)

        # Predict
        pred       = model.predict(X_input)[0]
        confidence = model.predict_proba(X_input)[0][1]

        return jsonify({
            "prediction": int(pred),
            "confidence": round(confidence * 100, 2),
            "message": "Likely to churn" if pred == 1 else "Likely to stay"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ───────────────────────────────────────────
# Entry-point - bind to 0.0.0.0:$PORT for Render
# ───────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))   # Render provides PORT
    app.run(host="0.0.0.0", port=port, debug=True)
