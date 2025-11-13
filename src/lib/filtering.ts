import type { SessionCard, SkillTag } from '../types';

interface FilterOptions {
  searchQuery: string;
  categoryFilter: 'all' | SkillTag;
}

export function filterSessions(
  sessions: SessionCard[],
  { searchQuery, categoryFilter }: FilterOptions,
): SessionCard[] {
  const normalizedSearch = searchQuery.trim().toLowerCase();

  return sessions.filter((session) => {
    const matchesCategory = categoryFilter === 'all' || session.tag === categoryFilter;
    const matchesSearch =
      !normalizedSearch ||
      session.title.toLowerCase().includes(normalizedSearch) ||
      session.host.toLowerCase().includes(normalizedSearch) ||
      session.blurb.toLowerCase().includes(normalizedSearch);
    return matchesCategory && matchesSearch;
  });
}
