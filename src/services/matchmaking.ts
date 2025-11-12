import type { SessionCard } from '../types';

const latencyByStatus: Record<SessionCard['status'], number> = {
  live: 600,
  soon: 900,
  later: 1200,
};

export function requestMatch(session: SessionCard) {
  const latency = latencyByStatus[session.status] ?? 800;
  return new Promise<SessionCard>((resolve) => {
    setTimeout(() => resolve(session), latency);
  });
}
