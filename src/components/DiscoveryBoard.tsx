import { useMemo, useState } from 'react';
import type { SessionCard, SkillClip, UserProfile } from '../types';

interface Props {
  profile: UserProfile;
  sessions: SessionCard[];
  onJoin: (session: SessionCard) => void;
  isMatching?: boolean;
  featuredClips?: SkillClip[];
  onOpenClips?: () => void;
  categoryFilter?: string | null;
  searchQuery?: string;
}

const sectionTitles: Record<SessionCard['status'], string> = {
  live: 'Live now',
  soon: 'Starting soon',
  later: 'Plan for later',
};

function StatusBadge({ status }: { status: SessionCard['status'] }) {
  const colors: Record<SessionCard['status'], string> = {
    live: '#22c55e',
    soon: '#f97316',
    later: '#6366f1',
  };
  return (
    <span
      style={{
        padding: '4px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        color: '#fff',
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
        border: '1px solid #e2e8f0',
        background: '#fff',
        display: 'grid',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ fontWeight: 600, color: '#0f172a' }}>{session.title}</span>
        <StatusBadge status={session.status} />
      </div>
      <p style={{ color: '#475569', margin: 0 }}>{session.blurb}</p>
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
          <span style={{ color: '#64748b', fontSize: 14 }}>{session.language}</span>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right', color: '#475569', fontSize: 14 }}>
          <div>{session.startTime}</div>
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
          background: disabled ? '#cbd5f5' : '#0f172a',
          color: disabled ? '#94a3b8' : '#fff',
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

  return (
    <section style={{ padding: '32px 24px 80px', maxWidth: 1100, margin: '0 auto' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        <p style={{ color: '#64748b', margin: 0 }}>Hi {profile.name},</p>
        <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', margin: 0 }}>
          Here’s what matches your vibe today.
        </h2>
        <p style={{ color: '#475569', margin: 0 }}>
          Availability: {profile.availability.join(', ')} · Timezone: {profile.timezone}
        </p>
      </header>

      {featuredClips.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <h3 style={{ margin: 0 }}>Featured skill clips</h3>
            {onOpenClips && (
              <button
                type="button"
                onClick={onOpenClips}
                style={{
                  border: 'none',
                  borderRadius: 999,
                  padding: '6px 16px',
                  background: '#0f172a',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                View feed
              </button>
            )}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
            }}
          >
            {featuredClips.map((clip) => (
              <article
                key={clip.id}
                style={{
                  borderRadius: 20,
                  overflow: 'hidden',
                  border: '1px solid #e2e8f0',
                  minHeight: 180,
                  backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0) 40%, rgba(15,23,42,.85)), url(${clip.previewUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  padding: 16,
                  color: '#fff',
                }}
              >
                <p style={{ margin: 0, fontSize: 12 }}>{clip.duration}s · {clip.tags.join(', ')}</p>
                <strong>{clip.title}</strong>
              </article>
            ))}
          </div>
        </div>
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
              border: '1px solid #cbd5f5',
              padding: '8px 16px',
              background: activeTag === tag ? '#312e81' : '#fff',
              color: activeTag === tag ? '#fff' : '#0f172a',
              cursor: 'pointer',
            }}
          >
            {tag === 'all' ? 'All interests' : tag}
          </button>
        ))}
        {searchQuery && (
          <span style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: 14 }}>
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
            border: '1px solid #cbd5f5',
            background: '#fff',
            color: '#475569',
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
                }}
              >
                <h3 style={{ margin: 0 }}>{sectionTitles[status]}</h3>
                <span style={{ color: '#94a3b8' }}>{grouped[status].length} options</span>
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
