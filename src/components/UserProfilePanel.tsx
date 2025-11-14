import { useEffect, useMemo, useState, useRef } from 'react';
import type { CSSProperties } from 'react';
import type { SessionCard, SkillClip, SkillTag, UserProfile } from '../types';
import { formatSkillTag } from '../lib/tagLabels';
import { formatRelativeOrTime } from '../lib/formatters';

type ActivityEntry = {
  id: string;
  label: string;
  detail?: string;
  tag?: SkillTag;
  icon?: string;
  timestamp: string;
};

interface Props {
  profile: UserProfile;
  sessions: SessionCard[];
  clips: SkillClip[];
  savedClips: SkillClip[];
  savedClipIds: string[];
  availableTags: SkillTag[];
  onProfileUpdate: (updates: Partial<UserProfile>) => void;
  onCreateSession: (draft: SessionDraftLocal) => void;
  onCreateClip: (draft: ClipDraftLocal) => void;
  activityLog?: ActivityEntry[];
}

type SessionDraftLocal = {
  title: string;
  tag: SkillTag;
  startTime: string;
  duration: number;
  level: SessionCard['level'];
  status: SessionCard['status'];
  blurb: string;
};

type ClipDraftLocal = {
  title: string;
  tag: SkillTag;
  previewUrl: string;
  duration: number;
  videoFileName?: string;
  videoFileSizeLabel?: string;
  previewName?: string;
  previewSizeLabel?: string;
  videoUrl?: string;
};

