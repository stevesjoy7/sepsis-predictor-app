import { useState, useEffect, useRef } from "react";
import { LineChart, Line, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const VITALS = ["HR","MAP","SBP","DBP","RR","SpO2","Glucose","Temp"];
const EMPTY_ROW = () => Object.fromEntries(VITALS.map(v => [v, ""]));

const BOUNDS = {
  "HR": [30, 220], "MAP": [40, 180], "SBP": [70, 250],
  "DBP": [30, 150], "RR": [5, 40], "SpO2": [70, 100],
  "Glucose": [40, 400], "Temp": [35.0, 42.0]
};

export default function VitalsForm({ onSubmit, loading, initialVitals }) {
  const [rows, setRows] = useState(initialVitals || Array.from({length:6}, EMPTY_ROW));
  const [isSimulating, setIsSimulating] = useState(false);
  const simRef = useRef(null);

  // Auto-Simulation Logic
  useEffect(() => {
    if (isSimulating) {
      simRef.current = setInterval(() => {
        // Shift rows left and append a new randomized row
        setRows(prev => {
          const next = [...prev.slice(1)];
          const newRow = {};
          
          // Generate new data using a slight random walk from the previous last row
          const last = prev[prev.length - 1];
          VITALS.forEach(v => {
            const [min, max] = BOUNDS[v];
            const base = last[v] !== "" ? last[v] : (min + max) / 2;
            const variance = (max - min) * 0.05; // 5% variance per tick
            
            let val = base + (Math.random() * variance * 2 - variance);
            if (val < min) val = min;
            if (val > max) val = max;
            
            newRow[v] = parseFloat(val.toFixed(v === 'Temp' ? 1 : 0));
          });
          next.push(newRow);
          onSubmit(next); // Auto submit the new rows
          return next;
        });
      }, 5000); // 5 seconds
    } else {
      clearInterval(simRef.current);
    }
    return () => clearInterval(simRef.current);
  }, [isSimulating, onSubmit]);

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

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const lines = text.split('\n').filter(l => l.trim().length > 0);
      if (lines.length < 2) return; // header only
      const headers = lines[0].split(',').map(h => h.trim());
      const nextRows = [];
      for (let i = 1; i <= Math.min(6, lines.length - 1); i++) {
        const values = lines[i].split(',');
        const newRow = {};
        headers.forEach((h, idx) => {
          if (VITALS.includes(h)) {
             newRow[h] = parseFloat(values[idx]) || "";
          }
        });
        VITALS.forEach(v => { if (newRow[v] === undefined) newRow[v] = "" });
        nextRows.push(newRow);
      }
      while(nextRows.length < 6) nextRows.push(EMPTY_ROW());
      setRows(nextRows);
    };
    reader.readAsText(file);
    e.target.value = null; // reset
  };

  // Prepare chart data ensuring it has an index for X-axis
  const chartData = rows.map((r, i) => ({ name: `Hr -${5-i}`, ...r }));

  const TrendChart = ({ dataKey, color, name }) => (
    <div style={{ flex: 1, minWidth: 120, height: 80, display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{name} Trend</span>
      <div style={{ flex: 1, background: 'rgba(0,0,0,0.1)', borderRadius: 8, padding: '4px 0' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <Tooltip 
              contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 8 }}
              itemStyle={{ color: 'var(--text-primary)', fontSize: 13 }}
              labelStyle={{ display: 'none' }}
              isAnimationActive={false}
            />
            <YAxis domain={['auto', 'auto']} hide />
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ r: 3, fill: color }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, height: "100%" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>Live Vitals Monitoring</h2>
          <p style={{ fontSize: 14, color: isSimulating ? "var(--color-green)" : "var(--text-muted)", transition: 'color 0.3s' }}>
            {isSimulating ? "🔴 Live Data Streaming Active" : "Enter patient vitals manually or simulate."}
          </p>
        </div>
        <button 
          onClick={() => setIsSimulating(!isSimulating)}
          style={{ 
            background: isSimulating ? 'rgba(239, 68, 68, 0.15)' : 'var(--accent-glow)',
            color: isSimulating ? 'var(--color-red)' : 'var(--text-primary)',
            border: `1px solid ${isSimulating ? 'var(--color-red)' : 'var(--accent-blue)'}`,
            padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, transition: 'all 0.3s'
          }}
        >
          {isSimulating ? "Stop Simulation" : "Simulate Live Data"}
        </button>
      </div>

      {/* Mini Trend Graphs */}
      <div style={{ display: 'flex', gap: 16 }}>
        <TrendChart dataKey="HR" color="var(--color-red)" name="Heart Rate" />
        <TrendChart dataKey="SBP" color="var(--accent-blue)" name="Systolic BP" />
        <TrendChart dataKey="Temp" color="var(--color-amber)" name="Temperature" />
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
                <td style={{ padding: "12px", color: "var(--accent-glow)", fontWeight: 600, borderRadius: "6px 0 0 6px" }}>−{5-i}</td>
                {VITALS.map((v, vi) => (
                  <td key={v} style={{ padding: "8px", borderRadius: vi === VITALS.length - 1 ? "0 6px 6px 0" : "0" }}>
                     <input
                        disabled={isSimulating}
                        type="number"
                        value={row[v]}
                        placeholder="--"
                        onChange={e => update(i, v, e.target.value)}
                        style={{
                          width: "100%", minWidth: 45, padding: "8px", fontSize: 13,
                          background: "var(--bg-primary)", color: "var(--text-primary)",
                          border: "1px solid var(--border-color)", borderRadius: 6,
                          outline: "none", transition: "border-color 0.2s, box-shadow 0.2s",
                          opacity: isSimulating ? 0.7 : 1
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

      {!isSimulating && (
        <div style={{ display: "flex", gap: 12 }}>
          <label 
            className="btn-primary" 
            style={{ flex: 1, background: "transparent", border: "1px dashed var(--border-color)", color: "var(--text-muted)", boxShadow: "none", display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer" }}
          >
            📁 Upload CSV
            <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: "none" }} disabled={loading} />
          </label>
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
            {loading ? "Analyzing..." : "Run Prediction Manual"}
          </button>
        </div>
      )}

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