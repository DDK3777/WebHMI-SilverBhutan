import { useEffect, useMemo, useRef, useState } from 'react';
import { createMqttService } from '../lib/mqttService';
import { buildTopic, topicDefinitions } from '../lib/mqttTopics';
import { defaultHmiState, demoTrendRows } from '../lib/defaultState';
import { fetchTrendRows, fetchTrendSeries, insertTrendRow } from '../lib/supabaseClient';

const demoModeEnabled = import.meta.env.VITE_ENABLE_DEMO_MODE !== 'false';

function formatNumber(value, digits = 2) {
  return Number(value || 0).toFixed(digits);
}

function mapPayloadToState(payload) {
  const metrics = payload.metrics ?? {};
  const pump1Flow = Number(metrics.pump1Flow ?? 0);
  const pump2Flow = Number(metrics.pump2Flow ?? 0);
  const inverterPowerKw = Number(metrics.inverterPowerKw ?? 0);

  return {
    pump1: {
      command: Boolean(payload.pump1?.command),
      healthy: payload.pump1?.healthy ?? true,
      running: Boolean(payload.pump1?.running)
    },
    pump2: {
      command: Boolean(payload.pump2?.command),
      healthy: payload.pump2?.healthy ?? true,
      running: Boolean(payload.pump2?.running)
    },
    metrics: {
      inverterPowerKw,
      solarRadiation: Number(metrics.solarRadiation ?? 0),
      pump1Head: Number(metrics.pump1Head ?? 0),
      pump2Head: Number(metrics.pump2Head ?? 0),
      pump1Flow,
      pump2Flow,
      ambientTemp: Number(metrics.ambientTemp ?? 0)
    },
    totals: {
      totalPowerMwh: Number(payload.totals?.totalPowerMwh ?? inverterPowerKw / 1000),
      totalFlowM3: Number(payload.totals?.totalFlowM3 ?? (pump1Flow + pump2Flow) / 1000)
    },
    lastUpdate: new Date().toISOString()
  };
}

function buildTrendRow(nextState) {
  return {
    timestamp: new Date().toISOString(),
    inverter_power_kw: Number(formatNumber(nextState.metrics.inverterPowerKw)),
    solar_radiation: Number(formatNumber(nextState.metrics.solarRadiation)),
    pump1_head_m: Number(formatNumber(nextState.metrics.pump1Head)),
    pump2_head_m: Number(formatNumber(nextState.metrics.pump2Head)),
    pump1_flow_lpm: Number(formatNumber(nextState.metrics.pump1Flow)),
    pump2_flow_lpm: Number(formatNumber(nextState.metrics.pump2Flow)),
    total_flow_lpm: Number(
      formatNumber(nextState.metrics.pump1Flow + nextState.metrics.pump2Flow)
    ),
    ambient_temp_c: Number(formatNumber(nextState.metrics.ambientTemp))
  };
}

