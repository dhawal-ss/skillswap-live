import { useMemo, useState } from 'react';
import { Skeleton } from './Skeleton';
import type { SessionCard, SkillClip, UserProfile, CreatorProfile, SkillTag } from '../types';
import { TrendingCreatorRail } from './TrendingCreators';
import { formatSkillTag } from '../lib/tagLabels';
import { formatDateTimeShort } from '../lib/formatters';

interface Props {
  profile: UserProfile;
  sessions: SessionCard[];
  onJoin: (session: SessionCard) => void;
  isMatching?: boolean;
  featuredClips?: SkillClip[];
  onOpenClips?: () => void;
  categoryFilter?: string | null;
  searchQuery?: string;
  isLoading?: boolean;
  creators?: CreatorProfile[];
  onTuneTag?: (tag: SkillTag, intent: 'more' | 'less') => void;
  onWatchClip?: (clip: SkillClip) => void;
}

const sectionTitles: Record<SessionCard['status'], string> = {
  live: 'Live now',
  soon: 'Starting soon',
  later: 'Plan for later',
};

function StatusBadge({ status }: { status: SessionCard['status'] }) {
  const colors: Record<SessionCard['status'], string> = {
    live: 'var(--color-status-live)',
    soon: 'var(--color-status-soon)',
    later: 'var(--color-status-later)',
  };
  return (
    <span
      style={{
        padding: '4px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        color: 'var(--color-text-inverse)',
        background: colors[status],
        textTransform: 'uppercase',
      }}
    >
      {status}
    </span>
  );
}

