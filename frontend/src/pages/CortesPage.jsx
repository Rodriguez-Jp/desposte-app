import { useEffect, useState } from "react";
import { Slice, Save, Plus, Pencil, Trash2 } from "lucide-react";
import { cortesAPI, animalesAPI } from "../services/api";
import Toast from "../components/Toast";

const CATEGORIAS = ["PREMIUM","ESTANDAR","ECONOMICO"];
const CORTES_LISTA = [
  "Lomo fino","Lomo de aguja","Punta de anca","Cadera","Bola negra",
  "Muchacho","Costilla","Lagarto","Pecho","Brazo","Molida primera","Molida corriente",
];
const EMPTY = { animal_id:"", nombre:"", categoria:"ESTANDAR", peso_kg:"" };
const fmt = (n) => Number(n??0).toLocaleString("es-CO");

export default function CortesPage() {
  const [cortes,   setCortes]   = useState([]);
  const [animales, setAnimales] = useState([]);
  const [form, setForm]         = useState(EMPTY);
  const [editId, setEditId]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [toast, setToast]       = useState({ msg:"" });

  const cargar = () => {
    cortesAPI.listar().then(r=>setCortes(r.data));
    animalesAPI.listar().then(r=>setAnimales(r.data));
  };
  useEffect(()=>{ cargar(); },[]);
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const payload = {
        ...form,
        animal_id: parseInt(form.animal_id),
        peso_kg: parseFloat(form.peso_kg),
      };
      if (editId) {
        await cortesAPI.actualizar(editId, payload);
        setToast({msg:"Corte actualizado",type:"success"});
      } else {
        await cortesAPI.crear(payload);
        setToast({msg:"Corte registrado",type:"success"});
      }
      setForm(EMPTY); setEditId(null); cargar();
    } catch(err) {
      setToast({msg:err.response?.data?.detail||"Error",type:"error"});
    } finally { setLoading(false); }
  };

  const editar = (c) => {
    setForm({
      animal_id:String(c.animal_id), nombre:c.nombre, categoria:c.categoria,
      peso_kg:c.peso_kg??"",
    });
    setEditId(c.id);
    window.scrollTo({ top:0, behavior:"smooth" });
  };

  const cancelar = () => { setForm(EMPTY); setEditId(null); };

  const eliminar = async (id) => {
    if (!confirm("¿Eliminar este corte?")) return;
    await cortesAPI.eliminar(id); cargar();
    setToast({msg:"Corte eliminado",type:"success"});
  };

  const catClass = (c) => c==="PREMIUM" ? "cat-premium" : c==="ESTANDAR" ? "cat-estandar" : "cat-economico";

  return (
    <div className="main-content">
      <p className="section-title"><Slice size={20} /> Registro de Cortes</p>

      <div className="table-card" style={{marginBottom:24}}>
        <div className="table-card-header"><h2>{editId ? "Editar Corte" : "Nuevo Corte"}</h2></div>
        <div style={{padding:"20px 24px"}}>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Animal *</label>
                <select value={form.animal_id} onChange={e=>set("animal_id",e.target.value)} required>
                  <option value="">— Seleccionar animal —</option>
                  {animales.map(a=><option key={a.id} value={a.id}>{a.codigo} ({a.tipo})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Corte *</label>
                <select value={form.nombre} onChange={e=>set("nombre",e.target.value)} required>
                  <option value="">— Seleccionar corte —</option>
                  {CORTES_LISTA.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Categoría</label>
                <select value={form.categoria} onChange={e=>set("categoria",e.target.value)}>
                  {CATEGORIAS.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Peso (kg) *</label>
                <input type="number" step="any" value={form.peso_kg} onChange={e=>set("peso_kg",e.target.value)} required className="mono" placeholder="45.5" />
              </div>
            </div>
            <div style={{marginTop:18, display:"flex", gap:12}}>
              <button type="submit" className="btn btn-navy btn-full" disabled={loading} style={{maxWidth:220}}>
                {loading ? "Guardando…" : editId ? <><Save size={15} /> Guardar Cambios</> : <><Plus size={15} /> Registrar Corte</>}
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
          <h2>Cortes Registrados</h2>
          <span className="tag tag-navy">{cortes.length} cortes</span>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Corte</th><th>Animal</th><th>Categoría</th><th>Peso (kg)</th><th>Factor ABC</th>
                <th>Costo Ref.</th><th>Precio Mercado</th><th>Precio Sugerido</th><th>Margen</th><th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {cortes.map(c=>(
                <tr key={c.id}>
                  <td style={{fontWeight:600}}>{c.nombre}</td>
                  <td className="td-muted">#{c.animal_id}</td>
                  <td><span className={`cat-badge ${catClass(c.categoria)}`}>{c.categoria}</span></td>
                  <td className="td-mono">{c.peso_kg} kg</td>
                  <td className="td-mono td-muted" title="Factor de complejidad ABC (automático)">{c.factor_complejidad != null ? c.factor_complejidad.toFixed(1) : "—"}</td>
                  <td className="td-mono td-muted" title="Costo ABC por kg (último análisis)">{c.costo_unitario ? `$${fmt(c.costo_unitario)}` : "—"}</td>
                  <td className="td-mono td-muted">{c.precio_mercado_sipsa ? `$${fmt(c.precio_mercado_sipsa)}` : "—"}</td>
                  <td className="td-price">{c.precio_sugerido ? `$${fmt(c.precio_sugerido)}` : "—"}</td>
                  <td>{c.margen_ganancia ? (
                    <span className={`tag ${c.margen_ganancia>=20?"tag-green":"tag-yellow"}`}>{c.margen_ganancia.toFixed(1)}%</span>
                  ) : "—"}</td>
                  <td>
                    <div style={{display:"flex", gap:6}}>
                      <button className="btn btn-sm" onClick={()=>editar(c)}><Pencil size={14} /></button>
                      <button className="btn btn-danger btn-sm" onClick={()=>eliminar(c.id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!cortes.length && (
                <tr><td colSpan={10}><div className="empty-state"><div className="empty-icon"><Slice size={40} /></div><p>Sin cortes — registra animales primero</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Toast message={toast.msg} type={toast.type} onHide={()=>setToast({msg:""})} />
    </div>
  );
}
