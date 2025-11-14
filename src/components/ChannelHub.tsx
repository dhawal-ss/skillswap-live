import { useMemo, useRef, useState, useEffect } from 'react';
import { followCreator } from '../services/api';
import { Skeleton } from './Skeleton';
import type { CreatorProfile, SkillClip, SkillTag } from '../types';
import { formatSkillTag } from '../lib/tagLabels';

interface Props {
  creators: CreatorProfile[];
  clips: SkillClip[];
  searchQuery?: string;
  categoryFilter?: 'all' | SkillTag | null;
  isLoading?: boolean;
}

export function ChannelHub({
  creators,
  clips,
  searchQuery = '',
  categoryFilter = null,
  isLoading = false,
}: Props) {
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

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
        creator.specialty.includes(categoryFilter as SkillTag);
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
      const creator = creators.find((item) => item.id === id);
      const name = creator?.name ?? 'this creator';
      setToast(!following.has(id) ? `Following ${name}` : `Unfollowed ${name}`);
      if (toastTimer.current) {
        window.clearTimeout(toastTimer.current);
      }
      toastTimer.current = window.setTimeout(() => {
        setToast(null);
        toastTimer.current = null;
      }, 2200);
    } catch (error) {
      console.error('Failed to sync follow state', error);
    }
  };

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        window.clearTimeout(toastTimer.current);
      }
    };
  }, []);

  if (isLoading) {
    return (
      <section style={{ padding: '32px 24px 80px', maxWidth: 1100, margin: '0 auto' }}>
        <header style={{ marginBottom: 24 }}>
          <p style={{ color: 'var(--color-text-meta)', margin: 0 }}>Creator channels</p>
          <h2 style={{ margin: '8px 0 0' }}>Follow hosts you vibe with.</h2>
        </header>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 20,
          }}
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <article
              key={`hub-skeleton-${index}`}
              style={{
                padding: 20,
                borderRadius: 20,
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                display: 'grid',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', gap: 12 }}>
                <Skeleton width={60} height={60} borderRadius={30} />
                <div style={{ flex: 1 }}>
                  <Skeleton width="60%" height={16} />
                  <Skeleton width="80%" height={14} />
                </div>
              </div>
              <Skeleton width="70%" height={14} />
              <Skeleton width="40%" height={14} />
              <Skeleton width="50%" height={32} borderRadius={12} />
            </article>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section style={{ padding: '32px 24px 80px', maxWidth: 1100, margin: '0 auto' }}>
      <header style={{ marginBottom: 24 }}>
        <p style={{ color: 'var(--color-text-meta)', margin: 0 }}>Creator channels</p>
        <h2 style={{ margin: '8px 0 0' }}>Follow hosts you vibe with.</h2>
      </header>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20,
        }}
      >
        {filteredCreators.length === 0 && (
          <p style={{ color: 'var(--color-text-subtle)' }}>No creators match those filters yet.</p>
        )}
        {filteredCreators.map((creator) => (
          <article
            key={creator.id}
            style={{
              padding: 20,
              borderRadius: 20,
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
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
                <p style={{ margin: 0, color: 'var(--color-text-subtle)' }}>{creator.bio}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--color-text-muted)' }}>
              <span>{creator.followers.toLocaleString()} followers</span>
              <span>{creator.upcomingSessions} upcoming</span>
              <span>{clipCountByCreator[creator.id] ?? 0} clips</span>
            </div>
            <p style={{ margin: 0, color: 'var(--color-text-subtle)', fontSize: 13 }}>
              Fans love {creator.specialty[0] ? formatSkillTag(creator.specialty[0]) : 'their sessions'}
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {creator.specialty.map((tag) => (
                <span
                  key={tag}
                  style={{
                    borderRadius: 999,
                    border: '1px solid var(--color-border-strong)',
                    padding: '6px 12px',
                    fontSize: 12,
                    color: 'var(--color-text-muted)',
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
                borderRadius: 999,
                border: 'none',
                padding: '12px 20px',
                background: following.has(creator.id)
                  ? 'var(--color-pill-bg)'
                  : 'linear-gradient(120deg, var(--color-text-primary), var(--color-brand))',
                color: following.has(creator.id) ? 'var(--color-brand)' : 'var(--color-contrast-on-accent)',
                cursor: 'pointer',
                fontWeight: 600,
                boxShadow: following.has(creator.id)
                  ? 'none'
                  : '0 15px 30px rgba(15,23,42,0.25)',
              }}
            >
              {following.has(creator.id) ? 'Following' : 'Follow'}
            </button>
          </article>
        ))}
      </div>
      {toast && (
        <div style={toastStyle}>{toast}</div>
      )}
    </section>
  );
}

const toastStyle = {
  position: 'fixed' as const,
  bottom: 32,
  right: 32,
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 16,
  padding: '12px 18px',
  boxShadow: '0 15px 40px rgba(15,23,42,0.25)',
  color: 'var(--color-text-primary)',
  fontWeight: 600,
  zIndex: 40,
};
