import os
# Force TensorFlow/XGBoost to use exactly 1 thread to prevent Render Out-Of-Memory (OOM) Segfaults
os.environ['TF_NUM_INTEROP_THREADS'] = '1'
os.environ['TF_NUM_INTRAOP_THREADS'] = '1'
os.environ['OMP_NUM_THREADS'] = '1'
os.environ['MKL_NUM_THREADS'] = '1'
os.environ['OPENBLAS_NUM_THREADS'] = '1'

import numpy as np, joblib
import tensorflow as tf
tf.config.threading.set_inter_op_parallelism_threads(1)
tf.config.threading.set_intra_op_parallelism_threads(1)
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

def predict_bilstm(normalized, vitals_list=None):
    X = normalized.reshape(1, 6, 8)
    prob = float(bilstm.predict(X, verbose=0)[0][0])
    
    # 1. Base Risk Level
    if prob < 0.25:   risk = "LOW"
    elif prob < 0.40: risk = "MODERATE"
    else:             risk = "HIGH"

    recs = []
    qsofa = 0
    progression_prob = prob
    
    # 2. AI Recommendations & qSOFA (if vitals exist)
    if vitals_list and len(vitals_list) > 0:
        last_vitals = vitals_list[-1]
        
        # qSOFA Calculation
        if last_vitals.get("RR", 0) >= 22: qsofa += 1
        if last_vitals.get("SBP", 999) <= 100: qsofa += 1
        # Mentation is assumed 0 for this demo context
        
        # AI Logic based on intersections
        if prob >= 0.40:
            recs.append("Immediate ICU escalation recommended")
        else:
            recs.append("Continue routine ICU monitoring")
            
        if last_vitals.get("SpO2", 100) < 92:
            recs.append("Consider oxygen support (SpO2 < 92%)")
        if last_vitals.get("MAP", 100) < 65 or last_vitals.get("SBP", 100) < 90:
            recs.append("Administer fluids/vasopressors (Hypotension detected)")
        if last_vitals.get("HR", 0) > 110:
            recs.append("Assess for tachycardia etiology")
            
        # 3. 6-Hour Risk Progression
        # Heuristic: compute gradient of HR/SBP over last 2 hours and extrapolate risk directly
        # Mathematically sound for demo: scale prob by gradient trajectory
        if len(vitals_list) >= 2:
            prev = vitals_list[-2]
            # Simple worsening indicator
            hr_worsening = (last_vitals.get("HR", 0) - prev.get("HR", 0)) > 2
            sbp_worsening = (prev.get("SBP", 0) - last_vitals.get("SBP", 0)) > 2
            
            modifier = 1.0
            if hr_worsening: modifier += 0.08
            if sbp_worsening: modifier += 0.08
            if not hr_worsening and not sbp_worsening: modifier -= 0.05
            
            progression_prob = min(0.99, max(0.01, prob * modifier))
            
    if not recs: recs = ["Continue routine monitoring"]
    
    return prob, risk, recs, progression_prob, qsofa

def predict_xgboost(normalized):
    feat = []
    for i in range(8):
        w = normalized[:, i]
        feat.extend([w.mean(), w.std(), w.min(), w.max(), w[-1]])
    X = np.array(feat).reshape(1, -1)
    prob = float(xgb.predict_proba(X)[0][1])
    return prob