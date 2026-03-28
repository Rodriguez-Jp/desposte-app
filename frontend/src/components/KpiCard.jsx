export default function KpiCard({ label, value, color = "" }) {
  return (
    <div className="kpi-card">
      <span className="kpi-label">{label}</span>
      <span className={`kpi-value ${color}`}>{value ?? "—"}</span>
    </div>
  );
}
