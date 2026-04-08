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
  
  const [activeTab, setActiveTab] = useState('monitoring'); // 'monitoring' or 'analytics'

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
      
      await updatePatient(id, { lastRiskScore: pred.bilstm_prob, vitals });
      
      const shapData = await runShap(id, vitals);
      setShap(shapData);
      const limeData = await runLime(id, vitals);
      setLime(limeData);
      
      // Auto-switch to analytics tab when a prediction is made manually
      if (!isSimulating) {
         setActiveTab('analytics');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) return <div className="dashboard-container" style={{ textAlign: "center", marginTop: 100 }}>Loading patient profile...</div>;
  if (!patient) return <div className="dashboard-container" style={{ textAlign: "center", marginTop: 100 }}>Patient not found</div>;

  const currentRisk = result ? result.bilstm_prob : patient.lastRiskScore;
  const isHighRisk = currentRisk >= 0.4;
  const isSimulating = loading && activeTab === 'monitoring'; // Crude heuristic, actual simulation handles inside VitalsForm but passed up via loading state

  return (
    <div className="dashboard-container">
      <Link 
         to="/" 
         style={{ 
            display: "inline-flex", alignItems: "center", gap: 8, 
            padding: "8px 16px", marginBottom: 24, borderRadius: 8, 
            background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-color)", 
            color: "var(--text-primary)", textDecoration: "none", fontSize: 14, fontWeight: 500,
            transition: "all 0.2s"
         }}
         onMouseOver={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.borderColor = "var(--accent-blue)"; e.currentTarget.style.color = "var(--accent-blue)"; }}
         onMouseOut={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "var(--border-color)"; e.currentTarget.style.color = "var(--text-primary)"; }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Back to Central Monitor
      </Link>
      
      {/* Patient Summary Card (Feature 6) */}
      <div className={`glass-panel ${isHighRisk ? 'danger-card' : ''}`} style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="dashboard-title">Patient Profile: {patient.name}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginTop: 4 }}>
            Age: <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{patient.age || "N/A"}</span> | 
            ID: <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{patient.id}</span>
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          {patient.vitals && patient.vitals[5] && (
            <div style={{ display: 'flex', gap: 16 }}>
              {patient.vitals[5].HR > 100 && <span style={{ color: 'var(--color-red)' }}>⚠️ Tachycardia (HR: {patient.vitals[5].HR})</span>}
              {patient.vitals[5].SpO2 < 92 && <span style={{ color: 'var(--color-red)' }}>⚠️ Hypoxia (SpO2: {patient.vitals[5].SpO2})</span>}
              {patient.vitals[5].SBP < 90 && <span style={{ color: 'var(--color-red)' }}>⚠️ Hypotension (SBP: {patient.vitals[5].SBP})</span>}
            </div>
          )}
          
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Status</div>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-blue)' }}>
                <div className="spinner" style={{ width: 16, height: 16, border: '2px solid', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <span style={{ fontSize: 14, fontWeight: 500 }}>Analyzing...</span>
              </div>
            ) : (
                <div style={{ color: isHighRisk ? 'var(--color-red)' : 'var(--color-green)', fontWeight: 700 }}>
                    {isHighRisk ? 'CRITICAL ALERT' : 'STABLE'}
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation (Feature 11) */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: 24 }}>
        <button className={`tab-button ${activeTab === 'monitoring' ? 'active' : ''}`} onClick={() => setActiveTab('monitoring')}>
          Live Monitoring
        </button>
        <button className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
          AI Analytics & Predictors
        </button>
      </div>

      {/* Tab Content */}
      <div style={{ display: activeTab === 'monitoring' ? 'block' : 'none' }}>
        <div className="glass-panel" style={{ padding: 24 }}>
          <VitalsForm onSubmit={handleSubmit} loading={loading} initialVitals={patient.vitals} />
        </div>
      </div>

      <div style={{ display: activeTab === 'analytics' ? 'block' : 'none' }}>
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
