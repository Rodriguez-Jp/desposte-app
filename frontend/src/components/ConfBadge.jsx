export default function ConfBadge({ value }) {
  const cls = value >= 80 ? "conf-high" : value >= 65 ? "conf-mid" : "conf-low";
  return <span className={`conf-badge ${cls}`} title={`${value}% confianza`}>{value}%</span>;
}