function SessionCardView({
  session,
  onJoin,
  disabled,
}: {
  session: SessionCard;
  onJoin: () => void;
  disabled?: boolean;
}) {
  return (
    <article
      style={{
        padding: 20,
        borderRadius: 20,
        border: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        display: 'grid',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{session.title}</span>
        <StatusBadge status={session.status} />
      </div>
      <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>{session.blurb}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <img
          src={session.hostAvatar}
          alt={session.host}
          width={40}
          height={40}
          style={{ borderRadius: '50%' }}
        />
        <div>
          <strong style={{ display: 'block' }}>{session.host}</strong>
          <span style={{ color: 'var(--color-text-subtle)', fontSize: 14 }}>{session.language}</span>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right', color: 'var(--color-text-muted)', fontSize: 14 }}>
          <div>{formatDateTimeShort(session.startTime)}</div>
          <div>{session.duration} min · {session.level}</div>
        </div>
      </div>
      <button
        type="button"
        onClick={onJoin}
        disabled={disabled}
        style={{
          justifySelf: 'flex-end',
          padding: '10px 20px',
          borderRadius: 12,
          border: 'none',
          background: disabled ? 'var(--color-disabled-bg)' : 'var(--color-text-primary)',
          color: disabled ? 'var(--color-disabled-text)' : 'var(--color-contrast-on-accent)',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        {session.status === 'later' ? 'Schedule' : 'Join session'}
      </button>
    </article>
  );
}

export function DiscoveryBoard({
  profile,
  sessions,
  onJoin,
  isMatching = false,
  featuredClips = [],
  onOpenClips,
  categoryFilter = null,
  searchQuery = '',
  isLoading = false,
  creators = [],
  onTuneTag,
  onWatchClip,
}: Props) {
  const [activeTag, setActiveTag] = useState<string>('all');

  const filtered = useMemo(() => {
    const normalizedSearch = searchQuery.toLowerCase();
    return sessions.filter((session) => {
      const matchesTag = activeTag === 'all' || session.tag === activeTag;
      const matchesCategory = !categoryFilter || categoryFilter === 'all' || session.tag === categoryFilter;
      const matchesQuery =
        !normalizedSearch ||
        session.title.toLowerCase().includes(normalizedSearch) ||
        session.host.toLowerCase().includes(normalizedSearch);
      return matchesTag && matchesCategory && matchesQuery;
    });
  }, [sessions, activeTag, categoryFilter, searchQuery]);

  const grouped = useMemo(() => {
    return filtered.reduce(
      (acc, session) => {
        acc[session.status].push(session);
        return acc;
      },
      { live: [] as SessionCard[], soon: [] as SessionCard[], later: [] as SessionCard[] },
    );
  }, [filtered]);

  const tagOptions = ['all', ...new Set(profile.learnTags)];
  const creatorMap = useMemo(
    () =>
      creators.reduce<Record<string, CreatorProfile>>((acc, creator) => {
        acc[creator.id] = creator;
        return acc;
      }, {}),
    [creators],
  );
  const highlightClips = useMemo(
    () => featuredClips.filter((clip) => creatorMap[clip.creatorId]).slice(0, 4),
    [featuredClips, creatorMap],
  );
  const headerContent = (
    <header style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        <p style={{ color: 'var(--color-text-subtle)', margin: 0 }}>Hi {profile.name},</p>
        <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', margin: 0 }}>
          Here’s what matches your vibe today.
        </h2>
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
          Availability: {profile.availability.join(', ')} · Timezone: {profile.timezone}
        </p>
      </header>
  );

  if (isLoading) {
    return (
      <section style={{ padding: '32px 24px 80px', maxWidth: 1100, margin: '0 auto' }}>
        {headerContent}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={`chip-${index}`} width={90} height={34} borderRadius={999} />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {Array.from({ length: 6 }).map((_, index) => (
            <article
              key={`skeleton-${index}`}
              style={{
                borderRadius: 20,
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                padding: 20,
                display: 'grid',
                gap: 16,
              }}
            >
              <Skeleton width="70%" height={20} />
              <Skeleton width="90%" height={14} />
              <Skeleton width="60%" height={14} />
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <Skeleton width={40} height={40} borderRadius={20} />
                <div style={{ flex: 1 }}>
                  <Skeleton width="50%" height={14} />
                  <Skeleton width="30%" height={12} />
                </div>
              </div>
              <Skeleton width="40%" height={36} borderRadius={12} />
            </article>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section style={{ padding: '32px 24px 80px', maxWidth: 1100, margin: '0 auto' }}>
      {headerContent}

      {highlightClips.length > 0 && (
        <CreatorHighlights
          clips={highlightClips}
          creatorMap={creatorMap}
          onOpenClips={onOpenClips}
          onWatchClip={onWatchClip}
        />
      )}

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 20,
          alignItems: 'center',
        }}
      >
        {tagOptions.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setActiveTag(tag)}
            style={{
              borderRadius: 999,
              border: '1px solid var(--color-border-strong)',
              padding: '8px 16px',
              background: activeTag === tag ? 'var(--color-brand)' : 'var(--color-surface)',
              color: activeTag === tag ? 'var(--color-contrast-on-accent)' : 'var(--color-text-primary)',
              cursor: 'pointer',
            }}
          >
            {tag === 'all' ? 'All interests' : formatSkillTag(tag as SkillTag)}
          </button>
        ))}
        {searchQuery && (
          <span style={{ marginLeft: 'auto', color: 'var(--color-text-meta)', fontSize: 14 }}>
            Searching for “{searchQuery}”
          </span>
        )}
      </div>

      {isMatching && (
        <div
          style={{
            marginBottom: 20,
            padding: '12px 18px',
            borderRadius: 14,
            border: '1px solid var(--color-border-strong)',
            background: 'var(--color-surface)',
            color: 'var(--color-text-muted)',
          }}
        >
          Matching you with the host… running mic/cam checks.
        </div>
      )}

      <div style={{ display: 'grid', gap: 32 }}>
        {(Object.keys(grouped) as SessionCard['status'][]).map((status) => {
          if (grouped[status].length === 0) return null;
          return (
            <div key={status}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                  ...(status !== 'live'
                    ? {
                        position: 'sticky',
                        top: 96,
                        background: 'var(--color-page-bg)',
                        padding: '8px 0',
                        zIndex: 5,
                      }
                    : {}),
                }}
              >
                <h3 style={{ margin: 0 }}>{sectionTitles[status]}</h3>
                <span style={{ color: 'var(--color-text-meta)' }}>{grouped[status].length} options</span>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: 20,
                }}
              >
                {grouped[status].map((session) => (
                  <SessionCardView
                    key={session.id}
                    session={session}
                    disabled={isMatching}
                    onJoin={() => onJoin(session)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CreatorHighlights({
  clips,
  creatorMap,
  onWatchClip,
  onOpenClips,
}: {
  clips: SkillClip[];
  creatorMap: Record<string, CreatorProfile>;
  onWatchClip?: (clip: SkillClip) => void;
  onOpenClips?: () => void;
}) {
  if (clips.length === 0) return null;
  return (
    <section
      style={{ border: '1px solid var(--color-border)', borderRadius: 24, padding: 16, marginBottom: 24 }}
      data-tour-id="highlight-creators"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0 }}>Creators to follow</h3>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 14 }}>Short clips from trending teachers</p>
        </div>
        {onOpenClips && (
          <button
            type="button"
            onClick={onOpenClips}
            style={{
              borderRadius: 999,
              border: '1px solid var(--color-border-strong)',
              padding: '6px 14px',
              background: 'var(--color-surface)',
              cursor: 'pointer',
            }}
          >
            View all
          </button>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        {clips.map((clip) => {
          const creator = creatorMap[clip.creatorId];
          if (!creator) return null;
          return (
            <article
              key={clip.id}
              style={{
                borderRadius: 20,
                border: '1px solid var(--color-border)',
                overflow: 'hidden',
                display: 'grid',
                gridTemplateRows: '200px auto',
                background: 'var(--color-surface)',
              }}
            >
              <div
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0) 40%, rgba(15,23,42,.7)), url(${clip.previewUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  color: '#fff',
                }}
              >
                <p style={{ margin: 0, fontSize: 12 }}>
                  {clip.duration}s · {clip.tags.map((tag) => formatSkillTag(tag)).join(', ')}
                </p>
                <strong>{clip.title}</strong>
              </div>
              <div style={{ padding: 16, display: 'grid', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src={creator.avatar} alt={creator.name} width={40} height={40} style={{ borderRadius: '50%' }} />
                  <div>
                    <strong>{creator.name}</strong>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
                      {creator.followers.toLocaleString()} followers
                    </p>
                  </div>
                </div>
                <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                  👁 {clip.views?.toLocaleString() ?? '—'} views
                </span>
                <button
                  type="button"
                  onClick={() => onWatchClip?.(clip)}
                  style={{
                    borderRadius: 12,
                    border: 'none',
                    padding: '10px 14px',
                    background: 'var(--color-text-primary)',
                    color: 'var(--color-contrast-on-accent)',
                    cursor: 'pointer',
                  }}
                >
                  Watch clip →
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
