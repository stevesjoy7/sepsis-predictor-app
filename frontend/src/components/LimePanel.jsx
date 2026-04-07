import React from 'react';

export default function LimePanel({ top10 }) {
  const max = Math.max(...top10.map(d => Math.abs(d.weight)), 0.001); // avoid div by 0

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
         <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>LIME Explanation</h3>
         <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Top 10 local features influencing individual prediction.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
        {top10.map((d, i) => {
           const intensity = Math.abs(d.weight) / max;
           const widthPct = Math.max(intensity * 100, 1);
           const isPositive = d.weight > 0;
           const color = isPositive ? "var(--color-red)" : "var(--color-green)";
           const glow = isPositive ? "var(--color-red-glow)" : "var(--color-green-glow)";

           return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ 
                 width: 100, fontSize: 12, textAlign: "right", color: "var(--text-secondary)", 
                 whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" 
              }}>
                 {d.feature}
              </span>
              <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", height: 12, borderRadius: 6, position: "relative" }}>
                 <div style={{
                   position: "absolute",
                   left: 0,
                   top: 0,
                   height: "100%", 
                   width: `${widthPct}%`,
                   background: color,
                   borderRadius: 6,
                   boxShadow: `0 0 8px ${glow}`,
                   transition: "width 0.5s ease-out"
                 }}/>
              </div>
              <span style={{ fontSize: 12, width: 50, textAlign: "left", color: "var(--text-primary)", fontWeight: 500 }}>
                 {d.weight > 0 ? "+" : ""}{d.weight.toFixed(3)}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 16, marginTop: 12, paddingTop: 16, borderTop: "1px solid var(--border-color)" }}>
         <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-muted)" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-red)", boxShadow: "0 0 4px var(--color-red-glow)" }} />
            Increases Risk
         </div>
         <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-muted)" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-green)", boxShadow: "0 0 4px var(--color-green-glow)" }} />
            Decreases Risk
         </div>
      </div>
    </div>
  );
}