type AnalyticsEvent = {
  name: string;
  metadata?: Record<string, unknown>;
};

const queue: AnalyticsEvent[] = [];

export function trackEvent(name: string, metadata?: Record<string, unknown>) {
  queue.push({ name, metadata });
  const nodeEnv = typeof process !== 'undefined' ? process.env?.NODE_ENV : undefined;
  if (nodeEnv !== 'test') {
    console.debug('[analytics]', name, metadata ?? {});
  }
}

export function getAnalyticsQueue() {
  return [...queue];
}
