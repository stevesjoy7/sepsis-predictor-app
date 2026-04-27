import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchPatients, createPatient, updatePatient, deletePatient } from "../api";

function MiniGauge({ score, color, glow }) {
  const size = 56;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="transparent" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="transparent" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 4px ${glow})`, transition: 'stroke-dashoffset 1s ease' }} />
    </svg>
  );
}

export default function PatientListPage() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: "", age: "" });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const data = await fetchPatients();
      setPatients(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return;

    try {
      if (editingId) {
        await updatePatient(editingId, formData);
      } else {
        await createPatient(formData);
      }
      await loadPatients();
      setShowModal(false);
      setFormData({ name: "", age: "" });
      setEditingId(null);
    } catch (error) {
      console.error(error);
      alert("Failed to save patient. Please check if your backend and database services are active.");
    }
  };

  const handleEdit = (e, p) => {
    e.stopPropagation();
    setFormData({ name: p.name, age: p.age });
    setEditingId(p.id);
    setShowModal(true);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this patient?")) {
      await deletePatient(id);
      await loadPatients();
    }
  };

  return (
    <div className="dashboard-container">
      {/* Top Navigation Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, padding: '16px 24px', background: 'var(--bg-panel)', borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-panel)' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, var(--accent-blue), #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, fontWeight: 'bold' }}>
               🏥
            </div>
            <h1 className="dashboard-title" style={{ marginBottom: 0 }}>ICU Central Monitor</h1>
         </div>
         <div style={{ display: 'flex', gap: 16 }}>
            <button className="btn-primary" onClick={() => { localStorage.removeItem("sepsis_auth"); navigate('/auth'); }} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
               🚪 Sign Out
            </button>
            <button className="btn-primary" onClick={() => navigate('/evaluation')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>
               📊 Model Validation
            </button>
            <button 
               onClick={() => setShowModal(true)}
               style={{ 
                  background: 'linear-gradient(135deg, var(--color-green), #059669)', 
                  border: 'none', color: '#fff', padding: '10px 24px', borderRadius: 8, 
                  fontWeight: 600, fontSize: 15, cursor: 'pointer', 
                  boxShadow: '0 4px 14px rgba(34, 197, 94, 0.4)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  display: 'flex', alignItems: 'center', gap: 8
               }}
               onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(34, 197, 94, 0.6)'; }}
               onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(34, 197, 94, 0.4)'; }}
            >
               <span style={{ fontSize: 18 }}>+</span> Admit Patient
            </button>
         </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
        {loading ? (
           <div className="glass-panel" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
             Loading patients...
           </div>
        ) : patients.length === 0 ? (
          <div className="glass-panel" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
            No patients found. Add a patient to get started.
          </div>
        ) : (
          patients.map(p => {
            // Sepsis risk specific logic based on standard BiLSTM prob
            const riskProb = p.lastRiskScore || 0; 
            const isHigh = riskProb >= 0.40;
            const isMod = riskProb >= 0.25 && riskProb < 0.40;
            
            const riskLabel = isHigh ? "HIGH RISK" : isMod ? "MODERATE" : "LOW RISK";
            const color = isHigh ? "var(--color-red)" : isMod ? "var(--color-amber)" : "var(--color-green)";
            const glow = isHigh ? "var(--color-red-glow)" : isMod ? "var(--color-amber-glow)" : "var(--color-green-glow)";
            const bgBadge = isHigh ? "rgba(239,68,68,0.15)" : isMod ? "rgba(245,158,11,0.15)" : "rgba(34,197,94,0.15)";
            
            const pct = (riskProb * 100).toFixed(0);

            return (
              <div 
                key={p.id} 
                onClick={() => navigate(`/patient/${p.id}`)}
                className={`patient-card glass-panel ${isHigh ? 'danger-card' : ''}`}
                style={{ 
                  display: 'flex', flexDirection: 'column', padding: 20, cursor: 'pointer',
                  background: '#11151c', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16,
                  position: 'relative'
                }}
              >
                {/* Top Row: Name and Dot */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 16, color: '#e2e8f0', letterSpacing: 1 }}>
                    {p.name.toUpperCase()}
                  </span>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgb(45, 212, 191)', boxShadow: '0 0 8px rgb(45, 212, 191)' }} />
                </div>

                {/* Middle Row: Gauge and Percentage */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                  <MiniGauge score={pct} color={color} glow={glow} />
                  <span style={{ fontSize: 32, fontWeight: 600, color: color, textShadow: `0 0 12px ${glow}` }}>
                    {pct}%
                  </span>
                </div>

                {/* Bottom Row: Ribbon */}
                <div style={{ 
                  background: bgBadge, color: color, textAlign: 'center', 
                  padding: '8px 0', borderRadius: 8, fontSize: 12, fontWeight: 700, 
                  letterSpacing: 1, textTransform: 'uppercase' 
                }}>
                  {riskLabel}
                </div>

                {/* Actions overlayed cleanly at the bottom corners so they don't break the UI */}
                <div className="card-actions" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                  <button onClick={(e) => handleEdit(e, p)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', padding: 0 }}>
                    Edit
                  </button>
                  <button onClick={(e) => handleDelete(e, p.id)} style={{ background: 'transparent', border: 'none', color: 'var(--color-red)', fontSize: 13, cursor: 'pointer', opacity: 0.8, padding: 0 }}>
                    Del
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div className="glass-panel" style={{ width: 400, background: 'var(--bg-primary)' }}>
            <h2 style={{ marginBottom: 16 }}>{editingId ? "Edit Patient" : "Add Patient"}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Full ID/Name</label>
                <input 
                  type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: 12, background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-primary)', outline: 'none' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Age</label>
                <input 
                  type="number" value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })}
                  style={{ width: '100%', padding: 12, background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" onClick={() => { setShowModal(false); setEditingId(null); setFormData({name:'', age:''}); }} style={{ flex: 1, padding: 12, background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: 12 }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Added hover state for cleaner buttons */}
      <style>{`
        .patient-card {
          transition: transform 0.2s, background 0.2s;
        }
        .patient-card:hover {
          transform: translateY(-4px);
          background: #181c25 !important;
        }
        .card-actions button:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
