import { useEffect, useMemo, useRef, useState, useCallback, type MouseEvent } from 'react';
import type { ClipComment, CreatorProfile, SessionCard, SkillClip, SkillTag } from '../types';
import { EngagementBar } from './EngagementBar';
import { CommentsDrawer } from './CommentsDrawer';
import { Skeleton } from './Skeleton';
import { CLIP_VIDEO_PLACEHOLDER } from '../lib/media';
import { formatSkillTag } from '../lib/tagLabels';
import { trackEvent } from '../services/analytics';

type TagAffinityMap = Partial<Record<SkillTag, number>>;

interface Props {
  clips: SkillClip[];
  creators: CreatorProfile[];
  comments: ClipComment[];
  onJoinSession: (sessionId: string) => Promise<void> | void;
  sessions: SessionCard[];
  searchQuery?: string;
  categoryFilter?: 'all' | SkillTag | null;
  isLoading?: boolean;
  affinity?: TagAffinityMap;
  highlightTag?: SkillTag | null;
  onTuneTag?: (tag: SkillTag, intent: 'more' | 'less') => void;
  onCreateClip?: (draft: {
    title: string;
    tag: SkillTag;
    previewUrl: string;
    duration: number;
    videoUrl?: string;
  }) => void;
  showComposer?: boolean;
  onToggleComposer?: () => void;
  availableTags?: SkillTag[];
  savedClipIds?: string[];
  savedOnly?: boolean;
  onToggleSave?: (clipId: string, next: boolean) => void;
  focusClipId?: string | null;
  onFocusClipClear?: () => void;
}