export function UserProfilePanel({
  profile,
  sessions,
  clips,
  savedClips,
  savedClipIds,
  availableTags,
  onProfileUpdate,
  onCreateSession,
  onCreateClip,
  activityLog = [],
}: Props) {
  const [bio, setBio] = useState(profile.bio ?? '');
  const [teachTags, setTeachTags] = useState<SkillTag[]>(profile.teachTags);
  const [sessionForm, setSessionForm] = useState<SessionDraftLocal>({
    title: '',
    tag: availableTags[0],
    startTime: '',
    duration: 15,
    level: 'Beginner',
    status: 'later',
    blurb: '',
  });
  const [clipForm, setClipForm] = useState<ClipDraftLocal>({
    title: '',
    tag: availableTags[0],
    previewUrl: '',
    duration: 30,
    videoFileName: '',
    videoFileSizeLabel: '',
    previewName: '',
    previewSizeLabel: '',
    videoUrl: '',
  });
  const [profileSaved, setProfileSaved] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null);
  const totalMinutes = useMemo(() => sessions.reduce((sum, session) => sum + session.duration, 0), [sessions]);
  const avgLikes = useMemo(
    () => Math.round(clips.reduce((sum, clip) => sum + clip.likes, 0) / (clips.length || 1)),
    [clips],
  );
  const avgUserClipSaves = useMemo(
    () => Math.round(clips.reduce((sum, clip) => sum + clip.saves, 0) / (clips.length || 1)),
    [clips],
  );
  const topSavedClip = useMemo(() => {
    return [...savedClips].sort((a, b) => b.saves - a.saves)[0];
  }, [savedClips]);
  const [selectedActivityDay, setSelectedActivityDay] = useState<string | null>(null);

  useEffect(() => {
    setBio(profile.bio ?? '');
    setTeachTags(profile.teachTags);
  }, [profile.bio, profile.teachTags]);

  const toggleTeachTag = (tag: SkillTag) => {
    setTeachTags((prev) => (prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]));
  };

  const handleProfileSave = () => {
    onProfileUpdate({ bio, teachTags });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const handleAvatarUpload = (file: File | null) => {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setAvatarMessage('Please use an image under 4MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      onProfileUpdate({ avatarUrl: reader.result as string });
      setAvatarMessage('Photo updated!');
      setTimeout(() => setAvatarMessage(null), 2500);
    };
    reader.readAsDataURL(file);
  };

  const avatarSrc =
    profile.avatarUrl ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.name)}`;

  const resetSessionForm = () =>
    setSessionForm({
      title: '',
      tag: availableTags[0],
      startTime: '',
      duration: 15,
      level: 'Beginner',
      status: 'later',
      blurb: '',
    });

  const resetClipForm = () => {
    if (clipForm.videoUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(clipForm.videoUrl);
    }
    setClipForm({
      title: '',
      tag: availableTags[0],
      previewUrl: '',
      duration: 30,
      videoFileName: '',
      videoFileSizeLabel: '',
      previewName: '',
      previewSizeLabel: '',
      videoUrl: '',
    });
  };

  return (
    <section style={{ padding: '32px 24px 80px', maxWidth: 1100, margin: '0 auto', display: 'grid', gap: 32 }}>
      <header style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center' }}>
        <div style={{ display: 'grid', gap: 8, justifyItems: 'center' }}>
          <img
            src={avatarSrc}
            alt={profile.name}
            width={96}
            height={96}
            style={{ borderRadius: '50%', border: '4px solid var(--color-pill-bg)', objectFit: 'cover' }}
          />
          <label
            htmlFor="avatar-upload"
            style={{
              borderRadius: 999,
              border: '1px solid var(--color-border-strong)',
              padding: '6px 12px',
              fontSize: 14,
              cursor: 'pointer',
              background: 'var(--color-surface)',
            }}
          >
            Update photo
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(event) => handleAvatarUpload(event.target.files?.[0] ?? null)}
            />
          </label>
          {avatarMessage && (
            <span style={{ color: 'var(--color-text-meta)', fontSize: 12 }}>{avatarMessage}</span>
          )}
        </div>
        <div>
          <p style={{ textTransform: 'uppercase', letterSpacing: 2, color: 'var(--color-text-meta)', margin: 0 }}>
            Your creator profile
          </p>
          <h1 style={{ margin: '8px 0 4px' }}>{profile.name}</h1>
          <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>Timezone · {profile.timezone}</p>
          <p style={{ margin: '4px 0 0', color: 'var(--color-text-muted)' }}>
            Teaching: {teachTags.length ? teachTags.join(', ') : 'Add topics to start sharing'}
          </p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <StatCard label="Live minutes scheduled" value={`${totalMinutes} min`} />
        <StatCard label="Clips published" value={clips.length} />
        <StatCard label="Avg likes per clip" value={clips.length ? avgLikes : 0} />
        <StatCard label="Upcoming sessions" value={sessions.filter((s) => s.status !== 'live').length} />
      </div>

      <section>
        <SectionHeading title="Clip insights" subtitle="See what learners pin for later." />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
          }}
        >
          <InsightCard label="Saved clips" value={savedClipIds.length} helper="Pinned from discovery" />
          <InsightCard
            label="Avg saves on your clips"
            value={`${avgUserClipSaves} saves`}
            helper="Signals future demand"
          />
          <InsightCard
            label="Most saved clip"
            value={topSavedClip ? topSavedClip.title : 'No clips yet'}
            helper={topSavedClip ? `${topSavedClip.saves} saves` : 'Share clips to unlock stats'}
          />
        </div>
        {savedClips.length > 0 && (
          <div
            style={{
              marginTop: 16,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 12,
            }}
          >
            {savedClips.slice(0, 3).map((clip) => (
              <SavedClipCard key={clip.id} clip={clip} />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeading title="Profile settings" subtitle="Describe what you teach and tune your tags." />
        <div style={{ borderRadius: 20, border: '1px solid var(--color-border)', padding: 24, background: 'var(--color-surface)', display: 'grid', gap: 16 }}>
          <label style={{ display: 'grid', gap: 8 }}>
            <span style={{ fontWeight: 600 }}>Bio</span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Share your teaching style, credentials, or vibe."
              style={{
                minHeight: 120,
                borderRadius: 12,
                border: '1px solid var(--color-border-strong)',
                padding: 12,
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
              }}
            />
          </label>
          <div>
            <p style={{ fontWeight: 600 }}>Teaching tags</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTeachTag(tag)}
              style={{
                borderRadius: 999,
                border: '1px solid var(--color-border-strong)',
                padding: '6px 12px',
                background: teachTags.includes(tag) ? 'var(--color-text-primary)' : 'var(--color-surface)',
                color: teachTags.includes(tag) ? 'var(--color-contrast-on-accent)' : 'var(--color-text-primary)',
                cursor: 'pointer',
              }}
              >
                {formatSkillTag(tag)}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={handleProfileSave}
          style={{
            justifySelf: 'flex-start',
            border: 'none',
            borderRadius: 16,
            padding: '12px 24px',
            background: 'var(--color-text-primary)',
            color: 'var(--color-contrast-on-accent)',
            cursor: 'pointer',
          }}
        >
          Save profile
          </button>
          {profileSaved && <span style={{ color: 'var(--color-success)' }}>Profile updated ✔️</span>}
        </div>
      </section>

      <ActivityHeatmap
        entries={activityLog}
        selectedDay={selectedActivityDay}
        onSelectDay={setSelectedActivityDay}
      />

      <section>
        <SectionHeading title="My live sessions" subtitle="Add a new room in seconds." />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onCreateSession(sessionForm);
            resetSessionForm();
          }}
          style={{ borderRadius: 20, border: '1px solid var(--color-border)', padding: 20, background: 'var(--color-surface)', display: 'grid', gap: 12 }}
        >
          <input
            required
            value={sessionForm.title}
            onChange={(e) => setSessionForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Session title"
            style={{
              borderRadius: 12,
              border: '1px solid var(--color-border-strong)',
              padding: 12,
              background: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
            }}
          />
          <textarea
            value={sessionForm.blurb}
            onChange={(e) => setSessionForm((prev) => ({ ...prev, blurb: e.target.value }))}
            placeholder="What will people learn?"
            style={{
              borderRadius: 12,
              border: '1px solid var(--color-border-strong)',
              padding: 12,
              minHeight: 80,
              background: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
            }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <select
              value={sessionForm.tag}
              onChange={(e) => setSessionForm((prev) => ({ ...prev, tag: e.target.value as SkillTag }))}
              style={selectStyle}
            >
              {availableTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Start time (e.g., Friday 18:00)"
              value={sessionForm.startTime}
              onChange={(e) => setSessionForm((prev) => ({ ...prev, startTime: e.target.value }))}
              style={selectStyle}
            />
            <input
              type="number"
              min={5}
              max={60}
              value={sessionForm.duration}
              onChange={(e) => setSessionForm((prev) => ({ ...prev, duration: Number(e.target.value) }))}
              style={selectStyle}
            />
            <select
              value={sessionForm.level}
              onChange={(e) => setSessionForm((prev) => ({ ...prev, level: e.target.value as SessionCard['level'] }))}
              style={selectStyle}
            >
              {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
            <select
              value={sessionForm.status}
              onChange={(e) => setSessionForm((prev) => ({ ...prev, status: e.target.value as SessionCard['status'] }))}
              style={selectStyle}
            >
              {['live', 'soon', 'later'].map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" style={primaryButton}>
            Publish session
          </button>
        </form>

        {sessions.length === 0 ? (
          <EmptyState message="No sessions yet—use the form above to publish your first one." />
        ) : (
          <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
            {sessions.map((session) => (
              <article
                key={session.id}
                style={{
                  borderRadius: 20,
                  border: '1px solid var(--color-border)',
                  padding: 20,
                  background: 'var(--color-surface)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <strong>{session.title}</strong>
                    <p style={{ margin: '4px 0 0', color: 'var(--color-text-muted)' }}>{session.blurb}</p>
                  </div>
                  <span style={{ color: 'var(--color-text-meta)' }}>{session.startTime}</span>
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 12, color: 'var(--color-text-muted)', fontSize: 14 }}>
                  <span>{session.duration} min</span>
                  <span>{session.language}</span>
                  <span>{session.level}</span>
                  <span>Status: {session.status}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeading title="My skill clips" subtitle="Upload + manage your teaser library." />
        <ClipComposer
          draft={clipForm}
          availableTags={availableTags}
          onChange={setClipForm}
          onSubmit={() => {
            onCreateClip(clipForm);
            resetClipForm();
          }}
        />

        {clips.length === 0 ? (
          <EmptyState message="Record a 30-second tip to unlock profile clips." />
        ) : (
          <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
            {clips.map((clip, index) => (
              <article
                key={clip.id}
                className="card-stagger"
                style={{
                  borderRadius: 20,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  overflow: 'hidden',
                  display: 'grid',
                  gridTemplateColumns: '220px 1fr',
                  animationDelay: `${index * 60}ms`,
                }}
              >
                <div style={{ position: 'relative', minHeight: 180 }}>
                  <video
                    controls
                    preload="metadata"
                    poster={clip.previewUrl}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  >
                    <source src={clip.videoUrl ?? clip.previewUrl} type="video/mp4" />
                  </video>
                </div>
                <div style={{ padding: 16, display: 'grid', gap: 8 }}>
                  <strong>{clip.title}</strong>
                  <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 14 }}>
                    Duration {clip.duration}s · Tags {clip.tags.map((tag) => formatSkillTag(tag)).join(', ')}
                  </p>
                  <div style={{ display: 'flex', gap: 16, fontSize: 14, color: 'var(--color-text-muted)' }}>
                    <span>❤️ {clip.likes.toLocaleString()}</span>
                    <span>💬 {clip.comments}</span>
                    <span>📌 {clip.saves}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <article
      style={{
        borderRadius: 18,
        border: '1px solid var(--color-border)',
        padding: 20,
        background: 'var(--color-surface)',
      }}
    >
      <p style={{ margin: 0, color: 'var(--color-text-meta)', fontSize: 13 }}>{label}</p>
      <strong style={{ fontSize: 24 }}>{value}</strong>
    </article>
  );
}

function InsightCard({ label, value, helper }: { label: string; value: string | number; helper: string }) {
  return (
    <div
      style={{
        borderRadius: 16,
        border: '1px solid var(--color-border)',
        padding: 16,
        background: 'var(--color-surface)',
        display: 'grid',
        gap: 4,
      }}
    >
      <span style={{ fontSize: 13, color: 'var(--color-text-subtle)' }}>{label}</span>
      <strong style={{ fontSize: '1.5rem' }}>{value}</strong>
      <span style={{ fontSize: 13, color: 'var(--color-text-meta)' }}>{helper}</span>
    </div>
  );
}

function SavedClipCard({ clip }: { clip: SkillClip }) {
  return (
    <article
      style={{
        borderRadius: 16,
        border: '1px solid var(--color-border)',
        padding: 12,
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        background: 'var(--color-surface)',
      }}
    >
      <img
        src={clip.previewUrl}
        alt={clip.title}
        width={64}
        height={64}
        style={{ borderRadius: 12, objectFit: 'cover' }}
      />
      <div style={{ flex: 1 }}>
        <strong>{clip.title}</strong>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-subtle)' }}>{clip.saves} saves</p>
      </div>
    </article>
  );
}

function ClipComposer({
  draft,
  availableTags,
  onChange,
  onSubmit,
}: {
  draft: ClipDraftLocal;
  availableTags: SkillTag[];
  onChange: (value: ClipDraftLocal) => void;
  onSubmit: () => Promise<void> | void;
}) {
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const previewInputRef = useRef<HTMLInputElement | null>(null);
  const uploadTimer = useRef<number | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success'>('idle');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    return () => {
      if (uploadTimer.current) {
        clearInterval(uploadTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (draft.videoUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(draft.videoUrl);
      }
    };
  }, [draft.videoUrl]);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (status === 'uploading') return;
        setStatus('uploading');
        setProgress(20);
        uploadTimer.current = window.setInterval(() => {
          setProgress((prev) => {
            const next = Math.min(prev + 15 + Math.random() * 20, 100);
            if (next >= 100) {
              if (uploadTimer.current) {
                clearInterval(uploadTimer.current);
                uploadTimer.current = null;
              }
              Promise.resolve(onSubmit()).finally(() => {
                videoInputRef.current && (videoInputRef.current.value = '');
                previewInputRef.current && (previewInputRef.current.value = '');
                setStatus('success');
                setTimeout(() => {
                  setStatus('idle');
                  setProgress(0);
                }, 1500);
              });
            }
            return next;
          });
        }, 220);
      }}
      style={{ borderRadius: 20, border: '1px solid var(--color-border)', padding: 20, background: 'var(--color-surface)', display: 'grid', gap: 12 }}
    >
      <input
        required
        value={draft.title}
        onChange={(event) => onChange({ ...draft, title: event.target.value })}
        placeholder="Clip title"
        style={{ borderRadius: 12, border: '1px solid var(--color-border-strong)', padding: 12, background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <select
          value={draft.tag}
          onChange={(event) => onChange({ ...draft, tag: event.target.value as SkillTag })}
          style={selectStyle}
        >
          {availableTags.map((tag) => (
            <option key={tag} value={tag}>
              {formatSkillTag(tag)}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={10}
          max={120}
          value={draft.duration}
          onChange={(event) => onChange({ ...draft, duration: Number(event.target.value) })}
          style={selectStyle}
        />
        <input
          type="url"
          value={draft.previewUrl}
          onChange={(event) => onChange({ ...draft, previewUrl: event.target.value })}
          placeholder="Cover image URL (optional)"
          style={selectStyle}
        />
      </div>
      <label style={{ display: 'grid', gap: 6, fontSize: 13, color: 'var(--color-text-subtle)' }}>
        Video file (MP4/WEBM, &lt; 25MB)
        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4,video/webm"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) {
              if (draft.videoUrl?.startsWith('blob:')) {
                URL.revokeObjectURL(draft.videoUrl);
              }
              onChange({ ...draft, videoFileName: '', videoFileSizeLabel: '', videoUrl: '' });
              return;
            }
            const sizeMb = file.size / (1024 * 1024);
            if (sizeMb > 25) {
              alert('Please pick a video smaller than 25MB.');
              event.target.value = '';
              return;
            }
            if (draft.videoUrl?.startsWith('blob:')) {
              URL.revokeObjectURL(draft.videoUrl);
            }
            const objectUrl = URL.createObjectURL(file);
            onChange({
              ...draft,
              videoFileName: file.name,
              videoFileSizeLabel: `${sizeMb.toFixed(1)} MB`,
              videoUrl: objectUrl,
            });
          }}
          style={{ borderRadius: 12, border: '1px dashed var(--color-border-strong)', padding: 10, background: 'var(--color-surface)' }}
        />
        {draft.videoFileName && (
          <span style={{ color: 'var(--color-text-meta)' }}>
            {draft.videoFileName} · {draft.videoFileSizeLabel}
          </span>
        )}
      </label>
      <label style={{ display: 'grid', gap: 6, fontSize: 13, color: 'var(--color-text-subtle)' }}>
        Preview image (PNG/JPG, &lt; 5MB)
        <input
          ref={previewInputRef}
          type="file"
          accept="image/png,image/jpeg"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) {
              onChange({ ...draft, previewName: '', previewSizeLabel: '', previewUrl: '' });
              return;
            }
            const sizeMb = file.size / (1024 * 1024);
            if (sizeMb > 5) {
              alert('Please pick an image smaller than 5MB.');
              event.target.value = '';
              return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
              onChange({
                ...draft,
                previewUrl: reader.result as string,
                previewName: file.name,
                previewSizeLabel: `${sizeMb.toFixed(1)} MB`,
              });
            };
            reader.readAsDataURL(file);
          }}
          style={{ borderRadius: 12, border: '1px dashed var(--color-border-strong)', padding: 10, background: 'var(--color-surface)' }}
        />
        {draft.previewName && (
          <span style={{ color: 'var(--color-text-meta)' }}>
            {draft.previewName} · {draft.previewSizeLabel}
          </span>
        )}
      </label>
      {status !== 'idle' && (
        <div className="upload-progress" aria-live="polite">
          <div className="upload-progress__bar" style={{ width: `${progress}%` }} />
        </div>
      )}
      {status === 'success' && (
        <span style={{ color: 'var(--color-success)', fontSize: 13 }}>Clip uploaded!</span>
      )}
      <button type="submit" style={primaryButton}>
        {status === 'uploading' ? 'Uploading…' : 'Publish clip'}
      </button>
    </form>
  );
}

function ActivityHeatmap({
  entries,
  selectedDay,
  onSelectDay,
}: {
  entries: ActivityEntry[];
  selectedDay: string | null;
  onSelectDay: (day: string | null) => void;
}) {
  if (entries.length === 0) {
    return (
      <section>
        <SectionHeading title="Recent activity" subtitle="What you’ve been up to." />
        <EmptyState message="Actions like joining sessions or creating clips will appear here." />
      </section>
    );
  }

  const today = new Date();
  const days = Array.from({ length: 28 }).map((_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    return date.toISOString().slice(0, 10);
  }).reverse();

  const grouped = entries.reduce<Record<string, ActivityEntry[]>>((acc, entry) => {
    const day = entry.timestamp.slice(0, 10);
    if (!acc[day]) acc[day] = [];
    acc[day].push(entry);
    return acc;
  }, {});

  const intensities = days.map((day) => grouped[day]?.length ?? 0);
  const max = Math.max(...intensities, 1);

  return (
    <section>
      <SectionHeading title="Recent activity" subtitle="Tap a day to review actions." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {days.map((day) => {
          const count = grouped[day]?.length ?? 0;
          const ratio = count / max;
          const color = count
            ? `rgba(49,46,129,${0.2 + ratio * 0.6})`
            : 'var(--color-border)';
          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelectDay(selectedDay === day ? null : day)}
              style={{
                border: 'none',
                borderRadius: 6,
                aspectRatio: '1 / 1',
                background: selectedDay === day ? 'var(--color-brand)' : color,
                color:
                  selectedDay === day || count
                    ? 'var(--color-contrast-on-accent)'
                    : 'var(--color-text-muted)',
                fontSize: 12,
                cursor: 'pointer',
              }}
              title={`${day} · ${count} actions`}
            >
              {count || ''}
            </button>
          );
        })}
      </div>
      {selectedDay && grouped[selectedDay] && (
        <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
          {grouped[selectedDay].map((entry) => (
            <article
              key={entry.id}
              style={{
                borderRadius: 16,
                border: '1px solid var(--color-border)',
                padding: 16,
                background: 'var(--color-surface)',
                display: 'flex',
                gap: 12,
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>{entry.icon ?? '•'}</span>
              <div style={{ flex: 1 }}>
                <strong>{entry.label}</strong>
                {entry.detail && (
                  <p style={{ margin: '4px 0 0', color: 'var(--color-text-muted)' }}>{entry.detail}</p>
                )}
              </div>
              <span style={{ color: 'var(--color-text-meta)', fontSize: 12 }}>
                {formatRelativeOrTime(new Date(entry.timestamp))}
              </span>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ margin: 0 }}>{title}</h2>
      <p style={{ margin: '4px 0 0', color: 'var(--color-text-subtle)' }}>{subtitle}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      style={{
        borderRadius: 18,
        border: '1px dashed var(--color-border-strong)',
        padding: 24,
        textAlign: 'center',
        color: 'var(--color-text-meta)',
      }}
    >
      {message}
    </div>
  );
}

const selectStyle: CSSProperties = {
  borderRadius: 12,
  border: '1px solid var(--color-border-strong)',
  padding: '10px 12px',
  minWidth: 160,
  background: 'var(--color-surface)',
  color: 'var(--color-text-primary)',
};

const primaryButton: CSSProperties = {
  border: 'none',
  borderRadius: 16,
  padding: '12px 24px',
  background: 'var(--color-text-primary)',
  color: 'var(--color-contrast-on-accent)',
  cursor: 'pointer',
  justifySelf: 'flex-start',
};

export { ActivityHeatmap };
