import { useMemo, useState } from 'react';
import { followCreator } from '../services/api';
import type { CreatorProfile, SkillClip } from '../types';

interface Props {
  creators: CreatorProfile[];
  clips: SkillClip[];
  searchQuery?: string;
  categoryFilter?: string | null;
}

export function ChannelHub({ creators, clips, searchQuery = '', categoryFilter = null }: Props) {
  const [following, setFollowing] = useState<Set<string>>(new Set());

  const clipCountByCreator = useMemo(() => {
    return clips.reduce<Record<string, number>>((acc, clip) => {
      acc[clip.creatorId] = (acc[clip.creatorId] || 0) + 1;
      return acc;
    }, {});
  }, [clips]);

  const filteredCreators = useMemo(() => {
    const normalized = searchQuery.toLowerCase();
    return creators.filter((creator) => {
      const matchesCategory =
        !categoryFilter ||
        categoryFilter === 'all' ||
        creator.specialty.includes(categoryFilter);
      const matchesSearch =
        !normalized ||
        creator.name.toLowerCase().includes(normalized) ||
        creator.bio.toLowerCase().includes(normalized);
      return matchesCategory && matchesSearch;
    });
  }, [creators, searchQuery, categoryFilter]);

  const toggleFollow = async (id: string) => {
    setFollowing((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    try {
      await followCreator(id, !following.has(id));
    } catch (error) {
      console.error('Failed to sync follow state', error);
    }
  };

  return (
    <section style={{ padding: '32px 24px 80px', maxWidth: 1100, margin: '0 auto' }}>
      <header style={{ marginBottom: 24 }}>
        <p style={{ color: '#94a3b8', margin: 0 }}>Creator channels</p>
        <h2 style={{ margin: '8px 0 0' }}>Follow hosts you vibe with.</h2>
      </header>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20,
        }}
      >
        {filteredCreators.map((creator) => (
          <article
            key={creator.id}
            style={{
              padding: 20,
              borderRadius: 20,
              border: '1px solid #e2e8f0',
              background: '#fff',
              display: 'grid',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', gap: 12 }}>
              <img
                src={creator.avatar}
                alt={creator.name}
                width={60}
                height={60}
                style={{ borderRadius: '50%' }}
              />
              <div>
                <strong>{creator.name}</strong>
                <p style={{ margin: 0, color: '#64748b' }}>{creator.bio}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#475569' }}>
              <span>{creator.followers.toLocaleString()} followers</span>
              <span>{creator.upcomingSessions} upcoming</span>
              <span>{clipCountByCreator[creator.id] ?? 0} clips</span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {creator.specialty.map((tag) => (
                <span
                  key={tag}
                  style={{
                    borderRadius: 999,
                    border: '1px solid #cbd5f5',
                    padding: '6px 12px',
                    fontSize: 12,
                    color: '#475569',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={() => toggleFollow(creator.id)}
              style={{
                borderRadius: 14,
                border: 'none',
                padding: '12px 18px',
                background: following.has(creator.id) ? '#e0e7ff' : '#0f172a',
                color: following.has(creator.id) ? '#312e81' : '#fff',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {following.has(creator.id) ? 'Following' : 'Follow'}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
