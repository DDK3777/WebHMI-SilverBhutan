export const topicDefinitions = {
  live: 'telemetry/live',
  pump1Command: 'command/pump1',
  pump2Command: 'command/pump2'
};

export const buildTopic = (baseTopic, suffix) => `${baseTopic}/${suffix}`;
