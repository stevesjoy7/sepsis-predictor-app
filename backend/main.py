from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import asyncio, predict, explain
import database
from typing import Dict, Any, Optional

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"],
                   allow_methods=["*"], allow_headers=["*"])

@app.on_event("startup")
def startup_event():
    database.init_db()

class VitalsHour(BaseModel):
    HR: float; MAP: float; SBP: float; DBP: float
    RR: float; SpO2: float; Glucose: float; Temp: float

class PatientCreate(BaseModel):
    name: str
    age: Optional[str] = None

class PatientUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[str] = None
    lastRiskScore: Optional[float] = None
    vitals: Optional[List[Dict[str, Any]]] = None

class PredictRequest(BaseModel):
    patient_id: str
    vitals: List[VitalsHour]  # exactly 6 items

@app.post("/predict")
def run_predict(req: PredictRequest):
    norm = predict.preprocess([v.dict() for v in req.vitals])
    prob, risk, rec = predict.predict_bilstm(norm)
    xgb_prob        = predict.predict_xgboost(norm)
    return {"bilstm_prob": prob, "xgb_prob": xgb_prob,
            "risk_level": risk, "recommendation": rec}

@app.post("/explain/shap")
def run_shap(req: PredictRequest):
    norm = predict.preprocess([v.dict() for v in req.vitals])
    bar, heatmap = explain.get_shap(norm)
    return {"bar_values": bar, "heatmap_values": heatmap,
            "vital_names": predict.VITAL_COLS}

@app.post("/explain/lime")
def run_lime(req: PredictRequest):
    norm = predict.preprocess([v.dict() for v in req.vitals])
    top10 = explain.get_lime(norm, explain.BACKGROUND)
    return {"top10": top10}

@app.get("/patients")
def get_patients():
    return database.get_all_patients()

@app.get("/patients/{patient_id}")
def get_patient(patient_id: str):
    return database.get_patient(patient_id)

@app.post("/patients")
def create_patient(req: PatientCreate):
    return database.create_patient(name=req.name, age=req.age)

@app.put("/patients/{patient_id}")
def update_patient(patient_id: str, req: PatientUpdate):
    updates = req.dict(exclude_unset=True)
    return database.update_patient(patient_id, updates)

@app.delete("/patients/{patient_id}")
def delete_patient(patient_id: str):
    database.delete_patient(patient_id)
    return {"message": "deleted"}