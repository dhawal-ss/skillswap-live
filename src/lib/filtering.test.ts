import type { SessionCard } from '../types';
import { filterSessions } from './filtering';

const sessions: SessionCard[] = [
  {
    id: '1',
    title: 'Beginner Spanish Cafe Chat',
    tag: 'languages',
    host: 'Lola',
    hostAvatar: '',
    language: 'Spanish',
    startTime: 'Today',
    duration: 30,
    level: 'Beginner',
    rating: 4.6,
    status: 'live',
    blurb: 'Practice small talk over coffee.',
  },
  {
    id: '2',
    title: 'Sourdough Starter SOS',
    tag: 'cooking',
    host: 'Mina',
    hostAvatar: '',
    language: 'English',
    startTime: 'Tomorrow',
    duration: 40,
    level: 'Intermediate',
    rating: 4.9,
    status: 'soon',
    blurb: 'Fix a sluggish starter and bake together.',
  },
];

describe('filterSessions', () => {
  it('filters by category', () => {
    const result = filterSessions(sessions, { searchQuery: '', categoryFilter: 'cooking' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('filters by search query (title, host, blurb)', () => {
    const result = filterSessions(sessions, { searchQuery: 'starter', categoryFilter: 'all' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('returns all sessions when search and category are neutral', () => {
    const result = filterSessions(sessions, { searchQuery: '', categoryFilter: 'all' });
    expect(result).toHaveLength(2);
  });
});
