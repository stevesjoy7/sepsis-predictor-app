import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from "recharts";

export default function ShapPanel({ bar_values, heatmap_values, vital_names }) {
  const barData = vital_names.map((name, i) => ({ name, value: bar_values[i] }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>SHAP Feature Importance</h3>
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Impact of each vital sign on the BiLSTM prediction.</p>
      </div>
      
      <div style={{ height: 200, width: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
            <XAxis type="number" tick={{ fontSize: 11, fill: "var(--text-muted)" }} stroke="var(--border-color)" />
            <YAxis dataKey="name" type="category" width={60} tick={{ fontSize: 11, fill: "var(--text-secondary)" }} stroke="transparent" />
            <Tooltip 
               formatter={v => v.toFixed(4)} 
               contentStyle={{ background: "var(--bg-panel-hover)", border: "1px solid var(--border-color)", borderRadius: 8, color: "var(--text-primary)" }}
               itemStyle={{ color: "var(--accent-blue)" }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {barData.map((d, i) => (
                 <Cell key={i} fill={d.value > 0 ? "var(--color-red)" : "var(--color-green)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginTop: 8 }}>
         <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>Temporal Heatmap</h3>
         <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>SHAP values across the 6-hour history window.</p>
         <div style={{ overflowX: "auto" }}>
            <table style={{ minWidth: "100%", borderCollapse: "separate", borderSpacing: "0 4px", fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ padding: "0 8px 8px", color: "var(--text-secondary)", fontWeight: 500, textAlign: "left" }}>Vital</th>
                  {Array.from({length:6}, (_,i) => i).reverse().map(i => (
                     <th key={i} style={{ padding: "0 8px 8px", color: "var(--text-secondary)", fontWeight: 500, textAlign: "center" }}>Hr -{i}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vital_names.map((vit, vi) => {
                  const rowVals = heatmap_values.map(hr => hr[vi]);
                  const maxVal  = Math.max(...rowVals.map(Math.abs));
                  return (
                    <tr key={vit}>
                      <td style={{ padding: "6px 8px", fontWeight: 500, color: "var(--text-primary)" }}>{vit}</td>
                      {rowVals.map((val, hi) => {
                        const intensity = maxVal > 0 ? Math.abs(val) / maxVal : 0;
                        const bg = val > 0 
                                   ? `rgba(239,68,68,${(intensity * 0.8).toFixed(2)})` 
                                   : `rgba(34,197,94,${(intensity * 0.8).toFixed(2)})`;
                        const isHighIntensity = intensity > 0.4;
                        return (
                           <td key={hi} style={{
                              padding: "6px 8px", 
                              background: bg,
                              textAlign: "center", 
                              color: isHighIntensity ? "#fff" : "var(--text-muted)",
                              border: `1px solid ${intensity > 0 ? 'transparent' : 'var(--border-color)'}`,
                              borderRadius: 4
                           }}>
                              {val === 0 ? "0.00" : val.toFixed(2)}
                           </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}