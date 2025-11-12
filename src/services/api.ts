import { mockSessions } from '../data/mockSessions';
import { mockCreators } from '../data/mockCreators';
import { mockClips } from '../data/mockClips';
import { mockClipComments } from '../data/mockClipComments';
import type {
  ClipComment,
  CreatorProfile,
  SessionCard,
  SkillClip,
} from '../types';

const clone = <T,>(payload: T): T => JSON.parse(JSON.stringify(payload));

const simulateNetwork = async <T,>(payload: T, delay = 350): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(clone(payload)), delay));

export const fetchSessions = () => simulateNetwork<SessionCard[]>(mockSessions);
export const fetchCreators = () => simulateNetwork<CreatorProfile[]>(mockCreators);
export const fetchClips = () => simulateNetwork<SkillClip[]>(mockClips);
export const fetchClipComments = () => simulateNetwork<ClipComment[]>(mockClipComments);

export const followCreator = async (creatorId: string, follow: boolean) =>
  simulateNetwork({ ok: true, creatorId, follow }, 250);

export const reactToClip = async (clipId: string, reaction: 'like' | 'save') =>
  simulateNetwork({ ok: true, clipId, reaction }, 250);

export const submitClipComment = async (clipId: string, message: string) =>
  simulateNetwork(
    { ok: true, clipId, message, id: `comment-${Math.random().toString(36).slice(2)}` },
    400,
  );
