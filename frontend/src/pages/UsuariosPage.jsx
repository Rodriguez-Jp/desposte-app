import { useEffect, useState } from "react";
import { authAPI } from "../services/api";
import Toast from "../components/Toast";

const ROLES = ["ADMIN","ESTANDAR"];
const EMPTY = {nombre:"",email:"",username:"",password:"",rol:"ESTANDAR"};
const fmt   = (d) => d ? new Date(d).toLocaleString("es-CO",{dateStyle:"short",timeStyle:"short"}) : "—";

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm]         = useState(EMPTY);
  const [loading, setLoading]   = useState(false);
  const [toast, setToast]       = useState({msg:""});
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState(null);

  const cargar = () => authAPI.listarUsuarios().then(r=>setUsuarios(r.data));
  useEffect(()=>{cargar();},[]);
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      if (editId) {
        await authAPI.actualizarUsuario(editId,{nombre:form.nombre,email:form.email,rol:form.rol});
        setToast({msg:"✅ Usuario actualizado",type:"success"});
      } else {
        await authAPI.crearUsuario(form);
        setToast({msg:"✅ Usuario creado",type:"success"});
      }
      setForm(EMPTY); setShowForm(false); setEditId(null); cargar();
    } catch(err) {
      setToast({msg:"❌ "+(err.response?.data?.detail||"Error"),type:"error"});
    } finally {setLoading(false);}
  };

  const toggleActivo = async (u) => {
    await authAPI.actualizarUsuario(u.id,{activo:!u.activo}); cargar();
    setToast({msg:`Usuario ${!u.activo?"activado":"desactivado"}`,type:"success"});
  };

  const eliminar = async (id) => {
    if(!confirm("¿Eliminar usuario permanentemente?")) return;
    await authAPI.eliminarUsuario(id); cargar();
    setToast({msg:"Usuario eliminado",type:"success"});
  };

  const abrirEditar = (u) => {
    setForm({nombre:u.nombre,email:u.email,username:u.username,password:"",rol:u.rol});
    setEditId(u.id); setShowForm(true);
  };

  return (
    <div className="main-content">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <p className="section-title" style={{margin:0}}>👥 Gestión de Usuarios</p>
        <button className="btn btn-navy" onClick={()=>{setForm(EMPTY);setEditId(null);setShowForm(true);}}>
          ＋ Nuevo Usuario
        </button>
      </div>

      <div className="kpis" style={{gridTemplateColumns:"repeat(3,1fr)",marginBottom:20}}>
        <div className="kpi-card"><span className="kpi-label">Total</span><span className="kpi-value navy">{usuarios.length}</span></div>
        <div className="kpi-card"><span className="kpi-label">Administradores</span><span className="kpi-value orange">{usuarios.filter(u=>u.rol==="ADMIN").length}</span></div>
        <div className="kpi-card"><span className="kpi-label">Activos</span><span className="kpi-value green">{usuarios.filter(u=>u.activo).length}</span></div>
      </div>

      {showForm && (
        <div className="modal-overlay open" onClick={e=>{if(e.target===e.currentTarget){setShowForm(false);setEditId(null);}}}>
          <div className="modal-box">
            <h3>{editId?"✏️ Editar Usuario":"➕ Nuevo Usuario"}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{marginBottom:12}}>
                <label>Nombre completo *</label>
                <input value={form.nombre} onChange={e=>set("nombre",e.target.value)} required placeholder="Juan Pérez" />
              </div>
              <div className="form-group" style={{marginBottom:12}}>
                <label>Email *</label>
                <input type="email" value={form.email} onChange={e=>set("email",e.target.value)} required placeholder="juan@empresa.com" />
              </div>
              {!editId && <>
                <div className="form-group" style={{marginBottom:12}}>
                  <label>Username *</label>
                  <input value={form.username} onChange={e=>set("username",e.target.value)} required placeholder="juan.perez" />
                </div>
                <div className="form-group" style={{marginBottom:12}}>
                  <label>Contraseña *</label>
                  <input type="password" value={form.password} onChange={e=>set("password",e.target.value)} required placeholder="Mínimo 8 caracteres" />
                </div>
              </>}
              <div className="form-group" style={{marginBottom:20}}>
                <label>Rol</label>
                <select value={form.rol} onChange={e=>set("rol",e.target.value)}>
                  {ROLES.map(r=><option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={()=>{setShowForm(false);setEditId(null);}}>Cancelar</button>
                <button type="submit" className="btn btn-navy" disabled={loading}>{loading?"Guardando…":editId?"Guardar":"Crear"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="table-card">
        <div className="table-card-header">
          <h2>Usuarios del Sistema</h2>
          <span className="tag tag-navy">{usuarios.length} registros</span>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr><th>ID</th><th>Nombre</th><th>Username</th><th>Email</th><th>Rol</th><th>Estado</th><th>Último Acceso</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {usuarios.map(u=>(
                <tr key={u.id}>
                  <td className="td-mono td-muted">#{u.id}</td>
                  <td style={{fontWeight:600}}>{u.nombre}</td>
                  <td className="td-mono">{u.username}</td>
                  <td className="td-muted" style={{fontSize:".82rem"}}>{u.email}</td>
                  <td>
                    <span className="tag" style={u.rol==="ADMIN"?{background:"#fef0e7",color:"var(--accent)"}:{background:"#e0effe",color:"#1a5fb4"}}>
                      {u.rol==="ADMIN"?"👑 Admin":"👤 Operador"}
                    </span>
                  </td>
                  <td><span className={`tag ${u.activo?"tag-green":"tag-red"}`}>{u.activo?"● Activo":"○ Inactivo"}</span></td>
                  <td className="td-mono td-muted" style={{fontSize:".78rem"}}>{fmt(u.ultimo_acceso)}</td>
                  <td>
                    <div className="actions">
                      <button className="btn btn-ghost btn-sm" onClick={()=>abrirEditar(u)}>✏️</button>
                      <button className={`btn btn-sm ${u.activo?"btn-danger":"btn-approve"}`} onClick={()=>toggleActivo(u)}>{u.activo?"⛔":"✅"}</button>
                      <button className="btn btn-danger btn-sm" onClick={()=>eliminar(u.id)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Toast message={toast.msg} type={toast.type} onHide={()=>setToast({msg:""})} />
    </div>
  );
}
