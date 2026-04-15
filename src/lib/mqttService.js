import mqtt from 'mqtt';

export function createMqttService({
  brokerUrl,
  username,
  password,
  clientId,
  baseTopic,
  subscriptions,
  onMessage,
  onStatusChange
}) {
  let client;

  const connect = () => {
    if (!brokerUrl) {
      onStatusChange?.('missing-config');
      return;
    }

    client = mqtt.connect(brokerUrl, {
      username: username || undefined,
      password: password || undefined,
      clientId: clientId || `solar-pump-hmi-${Math.random().toString(16).slice(2)}`,
      clean: true,
      reconnectPeriod: 3000,
      connectTimeout: 10000
    });

    client.on('connect', () => {
      onStatusChange?.('connected');
      subscriptions.forEach((topic) => {
        client.subscribe(topic);
      });
    });

    client.on('reconnect', () => onStatusChange?.('reconnecting'));
    client.on('close', () => onStatusChange?.('disconnected'));
    client.on('error', () => onStatusChange?.('error'));

    client.on('message', (topic, payload) => {
      try {
        const parsed = JSON.parse(payload.toString());
        onMessage?.(topic, parsed);
      } catch {
        onMessage?.(topic, payload.toString());
      }
    });
  };

  const publish = (topic, payload) => {
    if (!client || !client.connected) {
      throw new Error('MQTT is not connected yet.');
    }

    client.publish(topic, JSON.stringify(payload), { qos: 0, retain: false });
  };

  const disconnect = () => {
    client?.end(true);
  };

  return {
    connect,
    disconnect,
    publish,
    getBaseTopic: () => baseTopic
  };
}
