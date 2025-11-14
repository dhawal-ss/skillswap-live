import { useState } from 'react';
import type { CSSProperties } from 'react';

type Provider = 'email';

interface SignInDialogProps {
  open: boolean;
  status: 'idle' | 'sending' | 'link-sent' | 'error';
  statusMessage?: string | null;
  onClose: () => void;
  onSubmit: (payload: { name: string; email: string; provider: Provider; age: number }) => void;
}

export function SignInDialog({ open, onClose, onSubmit, status, statusMessage }: SignInDialogProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const provider: Provider = 'email';
  const [error, setError] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);
  const isSubmitting = status === 'sending';
  const completed = status === 'link-sent';

  if (!open) return null;

  const triggerError = (message: string) => {
    setError(message);
    setShaking(true);
    setTimeout(() => setShaking(false), 600);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.65)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 100,
      }}
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim()) {
            triggerError('Please enter your display name.');
            return;
          }
          if (!email.trim()) {
            triggerError('Please enter a valid email address.');
            return;
          }
          const parsedAge = Number(age);
          if (!Number.isFinite(parsedAge) || parsedAge < 13) {
            triggerError('You must be at least 13 years old to join.');
            return;
          }
          setError(null);
          onSubmit({ name: name.trim(), email: email.trim().toLowerCase(), provider, age: parsedAge });
        }}
        style={{
          width: 'min(420px, 90vw)',
          borderRadius: 20,
          padding: 24,
          background: 'var(--color-surface)',
          display: 'grid',
          gap: 16,
          animation: shaking ? 'shake 0.6s' : undefined,
        }}
      >
        <div>
          <h2 style={{ margin: '0 0 8px' }}>Sign in to SkillSwap</h2>
          <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>
            Your profile, progress, and sessions stay synced on every device.
          </p>
        </div>
        {error && <p style={{ margin: 0, color: 'var(--color-danger)', fontWeight: 600 }}>{error}</p>}
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 14, color: 'var(--color-text-subtle)' }}>Display name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
            disabled={completed || isSubmitting}
            style={fieldStyle}
          />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 14, color: 'var(--color-text-subtle)' }}>Email</span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            type="email"
            disabled={completed || isSubmitting}
            style={fieldStyle}
          />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 14, color: 'var(--color-text-subtle)' }}>Age</span>
          <input
            value={age}
            onChange={(event) => setAge(event.target.value)}
            placeholder="13+"
            type="number"
            min={13}
            disabled={completed || isSubmitting}
            style={fieldStyle}
          />
        </label>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-subtle)' }}>
          We’ll send a magic link to your inbox.
        </p>
        {statusMessage && (
          <p
            style={{
              margin: 0,
              color: status === 'error' ? 'var(--color-danger)' : 'var(--color-brand)',
              fontWeight: 600,
            }}
          >
            {statusMessage}
          </p>
        )}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', alignItems: 'center' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              borderRadius: 999,
              border: '1px solid var(--color-border)',
              padding: '8px 16px',
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim() || !email.trim() || !age.trim() || isSubmitting || completed}
            style={{
              borderRadius: 999,
              border: 'none',
              padding: '10px 20px',
              background: 'var(--color-brand)',
              color: 'var(--color-contrast-on-accent)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {completed ? 'Link sent' : isSubmitting ? 'Sending...' : 'Continue'}
          </button>
        </div>
      </form>
    </div>
  );
}

const fieldStyle: CSSProperties = {
  borderRadius: 12,
  border: '1px solid var(--color-border-strong)',
  padding: '10px 12px',
  background: 'var(--color-surface)',
};
