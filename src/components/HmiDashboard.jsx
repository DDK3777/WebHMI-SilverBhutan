import HmiCard from './HmiCard';
import PumpPanel from './PumpPanel';
import { signOutUser } from '../lib/supabaseClient';
import TrendModal from './TrendModal';

function formatValue(value) {
  return Number(value || 0).toFixed(2);
}

function formatDateTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })}`;
}

export default function HmiDashboard({
  hmiState,
  connectionStatus,
  trendRows,
  activityMessage,
  publishPumpCommand,
  isDemoAccess,
  userRole,
  controlsEnabled,
  onOpenTrend,
  activeTrendMetric,
  activeTrendSeries,
  onCloseTrend,
  onLogout
}) {
  const cards = [
    {
      key: 'inverter_power_kw',
      title: 'INVERTER POWER GENERATOR',
      value: formatValue(hmiState.metrics.inverterPowerKw),
      unit: 'kW'
    },
    {
      key: 'solar_radiation',
      title: 'SOLAR RADIATION',
      value: formatValue(hmiState.metrics.solarRadiation),
      unit: 'W/m2'
    },
    {
      key: 'pump1_head_m',
      title: 'PUMP-1 HEAD METER',
      value: formatValue(hmiState.metrics.pump1Head),
      unit: 'm'
    },
    {
      key: 'pump2_head_m',
      title: 'PUMP-2 HEAD METER',
      value: formatValue(hmiState.metrics.pump2Head),
      unit: 'm'
    },
    {
      key: 'pump1_flow_lpm',
      title: 'PUMP-1 FLOW',
      value: formatValue(hmiState.metrics.pump1Flow),
      unit: 'LPM'
    },
    {
      key: 'pump2_flow_lpm',
      title: 'PUMP-2 FLOW',
      value: formatValue(hmiState.metrics.pump2Flow),
      unit: 'LPM'
    },
    {
      key: 'ambient_temp_c',
      title: 'AMBIENT TEMP.',
      value: formatValue(hmiState.metrics.ambientTemp),
      unit: 'C'
    }
  ];

  return (
    <div className="app-shell">
      <div className="top-bar">
        <div>
          <div className="plant-title">MAIN</div>
          <div className="plant-subtitle">Solar Pump Web HMI</div>
        </div>
        <div className="header-actions">
          <span className={`status-pill compact ${connectionStatus}`}>{connectionStatus.toUpperCase()}</span>
          <span className="role-label">Role: {isDemoAccess ? 'demo' : userRole || '--'}</span>
          <button
            type="button"
            className="logout-button"
            onClick={isDemoAccess ? onLogout : signOutUser}
          >
            Logout
          </button>
        </div>
      </div>

      <div className="hmi-layout">
        <aside className="left-column">
          <PumpPanel
            title="PUMP - 1"
            pump={hmiState.pump1}
            onCommandChange={(command) => publishPumpCommand(1, command)}
            controlsEnabled={controlsEnabled}
            restrictionLabel="Control locked. Admin or engineer role is required."
          />
          <PumpPanel
            title="PUMP - 2"
            pump={hmiState.pump2}
            onCommandChange={(command) => publishPumpCommand(2, command)}
            controlsEnabled={controlsEnabled}
            restrictionLabel="Control locked. Admin or engineer role is required."
          />

          <div className="emergency-panel">
            <div className="emergency-circle">EMERGENCY STOP</div>
            <p>Keep this as indication only. Real emergency stop must stay hardwired in PLC/panel.</p>
          </div>
        </aside>

        <main className="right-column">
          <section className="panel">
            <div className="panel-title">REAL TIME DATA</div>
            <div className="metrics-grid">
              {cards.map((card) => (
                <HmiCard key={card.title} {...card} onOpenTrend={() => onOpenTrend(card)} />
              ))}
            </div>
          </section>

          <section className="summary-grid">
            <div className="summary-box">
              <span>TOTAL INVERTER POWER GENERATION</span>
              <button
                type="button"
                className="summary-trigger"
                onClick={() =>
                  onOpenTrend({
                    key: 'inverter_power_kw',
                    title: 'INVERTER POWER GENERATOR',
                    unit: 'kW'
                  })
                }
              >
                {formatValue(hmiState.totals.totalPowerMwh)}
              </button>
              <small>MWh</small>
            </div>
            <div className="summary-box">
              <span>TOTAL FLOW (P1 + P2)</span>
              <button
                type="button"
                className="summary-trigger"
                onClick={() =>
                  onOpenTrend({
                    key: 'total_flow_lpm',
                    title: 'TOTAL FLOW (P1 + P2)',
                    unit: 'LPM'
                  })
                }
              >
                {formatValue(hmiState.totals.totalFlowM3)}
              </button>
              <small>m3</small>
            </div>
          </section>

          <section className="panel">
            <div className="panel-title">DATA LOG</div>
            <div className="table-shell">
              <table>
                <thead>
                  <tr>
                    <th>DATE / TIME</th>
                    <th>INVERTER POWER (kWh)</th>
                    <th>FLOW (LPM)</th>
                  </tr>
                </thead>
                <tbody>
                  {trendRows.map((row) => (
                    <tr key={row.timestamp}>
                      <td>{formatDateTime(row.timestamp)}</td>
                      <td>{formatValue(row.inverter_power_kw)}</td>
                      <td>{formatValue(row.total_flow_lpm)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      <div className="activity-bar">{activityMessage}</div>
      <TrendModal
        open={Boolean(activeTrendMetric)}
        metric={activeTrendMetric}
        series={activeTrendSeries}
        onClose={onCloseTrend}
      />
    </div>
  );
}
