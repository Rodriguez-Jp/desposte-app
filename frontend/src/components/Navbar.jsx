import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LINKS = [
  { to: "/",         label: "📊 Dashboard", adminOnly: false },
  { to: "/animales", label: "🐄 Animales",  adminOnly: false },
  { to: "/cortes",   label: "🥩 Cortes",    adminOnly: false },
  { to: "/costos",   label: "💰 Costos",    adminOnly: false },
  { to: "/sipsa",    label: "📈 SIPSA",     adminOnly: false },
  { to: "/analisis", label: "🔬 Análisis",  adminOnly: false },
  { to: "/usuarios", label: "👥 Usuarios",  adminOnly: true  },
];

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <NavLink to="/" className="nav-brand" style={{textDecoration:"none"}}>
        <div className="nav-brand-icon">🐂</div>
        <h1><strong>Optimización de Precios</strong><br/>en el Desposte de Ganado</h1>
      </NavLink>

      <div className="nav-links" style={{flex:1, paddingLeft:16}}>
        {LINKS.filter(l => !l.adminOnly || isAdmin).map(({ to, label }) => (
          <NavLink key={to} to={to} end={to==="/"} className={({isActive})=>"nav-link"+(isActive?" active":"")}>
            {label}
          </NavLink>
        ))}
      </div>

      {user && (
        <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
          <NavLink to="/perfil" style={{textDecoration:"none"}}>
            <div style={st.userInfo}>
              <div style={st.avatar}>{user.nombre?.[0]?.toUpperCase()||"U"}</div>
              <div>
                <div style={st.userName}>{user.nombre}</div>
                <span style={st.rolBadge(user.rol)}>
                  {user.rol==="ADMIN"?"👑 Admin":"👤 Operador"}
                </span>
              </div>
            </div>
          </NavLink>
          <button onClick={()=>{logout();navigate("/login");}} className="nav-link">
            🚪 Salir
          </button>
        </div>
      )}
    </nav>
  );
}

const st = {
  userInfo: {
    display:"flex",alignItems:"center",gap:8,
    padding:"4px 10px",borderRadius:8,
    background:"rgba(255,255,255,.08)",cursor:"pointer",
  },
  avatar: {
    width:32,height:32,borderRadius:"50%",
    background:"rgba(255,255,255,.2)",
    display:"flex",alignItems:"center",justifyContent:"center",
    fontWeight:700,color:"white",fontSize:".9rem",
  },
  userName: {color:"white",fontSize:".82rem",fontWeight:600},
  rolBadge: (rol) => ({
    fontSize:".68rem",fontWeight:700,padding:"1px 7px",borderRadius:20,
    background: rol==="ADMIN"?"#e05c1a":"rgba(255,255,255,.2)",
    color:"white",
  }),
};
