import { useEffect, useState } from "react";
import { animalesAPI } from "../services/api";
import Toast from "../components/Toast";

const TIPOS    = ["BOVINO","PORCINO","OVINO"];
const CALIDADES = ["PRIMERA","SEGUNDA","TERCERA"];
const EMPTY = { codigo:"", tipo:"BOVINO", raza:"", peso_vivo:"", peso_canal:"", calidad:"PRIMERA", precio_compra:"", notas:"" };
const fmt = (n) => Number(n ?? 0).toLocaleString("es-CO");

export default function AnimalesPage() {
  const [animales, setAnimales] = useState([]);
  const [form, setForm]         = useState(EMPTY);
  const [loading, setLoading]   = useState(false);
  const [toast, setToast]       = useState({ msg:"", type:"success" });

  const cargar = () => animalesAPI.listar().then(r => setAnimales(r.data));
  useEffect(() => { cargar(); }, []);

  const set = (k, v) => setForm(p => ({...p, [k]: v}));

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await animalesAPI.crear({
        ...form,
        peso_vivo: parseFloat(form.peso_vivo),
        peso_canal: form.peso_canal ? parseFloat(form.peso_canal) : null,
        precio_compra: parseFloat(form.precio_compra),
      });
      setToast({ msg:"✅ Animal registrado exitosamente", type:"success" });
      setForm(EMPTY); cargar();
    } catch(err) {
      setToast({ msg:"❌ " + (err.response?.data?.detail || "Error al registrar"), type:"error" });
    } finally { setLoading(false); }
  };

  const eliminar = async (id) => {
    if (!confirm("¿Eliminar este animal?")) return;
    await animalesAPI.eliminar(id); cargar();
    setToast({ msg:"Animal eliminado", type:"success" });
  };

  return (
    <div className="main-content">
      <p className="section-title">🐄 Registro de Animales</p>

      {/* Formulario */}
      <div className="table-card" style={{marginBottom:24}}>
        <div className="table-card-header"><h2>Nuevo Animal</h2></div>
        <div style={{padding:"20px 24px"}}>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Código *</label>
                <input value={form.codigo} onChange={e=>set("codigo",e.target.value)} required placeholder="Ej: BOV-001" />
              </div>
              <div className="form-group">
                <label>Tipo</label>
                <select value={form.tipo} onChange={e=>set("tipo",e.target.value)}>
                  {TIPOS.map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Raza</label>
                <input value={form.raza} onChange={e=>set("raza",e.target.value)} placeholder="Ej: Cebú, Holstein" />
              </div>
              <div className="form-group">
                <label>Peso Vivo (kg) *</label>
                <input type="number" step="any" value={form.peso_vivo} onChange={e=>set("peso_vivo",e.target.value)} required className="mono" placeholder="450" />
              </div>
              <div className="form-group">
                <label>Peso Canal (kg)</label>
                <input type="number" step="any" value={form.peso_canal} onChange={e=>set("peso_canal",e.target.value)} className="mono" placeholder="247 (opcional)" />
              </div>
              <div className="form-group">
                <label>Calidad</label>
                <select value={form.calidad} onChange={e=>set("calidad",e.target.value)}>
                  {CALIDADES.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Precio Compra ($) *</label>
                <input type="number" step="any" value={form.precio_compra} onChange={e=>set("precio_compra",e.target.value)} required className="mono" placeholder="2500000" />
              </div>
              <div className="form-group" style={{gridColumn:"span 2"}}>
                <label>Notas</label>
                <input value={form.notas} onChange={e=>set("notas",e.target.value)} placeholder="Observaciones..." />
              </div>
            </div>
            <div style={{marginTop:18}}>
              <button type="submit" className="btn btn-navy btn-full" disabled={loading} style={{maxWidth:220}}>
                {loading ? "Guardando…" : "＋ Registrar Animal"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Tabla */}
      <div className="table-card">
        <div className="table-card-header">
          <h2>Animales Registrados</h2>
          <span className="tag tag-navy">{animales.length} registros</span>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Código</th><th>Tipo</th><th>Raza</th><th>Peso Vivo</th>
                <th>Peso Canal</th><th>Rendimiento</th><th>Calidad</th>
                <th>Precio Compra</th><th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {animales.map(a=>(
                <tr key={a.id}>
                  <td style={{fontWeight:600}}>{a.codigo}</td>
                  <td><span className="tag tag-navy">{a.tipo}</span></td>
                  <td className="td-muted">{a.raza||"—"}</td>
                  <td className="td-mono">{fmt(a.peso_vivo)} kg</td>
                  <td className="td-mono">{a.peso_canal ? `${fmt(a.peso_canal)} kg` : "—"}</td>
                  <td>{a.rendimiento_canal ? <span className="tag tag-green">{a.rendimiento_canal}%</span> : "—"}</td>
                  <td><span className="tag tag-blue">{a.calidad}</span></td>
                  <td className="td-price">${fmt(a.precio_compra)}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={()=>eliminar(a.id)}>🗑 Eliminar</button>
                  </td>
                </tr>
              ))}
              {!animales.length && (
                <tr><td colSpan={9}><div className="empty-state"><div className="empty-icon">🐄</div><p>Sin animales registrados</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Toast message={toast.msg} type={toast.type} onHide={()=>setToast({msg:""})} />
    </div>
  );
}
