import numpy as np, joblib
from tensorflow.keras.models import load_model

# Load once at module level — never inside a function
bilstm = load_model("models/best_sepsis_model.keras")
xgb    = joblib.load("models/xgb_sepsis_model.pkl")
scaler = joblib.load("models/sepsis_scaler.pkl")

VITAL_COLS = ["HR","MAP","SBP","DBP","RR","SpO2","Glucose","Temp"]
BOUNDS = {
    "HR":(30,220),"MAP":(40,180),"SBP":(70,250),
    "DBP":(30,150),"RR":(5,40),"SpO2":(70,100),
    "Glucose":(40,400),"Temp":(35.0,42.0)
}

def preprocess(vitals_list):
    """vitals_list: list of 6 dicts, one per hour"""
    import pandas as pd
    df = pd.DataFrame(vitals_list)[VITAL_COLS]
    for col,(lo,hi) in BOUNDS.items():
        df[col] = df[col].clip(lo, hi)
    normalized = scaler.transform(df)
    return normalized  # shape (6,8)

def predict_bilstm(normalized):
    X = normalized.reshape(1, 6, 8)
    prob = float(bilstm.predict(X, verbose=0)[0][0])
    if prob < 0.25:   risk, rec = "LOW",      "Continue routine monitoring"
    elif prob < 0.40: risk, rec = "MODERATE", "Increase monitoring frequency"
    else:             risk, rec = "HIGH",      "Immediate clinical attention required"
    return prob, risk, rec

def predict_xgboost(normalized):
    feat = []
    for i in range(8):
        w = normalized[:, i]
        feat.extend([w.mean(), w.std(), w.min(), w.max(), w[-1]])
    X = np.array(feat).reshape(1, -1)
    prob = float(xgb.predict_proba(X)[0][1])
    return prob