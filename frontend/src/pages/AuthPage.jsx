import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState("Doctor");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem("sepsis_auth", role);
      navigate("/");
    }, 800);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)',
      backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.15), transparent 50%), radial-gradient(circle at 100% 100%, rgba(139, 92, 246, 0.1), transparent 50%)',
      padding: 24
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: 440, padding: 40, position: 'relative', overflow: 'hidden' }}>
        
        {/* Decorative background blur */}
        <div style={{ position: 'absolute', top: -50, left: -50, width: 100, height: 100, background: 'var(--accent-blue)', filter: 'blur(60px)', opacity: 0.5, zIndex: 0 }} />
        
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, margin: '0 auto 16px', borderRadius: 16, background: 'linear-gradient(135deg, var(--accent-blue), #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 32, boxShadow: '0 8px 32px rgba(59, 130, 246, 0.4)' }}>
            🏥
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>ICU Neural Monitor</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Secure portal for clinical staff</p>
        </div>

        <form onSubmit={handleLogin} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          <div>
             <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>Select Role</label>
             <div style={{ display: 'flex', gap: 10 }}>
                {["Doctor", "Nurse", "Admin"].map(r => (
                   <button 
                      key={r} type="button"
                      onClick={() => setRole(r)}
                      style={{ 
                         flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                         background: role === r ? 'var(--accent-glow)' : 'transparent',
                         color: role === r ? 'var(--accent-blue)' : 'var(--text-muted)',
                         border: `1px solid ${role === r ? 'var(--accent-blue)' : 'var(--border-color)'}`
                      }}
                   >
                      {r}
                   </button>
                ))}
             </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>Staff ID / Email</label>
            <input 
              type="text" placeholder="e.g. dr.smith@hospital.org"
              style={{ width: '100%', padding: '14px 16px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s' }}
              onFocus={e => e.target.style.borderColor = 'var(--accent-blue)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
              required
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>Passcode</label>
            <input 
              type="password" placeholder="••••••••"
              style={{ width: '100%', padding: '14px 16px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s' }}
              onFocus={e => e.target.style.borderColor = 'var(--accent-blue)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
              required
            />
          </div>

          <button 
            type="submit" disabled={loading}
            style={{ 
              width: '100%', padding: 16, marginTop: 8, borderRadius: 8, border: 'none', 
              background: 'linear-gradient(135deg, var(--accent-blue), #2563eb)', color: '#fff', 
              fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)',
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8
            }}
            onMouseOver={e => { if(!loading) e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {loading ? (
               <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            ) : "Authenticate"}
          </button>
        </form>

      </div>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
