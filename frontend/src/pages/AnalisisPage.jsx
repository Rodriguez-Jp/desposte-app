import { useEffect, useState } from "react";
import { animalesAPI, analisisAPI } from "../services/api";
import KpiCard from "../components/KpiCard";
import ConfBadge from "../components/ConfBadge";
import Toast from "../components/Toast";

const fmt = (n) => Number(n??0).toLocaleString("es-CO");

export default function AnalisisPage() {
  const [animales,   setAnimales]   = useState([]);
  const [animalId,   setAnimalId]   = useState("");
  const [margen,     setMargen]     = useState(25);
  const [resultados, setResultados] = useState(null);
  const [costoKg,    setCostoKg]    = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [toast,      setToast]      = useState({msg:""});

  useEffect(()=>{ animalesAPI.listar().then(r=>setAnimales(r.data)); },[]);

  const calcular = async () => {
    if (!animalId) { setToast({msg:"⚠️ Selecciona un animal",type:"error"}); return; }
    setLoading(true); setResultados(null); setCostoKg(null);
    try {
      const [r, k] = await Promise.all([
        analisisAPI.calcularPrecios(animalId, margen),
        analisisAPI.costoKg(animalId),
      ]);
      setResultados(r.data); setCostoKg(k.data.costo_por_kg);
      setToast({msg:"✅ Precios calculados exitosamente",type:"success"});
    } catch(err) {
      setToast({msg:"❌ "+(err.response?.data?.detail||"Error en cálculo"),type:"error"});
    } finally { setLoading(false); }
  };

  const catClass = (c) => c==="PREMIUM"?"cat-premium":c==="ESTANDAR"?"cat-estandar":"cat-economico";

  const stats = resultados?.resultados ? {
    avgSugerido: resultados.resultados.reduce((s,r)=>s+r.precio_sugerido,0)/resultados.resultados.length,
    avgMargen:   resultados.resultados.reduce((s,r)=>s+r.margen_real,0)/resultados.resultados.length,
    conCorte:    resultados.resultados.filter(r=>r.precio_sipsa_referencia).length,
  } : null;

  return (
    <div className="main-content">
      <p className="section-title">🔬 Análisis y Cálculo de Precios</p>

      {/* Panel de control */}
      <div className="table-card" style={{marginBottom:24}}>
        <div className="table-card-header"><h2>Parámetros de Cálculo</h2></div>
        <div style={{padding:"20px 24px",display:"flex",gap:16,alignItems:"flex-end",flexWrap:"wrap"}}>
          <div className="form-group" style={{minWidth:240}}>
            <label>Animal</label>
            <select value={animalId} onChange={e=>setAnimalId(e.target.value)}>
              <option value="">— Seleccionar animal —</option>
              {animales.map(a=><option key={a.id} value={a.id}>{a.codigo} – {a.tipo} · {a.peso_vivo} kg</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Margen objetivo (%)</label>
            <input type="number" min="5" max="90" value={margen} onChange={e=>setMargen(e.target.value)} className="mono" style={{width:90}} />
          </div>
          <button onClick={calcular} disabled={loading} className="btn btn-navy" style={{padding:"10px 24px",fontSize:".9rem",marginBottom:1}}>
            {loading ? "⏳ Calculando…" : "⚡ Calcular Precios"}
          </button>
        </div>
      </div>

      {/* KPIs resultado */}
      {stats && costoKg !== null && (
        <div className="kpis" style={{marginBottom:24}}>
          <KpiCard label="Costo/kg Canal"      value={`$${fmt(costoKg)}`}                       color="orange" />
          <KpiCard label="Precio Sugerido Prom" value={`$${fmt(Math.round(stats.avgSugerido))}`} color="blue"   />
          <KpiCard label="Margen Real Promedio" value={`${stats.avgMargen.toFixed(1)}%`}          color="green"  />
          <KpiCard label="Cortes con SIPSA"     value={`${stats.conCorte} / ${resultados.resultados.length}`} color="navy" />
        </div>
      )}

      {/* Tabla de precios calculados */}
      {resultados && (
        <div className="table-card" style={{marginBottom:20}}>
          <div className="table-card-header">
            <h2>Precios Sugeridos por Corte — {resultados.animal_codigo}</h2>
            <span className="tag tag-green">Margen objetivo: {resultados.margen_objetivo}%</span>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Corte</th>
                  <th>Cat.</th>
                  <th>Peso (kg)</th>
                  <th>Costo Unit.</th>
                  <th>Precio Mercado</th>
                  <th>Precio Sugerido</th>
                  <th>Mín. Viable</th>
                  <th>Margen Real</th>
                  <th>Confianza</th>
                </tr>
              </thead>
              <tbody>
                {resultados.resultados.map((r,i)=>(
                  <tr key={i}>
                    <td style={{fontWeight:600}}>{r.corte_nombre}</td>
                    <td><span className={`cat-badge ${catClass(r.categoria)}`}>{r.categoria}</span></td>
                    <td className="td-mono">{r.peso_kg} kg</td>
                    <td className="td-mono td-muted">${fmt(r.precio_costo_unitario)}</td>
                    <td className="td-mono td-muted">{r.precio_sipsa_referencia ? `$${fmt(r.precio_sipsa_referencia)}` : "—"}</td>
                    <td className="td-price">${fmt(r.precio_sugerido)}</td>
                    <td className="td-mono td-muted">${fmt(r.precio_minimo_viable)}</td>
                    <td>
                      <span className={`tag ${r.margen_real>=margen?"tag-green":"tag-red"}`}>
                        {r.margen_real.toFixed(1)}%
                      </span>
                    </td>
                    <td><ConfBadge value={r.nivel_confianza} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Alertas dinámicas */}
      {resultados && (
        <div className="alerts">
          {resultados.resultados.filter(r=>r.margen_real<margen).length>0 && (
            <div className="alert alert-red">
              <span className="alert-icon">⚠️</span>
              <span>{resultados.resultados.filter(r=>r.margen_real<margen).length} corte(s) por debajo del margen objetivo</span>
            </div>
          )}
          {resultados.resultados.filter(r=>r.precio_sipsa_referencia).length>0 && (
            <div className="alert alert-green">
              <span className="alert-icon">✅</span>
              <span>{resultados.resultados.filter(r=>r.precio_sipsa_referencia).length} corte(s) con referencia de precio SIPSA</span>
            </div>
          )}
          {resultados.resultados.filter(r=>r.nivel_confianza>=85).length>0 && (
            <div className="alert alert-blue">
              <span className="alert-icon">📊</span>
              <span>{resultados.resultados.filter(r=>r.nivel_confianza>=85).length} corte(s) con alta confianza (≥85%)</span>
            </div>
          )}
        </div>
      )}

      {!resultados && !loading && (
        <div className="empty-state">
          <div className="empty-icon">🔬</div>
          <p>Selecciona un animal y presiona <strong>Calcular Precios</strong> para ver resultados</p>
        </div>
      )}

      <Toast message={toast.msg} type={toast.type} onHide={()=>setToast({msg:""})} />
    </div>
  );
}
