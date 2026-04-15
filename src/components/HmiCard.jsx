export default function HmiCard({ title, value, unit, onOpenTrend }) {
  return (
    <button type="button" className="metric-card metric-button" onClick={onOpenTrend}>
      <div className="metric-title">{title}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-unit">{unit}</div>
    </button>
  );
}
