import type { SkillClip, SkillTag } from '../types';
import { fetchClips } from './api';
import { CLIP_VIDEO_PLACEHOLDER } from '../lib/media';
import { supabase } from './supabaseClient';
import { getViewerId } from '../lib/viewerId';

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

const fallbackUpload = async (draft: {
  title: string;
  tag: SkillTag;
  previewUrl: string;
  duration: number;
  videoUrl?: string;
}): Promise<SkillClip> => {
  await delay(320);
  return {
    id: `uploaded-${Date.now()}`,
    title: draft.title,
    creatorId: 'self',
    previewUrl: draft.previewUrl || `https://source.unsplash.com/random/800x600?${draft.tag}`,
    videoUrl: draft.videoUrl || CLIP_VIDEO_PLACEHOLDER,
    duration: draft.duration,
    likes: 0,
    comments: 0,
    saves: 0,
    views: 0,
    tags: [draft.tag],
  };
};

export const clipService = {
  list: () => fetchClips(),
  toggleSave: async (clipId: string, saved: boolean) => {
    if (!supabase) {
      await delay(140);
      return { clipId, saved };
    }
    const viewerId = getViewerId();
    if (saved) {
      const { error } = await supabase.from('clip_saves').upsert({ clip_id: clipId, viewer_id: viewerId });
      if (error) throw error;
    } else {
      const { error } = await supabase.from('clip_saves').delete().eq('clip_id', clipId).eq('viewer_id', viewerId);
      if (error) throw error;
    }
    return { clipId, saved };
  },
  uploadDraft: async (draft: {
    title: string;
    tag: SkillTag;
    previewUrl: string;
    duration: number;
    videoUrl?: string;
  }): Promise<SkillClip> => {
    if (!supabase) {
      return fallbackUpload(draft);
    }
    const { data, error } = await supabase
      .from('clips')
      .insert({
        title: draft.title,
        creator_id: getViewerId(),
        preview_url: draft.previewUrl,
        video_url: draft.videoUrl ?? CLIP_VIDEO_PLACEHOLDER,
        duration: draft.duration,
        tags: [draft.tag],
      })
      .select(
        'id,title,creator_id,preview_url,video_url,duration,likes,comments,saves,views,tags',
      )
      .single();
    if (error) {
      console.error('[clipService.uploadDraft] falling back to mock', error);
      return fallbackUpload(draft);
    }
    return {
      id: data.id,
      title: data.title,
      creatorId: data.creator_id,
      previewUrl: data.preview_url,
      videoUrl: data.video_url ?? undefined,
      duration: data.duration ?? draft.duration,
      likes: data.likes ?? 0,
      comments: data.comments ?? 0,
      saves: data.saves ?? 0,
      views: data.views ?? 0,
      tags: (data.tags ?? []) as SkillTag[],
    };
  },
};
