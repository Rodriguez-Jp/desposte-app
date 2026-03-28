import { useEffect, useState } from "react";
import { analisisAPI, sipsaAPI } from "../services/api";
import KpiCard from "../components/KpiCard";

const fmt = (n) => Number(n ?? 0).toLocaleString("es-CO");

export default function DashboardPage() {
  const [metrics,   setMetrics]   = useState(null);
  const [promedios, setPromedios] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([analisisAPI.dashboard(), sipsaAPI.promedios()])
      .then(([m, p]) => {
        setMetrics(m.data);
        setPromedios(Object.entries(p.data).map(([key, val]) => ({ key, ...val })));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="main-content empty-state">
      <div className="empty-icon">⏳</div>
      <p>Cargando dashboard…</p>
    </div>
  );

  return (
    <div className="main-content">
      {/* KPIs */}
      <div className="kpis">
        <KpiCard label="Total Animales"     value={metrics?.total_animales}                                 color="navy"   />
        <KpiCard label="Cortes Registrados" value={metrics?.total_cortes}                                   color="blue"   />
        <KpiCard label="Costo Promedio/kg"  value={`$${fmt(metrics?.costo_promedio_kg)}`}                   color="orange" />
        <KpiCard label="Margen Promedio"    value={`${Number(metrics?.margen_promedio ?? 0).toFixed(1)}%`}  color="green"  />
      </div>

      {/* Tabla precios SIPSA */}
      <div className="table-card">
        <div className="table-card-header">
          <h2>📈 Precios de Referencia SIPSA por Corte</h2>
          <span className="tag tag-navy">DANE · Colombia</span>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Corte</th>
                <th>Mínimo ($/kg)</th>
                <th>Promedio ($/kg)</th>
                <th>Máximo ($/kg)</th>
                <th>Desviación</th>
                <th>Registros</th>
                <th>Tendencia</th>
              </tr>
            </thead>
            <tbody>
              {promedios.map((r) => (
                <tr key={r.key}>
                  <td style={{fontWeight:600}}>{r.key.replace(/_/g," ")}</td>
                  <td className="td-mono td-muted">${fmt(r.precio_minimo)}</td>
                  <td className="td-price">${fmt(r.precio_promedio)}</td>
                  <td className="td-mono td-muted">${fmt(r.precio_maximo)}</td>
                  <td className="td-mono td-muted">${fmt(r.desviacion)}</td>
                  <td className="td-mono td-muted">{r.registros}</td>
                  <td>
                    <span className={`tag ${
                      r.tendencia?.includes("SUB") ? "tag-red" :
                      r.tendencia?.includes("BAJ") ? "tag-blue" : "tag-green"
                    }`}>{r.tendencia}</span>
                  </td>
                </tr>
              ))}
              {!promedios.length && (
                <tr><td colSpan={7} className="empty-state"><p>Sin datos SIPSA — ve a la pestaña SIPSA y presiona Actualizar</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alertas */}
      <div className="alerts">
        <div className="alert alert-blue">
          <span className="alert-icon">ℹ️</span>
          <span>Datos SIPSA: {metrics?.registros_sipsa ?? 0} registros almacenados en BD</span>
        </div>
        <div className="alert alert-green">
          <span className="alert-icon">✅</span>
          <span>Sistema de fallback activo — datos siempre disponibles</span>
        </div>
        <div className="alert alert-yellow">
          <span className="alert-icon">⚡</span>
          <span>Ve a Análisis para calcular precios automáticos por animal</span>
        </div>
      </div>
    </div>
  );
}
