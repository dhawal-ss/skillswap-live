import type { SessionCard } from '../types';
import { fetchSessions } from './api';

const lag = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

export const sessionService = {
  list: () => fetchSessions(),
  join: async (session: SessionCard) => {
    await lag(180);
    return { ok: true, sessionId: session.id };
  },
};

