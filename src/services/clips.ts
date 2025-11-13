import type { SkillClip, SkillTag } from '../types';
import { fetchClips } from './api';
import { CLIP_VIDEO_PLACEHOLDER } from '../lib/media';

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

export const clipService = {
  list: () => fetchClips(),
  toggleSave: async (clipId: string, saved: boolean) => {
    await delay(140);
    return { clipId, saved };
  },
  uploadDraft: async (draft: {
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
      previewUrl:
        draft.previewUrl || `https://source.unsplash.com/random/800x600?${draft.tag}`,
      videoUrl: draft.videoUrl || CLIP_VIDEO_PLACEHOLDER,
      duration: draft.duration,
      likes: 0,
      comments: 0,
      saves: 0,
      views: 0,
      tags: [draft.tag],
    };
  },
};
