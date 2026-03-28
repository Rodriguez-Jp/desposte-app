import { useState } from "react";
import { authAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/Toast";

export default function PerfilPage() {
  const { user } = useAuth();
  const [form, setForm]       = useState({password_actual:"",password_nueva:"",confirmar:""});
  const [loading, setLoading] = useState(false);
  const [toast, setToast]     = useState({msg:""});
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password_nueva !== form.confirmar)
      return setToast({msg:"❌ Las contraseñas no coinciden",type:"error"});
    if (form.password_nueva.length < 8)
      return setToast({msg:"❌ Mínimo 8 caracteres",type:"error"});
    setLoading(true);
    try {
      await authAPI.cambiarPassword({password_actual:form.password_actual,password_nueva:form.password_nueva});
      setToast({msg:"✅ Contraseña actualizada",type:"success"});
      setForm({password_actual:"",password_nueva:"",confirmar:""});
    } catch(err) {
      setToast({msg:"❌ "+(err.response?.data?.detail||"Error"),type:"error"});
    } finally {setLoading(false);}
  };

  return (
    <div className="main-content">
      <p className="section-title">👤 Mi Perfil</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <div className="table-card">
          <div className="table-card-header"><h2>Información de cuenta</h2></div>
          <div style={{padding:"24px"}}>
            <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20}}>
              <div style={{width:64,height:64,borderRadius:"50%",background:"var(--navy)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.8rem",color:"white",fontWeight:700}}>
                {user?.nombre?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{fontWeight:700,fontSize:"1.1rem",color:"var(--navy)"}}>{user?.nombre}</div>
                <div style={{color:"var(--muted)",fontSize:".85rem",margin:"2px 0 6px"}}>{user?.username}</div>
                <span className="tag" style={user?.rol==="ADMIN"?{background:"#fef0e7",color:"var(--accent)"}:{background:"#e0effe",color:"#1a5fb4"}}>
                  {user?.rol==="ADMIN"?"👑 Administrador":"👤 Operador"}
                </span>
              </div>
            </div>
            <div style={{borderTop:"1px solid var(--border)",paddingTop:16,display:"grid",gap:12}}>
              {[["Nombre completo",user?.nombre],["Username",user?.username],["Rol",user?.rol]].map(([l,v])=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:".8rem",color:"var(--muted)"}}>{l}</span>
                  <span style={{fontWeight:600,fontSize:".9rem"}}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="table-card">
          <div className="table-card-header"><h2>🔐 Cambiar contraseña</h2></div>
          <div style={{padding:"24px"}}>
            <form onSubmit={handleSubmit}>
              {[["password_actual","Contraseña actual","Tu contraseña actual"],
                ["password_nueva","Nueva contraseña","Mínimo 8 caracteres"],
                ["confirmar","Confirmar nueva contraseña","Repite la nueva contraseña"]].map(([k,label,ph])=>(
                <div className="form-group" key={k} style={{marginBottom:14}}>
                  <label>{label}</label>
                  <input type="password" value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={ph} required />
                </div>
              ))}
              <button type="submit" className="btn btn-navy btn-full" disabled={loading} style={{marginTop:6}}>
                {loading?"Guardando…":"🔐 Actualizar contraseña"}
              </button>
            </form>
          </div>
        </div>
      </div>
      <Toast message={toast.msg} type={toast.type} onHide={()=>setToast({msg:""})} />
    </div>
  );
}
