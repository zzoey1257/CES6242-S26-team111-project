
import json, math, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent
META = json.loads((ROOT / "data" / "model_meta.json").read_text())
CASES = json.loads((ROOT / "data" / "validation_cases.json").read_text())

RAW_KEYS = [
    "HighBP", "HighChol", "CholCheck", "BMI", "Smoker", "Stroke",
    "HeartDiseaseorAttack", "PhysActivity", "Fruits", "Veggies",
    "HvyAlcoholConsump", "AnyHealthcare", "NoDocbcCost", "GenHlth",
    "MentHlth", "PhysHlth", "DiffWalk", "Sex", "Age", "Education", "Income"
]


def engineer_features(raw: dict) -> dict:
    return {
        "BMI": raw["BMI"],
        "GenHlth": raw["GenHlth"],
        "DiffWalk": raw["DiffWalk"],
        "Sex": raw["Sex"],
        "Education": raw["Education"],
        "Income": raw["Income"],
        "CardioRisk": raw["HighBP"] + raw["HighChol"] + raw["HeartDiseaseorAttack"],
        "HealthBurden": raw["MentHlth"] + raw["PhysHlth"],
        "LifestyleScore": raw["PhysActivity"] + raw["Fruits"] + raw["Veggies"] - raw["Smoker"],
        "HealthcareAccess": raw["AnyHealthcare"] + raw["CholCheck"],
        "AgeGroup": 0 if raw["Age"] <= 4 else (1 if raw["Age"] <= 8 else 2),
    }


def compute_logit(raw: dict):
    engineered = engineer_features(raw)
    logit = META["intercept"]
    contributions = {}
    for feature in META["features"]:
        scaled = (engineered[feature] - META["means"][feature]) / META["scales"][feature]
        contrib = scaled * META["coefficients"][feature]
        contributions[feature] = contrib
        logit += contrib
    return logit, engineered, contributions


def predict_probability(raw: dict):
    logit, engineered, contributions = compute_logit(raw)
    probability = 1.0 / (1.0 + math.exp(-logit))
    return {
        "probability": probability,
        "logit": logit,
        "engineered": engineered,
        "contributions": contributions,
    }


def run_validation():
    print("Validating bundled browser model against bundled Python reference...\n")
    all_ok = True
    for case in CASES:
        result = predict_probability(case["raw_input"])
        ok = abs(result["probability"] - case["expected_probability"]) < 1e-12
        all_ok = all_ok and ok
        print(f"{case['name']}: {'OK' if ok else 'MISMATCH'}")
        print(f"  expected: {case['expected_probability']:.15f}")
        print(f"  actual:   {result['probability']:.15f}")
    print("\nResult:", "PASS" if all_ok else "FAIL")
    return 0 if all_ok else 1


if __name__ == "__main__":
    if len(sys.argv) == 1:
        raise SystemExit(run_validation())
    raw = json.loads(sys.argv[1])
    print(json.dumps(predict_probability(raw), indent=2))
