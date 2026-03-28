import { useEffect, useState } from "react";
import { sipsaAPI } from "../services/api";
import Toast from "../components/Toast";

const fmt = (n) => Number(n??0).toLocaleString("es-CO");

export default function SIPSAPage() {
  const [datos,     setDatos]     = useState([]);
  const [promedios, setPromedios] = useState({});
  const [loading,   setLoading]   = useState(false);
  const [tab,       setTab]       = useState("promedios");
  const [toast,     setToast]     = useState({msg:""});
  const [total,     setTotal]     = useState(0);

  const consultar = async () => {
    setLoading(true);
    try {
      const [d, p] = await Promise.all([sipsaAPI.consultar({}), sipsaAPI.promedios()]);
      setDatos(d.data.datos || []); setTotal(d.data.total || 0);
      setPromedios(p.data || {});
    } catch { setToast({msg:"❌ Error consultando SIPSA",type:"error"}); }
    finally { setLoading(false); }
  };

  const guardar = async () => {
    setLoading(true);
    try { await sipsaAPI.guardar(); setToast({msg:"✅ Datos SIPSA guardados en base de datos",type:"success"}); }
    catch { setToast({msg:"❌ Error guardando",type:"error"}); }
    finally { setLoading(false); }
  };

  useEffect(()=>{ consultar(); },[]);

  const TABS = [
    {id:"promedios", label:"📌 Promedios por Corte"},
    {id:"tabla",     label:"📋 Datos Detallados"},
  ];

  return (
    <div className="main-content">
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <p className="section-title" style={{margin:0}}>📈 Sistema SIPSA — DANE Colombia</p>
        <div style={{display:"flex",gap:8}}>
          <button onClick={consultar} disabled={loading} className="btn btn-ghost">
            {loading ? "⏳ Consultando…" : "🔄 Actualizar datos"}
          </button>
          <button onClick={guardar} disabled={loading} className="btn btn-navy">
            💾 Guardar en BD
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpis" style={{gridTemplateColumns:"repeat(3,1fr)",marginBottom:20}}>
        <div className="kpi-card"><span className="kpi-label">Registros consultados</span><span className="kpi-value navy">{total}</span></div>
        <div className="kpi-card"><span className="kpi-label">Cortes con precios</span><span className="kpi-value green">{Object.keys(promedios).length}</span></div>
        <div className="kpi-card"><span className="kpi-label">Fuente</span><span className="kpi-value blue" style={{fontSize:"1rem"}}>DANE · SIPSA</span></div>
      </div>

      {/* Tabs */}
      <div className="tabs-bar" style={{marginBottom:0,borderRadius:"10px 10px 0 0"}}>
        {TABS.map(t=>(
          <button key={t.id} className={`tab-btn ${tab===t.id?"active":""}`} onClick={()=>setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Promedios grid */}
      {tab === "promedios" && (
        <div className="table-card" style={{borderRadius:"0 0 10px 10px",borderTop:"none"}}>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Corte / Producto</th>
                  <th>Mínimo ($/kg)</th>
                  <th>Promedio ($/kg)</th>
                  <th>Máximo ($/kg)</th>
                  <th>Desviación</th>
                  <th>Registros</th>
                  <th>Tendencia</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(promedios).map(([key,val])=>(
                  <tr key={key}>
                    <td style={{fontWeight:600,textTransform:"capitalize"}}>{key.replace(/_/g," ")}</td>
                    <td className="td-mono td-muted">${fmt(val.precio_minimo)}</td>
                    <td className="td-price">${fmt(val.precio_promedio)}</td>
                    <td className="td-mono td-muted">${fmt(val.precio_maximo)}</td>
                    <td className="td-mono td-muted">${fmt(val.desviacion)}</td>
                    <td className="td-mono td-muted">{val.registros}</td>
                    <td>
                      <span className={`tag ${val.tendencia?.includes("SUB")?"tag-red":val.tendencia?.includes("BAJ")?"tag-blue":"tag-green"}`}>
                        {val.tendencia}
                      </span>
                    </td>
                  </tr>
                ))}
                {!Object.keys(promedios).length && (
                  <tr><td colSpan={7}><div className="empty-state"><div className="empty-icon">📈</div><p>Presiona Actualizar datos</p></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Datos detallados */}
      {tab === "tabla" && (
        <div className="table-card" style={{borderRadius:"0 0 10px 10px",borderTop:"none"}}>
          <div className="table-scroll" style={{maxHeight:520}}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Producto</th><th>Ciudad</th><th>Mercado</th>
                  <th>Mín. ($/kg)</th><th>Promedio ($/kg)</th><th>Máx. ($/kg)</th><th>Semana</th>
                </tr>
              </thead>
              <tbody>
                {datos.slice(0,200).map((d,i)=>(
                  <tr key={i}>
                    <td style={{fontWeight:500,fontSize:".82rem"}}>{d.producto}</td>
                    <td className="td-muted" style={{fontSize:".8rem"}}>{d.ciudad||"—"}</td>
                    <td className="td-muted" style={{fontSize:".8rem"}}>{d.mercado||"—"}</td>
                    <td className="td-mono td-muted">${fmt(d.precio_minimo)}</td>
                    <td className="td-price">${fmt(d.precio_promedio)}</td>
                    <td className="td-mono td-muted">${fmt(d.precio_maximo)}</td>
                    <td className="td-mono td-muted">{d.semana||"—"}</td>
                  </tr>
                ))}
                {!datos.length && (
                  <tr><td colSpan={7}><div className="empty-state"><p>Sin datos — presiona Actualizar</p></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Toast message={toast.msg} type={toast.type} onHide={()=>setToast({msg:""})} />
    </div>
  );
}
