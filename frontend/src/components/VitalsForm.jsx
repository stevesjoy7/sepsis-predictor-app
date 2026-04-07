import { useState } from "react";

const VITALS = ["HR","MAP","SBP","DBP","RR","SpO2","Glucose","Temp"];
const EMPTY_ROW = () => Object.fromEntries(VITALS.map(v => [v, ""]));

const BOUNDS = {
  "HR": [30, 220], "MAP": [40, 180], "SBP": [70, 250],
  "DBP": [30, 150], "RR": [5, 40], "SpO2": [70, 100],
  "Glucose": [40, 400], "Temp": [35.0, 42.0]
};

export default function VitalsForm({ onSubmit, loading, initialVitals }) {
  const [rows, setRows] = useState(initialVitals || Array.from({length:6}, EMPTY_ROW));

  const update = (hour, vital, val) => {
    const next = [...rows];
    next[hour] = {...next[hour], [vital]: parseFloat(val) || ""};
    setRows(next);
  };

  const fillRandom = () => {
    const next = Array.from({length: 6}, () => {
      const row = {};
      VITALS.forEach(v => {
        const [min, max] = BOUNDS[v];
        row[v] = parseFloat((Math.random() * (max - min) + min).toFixed(v === 'Temp' ? 1 : 0));
      });
      return row;
    });
    setRows(next);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, height: "100%" }}>
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>Vital Signs History</h2>
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Enter patient vitals for the last 6 hours.</p>
      </div>

      <div style={{ flex: 1, overflowX: "auto" }}>
        <table style={{ minWidth: "100%", borderCollapse: "separate", borderSpacing: "0 8px", fontSize: 13, textAlign: "left" }}>
          <thead>
            <tr>
              <th style={{ padding: "0 12px 8px", color: "var(--text-secondary)", fontWeight: 500, width: 60 }}>Hr</th>
              {VITALS.map(v => (
                <th key={v} style={{ padding: "0 8px 8px", color: "var(--text-secondary)", fontWeight: 500 }}>{v}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ background: "rgba(0,0,0,0.15)", transition: "background 0.2s" }} className="vital-row">
                <td style={{ padding: "12px", color: "var(--accent-glow)", fontWeight: 600, borderRadius: "6px 0 0 6px" }}>−{6-i}</td>
                {VITALS.map((v, vi) => (
                  <td key={v} style={{ padding: "8px", borderRadius: vi === VITALS.length - 1 ? "0 6px 6px 0" : "0" }}>
                     <input
                        type="number"
                        value={row[v]}
                        placeholder="--"
                        onChange={e => update(i, v, e.target.value)}
                        style={{
                          width: "100%", minWidth: 45, padding: "8px", fontSize: 13,
                          background: "var(--bg-primary)", color: "var(--text-primary)",
                          border: "1px solid var(--border-color)", borderRadius: 6,
                          outline: "none", transition: "border-color 0.2s, box-shadow 0.2s"
                        }}
                        onFocus={e => {
                          e.target.style.borderColor = "var(--accent-blue)";
                          e.target.style.boxShadow = "var(--shadow-glow)";
                        }}
                        onBlur={e => {
                          e.target.style.borderColor = "var(--border-color)";
                          e.target.style.boxShadow = "none";
                        }}
                     />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <button 
          className="btn-primary" 
          onClick={fillRandom} 
          disabled={loading}
          style={{ flex: 1, background: "transparent", border: "1px solid var(--border-color)", color: "var(--text-primary)", boxShadow: "none" }}
        >
          Auto-Fill Random
        </button>
        <button 
          className="btn-primary" 
          onClick={() => onSubmit(rows)} 
          disabled={loading}
          style={{ flex: 2 }}
        >
          {loading ? "Analyzing..." : "Run Prediction"}
        </button>
      </div>

      {/* Adding a small injected style for hover state of rows */}
      <style>{`
        .vital-row:hover {
          background: rgba(255,255,255,0.03) !important;
        }
        /* Remove arrows from number inputs for a cleaner look */
        input[type="number"]::-webkit-inner-spin-button, 
        input[type="number"]::-webkit-outer-spin-button { 
          -webkit-appearance: none; margin: 0; 
        }
      `}</style>
    </div>
  );
}