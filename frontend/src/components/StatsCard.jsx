const COLORS = {
  green:  "bg-green-50  border-green-200  text-green-700",
  blue:   "bg-blue-50   border-blue-200   text-blue-700",
  orange: "bg-orange-50 border-orange-200 text-orange-700",
  purple: "bg-purple-50 border-purple-200 text-purple-700",
};

export default function StatsCard({ title, value, subtitle, icon, color = "green" }) {
  return (
    <div className={`border rounded-xl p-5 ${COLORS[color]}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wide opacity-60">{title}</span>
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      {subtitle && <div className="text-sm opacity-70">{subtitle}</div>}
    </div>
  );
}
