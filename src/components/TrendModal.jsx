function formatDateTime(value) {
  const date = new Date(value);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })}`;
}

function buildPolylinePoints(series, chartHeight, maxValue) {
  if (series.length === 0) {
    return '';
  }

  return series
    .map((row, index) => {
      const x = (index / Math.max(series.length - 1, 1)) * 100;
      const normalized = maxValue === 0 ? 0 : Number(row.value) / maxValue;
      const y = chartHeight - normalized * chartHeight;
      return `${x},${y.toFixed(2)}`;
    })
    .join(' ');
}

export default function TrendModal({ open, metric, series, onClose }) {
  if (!open || !metric) {
    return null;
  }

  const orderedSeries = [...series].reverse();
  const maxValue = Math.max(...orderedSeries.map((row) => Number(row.value || 0)), 0);
  const points = buildPolylinePoints(orderedSeries, 180, maxValue);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="trend-modal" onClick={(event) => event.stopPropagation()}>
        <div className="trend-topbar">
          <div>
            <div className="trend-title">{metric.title}</div>
            <div className="trend-subtitle">Last {series.length} saved values</div>
          </div>
          <button type="button" className="logout-button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="trend-chart">
          {orderedSeries.length === 0 ? (
            <div className="trend-empty">No trend data available yet.</div>
          ) : (
            <svg viewBox="0 0 100 180" preserveAspectRatio="none" aria-label={`${metric.title} trend`}>
              <polyline fill="none" stroke="#2d57c8" strokeWidth="2.2" points={points} />
            </svg>
          )}
        </div>

        <div className="trend-table">
          <table>
            <thead>
              <tr>
                <th>DATE / TIME</th>
                <th>VALUE</th>
                <th>UNIT</th>
              </tr>
            </thead>
            <tbody>
              {series.map((row) => (
                <tr key={`${metric.key}-${row.timestamp}`}>
                  <td>{formatDateTime(row.timestamp)}</td>
                  <td>{Number(row.value || 0).toFixed(2)}</td>
                  <td>{metric.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
