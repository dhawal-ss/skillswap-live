export type SkillTag =
  | 'languages'
  | 'cooking'
  | 'music'
  | 'diy'
  | 'productivity'
  | 'wellness'
  | 'technology'
  | 'artDesign'
  | 'businessFinance'
  | 'martialArts';

export interface UserProfile {
  name: string;
  timezone: string;
  learnTags: SkillTag[];
  teachTags: SkillTag[];
  availability: string[]; // e.g., ['Morning', 'Evening']
  bio?: string;
  avatarUrl?: string;
}

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  provider: 'email';
  age?: number;
  avatarUrl?: string;
};

export interface SessionCard {
  id: string;
  title: string;
  tag: SkillTag;
  host: string;
  hostAvatar: string;
  demoVideoUrl?: string;
  language: string;
  startTime: string;
  duration: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  rating: number;
  status: 'live' | 'soon' | 'later';
  blurb: string;
}

export interface CreatorProfile {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  languages: string[];
  specialty: SkillTag[];
  followers: number;
  upcomingSessions: number;
  clipCount: number;
}

export interface SkillClip {
  id: string;
  title: string;
  creatorId: string;
  previewUrl: string;
  videoUrl?: string;
  duration: number;
  likes: number;
  comments: number;
  saves: number;
  views?: number;
  tags: SkillTag[];
  ctaSessionId?: string;
}

export interface ClipComment {
  id: string;
  clipId: string;
  author: string;
  avatar: string;
  role: 'Question' | 'Tip' | 'Request';
  body: string;
  timestamp: string;
}
