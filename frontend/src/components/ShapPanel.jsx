import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from "recharts";

export default function ShapPanel({ bar_values, heatmap_values, vital_names }) {
  // Map and sort data for Waterfall-like presentation (sorted by absolute impact)
  let barData = vital_names.map((name, i) => ({ 
    name, 
    value: bar_values[i], 
    absVal: Math.abs(bar_values[i]) 
  }));
  barData.sort((a, b) => a.absVal - b.absVal); // Lowest at top, highest at bottom

  // Generate explanatory text for the top 2 features driving risk up or down
  const highImpact = [...barData].sort((a, b) => b.absVal - a.absVal).slice(0, 2);
  const explanations = highImpact.map(feat => {
    const direction = feat.value > 0 ? "increases" : "decreases";
    const impact = feat.absVal > 0.05 ? "significantly" : "slightly";
    const color = feat.value > 0 ? "var(--color-red)" : "var(--color-green)";
    return (
      <div key={feat.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 13, background: 'var(--bg-primary)', padding: '8px 12px', borderRadius: 8, border: `1px solid ${color}40` }}>
         <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }}></div>
         <div>The patient's <strong>{feat.name}</strong> 
         <span style={{ color: color, fontWeight: 600 }}> ({feat.value > 0 ? '+' : ''}{feat.value.toFixed(4)})</span> {direction} risk {impact}.</div>
      </div>
    );
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>SHAP Waterfall Analysis</h3>
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Calculated systemic impact of vitals pushing probability higher (red) or lower (green).</p>
      </div>

      <div style={{ marginTop: 8 }}>
        {explanations}
      </div>
      
      <div style={{ height: 250, width: "100%", marginTop: 8 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
            <XAxis type="number" tick={{ fontSize: 11, fill: "var(--text-muted)" }} stroke="var(--border-color)" />
            <YAxis dataKey="name" type="category" width={60} tick={{ fontSize: 11, fill: "var(--text-primary)", fontWeight: 500 }} stroke="transparent" />
            <Tooltip 
               formatter={v => v.toFixed(4)} 
               contentStyle={{ background: "var(--bg-panel)", border: "1px solid var(--border-color)", borderRadius: 8, color: "var(--text-primary)" }}
               itemStyle={{ color: "var(--accent-blue)" }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
              {barData.map((d, i) => (
                 <Cell key={i} fill={d.value > 0 ? "var(--color-red)" : "var(--color-green)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginTop: 16 }}>
         <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>Temporal Heatmap</h3>
         <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>SHAP variance across the 6-hour history tracking window.</p>
         <div style={{ overflowX: "auto", background: 'rgba(0,0,0,0.1)', padding: 12, borderRadius: 12 }}>
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
                      <td style={{ padding: "8px 12px", fontWeight: 500, color: "var(--text-primary)", background: "rgba(255,255,255,0.03)", borderRadius: "6px 0 0 6px" }}>{vit}</td>
                      {rowVals.map((val, hi) => {
                        const intensity = maxVal > 0 ? Math.abs(val) / maxVal : 0;
                        const bg = val > 0 
                                   ? `rgba(239,68,68,${(intensity * 0.8).toFixed(2)})` 
                                   : `rgba(34,197,94,${(intensity * 0.8).toFixed(2)})`;
                        const isHighIntensity = intensity > 0.4;
                        return (
                           <td key={hi} style={{
                              padding: "8px", 
                              background: intensity > 0 ? bg : "rgba(255,255,255,0.02)",
                              textAlign: "center", 
                              color: isHighIntensity ? "#fff" : "var(--text-muted)",
                              borderRight: "1px solid var(--border-color)",
                              borderTop: "1px solid var(--border-color)",
                              borderBottom: "1px solid var(--border-color)",
                              borderRadius: hi === rowVals.length-1 ? "0 6px 6px 0" : 0
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