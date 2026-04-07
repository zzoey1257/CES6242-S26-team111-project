
import json, math, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent
META = json.loads((ROOT / "data" / "model_meta.json").read_text())
CASES = json.loads((ROOT / "data" / "validation_cases.json").read_text())

def engineer_features(raw: dict) -> dict:
    return {
        "BMI": raw["BMI"],
        "GenHlth": raw["GenHlth"],
        "DiffWalk": raw["DiffWalk"],
        "Sex": raw["Sex"],
        "Education": raw["Education"],
        "Income": raw["Income"],
        "CardioRisk": raw["HighBP"] + raw["HighChol"] + raw["HeartDiseaseorAttack"],
        "AgeGroup": 0 if raw["Age"] <= 4 else (1 if raw["Age"] <= 8 else 2),
    }

def build_patient_data(raw: dict) -> dict:
    engineered = engineer_features(raw)
    patient = dict(META["defaults"])
    patient["CardioRisk"] = engineered["CardioRisk"]
    patient["AgeGroup"] = engineered["AgeGroup"]
    for feature in META["features"]:
        if feature in raw:
            patient[feature] = raw[feature]
    return patient

def predict_probability(raw: dict):
    patient = build_patient_data(raw)
    logit = META["intercept"]
    contributions = {}
    for feature in META["features"]:
        scaled = (patient[feature] - META["means"][feature]) / META["scales"][feature]
        contrib = scaled * META["coefficients"][feature]
        contributions[feature] = contrib
        logit += contrib
    probability = 1.0 / (1.0 + math.exp(-logit))
    return {
        "patient_data": patient,
        "probability": probability,
        "logit": logit,
        "contributions": contributions,
    }

def run_validation():
    print("Validating refined browser model against bundled Python reference...\n")
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
