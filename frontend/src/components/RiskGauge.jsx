import { useEffect, useState } from "react";

export default function RiskGauge({ bilstm_prob, xgb_prob, risk_level, recommendation }) {
  const [animatedProb, setAnimatedProb] = useState(0);

  useEffect(() => {
    // Animate the gauge from 0 to the target
    setAnimatedProb(0);
    const timeout = setTimeout(() => {
       setAnimatedProb(bilstm_prob);
    }, 100);
    return () => clearTimeout(timeout);
  }, [bilstm_prob]);

  const score = animatedProb * 100;
  
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

  // SVG dimensions & calculations for circular progress
  const size = 160;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div style={{ display: "flex", gap: 32, alignItems: "center", width: "100%", padding: "16px 24px" }}>
      {/* Circular Gauge */}
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

      {/* Recommendation Details */}
      <div style={{ flex: 1 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>
          Risk Assessment
        </h3>
        <p style={{ margin: 0, fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.5, background: "rgba(255,255,255,0.03)", padding: "12px 16px", borderRadius: 8, borderLeft: `4px solid ${color}` }}>
          {recommendation}
        </p>
        
        <div style={{ marginTop: 16, display: "flex", gap: 16 }}>
          <div style={{ background: "rgba(0,0,0,0.2)", padding: "8px 12px", borderRadius: 8 }}>
             <p style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>BiLSTM Model</p>
             <p style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)" }}>{(bilstm_prob*100).toFixed(1)}%</p>
          </div>
          <div style={{ background: "rgba(0,0,0,0.2)", padding: "8px 12px", borderRadius: 8 }}>
             <p style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>XGBoost Baseline</p>
             <p style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)" }}>{(xgb_prob*100).toFixed(1)}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}