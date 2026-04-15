export const defaultHmiState = {
  pump1: {
    command: false,
    healthy: true,
    running: false
  },
  pump2: {
    command: false,
    healthy: true,
    running: false
  },
  metrics: {
    inverterPowerKw: 0,
    solarRadiation: 0,
    pump1Head: 0,
    pump2Head: 0,
    pump1Flow: 0,
    pump2Flow: 0,
    ambientTemp: 0
  },
  totals: {
    totalPowerMwh: 0,
    totalFlowM3: 0
  },
  lastUpdate: null
};

export const demoTrendRows = [
  {
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    inverter_power_kw: 24.7,
    total_flow_lpm: 136.2
  },
  {
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    inverter_power_kw: 26.3,
    total_flow_lpm: 141.8
  },
  {
    timestamp: new Date().toISOString(),
    inverter_power_kw: 27.1,
    total_flow_lpm: 144.4
  }
];
