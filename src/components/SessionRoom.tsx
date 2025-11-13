import { useState, type CSSProperties } from 'react';
import type { SessionCard } from '../types';
import { SESSION_VIDEO_PLACEHOLDER } from '../lib/media';

interface Props {
  session: SessionCard;
  onLeave: () => void;
}

export function SessionRoom({ session, onLeave }: Props) {
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [captions, setCaptions] = useState(true);
  const [notes, setNotes] = useState('');
  const [reaction, setReaction] = useState<string | null>(null);
  const [pipMode, setPipMode] = useState(false);
  const pipSource = session.demoVideoUrl ?? SESSION_VIDEO_PLACEHOLDER;
  const reactionOptions = [
    { emoji: '👏', label: 'Send clap reaction' },
    { emoji: '🔥', label: 'Send fire reaction' },
    { emoji: '💡', label: 'Send idea reaction' },
    { emoji: '❤️', label: 'Send heart reaction' },
  ];

  const triggerReaction = (emoji: string) => {
    setReaction(emoji);
    setTimeout(() => setReaction(null), 1500);
  };

  return (
    <section
      style={{
        padding: '40px 24px 80px',
        maxWidth: 1080,
        margin: '0 auto',
        display: 'grid',
        gap: 24,
      }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ margin: 0, color: 'var(--color-text-meta)' }}>Live with {session.host}</p>
          <h2 style={{ margin: '8px 0' }}>{session.title}</h2>
          <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>{session.language}</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            type="button"
            onClick={() => setPipMode((prev) => !prev)}
            style={{
              border: '1px solid var(--color-border)',
              background: 'transparent',
              color: 'var(--color-text-primary)',
              padding: '10px 16px',
              borderRadius: 12,
              cursor: 'pointer',
            }}
          >
            {pipMode ? 'Exit mini view' : 'PiP view'}
          </button>
          <button
            type="button"
            onClick={onLeave}
            style={{
              border: 'none',
              background: 'var(--color-danger)',
              color: 'var(--color-text-inverse)',
              padding: '12px 24px',
              borderRadius: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Leave session
          </button>
        </div>
      </header>

      <div
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: '3fr 2fr',
          minHeight: 360,
        }}
      >
        <div
          style={{
            background: 'var(--color-video-surface)',
            borderRadius: 24,
            position: pipMode ? 'relative' : 'relative',
            color: 'var(--color-text-inverse)',
            padding: 24,
            overflow: 'hidden',
          }}
        >
          {pipMode && (
            <div className="pip-video">
              <video
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                controls
                muted={muted}
                autoPlay
                loop
                playsInline
              >
                <source src={pipSource} type="video/mp4" />
              </video>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span>{cameraOff ? 'Camera paused' : 'Camera live'}</span>
            <span>{muted ? 'Muted' : 'Mic live'}</span>
          </div>
          <div
            style={{
              borderRadius: 18,
              height: '100%',
              overflow: 'hidden',
              position: 'relative',
              background: 'var(--color-video-surface)',
            }}
          >
            {cameraOff ? (
              <div
                style={{
                  textAlign: 'center',
                  color: 'var(--color-text-inverse)',
                  display: 'grid',
                  placeContent: 'center',
                  height: '100%',
                  padding: 16,
                }}
              >
                <p style={{ marginBottom: 8 }}>You look great. Camera resumes when you’re ready.</p>
                <p style={{ fontSize: '4rem', margin: 0 }}>📷</p>
              </div>
            ) : (
              <video
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                muted={muted}
                autoPlay
                playsInline
                loop
                aria-label={`${session.title} stream preview`}
                poster={session.hostAvatar}
              >
                <source src={pipSource} type="video/mp4" />
              </video>
            )}
          </div>

          {reaction && (
            <div
              className="reaction-burst"
              style={{
                position: 'absolute',
                top: 24,
                right: 24,
                fontSize: '2.5rem',
              }}
            >
              {reaction}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          <div
            style={{
              borderRadius: 20,
              border: '1px solid var(--color-border)',
              padding: 20,
              background: 'var(--color-surface)',
            }}
          >
            <p style={{ marginTop: 0, fontWeight: 600 }}>Shared notes</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Drop vocab, links, or steps here."
              aria-label="Shared notes"
              style={{
                width: '100%',
                minHeight: 160,
                borderRadius: 12,
                border: '1px solid var(--color-border-strong)',
                padding: 12,
                resize: 'vertical',
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                {
                  icon: muted ? '🔇' : '🎙',
                  label: muted ? 'Unmute' : 'Mute',
                  action: () => setMuted((prev) => !prev),
                },
                {
                  icon: cameraOff ? '🎥' : '📷',
                  label: cameraOff ? 'Start camera' : 'Stop camera',
                  action: () => setCameraOff((prev) => !prev),
                },
                {
                  icon: '💬',
                  label: captions ? 'Hide captions' : 'Show captions',
                  action: () => setCaptions((prev) => !prev),
                },
              ].map((control) => (
                <button key={control.label} type="button" onClick={control.action} style={controlStyle}>
                  <span aria-hidden="true">{control.icon}</span>
                  {control.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {reactionOptions.map(({ emoji, label }) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => triggerReaction(emoji)}
                  aria-label={label}
                  style={{ ...controlStyle, flex: 1, justifyContent: 'center' }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const controlStyle: CSSProperties = {
  flex: 1,
  borderRadius: 14,
  border: '1px solid var(--color-border-strong)',
  background: 'var(--color-surface)',
  padding: '10px 16px',
  cursor: 'pointer',
  color: 'var(--color-text-primary)',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};
