import { useMemo, useState } from 'react';
import type { ClipComment, CreatorProfile, SessionCard, SkillClip } from '../types';
import { EngagementBar } from './EngagementBar';
import { CommentsDrawer } from './CommentsDrawer';

interface Props {
  clips: SkillClip[];
  creators: CreatorProfile[];
  comments: ClipComment[];
  onJoinSession: (sessionId: string) => Promise<void> | void;
  sessions: SessionCard[];
  searchQuery?: string;
  categoryFilter?: string | null;
}

export function ClipFeed({
  clips,
  creators,
  comments,
  onJoinSession,
  sessions,
  searchQuery = '',
  categoryFilter = null,
}: Props) {
  const [openComments, setOpenComments] = useState<string | null>(null);

  const creatorMap = useMemo(() => {
    return creators.reduce<Record<string, CreatorProfile>>((acc, creator) => {
      acc[creator.id] = creator;
      return acc;
    }, {});
  }, [creators]);

  const visibleClips = useMemo(() => {
    const normalized = searchQuery.toLowerCase();
    return clips.filter((clip) => {
      const creatorName = creatorMap[clip.creatorId]?.name?.toLowerCase() ?? '';
      const matchesCategory =
        !categoryFilter || categoryFilter === 'all' || clip.tags.includes(categoryFilter);
      const matchesSearch =
        !normalized ||
        clip.title.toLowerCase().includes(normalized) ||
        creatorName.includes(normalized);
      return matchesCategory && matchesSearch;
    });
  }, [clips, categoryFilter, searchQuery, creatorMap]);

  const clipComments = useMemo(() => {
    return comments.filter((comment) => comment.clipId === openComments);
  }, [comments, openComments]);

  return (
    <section style={{ padding: '32px 16px 80px', maxWidth: 720, margin: '0 auto', display: 'grid', gap: 24 }}>
      {visibleClips.map((clip) => {
        const creator = creatorMap[clip.creatorId];
        const session = sessions.find((sess) => sess.id === clip.ctaSessionId);
        return (
          <article
            key={clip.id}
            style={{
              borderRadius: 24,
              overflow: 'hidden',
              border: '1px solid #e2e8f0',
              background: '#fff',
              boxShadow: '0 12px 40px rgba(15, 23, 42, 0.08)',
            }}
          >
            <div
              style={{
                minHeight: 320,
                backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0) 40%, rgba(15,23,42,0.7)), url(${clip.previewUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: 24,
                color: '#fff',
              }}
            >
              <p style={{ margin: '0 0 4px', fontSize: 13, letterSpacing: 1 }}>Skill clip · {clip.duration}s</p>
              <h3 style={{ margin: 0 }}>{clip.title}</h3>
            </div>
            <div style={{ padding: 20, display: 'grid', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img
                  src={creator.avatar}
                  alt={creator.name}
                  width={48}
                  height={48}
                  style={{ borderRadius: '50%' }}
                />
                <div>
                  <strong>{creator.name}</strong>
                  <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>
                    {creator.bio}
                  </p>
                </div>
                <span style={{ marginLeft: 'auto', color: '#475569', fontSize: 13 }}>
                  {creator.followers.toLocaleString()} followers
                </span>
              </div>

              <EngagementBar
                clipId={clip.id}
                initialLikes={clip.likes}
                initialSaves={clip.saves}
                initialComments={clip.comments}
                onComment={() => setOpenComments(clip.id)}
              />

              {session && (
                <div
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: 16,
                    padding: 16,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <p style={{ margin: '0 0 4px', color: '#94a3b8', fontSize: 13 }}>Book the live walkthrough</p>
                    <strong>{session.title}</strong>
                    <p style={{ margin: 0, color: '#475569', fontSize: 14 }}>{session.startTime}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onJoinSession(session.id)}
                    style={{
                      border: 'none',
                      background: '#0f172a',
                      color: '#fff',
                      padding: '10px 20px',
                      borderRadius: 14,
                      cursor: 'pointer',
                    }}
                  >
                    Join
                  </button>
                </div>
              )}
            </div>
          </article>
        );
      })}

      <CommentsDrawer
        comments={clipComments}
        open={Boolean(openComments)}
        onClose={() => setOpenComments(null)}
      />
    </section>
  );
}