export function useHmiController(isEnabled = true) {
  const [hmiState, setHmiState] = useState(defaultHmiState);
  const [connectionStatus, setConnectionStatus] = useState('idle');
  const [trendRows, setTrendRows] = useState([]);
  const [activityMessage, setActivityMessage] = useState('Waiting for data...');
  const lastTrendSaveRef = useRef(0);
  const mqttServiceRef = useRef(null);
  const [activeTrendMetric, setActiveTrendMetric] = useState(null);
  const [activeTrendSeries, setActiveTrendSeries] = useState([]);

  const mqttConfig = useMemo(
    () => ({
      brokerUrl: import.meta.env.VITE_MQTT_URL,
      username: import.meta.env.VITE_MQTT_USERNAME,
      password: import.meta.env.VITE_MQTT_PASSWORD,
      clientId: import.meta.env.VITE_MQTT_CLIENT_ID,
      baseTopic: import.meta.env.VITE_MQTT_BASE_TOPIC || 'plant/solar-pump/site-01'
    }),
    []
  );

  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    let isMounted = true;

    fetchTrendRows(8).then(({ data, skipped }) => {
      if (!isMounted) {
        return;
      }

      if (skipped || data.length === 0) {
        setTrendRows(demoTrendRows);
        return;
      }

      setTrendRows(data);
    });

    return () => {
      isMounted = false;
    };
  }, [isEnabled]);

  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    if (!mqttConfig.brokerUrl && demoModeEnabled) {
      setConnectionStatus('demo');
      setActivityMessage('Demo mode active. Add MQTT settings in .env to connect your router.');
      const timer = setInterval(() => {
        setHmiState((current) => {
          const next = {
            ...current,
            pump1: {
              ...current.pump1,
              running: !current.pump1.running,
              command: !current.pump1.command
            },
            pump2: {
              ...current.pump2,
              running: true,
              command: true
            },
            metrics: {
              inverterPowerKw: Number((20 + Math.random() * 10).toFixed(2)),
              solarRadiation: Number((600 + Math.random() * 250).toFixed(2)),
              pump1Head: Number((18 + Math.random() * 2).toFixed(2)),
              pump2Head: Number((17 + Math.random() * 2).toFixed(2)),
              pump1Flow: Number((60 + Math.random() * 15).toFixed(2)),
              pump2Flow: Number((65 + Math.random() * 15).toFixed(2)),
              ambientTemp: Number((28 + Math.random() * 5).toFixed(2))
            },
            totals: {
              totalPowerMwh: Number((0.02 + Math.random() * 0.02).toFixed(2)),
              totalFlowM3: Number((0.12 + Math.random() * 0.03).toFixed(2))
            },
            lastUpdate: new Date().toISOString()
          };

          return next;
        });
      }, 3000);

      return () => clearInterval(timer);
    }

    const subscriptions = [buildTopic(mqttConfig.baseTopic, topicDefinitions.live)];

    const mqttService = createMqttService({
      ...mqttConfig,
      subscriptions,
      onStatusChange: (status) => {
        setConnectionStatus(status);

        const labels = {
          connected: 'MQTT connected successfully.',
          reconnecting: 'MQTT reconnecting...',
          disconnected: 'MQTT disconnected.',
          error: 'MQTT connection error. Check your URL and credentials.',
          'missing-config': 'MQTT settings are missing.',
          idle: 'Waiting for MQTT...'
        };

        setActivityMessage(labels[status] || 'Waiting for MQTT...');
      },
      onMessage: async (topic, payload) => {
        if (topic !== buildTopic(mqttConfig.baseTopic, topicDefinitions.live)) {
          return;
        }

        const nextState = mapPayloadToState(payload);
        setHmiState(nextState);

        const now = Date.now();
        if (now - lastTrendSaveRef.current > 60000) {
          lastTrendSaveRef.current = now;
          const trendRow = buildTrendRow(nextState);
          const { error } = await insertTrendRow(trendRow);

          setTrendRows((current) => [trendRow, ...current].slice(0, 8));

          if (error) {
            setActivityMessage(`MQTT connected, but trend save failed: ${error.message}`);
          }
        }
      }
    });

    mqttServiceRef.current = mqttService;
    mqttService.connect();

    return () => {
      mqttServiceRef.current = null;
      mqttService.disconnect();
    };
  }, [isEnabled, mqttConfig]);

  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    if (connectionStatus !== 'demo') {
      return;
    }

    const now = Date.now();
    if (now - lastTrendSaveRef.current < 60000) {
      return;
    }

    lastTrendSaveRef.current = now;
    const row = buildTrendRow(hmiState);
    setTrendRows((current) => [row, ...current].slice(0, 8));
    insertTrendRow(row);
  }, [hmiState, connectionStatus, isEnabled]);

  const publishPumpCommand = async (pumpNumber, command) => {
    const brokerUrl = import.meta.env.VITE_MQTT_URL;
    const baseTopic = mqttConfig.baseTopic;
    const topic =
      pumpNumber === 1
        ? buildTopic(baseTopic, topicDefinitions.pump1Command)
        : buildTopic(baseTopic, topicDefinitions.pump2Command);

    if (!brokerUrl) {
      setActivityMessage(`Demo mode: Pump ${pumpNumber} command changed to ${command ? 'ON' : 'OFF'}.`);
      setHmiState((current) => ({
        ...current,
        [pumpNumber === 1 ? 'pump1' : 'pump2']: {
          ...current[pumpNumber === 1 ? 'pump1' : 'pump2'],
          command,
          running: command
        }
      }));
      return;
    }

    if (!mqttServiceRef.current) {
      setActivityMessage('MQTT is not connected yet.');
      return;
    }

    try {
      mqttServiceRef.current?.publish(topic, {
        pump: pumpNumber,
        command,
        source: 'web-hmi',
        timestamp: new Date().toISOString()
      });
      setActivityMessage(`Pump ${pumpNumber} ${command ? 'ON' : 'OFF'} command published.`);
    } catch (error) {
      setActivityMessage(error.message);
    }
  };

  const openTrend = async (metric) => {
    setActiveTrendMetric(metric);

    const { data, skipped } = await fetchTrendSeries(metric.key, 24);

    if (skipped || data.length === 0) {
      const demoSeries = trendRows.map((row) => ({
        timestamp: row.timestamp,
        value: Number(row[metric.key] || 0)
      }));
      setActiveTrendSeries(demoSeries);
      return;
    }

    setActiveTrendSeries(
      data.map((row) => ({
        timestamp: row.timestamp,
        value: Number(row[metric.key] || 0)
      }))
    );
  };

  const closeTrend = () => {
    setActiveTrendMetric(null);
    setActiveTrendSeries([]);
  };

  return {
    hmiState,
    connectionStatus,
    trendRows,
    activityMessage,
    publishPumpCommand,
    activeTrendMetric,
    activeTrendSeries,
    openTrend,
    closeTrend
  };
}