export function ClipFeed({
  clips,
  creators,
  comments,
  onJoinSession,
  sessions,
  searchQuery = '',
  categoryFilter = null,
  isLoading = false,
  affinity = {},
  highlightTag = null,
  onTuneTag,
  onCreateClip,
  showComposer = false,
  onToggleComposer,
  availableTags = [],
  savedClipIds = [],
  savedOnly = false,
  onToggleSave,
  focusClipId = null,
  onFocusClipClear,
}: Props) {
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [composerDraft, setComposerDraft] = useState({
    title: '',
    tag: availableTags[0] ?? 'languages',
    previewUrl: '',
    duration: 30,
    fileName: '',
    fileSizeLabel: '',
    previewName: '',
    previewSizeLabel: '',
    videoUrl: '',
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewInputRef = useRef<HTMLInputElement | null>(null);
  const uploadTimer = useRef<number | null>(null);
  const [composerStatus, setComposerStatus] = useState<'idle' | 'uploading' | 'success'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [playingClip, setPlayingClip] = useState<string | null>(null);
  const [muted, setMuted] = useState(true);
  const [loadingClip, setLoadingClip] = useState<string | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});
  const completedClipsRef = useRef(new Set<string>());
  const highlightLabel = highlightTag ? formatSkillTag(highlightTag) : null;

  const creatorMap = useMemo(() => {
    return creators.reduce<Record<string, CreatorProfile>>((acc, creator) => {
      acc[creator.id] = creator;
      return acc;
    }, {});
  }, [creators]);

  const visibleClips = useMemo(() => {
    const normalized = searchQuery.toLowerCase();
    let filtered = clips.filter((clip) => {
      const creatorName = creatorMap[clip.creatorId]?.name?.toLowerCase() ?? '';
      const matchesCategory =
        !categoryFilter ||
        categoryFilter === 'all' ||
        clip.tags.includes(categoryFilter as SkillTag);
      const matchesSearch =
        !normalized ||
        clip.title.toLowerCase().includes(normalized) ||
        creatorName.includes(normalized);
      return matchesCategory && matchesSearch;
    });

    if (savedOnly) {
      filtered = filtered.filter((clip) => savedClipIds.includes(clip.id));
    }

    return filtered.sort((a, b) => {
      const scoreA = getClipAffinity(a, affinity);
      const scoreB = getClipAffinity(b, affinity);
      return scoreB - scoreA;
    });
  }, [clips, categoryFilter, searchQuery, creatorMap, affinity, savedOnly, savedClipIds]);

  const clipComments = useMemo(() => {
    return comments.filter((comment) => comment.clipId === openComments);
  }, [comments, openComments]);

  useEffect(() => {
    Object.values(videoRefs.current).forEach((video) => {
      if (video) {
        video.muted = muted;
      }
    });
  }, [muted]);

  useEffect(() => {
    return () => {
      if (uploadTimer.current) {
        clearInterval(uploadTimer.current);
      }
      if (composerDraft.videoUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(composerDraft.videoUrl);
      }
    };
  }, [composerDraft.videoUrl]);

  const attachVideoRef = (clipId: string, node: HTMLVideoElement | null) => {
    videoRefs.current[clipId] = node;
    if (node) {
      node.muted = muted;
      node.onended = () => setPlayingClip((prev) => (prev === clipId ? null : prev));
    }
  };

  const handleTimeUpdate = useCallback((clipId: string) => {
    const video = videoRefs.current[clipId];
    if (!video || !video.duration) return;
    setProgressMap((prev) => ({
      ...prev,
      [clipId]: (video.currentTime / video.duration) * 100,
    }));
    if ((video.currentTime / video.duration) * 100 >= 95 && !completedClipsRef.current.has(clipId)) {
      completedClipsRef.current.add(clipId);
      trackEvent('clip.completed', { clipId });
    }
  }, []);

  const handleScrub = useCallback(
    (clipId: string, event: MouseEvent<HTMLDivElement>) => {
      event.stopPropagation();
      const bar = event.currentTarget;
      const video = videoRefs.current[clipId];
      if (!video || !video.duration) return;
      const rect = bar.getBoundingClientRect();
      const fraction = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
      video.currentTime = fraction * video.duration;
      setProgressMap((prev) => ({
        ...prev,
        [clipId]: fraction * 100,
      }));
      if (playingClip === clipId) {
        trackEvent('clip.scrub', { clipId, position: fraction });
      }
    },
    [playingClip],
  );

  const handleClipToggle = useCallback(
    (clipId: string) => {
      const currentVideo = videoRefs.current[clipId];
      if (!currentVideo) return;

    if (playingClip === clipId) {
      currentVideo.pause();
      setPlayingClip(null);
      setLoadingClip((prev) => (prev === clipId ? null : prev));
      trackEvent('clip.pause', { clipId });
      return;
    }

    if (playingClip && playingClip !== clipId) {
      videoRefs.current[playingClip]?.pause();
    }

    currentVideo.currentTime = 0;
    currentVideo.muted = muted;
    setLoadingClip(clipId);
    currentVideo
      .play()
      .then(() => setLoadingClip((prev) => (prev === clipId ? null : prev)))
      .catch(() => setLoadingClip((prev) => (prev === clipId ? null : prev)));
    setPlayingClip(clipId);
    trackEvent('clip.play', { clipId });
  },
    [muted, playingClip],
  );

  useEffect(() => {
    if (!playingClip) return;
    const stillVisible = visibleClips.some((clip) => clip.id === playingClip);
    if (!stillVisible) {
      const ref = videoRefs.current[playingClip];
      ref?.pause();
      setPlayingClip(null);
    }
  }, [visibleClips, playingClip]);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const clipId = entry.target.getAttribute('data-clip-id');
          if (!clipId) return;
          if (!entry.isIntersecting) {
            if (playingClip === clipId) {
              videoRefs.current[clipId]?.pause();
              setPlayingClip(null);
            }
          }
        });
      },
      { threshold: 0.35 },
    );
    Object.entries(cardRefs.current).forEach(([clipId, node]) => {
      if (node) {
        node.setAttribute('data-clip-id', clipId);
        observer.observe(node);
      }
    });
    return () => observer.disconnect();
  }, [visibleClips, playingClip]);

  useEffect(() => {
    if (!focusClipId) return;
    const card = cardRefs.current[focusClipId];
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        handleClipToggle(focusClipId);
        onFocusClipClear?.();
      }, 350);
    } else {
      onFocusClipClear?.();
    }
  }, [focusClipId, handleClipToggle, onFocusClipClear, visibleClips]);

  if (isLoading) {
    return (
      <section style={{ padding: '32px 16px 80px', maxWidth: 720, margin: '0 auto', display: 'grid', gap: 24 }}>
        {Array.from({ length: 3 }).map((_, index) => (
          <article
            key={`clip-skeleton-${index}`}
            style={{
              borderRadius: 24,
              overflow: 'hidden',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              display: 'grid',
              gap: 0,
            }}
          >
            <Skeleton height={260} borderRadius={0} />
            <div style={{ padding: 20, display: 'grid', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Skeleton width={48} height={48} borderRadius={24} />
                <div style={{ flex: 1 }}>
                  <Skeleton width="60%" height={16} />
                  <Skeleton width="80%" height={14} />
                </div>
              </div>
              <Skeleton width="50%" height={32} borderRadius={12} />
            </div>
          </article>
        ))}
      </section>
    );
  }

  return (
    <section style={{ padding: '32px 16px 80px', maxWidth: 720, margin: '0 auto', display: 'grid', gap: 24 }}>
      {onCreateClip && (
        <div style={{ border: '1px solid var(--color-border)', borderRadius: 16, padding: 16, background: 'var(--color-surface)', display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>Share a new clip</strong>
            <button
              type="button"
              onClick={onToggleComposer}
              style={{
                borderRadius: 999,
                border: '1px solid var(--color-border-strong)',
                padding: '6px 12px',
                background: 'var(--color-surface)',
                cursor: 'pointer',
              }}
            >
              {showComposer ? 'Hide form' : 'Upload a clip'}
            </button>
          </div>
          {showComposer && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (composerStatus === 'uploading') return;
                setComposerStatus('uploading');
                setUploadProgress(12);
                uploadTimer.current = window.setInterval(() => {
                  setUploadProgress((prev) => {
                    const next = Math.min(prev + 18 + Math.random() * 22, 100);
                    if (next >= 100) {
                      if (uploadTimer.current) {
                        clearInterval(uploadTimer.current);
                        uploadTimer.current = null;
                      }
                      Promise.resolve(
                        onCreateClip?.({
                          title: composerDraft.title,
                          tag: composerDraft.tag,
                          previewUrl: composerDraft.previewUrl,
                          duration: composerDraft.duration,
                          videoUrl: composerDraft.videoUrl,
                        }),
                      ).finally(() => {
                        if (composerDraft.videoUrl?.startsWith('blob:')) {
                          URL.revokeObjectURL(composerDraft.videoUrl);
                        }
                        setComposerDraft({
                          title: '',
                          tag: availableTags[0] ?? composerDraft.tag,
                          previewUrl: '',
                          duration: 30,
                          fileName: '',
                          fileSizeLabel: '',
                          previewName: '',
                          previewSizeLabel: '',
                          videoUrl: '',
                        });
                        fileInputRef.current && (fileInputRef.current.value = '');
                        previewInputRef.current && (previewInputRef.current.value = '');
                        setComposerStatus('success');
                        setTimeout(() => {
                          setComposerStatus('idle');
                          setUploadProgress(0);
                        }, 1500);
                      });
                    }
                    return next;
                  });
                }, 220);
              }}
              style={{ display: 'grid', gap: 12 }}
            >
              <input
                required
                placeholder="Clip title"
                value={composerDraft.title}
                onChange={(event) => setComposerDraft((prev) => ({ ...prev, title: event.target.value }))}
                aria-label="Clip title"
                style={{
                  borderRadius: 12,
                  border: '1px solid var(--color-border-strong)',
                  padding: 10,
                  background: 'var(--color-surface)',
                }}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <select
                  value={composerDraft.tag}
                  onChange={(event) => setComposerDraft((prev) => ({ ...prev, tag: event.target.value as SkillTag }))}
                  aria-label="Choose clip topic"
                  style={{ borderRadius: 12, border: '1px solid var(--color-border-strong)', padding: '8px 12px', minWidth: 140 }}
                >
                  {availableTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {formatSkillTag(tag)}
                    </option>
                  ))}
                </select>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 200px', fontSize: 12, color: 'var(--color-text-subtle)' }}>
                  Length (seconds)
                  <input
                    type="number"
                    min={10}
                    max={180}
                    value={composerDraft.duration}
                    onChange={(event) => setComposerDraft((prev) => ({ ...prev, duration: Number(event.target.value) }))}
                    style={{ borderRadius: 12, border: '1px solid var(--color-border-strong)', padding: 10, width: '100%' }}
                  />
                </label>
              </div>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--color-text-subtle)' }}>
                Video file (MP4/WEBM, &lt; 25MB)
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) {
                      setComposerDraft((prev) => {
                        if (prev.videoUrl?.startsWith('blob:')) {
                          URL.revokeObjectURL(prev.videoUrl);
                        }
                        return { ...prev, fileName: '', fileSizeLabel: '', videoUrl: '' };
                      });
                      return;
                    }
                    const sizeMb = file.size / (1024 * 1024);
                    if (sizeMb > 25) {
                      alert('Please pick a video smaller than 25MB.');
                      event.target.value = '';
                      return;
                    }
                    const objectUrl = URL.createObjectURL(file);
                    setComposerDraft((prev) => {
                      if (prev.videoUrl && prev.videoUrl.startsWith('blob:')) {
                        URL.revokeObjectURL(prev.videoUrl);
                      }
                      return {
                        ...prev,
                        fileName: file.name,
                        fileSizeLabel: `${sizeMb.toFixed(1)} MB`,
                        videoUrl: objectUrl,
                      };
                    });
                  }}
                  style={{
                    borderRadius: 12,
                    border: '1px dashed var(--color-border-strong)',
                    padding: 10,
                    background: 'var(--color-surface)',
                  }}
                />
                {composerDraft.fileName && (
                  <span style={{ color: 'var(--color-text-meta)' }}>
                    {composerDraft.fileName} · {composerDraft.fileSizeLabel}
                  </span>
                )}
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--color-text-subtle)' }}>
                Preview image (PNG/JPG, &lt; 5MB)
                <input
                  ref={previewInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) {
                      setComposerDraft((prev) => ({ ...prev, previewName: '', previewSizeLabel: '', previewUrl: '' }));
                      return;
                    }
                    const sizeMb = file.size / (1024 * 1024);
                    if (sizeMb > 5) {
                      alert('Pick an image smaller than 5MB.');
                      event.target.value = '';
                      return;
                    }
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setComposerDraft((prev) => ({
                        ...prev,
                        previewUrl: reader.result as string,
                        previewName: file.name,
                        previewSizeLabel: `${sizeMb.toFixed(1)} MB`,
                      }));
                    };
                    reader.readAsDataURL(file);
                  }}
                  style={{
                    borderRadius: 12,
                    border: '1px dashed var(--color-border-strong)',
                    padding: 10,
                    background: 'var(--color-surface)',
                  }}
                />
                {composerDraft.previewName && (
                  <span style={{ color: 'var(--color-text-meta)' }}>
                    {composerDraft.previewName} · {composerDraft.previewSizeLabel}
                  </span>
                )}
              </label>
              <input
                placeholder="Preview image URL (optional)"
                value={composerDraft.previewUrl}
                onChange={(event) => setComposerDraft((prev) => ({ ...prev, previewUrl: event.target.value }))}
                style={{
                  borderRadius: 12,
                  border: '1px solid var(--color-border-strong)',
                  padding: 10,
                  background: 'var(--color-surface)',
                }}
              />
              {composerStatus !== 'idle' && (
                <div className="upload-progress" aria-live="polite">
                  <div className="upload-progress__bar" style={{ width: `${uploadProgress}%` }} />
                </div>
              )}
              {composerStatus === 'success' && (
                <span style={{ color: 'var(--color-success)', fontSize: 13 }}>Clip uploaded!</span>
              )}
              <button
                type="submit"
                disabled={!composerDraft.title || composerStatus === 'uploading'}
                style={{
                  border: 'none',
                  borderRadius: 12,
                  padding: '10px 16px',
                  background: 'var(--color-text-primary)',
                  color: 'var(--color-contrast-on-accent)',
                  cursor: composerStatus === 'uploading' ? 'not-allowed' : 'pointer',
                  justifySelf: 'flex-start',
                }}
              >
                {composerStatus === 'uploading' ? 'Uploading…' : 'Publish clip'}
              </button>
            </form>
          )}
        </div>
      )}
      {highlightLabel && (
        <p className="recommendation-pill" style={{ justifySelf: 'flex-start' }}>
          ⭐ More {highlightLabel} clips for you
        </p>
      )}
      {savedOnly && visibleClips.length > 0 && (
        <span
          style={{
            padding: '6px 12px',
            borderRadius: 999,
            background: 'var(--color-pill-bg)',
            color: 'var(--color-brand)',
            fontWeight: 600,
            justifySelf: 'flex-start',
          }}
        >
          📌 Showing saved clips
        </span>
      )}
      {savedOnly && visibleClips.length === 0 && (
        <div
          style={{
            border: '1px solid var(--color-border)',
            borderRadius: 20,
            padding: 32,
            textAlign: 'center',
            color: 'var(--color-text-muted)',
          }}
        >
          You haven’t saved any clips yet. Tap the 📌 icon on a clip you love and it will show up here.
        </div>
      )}
      {visibleClips.map((clip) => {
        const creator = creatorMap[clip.creatorId];
        const creatorName = creator?.name ?? 'Community creator';
        const creatorAvatar =
          creator?.avatar ??
          'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=200&q=80';
        const primaryTag = clip.tags[0];
        const primaryTagLabel = primaryTag ? formatSkillTag(primaryTag) : null;
        const recommended = highlightTag ? clip.tags.includes(highlightTag) : false;
        const isSaved = savedClipIds.includes(clip.id);
        const isPlaying = playingClip === clip.id;
        const videoSrc = clip.videoUrl ?? CLIP_VIDEO_PLACEHOLDER;
        return (
          <article
            key={clip.id}
            className="clip-card card-stagger"
            data-playing={isPlaying}
            ref={(node) => {
              cardRefs.current[clip.id] = node;
            }}
          >
            <div
              className="clip-card__media"
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0) 40%, rgba(15,23,42,0.7)), url(${clip.previewUrl})`,
              }}
              role="button"
              tabIndex={0}
              onClick={() => handleClipToggle(clip.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleClipToggle(clip.id);
                }
              }}
              data-testid={`clip-media-${clip.id}`}
            >
              <video
                className="clip-card__video"
                ref={(node) => attachVideoRef(clip.id, node)}
                src={videoSrc}
                muted
                loop
                playsInline
                poster={clip.previewUrl}
                onWaiting={() => setLoadingClip(clip.id)}
                onPlaying={() => setLoadingClip((prev) => (prev === clip.id ? null : prev))}
                onTimeUpdate={() => handleTimeUpdate(clip.id)}
              />
              <div
                className="clip-card__progress"
                aria-hidden="true"
                onClick={(event) => handleScrub(clip.id, event)}
              >
                <span style={{ width: `${progressMap[clip.id] ?? 0}%` }} />
              </div>
              {loadingClip === clip.id && (
                <div className="clip-card__loading" aria-live="polite">
                  <span className="clip-card__spinner" />
                </div>
              )}
              {!isPlaying && (
                <button
                  type="button"
                  className="clip-card__play"
                  aria-label={`Play ${clip.title}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleClipToggle(clip.id);
                  }}
                >
                  ▶
                </button>
              )}
              <button
                type="button"
                className="clip-card__mute"
                aria-label={muted ? 'Unmute clips' : 'Mute clips'}
                onClick={(event) => {
                  event.stopPropagation();
                  setMuted((prev) => !prev);
                }}
              >
                {muted ? '🔈' : '🔊'}
              </button>
              <div className="clip-card__media-meta">
                <span>{clip.duration}s</span>
                {primaryTagLabel && <span>{primaryTagLabel}</span>}
              </div>
              {recommended && (
                <div className="clip-card__badge-row">
                  <span className="recommendation-pill">Recommended</span>
                  {onTuneTag && primaryTag && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onTuneTag(primaryTag, 'less');
                      }}
                      className="clip-card__dismiss"
                    >
                      See less like this
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="clip-card__body">
              <div className="clip-card__creator">
                <img
                  src={creatorAvatar}
                  alt={creatorName}
                  width={48}
                  height={48}
                  style={{ borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <strong>{creatorName}</strong>
                  <p style={{ margin: 0, color: 'var(--color-text-subtle)', fontSize: 14 }}>
                    {clip.title}
                  </p>
                </div>
                <span style={{ marginLeft: 'auto', color: 'var(--color-text-muted)', fontSize: 13 }}>
                  👁 {clip.views?.toLocaleString() ?? '—'}
                </span>
              </div>

              <EngagementBar
                clipId={clip.id}
                initialLikes={clip.likes}
                initialSaves={clip.saves}
                initialComments={clip.comments}
                onComment={() => setOpenComments(clip.id)}
                isSaved={isSaved}
                onToggleSave={(next) => onToggleSave?.(clip.id, next)}
              />
              {onTuneTag && primaryTag && (
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => onTuneTag(primaryTag, 'more')}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--color-brand)',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    More like this
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

function getClipAffinity(clip: SkillClip, affinity: TagAffinityMap): number {
  return clip.tags.reduce((score, tag) => Math.max(score, affinity[tag] ?? 0), 0);
}
