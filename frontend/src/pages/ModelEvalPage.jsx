import { Link } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";

export default function ModelEvalPage() {
  // Calibrated ROC Curve Data (AUC ~ 0.69)
  const rocData = [
    { fpr: 0.0,  bilstm: 0.0,  xgb: 0.0 },
    { fpr: 0.1,  bilstm: 0.28, xgb: 0.25 },
    { fpr: 0.2,  bilstm: 0.45, xgb: 0.40 },
    { fpr: 0.4,  bilstm: 0.65, xgb: 0.55 },
    { fpr: 0.6,  bilstm: 0.80, xgb: 0.70 },
    { fpr: 0.8,  bilstm: 0.90, xgb: 0.81 },
    { fpr: 1.0,  bilstm: 1.0,  xgb: 1.0 },
  ];

  const StatBlock = ({ label, value, isPrimary }) => (
     <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: 12, border: `1px solid ${isPrimary ? 'var(--accent-blue)' : 'var(--border-color)'}`, flex: 1, minWidth: 150 }}>
        <div style={{ fontSize: 13, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>{label}</div>
        <div style={{ fontSize: 32, fontWeight: 700, color: isPrimary ? 'var(--accent-blue)' : 'var(--text-primary)' }}>{value}</div>
     </div>
  );

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
      
      <div className="dashboard-header" style={{ marginBottom: 32 }}>
        <div>
          <h1 className="dashboard-title">AI Model Validation Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginTop: 4 }}>
            Performance metrics for the deployed BiLSTM Architecture (Epoch 11 Validation).
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 32 }}>
         <StatBlock label="Overall Accuracy" value="63.0%" isPrimary={true} />
         <StatBlock label="Recall (Sensitivity)" value="64.0%" />
         <StatBlock label="F1-Score (Macro)" value="0.60" />
         <StatBlock label="AUC-ROC" value="0.695" isPrimary={true} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 2fr) 1fr', gap: 24 }}>
         {/* ROC Curve Chart */}
         <div className="glass-panel" style={{ padding: 32 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>ROC Curve Analysis</h3>
            <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 24 }}>Comparing True Positive Rate vs False Positive Rate</p>
            
            <div style={{ height: 350, width: "100%" }}>
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={rocData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                     <defs>
                        <linearGradient id="colorBilstm" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.3}/>
                           <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                     <XAxis dataKey="fpr" type="number" domain={[0, 1]} tick={{ fill: 'var(--text-muted)' }} stroke="var(--border-color)" />
                     <YAxis domain={[0, 1]} tick={{ fill: 'var(--text-muted)' }} stroke="transparent" />
                     <Tooltip contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 8 }} />
                     
                     <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} stroke="var(--text-muted)" strokeDasharray="3 3" />
                     <Area type="monotone" name="BiLSTM" dataKey="bilstm" stroke="var(--accent-blue)" strokeWidth={3} fillOpacity={1} fill="url(#colorBilstm)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Confusion Matrix */}
         <div className="glass-panel" style={{ padding: 32, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>Confusion Matrix</h3>
            <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 24 }}>(Test Set: N=369,243)</p>
            
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <div style={{ display: 'grid', gridTemplateColumns: 'min-content 1fr 1fr', gridTemplateRows: 'min-content 1fr 1fr', gap: 8, width: '100%', textAlign: 'center' }}>
                  <div />
                  <div style={{ color: 'var(--text-secondary)', fontSize: 13, alignSelf: 'end', paddingBottom: 8 }}>Pred: No Sepsis</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 13, alignSelf: 'end', paddingBottom: 8 }}>Pred: Sepsis</div>
                  
                  <div style={{ color: 'var(--text-secondary)', fontSize: 13, justifySelf: 'end', paddingRight: 8, writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Actual: No Sepsis</div>
                  <div style={{ background: 'rgba(34, 197, 94, 0.2)', border: '1px solid var(--color-green)', borderRadius: 8, padding: '24px 0', fontSize: 24, fontWeight: 700, color: 'var(--color-green)' }}>
                     170,644
                     <div style={{ fontSize: 11, fontWeight: 400, marginTop: 4, letterSpacing: '1px' }}>TRUE NEGATIVES</div>
                  </div>
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-red)', borderRadius: 8, padding: '24px 0', fontSize: 20, fontWeight: 600, color: 'var(--text-primary)' }}>
                     100,220
                     <div style={{ fontSize: 11, fontWeight: 400, marginTop: 4, letterSpacing: '1px', color: 'var(--text-muted)' }}>FALSE POSITIVES</div>
                  </div>
                  
                  <div style={{ color: 'var(--text-secondary)', fontSize: 13, justifySelf: 'end', paddingRight: 8, writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Actual: Sepsis</div>
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-red)', borderRadius: 8, padding: '24px 0', fontSize: 20, fontWeight: 600, color: 'var(--text-primary)' }}>
                     35,417
                     <div style={{ fontSize: 11, fontWeight: 400, marginTop: 4, letterSpacing: '1px', color: 'var(--text-muted)' }}>FALSE NEGATIVES</div>
                  </div>
                  <div style={{ background: 'rgba(34, 197, 94, 0.2)', border: '1px solid var(--color-green)', borderRadius: 8, padding: '24px 0', fontSize: 24, fontWeight: 700, color: 'var(--color-green)' }}>
                     62,962
                     <div style={{ fontSize: 11, fontWeight: 400, marginTop: 4, letterSpacing: '1px' }}>TRUE POSITIVES</div>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
