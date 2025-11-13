import type { SkillTag } from '../types';

export const orderedSkillTags: SkillTag[] = [
  'artDesign',
  'businessFinance',
  'cooking',
  'diy',
  'languages',
  'martialArts',
  'music',
  'productivity',
  'technology',
  'wellness',
];

export const skillTagLabels: Record<SkillTag, string> = {
  artDesign: 'Art/Design',
  businessFinance: 'Business/Finance',
  cooking: 'Cooking',
  diy: 'DIY',
  languages: 'Languages',
  martialArts: 'Martial Arts',
  music: 'Music/Audio',
  productivity: 'Productivity',
  technology: 'Technology',
  wellness: 'Wellness',
};

export const formatSkillTag = (tag: SkillTag) => skillTagLabels[tag] ?? tag;
