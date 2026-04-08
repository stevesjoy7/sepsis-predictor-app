import { useEffect, useState } from "react";

export default function RiskGauge({ bilstm_prob, xgb_prob, risk_level, recommendation, progression_prob, qsofa_score }) {
  const [animatedProb, setAnimatedProb] = useState(0);

  useEffect(() => {
    setAnimatedProb(0);
    const timeout = setTimeout(() => {
       setAnimatedProb(bilstm_prob);
    }, 100);
    return () => clearTimeout(timeout);
  }, [bilstm_prob]);

  const score = animatedProb * 100;
  const nextScore = (progression_prob || bilstm_prob) * 100; // Fallback if missing
  
  // Decide colors based on risk
  let color = "var(--color-green)";
  let glow = "var(--color-green-glow)";
  if (risk_level === "MODERATE") {
    color = "var(--color-amber)";
    glow = "var(--color-amber-glow)";
  } else if (risk_level === "HIGH") {
    color = "var(--color-red)";
    glow = "var(--color-red-glow)";
  }

  // Next score coloring
  let nextColor = "var(--color-green)";
  if (nextScore >= 40) nextColor = "var(--color-red)";
  else if (nextScore >= 25) nextColor = "var(--color-amber)";

  // SVG dimensions & calculations for circular progress
  const size = 160;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div style={{ display: "flex", gap: 32, alignItems: "flex-start", width: "100%", padding: "16px 24px" }}>
      
      {/* Current Risk Gauge */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
          <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
            <circle
              cx={size / 2} cy={size / 2} r={radius}
              fill="transparent"
              stroke="var(--border-color)"
              strokeWidth={strokeWidth}
            />
            <circle
              cx={size / 2} cy={size / 2} r={radius}
              fill="transparent"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)", filter: `drop-shadow(0 0 8px ${glow})` }}
            />
          </svg>
          <div style={{
            position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
          }}>
            <span style={{ fontSize: 32, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-1px" }}>
              {score.toFixed(0)}<span style={{ fontSize: 18, color: "var(--text-muted)", marginLeft: 2 }}>%</span>
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color, letterSpacing: "1px", textTransform: "uppercase", marginTop: 2 }}>
              {risk_level}
            </span>
          </div>
        </div>
        <div style={{ marginTop: 12, fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>Current Risk</div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        
        {/* Risk in Next 6 Hours */}
        <div style={{ background: "rgba(0,0,0,0.2)", padding: "16px", borderRadius: 12, border: `1px solid ${nextColor}40`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>Risk Progression Prediction</div>
              <div style={{ fontSize: 15, color: "var(--text-secondary)", marginTop: 4 }}>Projected Risk in next 6 hours based on trajectory</div>
           </div>
           <div style={{ fontSize: 32, fontWeight: 700, color: nextColor, textShadow: `0 0 10px ${nextColor}40` }}>
              {nextScore.toFixed(0)}%
           </div>
        </div>

        {/* AI Recommendations */}
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
            🤖 AI Clinical Recommendations
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.isArray(recommendation) ? recommendation.map((rec, idx) => (
              <div key={idx} style={{ 
                fontSize: 14, color: "var(--text-primary)", lineHeight: 1.4, 
                background: "rgba(255,255,255,0.03)", padding: "10px 14px", borderRadius: 8, 
                borderLeft: `4px solid ${rec.includes("Immediate") || rec.includes("Administer") ? 'var(--color-red)' : 'var(--accent-blue)'}` 
              }}>
                {rec}
              </div>
            )) : (
              <div style={{ fontSize: 14, color: "var(--text-primary)", background: "rgba(255,255,255,0.03)", padding: "10px 14px", borderRadius: 8, borderLeft: `4px solid var(--accent-blue)` }}>
                {recommendation}
              </div>
            )}
          </div>
        </div>
        
        {/* Medical Scores Compare */}
        <div style={{ marginTop: 8, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: 1, background: "rgba(0,0,0,0.2)", padding: "12px", borderRadius: 8, border: "1px solid var(--border-color)" }}>
             <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>BiLSTM Neural Net</p>
             <p style={{ margin: "4px 0 0 0", fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>{(bilstm_prob*100).toFixed(1)}%</p>
          </div>
          <div style={{ flex: 1, background: "rgba(0,0,0,0.2)", padding: "12px", borderRadius: 8, border: "1px solid var(--border-color)" }}>
             <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>XGBoost Baseline</p>
             <p style={{ margin: "4px 0 0 0", fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>{(xgb_prob*100).toFixed(1)}%</p>
          </div>
          <div style={{ flex: 1, background: "rgba(0,0,0,0.2)", padding: "12px", borderRadius: 8, border: `1px solid ${qsofa_score >= 2 ? 'var(--color-red)' : 'var(--border-color)'}` }}>
             <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>qSOFA Score</p>
             <p style={{ margin: "4px 0 0 0", fontSize: 16, fontWeight: 600, color: qsofa_score >= 2 ? "var(--color-red)" : "var(--text-primary)" }}>
                {qsofa_score ?? '--'} / 3
             </p>
          </div>
        </div>

      </div>
    </div>
  );
}