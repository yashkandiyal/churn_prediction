import type { ChangeEvent, FormEvent } from "react";
import { useState, useEffect } from "react"; import {
  CheckCircle,
  AlertCircle,
  RefreshCw,
  CreditCard,
  FileText,
  Calendar,
  User,
} from "lucide-react";

type FormData = {
  contract: string;
  paperlessBilling: string;
  paymentMethod: string;
  tenure: string;
  gender: string;   
  age: string;      
};

type ChurnPrediction = {
  isLikelyToChurn: boolean;
  confidence: number;
};

export default function CustomerContractForm() {
  const [formData, setFormData] = useState<FormData>({
    contract: "Month-to-month",
    paperlessBilling: "No",
    paymentMethod: "Electronic check",
    tenure: "2",
    gender: "Male",  
    age: "30",        
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [churnPrediction, setChurnPrediction] =
    useState<ChurnPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [fadeIn, setFadeIn] = useState(false);


  useEffect(() => {
    setFadeIn(true);
    document.documentElement.style.setProperty("--hue", "220");
    const interval = setInterval(() => {
      const root = document.documentElement;
      const currentHue = parseInt(
        getComputedStyle(root).getPropertyValue("--hue") || "220"
      );
      root.style.setProperty("--hue", ((currentHue + 0.5) % 360).toString());
    }, 100);
    return () => clearInterval(interval);
  }, []);

  /* ---------- helpers ---------- */
  const handleChange = (
    e: ChangeEvent<HTMLSelectElement> | ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const API_BASE =
      import.meta.env.VITE_API_URL ?? "http://localhost:5000"; // dev fallback

    try {
      const res = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Contract: formData.contract,
          PaperlessBilling: formData.paperlessBilling,
          tenure: Number(formData.tenure),  
          PaymentMethod: formData.paymentMethod,
          Gender: formData.gender,
          Age: Number(formData.age),        
        }),
      });
      const result = await res.json();
      if (result.error) {
        console.error("Prediction Error:", result.error);
        alert(result.error);
      } else {
        setChurnPrediction({
          isLikelyToChurn: result.prediction === 1,
          confidence: result.confidence,
        });
        setIsSubmitted(true);
      }
    } catch (err) {
      console.error("API Error:", err);
      alert("API request failed.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------- option arrays ---------- */
  const contractOptions = ["Month-to-month", "One year", "Two year"];
  const billingOptions = ["Yes", "No"];
  const paymentOptions = [
    "Electronic check",
    "Mailed check",
    "Bank transfer",
    "Credit card",
  ];
  const genderOptions = ["Male", "Female"]; 

  const getIcon = (name: string) => {
    switch (name) {
      case "contract":
        return <FileText className="h-5 w-5 text-blue-500" />;
      case "paperlessBilling":
        return <FileText className="h-5 w-5 text-green-500" />;
      case "paymentMethod":
        return <CreditCard className="h-5 w-5 text-purple-500" />;
      case "tenure":
        return <Calendar className="h-5 w-5 text-amber-500" />;
      case "gender":
        return <User className="h-5 w-5 text-pink-500" />;
      case "age":
        return <Calendar className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const prettyLabel = (key: string) => {
    switch (key) {
      case "paperlessBilling":
        return "Paperless Billing";
      case "paymentMethod":
        return "Payment Method";
      case "tenure":
        return "Tenure (months)";
      case "gender":
        return "Gender";
      case "age":
        return "Age";
      default:
        return key[0].toUpperCase() + key.slice(1);
    }
  };

  /* ---------- render ---------- */
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(to bottom right, " +
          "hsl(var(--hue,220), 70%, 20%), " +
          "hsl(calc(var(--hue,220) + 60), 70%, 20%))",
      }}
    >
      
      <div className="absolute inset-0 overflow-hidden opacity-10">
        <div
          className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"
          style={{ background: "hsl(calc(var(--hue) + 30), 70%, 50%)" }}
        />
        <div
          className="absolute top-1/2 right-0 w-96 h-96 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"
          style={{ background: "hsl(calc(var(--hue) + 90), 70%, 50%)" }}
        />
        <div
          className="absolute bottom-0 left-1/2 w-96 h-96 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2"
          style={{ background: "hsl(calc(var(--hue) + 150), 70%, 50%)" }}
        />
      </div>

      <div
        className={`w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden border border-white/20 transition-all duration-700 ${fadeIn ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
      >
        {/* header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 relative">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2" />
          <h1 className="text-3xl font-bold text-white text-center mb-2">
            Customer Contract
          </h1>
          <p className="text-blue-100 text-center opacity-80">
            Enter contract details to predict churn risk
          </p>
        </div>

        {/* form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            {Object.keys(formData).map((field) => (
              <div
                key={field}
                className={`bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm transition duration-300 transform ${activeField === field
                  ? "scale-105"
                  : "hover:scale-105 cursor-pointer"
                  }`}
              >
                <label className="flex items-center space-x-2 text-sm font-medium text-white mb-2 opacity-90">
                  {getIcon(field)}
                  <span>{prettyLabel(field)}</span>
                </label>

                {/* Select inputs */}
                {["contract", "paperlessBilling", "paymentMethod", "gender"].includes(field) ? (
                  <select
                    name={field}
                    value={formData[field as keyof FormData]}
                    onChange={handleChange}
                    onFocus={() => setActiveField(field)}
                    onBlur={() => setActiveField(null)}
                    className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  >
                    {(field === "contract"
                      ? contractOptions
                      : field === "paperlessBilling"
                        ? billingOptions
                        : field === "paymentMethod"
                          ? paymentOptions
                          : genderOptions
                    ).map((option) => (
                      <option
                        key={option}
                        value={option}
                        className="text-gray-900"
                      >
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  /* tenure or age numeric input */
                  <input
                    type="number"
                    name={field}
                    value={formData[field as keyof FormData]}
                    onChange={handleChange}
                    onFocus={() => setActiveField(field)}
                    onBlur={() => setActiveField(null)}
                    min={1}
                    placeholder={`Enter ${field}`}
                    className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  />
                )}
              </div>
            ))}
          </div>

          {/* submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 rounded-xl text-white font-medium transition transform ${isLoading
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 hover:shadow-lg hover:shadow-blue-500/40 hover:scale-105"
              }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <RefreshCw className="animate-spin mr-3 h-5 w-5" />
                Processing...
              </div>
            ) : (
              "PREDICT CHURN RISK"
            )}
          </button>
        </form>

        {isSubmitted && churnPrediction && (
          <div
            className={`p-8 space-y-4 border-t border-white/10 transition ${churnPrediction.isLikelyToChurn
                ? "bg-gradient-to-r from-red-900 to-red-800"
                : "bg-gradient-to-r from-green-900 to-green-800"
              }`}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`p-3 rounded-full ${churnPrediction.isLikelyToChurn
                    ? "bg-red-700"
                    : "bg-green-700"
                  }`}
              >
                {churnPrediction.isLikelyToChurn ? (
                  <AlertCircle className="h-6 w-6 text-white" />
                ) : (
                  <CheckCircle className="h-6 w-6 text-white" />
                )}
              </div>
              <div>
                <p className="text-xl font-bold text-white">
                  {churnPrediction.isLikelyToChurn
                    ? "High Churn Risk!"
                    : "Low Churn Risk"}
                </p>
                <p className="text-sm text-white/80">
                  This customer is
                  {churnPrediction.isLikelyToChurn ? "likely" : "unlikely"} to
                  churn.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">Confidence Score</span>
              <span className="text-sm font-mono bg-black/30 px-3 py-1 rounded-lg text-white">
                {churnPrediction.confidence.toFixed(8)}
              </span>
            </div>

            <div className="w-full bg-black/30 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full ${churnPrediction.isLikelyToChurn
                    ? "bg-red-500"
                    : "bg-green-500"
                  }`}
                style={{ width: `${churnPrediction.confidence}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
