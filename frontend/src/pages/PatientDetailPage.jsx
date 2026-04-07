import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import VitalsForm from "../components/VitalsForm";
import RiskGauge  from "../components/RiskGauge";
import ShapPanel  from "../components/ShapPanel";
import LimePanel  from "../components/LimePanel";
import { fetchPatient, runPredict, runShap, runLime, updatePatient } from "../api";

export default function PatientDetailPage() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  
  const [result, setResult]   = useState(null);
  const [shap,   setShap]     = useState(null);
  const [lime,   setLime]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const loadPatient = async () => {
      try {
        const p = await fetchPatient(id);
        setPatient(p);
      } catch (err) {
        console.error("Error fetching patient", err);
      } finally {
        setPageLoading(false);
      }
    };
    loadPatient();
  }, [id]);

  const handleSubmit = async (vitals) => {
    setLoading(true);
    try {
      const pred = await runPredict(id, vitals);
      setResult(pred);
      
      // Save risk score to backend db
      await updatePatient(id, { lastRiskScore: pred.bilstm_prob, vitals });
      
      const shapData = await runShap(id, vitals);
      setShap(shapData);
      const limeData = await runLime(id, vitals);
      setLime(limeData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) return <div className="dashboard-container" style={{ textAlign: "center", marginTop: 100 }}>Loading patient profile...</div>;
  if (!patient) return <div className="dashboard-container" style={{ textAlign: "center", marginTop: 100 }}>Patient not found</div>;

  return (
    <div className="dashboard-container">
      <Link to="/" style={{ color: "var(--accent-blue)", textDecoration: "none", marginBottom: 16, display: "inline-block", fontSize: 14 }}>
        ← Back to Patients
      </Link>
      
      <div className="dashboard-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="dashboard-title">Patient Profile: {patient.name}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginTop: 4 }}>
            Age: <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{patient.age || "N/A"}</span> | ID: <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{patient.id}</span>
          </p>
        </div>
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-blue)' }}>
            <div className="spinner" style={{ width: 16, height: 16, border: '2px solid', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Analyzing...</span>
          </div>
        )}
      </div>

      <div className="dashboard-grid">
        {/* Left Column: Data Input */}
        <div className="glass-panel" style={{ padding: 20 }}>
          <VitalsForm onSubmit={handleSubmit} loading={loading} initialVitals={patient.vitals} />
        </div>

        {/* Right Column: Visualization & Explainability */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {result ? (
            <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RiskGauge {...result} />
            </div>
          ) : patient.lastRiskScore ? (
             <div className="glass-panel" style={{ minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Previous Risk Score: {(patient.lastRiskScore * 100).toFixed(0)}%. Run prediction to analyze new vitals.
             </div>
          ) : (
             <div className="glass-panel" style={{ minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Run prediction to view risk assessment
             </div>
          )}
          
          {(shap || lime) && (
            <div className="panels-grid">
              {shap && (
                <div className="glass-panel" style={{ padding: 20, overflowX: 'auto' }}>
                  <ShapPanel {...shap} />
                </div>
              )}
              {lime && (
                <div className="glass-panel" style={{ padding: 20 }}>
                  <LimePanel top10={lime.top10} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
