import { mockSessions } from '../data/mockSessions';
import { mockCreators } from '../data/mockCreators';
import { mockClips } from '../data/mockClips';
import { mockClipComments } from '../data/mockClipComments';
import type {
  ClipComment,
  CreatorProfile,
  SessionCard,
  SkillClip,
  SkillTag,
} from '../types';
import { getSupabaseClient } from './supabaseClient';
import { getViewerId } from '../lib/viewerId';

const clone = <T,>(payload: T): T => JSON.parse(JSON.stringify(payload));

const simulateNetwork = async <T,>(payload: T, delay = 350): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(clone(payload)), delay));

const fallbackOrThrow = async <T>(
  operation: (client: NonNullable<ReturnType<typeof getSupabaseClient>>) => Promise<T>,
  fallback: () => Promise<T>,
) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return fallback();
  }
  try {
    return await operation(supabase);
  } catch (error) {
    console.error('[supabase] falling back to mocks', error);
    return fallback();
  }
};

const mapClipRecord = (record: Record<string, any>): SkillClip => ({
  id: record.id,
  title: record.title,
  creatorId: record.creator_id,
  previewUrl: record.preview_url,
  videoUrl: record.video_url ?? undefined,
  duration: record.duration ?? 0,
  likes: record.likes ?? 0,
  comments: record.comments ?? 0,
  saves: record.saves ?? 0,
  views: record.views ?? undefined,
  tags: (record.tags ?? []) as SkillTag[],
  ctaSessionId: record.cta_session_id ?? undefined,
});

const mapSessionRecord = (record: Record<string, any>): SessionCard => ({
  id: record.id,
  title: record.title,
  tag: record.tag,
  host: record.host,
  hostAvatar: record.host_avatar,
  demoVideoUrl: record.demo_video_url ?? undefined,
  language: record.language,
  startTime: record.start_time,
  duration: record.duration,
  level: record.level,
  rating: record.rating,
  status: record.status,
  blurb: record.blurb,
});

const mapCreatorRecord = (record: Record<string, any>): CreatorProfile => ({
  id: record.id,
  name: record.name,
  avatar: record.avatar,
  bio: record.bio,
  languages: record.languages ?? [],
  specialty: (record.specialty ?? []) as SkillTag[],
  followers: record.followers ?? 0,
  upcomingSessions: record.upcoming_sessions ?? 0,
  clipCount: record.clip_count ?? 0,
});

const mapCommentRecord = (record: Record<string, any>): ClipComment => ({
  id: record.id,
  clipId: record.clip_id,
  author: record.author,
  avatar: record.avatar,
  role: record.role,
  body: record.body,
  timestamp: record.timestamp,
});

export const fetchSessions = () =>
  fallbackOrThrow(
    async (supabase) => {
      const { data, error } = await supabase
        .from('sessions')
        .select(
          'id,title,tag,host,host_avatar,demo_video_url,language,start_time,duration,level,rating,status,blurb',
        )
        .order('start_time', { ascending: true });
      if (error) throw error;
      return data.map(mapSessionRecord);
    },
    () => simulateNetwork<SessionCard[]>(mockSessions),
  );

export const fetchCreators = () =>
  fallbackOrThrow(
    async (supabase) => {
      const { data, error } = await supabase
        .from('creators')
        .select(
          'id,name,avatar,bio,languages,specialty,followers,upcoming_sessions,clip_count',
        )
        .order('followers', { ascending: false });
      if (error) throw error;
      return data.map(mapCreatorRecord);
    },
    () => simulateNetwork<CreatorProfile[]>(mockCreators),
  );

export const fetchClips = () =>
  fallbackOrThrow(
    async (supabase) => {
      const { data, error } = await supabase
        .from('clips')
        .select(
          'id,title,creator_id,preview_url,video_url,duration,likes,comments,saves,views,tags,cta_session_id',
        )
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map(mapClipRecord);
    },
    () => simulateNetwork<SkillClip[]>(mockClips),
  );

export const fetchClipComments = () =>
  fallbackOrThrow(
    async (supabase) => {
      const { data, error } = await supabase
        .from('clip_comments')
        .select('id,clip_id,author,avatar,role,body,timestamp')
        .order('timestamp', { ascending: false });
      if (error) throw error;
      return data.map(mapCommentRecord);
    },
    () => simulateNetwork<ClipComment[]>(mockClipComments),
  );

export const followCreator = (creatorId: string, follow: boolean) =>
  fallbackOrThrow(
    async (supabase) => {
      const viewerId = getViewerId();
      const table = supabase.from('creator_follows');
      if (follow) {
        const { error } = await table.upsert({ creator_id: creatorId, viewer_id: viewerId });
        if (error) throw error;
      } else {
        const { error } = await table.delete().eq('creator_id', creatorId).eq('viewer_id', viewerId);
        if (error) throw error;
      }
      return { ok: true, creatorId, follow };
    },
    () => simulateNetwork({ ok: true, creatorId, follow }, 250),
  );

export const reactToClip = (clipId: string, reaction: 'like' | 'save') =>
  fallbackOrThrow(
    async (supabase) => {
      const viewerId = getViewerId();
      const { error } = await supabase
        .from('clip_reactions')
        .insert({ clip_id: clipId, reaction, viewer_id: viewerId });
      if (error) throw error;
      return { ok: true, clipId, reaction };
    },
    () => simulateNetwork({ ok: true, clipId, reaction }, 250),
  );

export const submitClipComment = (clipId: string, message: string) =>
  fallbackOrThrow(
    async (supabase) => {
      const viewerId = getViewerId();
      const { data, error } = await supabase
        .from('clip_comments')
        .insert({
          clip_id: clipId,
          body: message,
          role: 'Tip',
          author: 'You',
          avatar: '',
          viewer_id: viewerId,
          timestamp: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return { ok: true, clipId, message, id: data.id };
    },
    () =>
      simulateNetwork(
        {
          ok: true,
          clipId,
          message,
          id: `comment-${Math.random().toString(36).slice(2)}`,
        },
        400,
      ),
  );
