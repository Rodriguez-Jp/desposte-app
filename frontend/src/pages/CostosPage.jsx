import { useEffect, useState } from "react";
import { costosAPI, animalesAPI } from "../services/api";
import Toast from "../components/Toast";

const CATS = ["Adquisicion","Transporte","Sacrificio","Proceso","Empaque","Almacenamiento","Otros"];
const EMPTY = { animal_id:"", concepto:"", categoria:"", valor:"", unidad:"por_animal", notas:"" };
const fmt = (n) => Number(n??0).toLocaleString("es-CO");

export default function CostosPage() {
  const [costos,   setCostos]   = useState([]);
  const [animales, setAnimales] = useState([]);
  const [form, setForm]         = useState(EMPTY);
  const [loading, setLoading]   = useState(false);
  const [toast, setToast]       = useState({msg:""});

  const cargar = () => {
    costosAPI.listar().then(r=>setCostos(r.data));
    animalesAPI.listar().then(r=>setAnimales(r.data));
  };
  useEffect(()=>{ cargar(); },[]);
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await costosAPI.crear({...form, animal_id: form.animal_id ? parseInt(form.animal_id) : null, valor: parseFloat(form.valor)});
      setToast({msg:"✅ Costo registrado",type:"success"});
      setForm(EMPTY); cargar();
    } catch(err) {
      setToast({msg:"❌ "+(err.response?.data?.detail||"Error"),type:"error"});
    } finally { setLoading(false); }
  };

  const total = costos.reduce((s,c)=>s+c.valor,0);
  const catColor = (c) => ({Transporte:"tag-blue",Sacrificio:"tag-red",Proceso:"tag-yellow",Empaque:"tag-green"}[c]||"tag-navy");

  return (
    <div className="main-content">
      <p className="section-title">💰 Registro de Costos</p>

      <div className="kpis" style={{gridTemplateColumns:"repeat(3,1fr)",marginBottom:24}}>
        <div className="kpi-card"><span className="kpi-label">Total Costos Registrados</span><span className="kpi-value orange">${fmt(total)}</span></div>
        <div className="kpi-card"><span className="kpi-label">Número de Registros</span><span className="kpi-value navy">{costos.length}</span></div>
        <div className="kpi-card"><span className="kpi-label">Costo Promedio</span><span className="kpi-value blue">${costos.length?fmt(total/costos.length):"0"}</span></div>
      </div>

      <div className="table-card" style={{marginBottom:24}}>
        <div className="table-card-header"><h2>Nuevo Costo</h2></div>
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
                <label>Notas</label>
                <input value={form.notas} onChange={e=>set("notas",e.target.value)} placeholder="Observaciones..." />
              </div>
            </div>
            <div style={{marginTop:18}}>
              <button type="submit" className="btn btn-navy btn-full" disabled={loading} style={{maxWidth:220}}>
                {loading ? "Guardando…" : "＋ Registrar Costo"}
              </button>
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
              <tr><th>Concepto</th><th>Animal</th><th>Categoría</th><th>Valor</th><th>Unidad</th><th>Notas</th><th>Fecha</th></tr>
            </thead>
            <tbody>
              {costos.map(c=>(
                <tr key={c.id}>
                  <td style={{fontWeight:600}}>{c.concepto}</td>
                  <td className="td-muted">{c.animal_id ? `#${c.animal_id}` : "General"}</td>
                  <td>{c.categoria ? <span className={`tag ${catColor(c.categoria)}`}>{c.categoria}</span> : "—"}</td>
                  <td className="td-price">${fmt(c.valor)}</td>
                  <td className="td-muted td-mono">{c.unidad}</td>
                  <td className="td-muted" style={{fontSize:".8rem"}}>{c.notas||"—"}</td>
                  <td className="td-muted td-mono" style={{fontSize:".78rem"}}>{new Date(c.fecha_registro).toLocaleDateString("es-CO")}</td>
                </tr>
              ))}
              {!costos.length && (
                <tr><td colSpan={7}><div className="empty-state"><div className="empty-icon">💰</div><p>Sin costos registrados</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Toast message={toast.msg} type={toast.type} onHide={()=>setToast({msg:""})} />
    </div>
  );
}
