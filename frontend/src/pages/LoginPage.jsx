import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [form, setForm]       = useState({ username: "", password: "" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      await login(form.username, form.password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || "Credenciales incorrectas");
    } finally { setLoading(false); }
  };

  return (
    <div style={s.bg}>
      <div style={s.card}>
        {/* Logo */}
        <div style={s.logoWrap}>
          <div style={s.logoCircle}>🐂</div>
          <h1 style={s.logoTitle}><strong>Optimización de Precios</strong></h1>
          <p style={s.logoSub}>Desposte de Ganado — v2.0</p>
        </div>

        <div style={s.divider} />

        <h2 style={s.h2}>Iniciar sesión</h2>

        {error && (
          <div className="alert alert-red"
               style={{marginBottom:16, padding:"10px 14px", borderRadius:8}}>
            <span className="alert-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{marginBottom:14}}>
            <label>Usuario</label>
            <input
              autoFocus
              value={form.username}
              onChange={e => setForm(p => ({...p, username: e.target.value}))}
              placeholder="Ingresa tu usuario"
              required
            />
          </div>

          <div className="form-group" style={{marginBottom:24, position:"relative"}}>
            <label>Contraseña</label>
            <input
              type={showPwd ? "text" : "password"}
              value={form.password}
              onChange={e => setForm(p => ({...p, password: e.target.value}))}
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPwd(p => !p)}
              style={s.eye}
              tabIndex={-1}
            >
              {showPwd ? "🙈" : "👁️"}
            </button>
          </div>

          <button
            type="submit"
            className="btn btn-navy btn-full"
            disabled={loading}
            style={{fontSize:"1rem", padding:"11px"}}
          >
            {loading ? "⏳ Verificando…" : "Ingresar →"}
          </button>
        </form>

        <p style={s.footer}>
          ¿No tienes acceso? Contacta al administrador del sistema.
        </p>
      </div>
    </div>
  );
}

const s = {
  bg: {
    minHeight: "100vh",
    background: "var(--navy)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    background: "var(--white)",
    borderRadius: 14,
    padding: "36px 40px",
    width: "100%",
    maxWidth: 400,
    boxShadow: "0 24px 64px rgba(0,0,0,.4)",
    animation: "fadeUp .35s ease",
  },
  logoWrap:   { textAlign: "center", marginBottom: 8 },
  logoCircle: {
    width: 60, height: 60, borderRadius: "50%",
    background: "var(--navy)",
    display: "inline-flex", alignItems: "center",
    justifyContent: "center", fontSize: "2rem", marginBottom: 10,
  },
  logoTitle: { color: "var(--navy)", fontSize: "1.1rem", fontWeight: 700, margin: 0 },
  logoSub:   { color: "var(--muted)", fontSize: ".82rem", margin: "4px 0 0" },
  divider:   { height: 1, background: "var(--border)", margin: "18px 0" },
  h2:        { fontSize: "1rem", fontWeight: 600, color: "var(--text)", marginBottom: 16 },
  eye: {
    position: "absolute", right: 10, bottom: 9,
    background: "none", border: "none", cursor: "pointer", fontSize: "1rem",
  },
  footer: {
    color: "var(--muted)",
    fontSize: ".78rem",
    textAlign: "center",
    marginTop: 20,
    paddingTop: 16,
    borderTop: "1px solid var(--border)",
  },
};