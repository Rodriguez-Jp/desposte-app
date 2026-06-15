import { useEffect, useState } from "react";
import { DollarSign, Save, Plus, Pencil, Trash2, X } from "lucide-react";
import { costosAPI, animalesAPI } from "../services/api";
import Toast from "../components/Toast";

const CATS = ["Adquisicion","Transporte","Sacrificio","Proceso","Empaque","Almacenamiento","Otros"];
const INDUCTORES = [
  ["KG","Kg procesados (por peso)"],
  ["HORAS_HOMBRE","Horas-hombre (por proceso)"],
  ["KWH","kWh (por proceso)"],
  ["M3_REFRIG","m³ refrigeración (por proceso)"],
  ["FIJO","Fijo (por peso)"],
];
const EMPTY = { animal_id:"", concepto:"", categoria:"", valor:"", unidad:"por_animal", inductor:"KG", notas:"" };
const fmt = (n) => Number(n??0).toLocaleString("es-CO");

export default function CostosPage() {
  const [costos,   setCostos]   = useState([]);
  const [animales, setAnimales] = useState([]);
  const [form, setForm]         = useState(EMPTY);
  const [editId, setEditId]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [toast, setToast]       = useState({msg:""});
  const [nota, setNota]         = useState(null);   // texto de nota expandida (modal)

  const cargar = () => {
    costosAPI.listar().then(r=>setCostos(r.data));
    animalesAPI.listar().then(r=>setAnimales(r.data));
  };
  useEffect(()=>{ cargar(); },[]);
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const payload = {...form, animal_id: form.animal_id ? parseInt(form.animal_id) : null, valor: parseFloat(form.valor)};
      if (editId) {
        await costosAPI.actualizar(editId, payload);
        setToast({msg:"Costo actualizado",type:"success"});
      } else {
        await costosAPI.crear(payload);
        setToast({msg:"Costo registrado",type:"success"});
      }
      setForm(EMPTY); setEditId(null); cargar();
    } catch(err) {
      setToast({msg:err.response?.data?.detail||"Error",type:"error"});
    } finally { setLoading(false); }
  };

  const editar = (c) => {
    setForm({
      animal_id:c.animal_id?String(c.animal_id):"", concepto:c.concepto,
      categoria:c.categoria||"", valor:c.valor??"", unidad:c.unidad||"por_animal",
      inductor:c.inductor||"KG", notas:c.notas||"",
    });
    setEditId(c.id);
    window.scrollTo({ top:0, behavior:"smooth" });
  };

  const cancelar = () => { setForm(EMPTY); setEditId(null); };

  const eliminar = async (id) => {
    if (!confirm("¿Eliminar este costo?")) return;
    await costosAPI.eliminar(id); cargar();
    setToast({msg:"Costo eliminado",type:"success"});
  };

  const total = costos.reduce((s,c)=>s+c.valor,0);
  const catColor = (c) => ({Transporte:"tag-blue",Sacrificio:"tag-red",Proceso:"tag-yellow",Empaque:"tag-green"}[c]||"tag-navy");
  const trunc = (t,n=28) => t.length>n ? t.slice(0,n)+"…" : t;

  return (
    <div className="main-content">
      <p className="section-title"><DollarSign size={20} /> Registro de Costos</p>

      <div className="kpis" style={{gridTemplateColumns:"repeat(3,1fr)",marginBottom:24}}>
        <div className="kpi-card"><span className="kpi-label">Total Costos Registrados</span><span className="kpi-value orange">${fmt(total)}</span></div>
        <div className="kpi-card"><span className="kpi-label">Número de Registros</span><span className="kpi-value navy">{costos.length}</span></div>
        <div className="kpi-card"><span className="kpi-label">Costo Promedio</span><span className="kpi-value blue">${costos.length?fmt(total/costos.length):"0"}</span></div>
      </div>

      <div className="table-card" style={{marginBottom:24}}>
        <div className="table-card-header"><h2>{editId ? "Editar Costo" : "Nuevo Costo"}</h2></div>
        <div style={{padding:"20px 24px"}}>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Animal (opcional)</label>
                <select value={form.animal_id} onChange={e=>set("animal_id",e.target.value)}>
                  <option value="">— General (no asignado) —</option>
                  {animales.map(a=><option key={a.id} value={a.id}>{a.codigo}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Concepto *</label>
                <input value={form.concepto} onChange={e=>set("concepto",e.target.value)} required placeholder="Ej: Transporte Corabastos" />
              </div>
              <div className="form-group">
                <label>Categoría</label>
                <select value={form.categoria} onChange={e=>set("categoria",e.target.value)}>
                  <option value="">— Sin categoría —</option>
                  {CATS.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Valor ($) *</label>
                <input type="number" step="any" value={form.valor} onChange={e=>set("valor",e.target.value)} required className="mono" placeholder="150000" />
              </div>
              <div className="form-group">
                <label>Unidad</label>
                <select value={form.unidad} onChange={e=>set("unidad",e.target.value)}>
                  <option value="por_animal">Por animal</option>
                  <option value="por_kg">Por kg</option>
                  <option value="fijo">Fijo</option>
                </select>
              </div>
              <div className="form-group">
                <label>Inductor ABC</label>
                <select value={form.inductor} onChange={e=>set("inductor",e.target.value)}>
                  {INDUCTORES.map(([v,l])=><option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Notas</label>
                <input value={form.notas} onChange={e=>set("notas",e.target.value)} placeholder="Observaciones..." />
              </div>
            </div>
            <div style={{marginTop:18, display:"flex", gap:12}}>
              <button type="submit" className="btn btn-navy btn-full" disabled={loading} style={{maxWidth:220}}>
                {loading ? "Guardando…" : editId ? <><Save size={15} /> Guardar Cambios</> : <><Plus size={15} /> Registrar Costo</>}
              </button>
              {editId && (
                <button type="button" className="btn btn-sm" onClick={cancelar} style={{maxWidth:140}}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <div className="table-card">
        <div className="table-card-header">
          <h2>Costos Registrados</h2>
          <span className="tag tag-orange" style={{background:"#fef0e7",color:"var(--accent)"}}>Total: ${fmt(total)}</span>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr><th>Concepto</th><th>Animal</th><th>Categoría</th><th>Valor</th><th>Unidad</th><th>Inductor</th><th>Notas</th><th>Fecha</th><th>Acción</th></tr>
            </thead>
            <tbody>
              {costos.map(c=>(
                <tr key={c.id}>
                  <td style={{fontWeight:600}}>{c.concepto}</td>
                  <td className="td-muted">{c.animal_id ? `#${c.animal_id}` : "General"}</td>
                  <td>{c.categoria ? <span className={`tag ${catColor(c.categoria)}`}>{c.categoria}</span> : "—"}</td>
                  <td className="td-price">${fmt(c.valor)}</td>
                  <td className="td-muted td-mono">{c.unidad}</td>
                  <td className="td-muted td-mono" style={{fontSize:".78rem"}}>{c.inductor||"KG"}</td>
                  <td className="td-muted" style={{fontSize:".8rem", maxWidth:200}}>
                    {c.notas
                      ? <span onClick={()=>setNota(c.notas)} title="Ver nota completa"
                              style={{cursor:"pointer", textDecoration: c.notas.length>28?"underline dotted":"none"}}>
                          {trunc(c.notas)}
                        </span>
                      : "—"}
                  </td>
                  <td className="td-muted td-mono" style={{fontSize:".78rem"}}>{new Date(c.fecha_registro).toLocaleDateString("es-CO")}</td>
                  <td>
                    <div style={{display:"flex", gap:6}}>
                      <button className="btn btn-sm" onClick={()=>editar(c)}><Pencil size={14} /></button>
                      <button className="btn btn-danger btn-sm" onClick={()=>eliminar(c.id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!costos.length && (
                <tr><td colSpan={9}><div className="empty-state"><div className="empty-icon"><DollarSign size={40} /></div><p>Sin costos registrados</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {nota !== null && (
        <div onClick={()=>setNota(null)}
             style={{position:"fixed", inset:0, background:"rgba(0,0,0,.45)", display:"flex",
                     alignItems:"center", justifyContent:"center", zIndex:1000, padding:20}}>
          <div onClick={e=>e.stopPropagation()}
               style={{background:"#fff", borderRadius:12, maxWidth:520, width:"100%", padding:24,
                       boxShadow:"0 10px 40px rgba(0,0,0,.25)"}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
              <h3 style={{margin:0}}>Nota</h3>
              <button className="btn btn-sm" onClick={()=>setNota(null)}><X size={14} /></button>
            </div>
            <p style={{margin:0, whiteSpace:"pre-wrap", wordBreak:"break-word", lineHeight:1.5}}>{nota}</p>
          </div>
        </div>
      )}
      <Toast message={toast.msg} type={toast.type} onHide={()=>setToast({msg:""})} />
    </div>
  );
}
