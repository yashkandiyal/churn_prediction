from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import pickle

app = Flask(__name__)
CORS(app)

# ────────────────────────────────────────────────────────────
# Load the trained model + the feature columns used at train-time
# ────────────────────────────────────────────────────────────
model, model_columns = pickle.load(open("model.sav", "rb"))

# Tenure-bin labels (same as training)
tenure_labels = [f"{i} - {i + 11}" for i in range(1, 72, 12)]


@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()

        # ───── Extract incoming values ─────
        contract         = data.get("Contract")          # str
        paperless        = data.get("PaperlessBilling")  # "Yes"/"No"
        payment_method   = data.get("PaymentMethod")     # str
        tenure           = int(data.get("tenure"))       # months
        gender           = data.get("Gender")            # "Male"/"Female"
        age              = int(data.get("Age"))          # years

        # Derive SeniorCitizen flag from age (≥60 ⇒ 1)
        senior = 1 if age >= 60 else 0

        # ───── Build a one-row DataFrame ─────
        new_df = pd.DataFrame([{
            "Contract":        contract,
            "PaperlessBilling": paperless,
            "PaymentMethod":    payment_method,
            "tenure":           tenure,
            "gender":           gender,        # NEW
            "SeniorCitizen":    senior         # NEW
        }])

        # Convert tenure -> tenure_group (used during training)
        new_df["tenure_group"] = pd.cut(
            new_df.tenure, range(1, 80, 12), right=False, labels=tenure_labels
        )
        new_df.drop(columns=["tenure"], inplace=True)

        # ───── One-hot encode categorical features ─────
        final_df = pd.get_dummies(new_df)

        # Align columns with training set (fill missing with 0)
        X_input = final_df.reindex(columns=model_columns, fill_value=0)

        # ───── Predict ─────
        pred        = model.predict(X_input)[0]
        confidence  = model.predict_proba(X_input)[0][1]   # probability of class 1

        return jsonify({
            "prediction":  int(pred),
            "confidence":  round(confidence * 100, 2),
            "message":     "Likely to churn" if pred == 1 else "Likely to stay"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
