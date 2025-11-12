import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { SessionCard, SkillClip, SkillTag, UserProfile } from '../types';

interface Props {
  profile: UserProfile;
  sessions: SessionCard[];
  clips: SkillClip[];
  availableTags: SkillTag[];
  onProfileUpdate: (updates: Partial<UserProfile>) => void;
  onCreateSession: (draft: SessionDraftLocal) => void;
  onCreateClip: (draft: ClipDraftLocal) => void;
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
};

export function UserProfilePanel({
  profile,
  sessions,
  clips,
  availableTags,
  onProfileUpdate,
  onCreateSession,
  onCreateClip,
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
  });
  const [profileSaved, setProfileSaved] = useState(false);
  const totalMinutes = useMemo(() => sessions.reduce((sum, session) => sum + session.duration, 0), [sessions]);
  const avgLikes = useMemo(
    () => Math.round(clips.reduce((sum, clip) => sum + clip.likes, 0) / (clips.length || 1)),
    [clips],
  );

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

  const resetClipForm = () =>
    setClipForm({
      title: '',
      tag: availableTags[0],
      previewUrl: '',
      duration: 30,
    });

  return (
    <section style={{ padding: '32px 24px 80px', maxWidth: 1100, margin: '0 auto', display: 'grid', gap: 32 }}>
      <header style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center' }}>
        <img
          src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.name)}`}
          alt={profile.name}
          width={96}
          height={96}
          style={{ borderRadius: '50%', border: '4px solid #e0e7ff' }}
        />
        <div>
          <p style={{ textTransform: 'uppercase', letterSpacing: 2, color: '#94a3b8', margin: 0 }}>
            Your creator profile
          </p>
          <h1 style={{ margin: '8px 0 4px' }}>{profile.name}</h1>
          <p style={{ margin: 0, color: '#475569' }}>Timezone · {profile.timezone}</p>
          <p style={{ margin: '4px 0 0', color: '#475569' }}>
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
        <SectionHeading title="Profile settings" subtitle="Describe what you teach and tune your tags." />
        <div style={{ borderRadius: 20, border: '1px solid #e2e8f0', padding: 24, background: '#fff', display: 'grid', gap: 16 }}>
          <label style={{ display: 'grid', gap: 8 }}>
            <span style={{ fontWeight: 600 }}>Bio</span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Share your teaching style, credentials, or vibe."
              style={{ minHeight: 120, borderRadius: 12, border: '1px solid #cbd5f5', padding: 12 }}
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
                    border: '1px solid #cbd5f5',
                    padding: '6px 12px',
                    background: teachTags.includes(tag) ? '#0f172a' : '#fff',
                    color: teachTags.includes(tag) ? '#fff' : '#0f172a',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {tag}
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
              background: '#0f172a',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Save profile
          </button>
          {profileSaved && <span style={{ color: '#22c55e' }}>Profile updated ✔️</span>}
        </div>
      </section>

      <section>
        <SectionHeading title="My live sessions" subtitle="Add a new room in seconds." />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onCreateSession(sessionForm);
            resetSessionForm();
          }}
          style={{ borderRadius: 20, border: '1px solid #e2e8f0', padding: 20, background: '#fff', display: 'grid', gap: 12 }}
        >
          <input
            required
            value={sessionForm.title}
            onChange={(e) => setSessionForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Session title"
            style={{ borderRadius: 12, border: '1px solid #cbd5f5', padding: 12 }}
          />
          <textarea
            value={sessionForm.blurb}
            onChange={(e) => setSessionForm((prev) => ({ ...prev, blurb: e.target.value }))}
            placeholder="What will people learn?"
            style={{ borderRadius: 12, border: '1px solid #cbd5f5', padding: 12, minHeight: 80 }}
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
                  border: '1px solid #e2e8f0',
                  padding: 20,
                  background: '#fff',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <strong>{session.title}</strong>
                    <p style={{ margin: '4px 0 0', color: '#475569' }}>{session.blurb}</p>
                  </div>
                  <span style={{ color: '#94a3b8' }}>{session.startTime}</span>
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 12, color: '#475569', fontSize: 14 }}>
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
        <SectionHeading title="My skill clips" subtitle="Short teasers keep your followers engaged between live rooms." />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onCreateClip(clipForm);
            resetClipForm();
          }}
          style={{ borderRadius: 20, border: '1px solid #e2e8f0', padding: 20, background: '#fff', display: 'grid', gap: 12 }}
        >
          <input
            required
            value={clipForm.title}
            onChange={(e) => setClipForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Clip title"
            style={{ borderRadius: 12, border: '1px solid #cbd5f5', padding: 12 }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <select
              value={clipForm.tag}
              onChange={(e) => setClipForm((prev) => ({ ...prev, tag: e.target.value as SkillTag }))}
              style={selectStyle}
            >
              {availableTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={10}
              max={120}
              value={clipForm.duration}
              onChange={(e) => setClipForm((prev) => ({ ...prev, duration: Number(e.target.value) }))}
              style={selectStyle}
            />
            <input
              type="url"
              value={clipForm.previewUrl}
              onChange={(e) => setClipForm((prev) => ({ ...prev, previewUrl: e.target.value }))}
              placeholder="Cover image URL (optional)"
              style={selectStyle}
            />
          </div>
          <button type="submit" style={primaryButton}>
            Publish clip
          </button>
        </form>

        {clips.length === 0 ? (
          <EmptyState message="Record a 30-second tip to unlock profile clips." />
        ) : (
          <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
            {clips.map((clip) => (
              <article
                key={clip.id}
                style={{
                  borderRadius: 20,
                  border: '1px solid #e2e8f0',
                  background: '#fff',
                  overflow: 'hidden',
                  display: 'grid',
                  gridTemplateColumns: '160px 1fr',
                }}
              >
                <div
                  style={{
                    backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0.1), rgba(15,23,42,0.7)), url(${clip.previewUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    minHeight: 160,
                  }}
                />
                <div style={{ padding: 16, display: 'grid', gap: 8 }}>
                  <strong>{clip.title}</strong>
                  <p style={{ margin: 0, color: '#475569', fontSize: 14 }}>Duration {clip.duration}s · Tags {clip.tags.join(', ')}</p>
                  <div style={{ display: 'flex', gap: 16, fontSize: 14, color: '#475569' }}>
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
        border: '1px solid #e2e8f0',
        padding: 20,
        background: '#fff',
      }}
    >
      <p style={{ margin: 0, color: '#94a3b8', fontSize: 13 }}>{label}</p>
      <strong style={{ fontSize: 24 }}>{value}</strong>
    </article>
  );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ margin: 0 }}>{title}</h2>
      <p style={{ margin: '4px 0 0', color: '#64748b' }}>{subtitle}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      style={{
        borderRadius: 18,
        border: '1px dashed #cbd5f5',
        padding: 24,
        textAlign: 'center',
        color: '#94a3b8',
      }}
    >
      {message}
    </div>
  );
}

const selectStyle: CSSProperties = {
  borderRadius: 12,
  border: '1px solid #cbd5f5',
  padding: '10px 12px',
  minWidth: 160,
};

const primaryButton: CSSProperties = {
  border: 'none',
  borderRadius: 16,
  padding: '12px 24px',
  background: '#0f172a',
  color: '#fff',
  cursor: 'pointer',
  justifySelf: 'flex-start',
};
