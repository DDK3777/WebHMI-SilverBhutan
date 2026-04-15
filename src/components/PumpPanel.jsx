function StateButton({ label, active, variant, onClick, disabled }) {
  return (
    <button
      type="button"
      className={`state-button ${variant} ${active ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
}

export default function PumpPanel({ title, pump, onCommandChange, controlsEnabled, restrictionLabel }) {
  return (
    <div className="pump-panel">
      <div className="pump-header">{title}</div>
      <div className="pump-actions">
        <StateButton
          label="OFF"
          active={!pump.command}
          variant="off"
          onClick={() => onCommandChange(false)}
          disabled={!controlsEnabled}
        />
        <StateButton
          label="ON"
          active={pump.command}
          variant="on"
          onClick={() => onCommandChange(true)}
          disabled={!controlsEnabled}
        />
      </div>
      {!controlsEnabled ? <div className="pump-restriction">{restrictionLabel}</div> : null}
      <div className={`pump-health ${pump.healthy ? 'healthy' : 'fault'}`}>
        {pump.healthy ? 'HEALTHY' : 'FAULT'}
      </div>
      <div className={`pump-run ${pump.running ? 'running' : 'stopped'}`}>
        {pump.running ? 'RUNNING' : 'STOPPED'}
      </div>
    </div>
  );
}
