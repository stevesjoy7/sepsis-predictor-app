import axios from "axios";

const BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

export const fetchPatients = () => axios.get(`${BASE}/patients?_t=${Date.now()}`).then(r => r.data);
export const fetchPatient = (id) => axios.get(`${BASE}/patients/${id}?_t=${Date.now()}`).then(r => r.data);
export const createPatient = (data) => axios.post(`${BASE}/patients`, data).then(r => r.data);
export const updatePatient = (id, data) => axios.put(`${BASE}/patients/${id}`, data).then(r => r.data);
export const deletePatient = (id) => axios.delete(`${BASE}/patients/${id}`).then(r => r.data);

export const runPredict  = (patientId, vitals) =>
  axios.post(`${BASE}/predict`, { patient_id: patientId, vitals }).then(r => r.data);

export const runShap     = (patientId, vitals) =>
  axios.post(`${BASE}/explain/shap`, { patient_id: patientId, vitals }).then(r => r.data);

export const runLime     = (patientId, vitals) =>
  axios.post(`${BASE}/explain/lime`, { patient_id: patientId, vitals }).then(r => r.data);