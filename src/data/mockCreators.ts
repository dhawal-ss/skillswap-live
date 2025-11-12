import type { CreatorProfile } from '../types';

export const mockCreators: CreatorProfile[] = [
  {
    id: 'creator-lucia',
    name: 'Lucía Márquez',
    avatar: 'https://i.pravatar.cc/100?img=44',
    bio: 'Polyglot guide making travel Spanish fun + fearless.',
    languages: ['Spanish', 'English'],
    specialty: ['languages', 'wellness'],
    followers: 12800,
    upcomingSessions: 3,
    clipCount: 42,
  },
  {
    id: 'creator-sambrew',
    name: 'Sam Brew',
    avatar: 'https://i.pravatar.cc/100?img=12',
    bio: 'Coffee ritual coach & kitchen minimalism nerd.',
    languages: ['English'],
    specialty: ['cooking', 'productivity'],
    followers: 9400,
    upcomingSessions: 2,
    clipCount: 28,
  },
  {
    id: 'creator-nara',
    name: 'Nara Kim',
    avatar: 'https://i.pravatar.cc/100?img=36',
    bio: 'Lo-fi beat maker sharing daily 5-min grooves.',
    languages: ['English', 'Korean'],
    specialty: ['music', 'technology'],
    followers: 15600,
    upcomingSessions: 4,
    clipCount: 64,
  },
];
