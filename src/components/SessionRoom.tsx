import { useState } from 'react';
import type { SessionCard } from '../types';

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
          <p style={{ margin: 0, color: '#94a3b8' }}>Live with {session.host}</p>
          <h2 style={{ margin: '8px 0' }}>{session.title}</h2>
          <p style={{ margin: 0, color: '#475569' }}>{session.language}</p>
        </div>
        <button
          type="button"
          onClick={onLeave}
          style={{
            border: 'none',
            background: '#dc2626',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Leave session
        </button>
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
            background: '#0f172a',
            borderRadius: 24,
            position: 'relative',
            color: '#fff',
            padding: 24,
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span>{cameraOff ? 'Camera paused' : 'Camera live'}</span>
            <span>{muted ? 'Muted' : 'Mic live'}</span>
          </div>
          <div
            style={{
              background:
                'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.25), transparent 55%)',
              borderRadius: 18,
              height: '100%',
              display: 'grid',
              placeItems: 'center',
              fontSize: '1.5rem',
            }}
          >
            {cameraOff ? (
              <div style={{ textAlign: 'center' }}>
                <p style={{ marginBottom: 8 }}>You look great. Camera resumes when you’re ready.</p>
                <p style={{ fontSize: '4rem', margin: 0 }}>📷</p>
              </div>
            ) : (
              <p>Video stream placeholder</p>
            )}
          </div>

          {reaction && (
            <div
              style={{
                position: 'absolute',
                top: 24,
                right: 24,
                fontSize: '2.5rem',
                animation: 'float 1.5s ease-out forwards',
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
              border: '1px solid #e2e8f0',
              padding: 20,
              background: '#fff',
            }}
          >
            <p style={{ marginTop: 0, fontWeight: 600 }}>Shared notes</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Drop vocab, links, or steps here."
              style={{
                width: '100%',
                minHeight: 160,
                borderRadius: 12,
                border: '1px solid #cbd5f5',
                padding: 12,
                resize: 'vertical',
              }}
            />
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                onClick={() => setMuted((prev) => !prev)}
                style={controlStyle}
              >
                {muted ? 'Unmute' : 'Mute'}
              </button>
              <button
                type="button"
                onClick={() => setCameraOff((prev) => !prev)}
                style={controlStyle}
              >
                {cameraOff ? 'Start camera' : 'Stop camera'}
              </button>
              <button
                type="button"
                onClick={() => setCaptions((prev) => !prev)}
                style={controlStyle}
              >
                {captions ? 'Hide captions' : 'Show captions'}
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['👏', '🔥', '💡', '❤️'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => triggerReaction(emoji)}
                  style={{ ...controlStyle, flex: 1 }}
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

const controlStyle: React.CSSProperties = {
  flex: 1,
  borderRadius: 14,
  border: '1px solid #cbd5f5',
  background: '#fff',
  padding: '10px 16px',
  cursor: 'pointer',
};
