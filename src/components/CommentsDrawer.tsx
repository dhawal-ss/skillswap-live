import type { ClipComment } from '../types';
import { formatRelativeOrTime } from '../lib/formatters';

interface Props {
  comments: ClipComment[];
  open: boolean;
  onClose: () => void;
}

export function CommentsDrawer({ comments, open, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.55)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 20,
      }}
    >
      <div
        className="glass-surface"
        style={{
          width: 'min(520px, 90vw)',
          maxHeight: '70vh',
          background: 'var(--color-surface)',
          borderRadius: 20,
          padding: 24,
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Community comments</h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              background: 'var(--color-border)',
              padding: '6px 12px',
              borderRadius: 12,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
        <p style={{ color: 'var(--color-text-subtle)', marginTop: 4 }}>Tap questions to answer them live.</p>
        <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
          {comments.map((comment) => (
            <article
              key={comment.id}
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: 14,
                padding: 16,
                display: 'flex',
                gap: 12,
              }}
            >
              <img
                src={comment.avatar}
                alt={comment.author}
                width={48}
                height={48}
                style={{ borderRadius: '50%' }}
              />
              <div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <strong>{comment.author}</strong>
                  <span style={{ fontSize: 12, color: 'var(--color-text-meta)' }}>
                    {formatRelativeOrTime(new Date(comment.timestamp))}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      color: 'var(--color-phase-active)',
                      border: '1px solid var(--color-chip-border)',
                      borderRadius: 999,
                      padding: '2px 8px',
                    }}
                  >
                    {comment.role}
                  </span>
                </div>
                <p style={{ margin: '6px 0 0', color: 'var(--color-text-muted)' }}>{comment.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
