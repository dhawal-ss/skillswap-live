import type { ClipComment } from '../types';

export const mockClipComments: ClipComment[] = [
  {
    id: 'comment-1',
    clipId: 'clip-101',
    author: 'Bella',
    avatar: 'https://i.pravatar.cc/60?img=52',
    role: 'Question',
    body: 'Could you cover casual goodbyes next?',
    timestamp: '2m ago',
  },
  {
    id: 'comment-2',
    clipId: 'clip-101',
    author: 'Omar',
    avatar: 'https://i.pravatar.cc/60?img=61',
    role: 'Tip',
    body: 'I pair these phrases with LingoClip flashcards—game changer.',
    timestamp: '6m ago',
  },
  {
    id: 'comment-3',
    clipId: 'clip-202',
    author: 'Hiromi',
    avatar: 'https://i.pravatar.cc/60?img=17',
    role: 'Request',
    body: 'Show a cold brew version please!',
    timestamp: '12m ago',
  },
];
