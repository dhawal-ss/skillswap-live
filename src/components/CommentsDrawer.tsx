import type { ClipComment } from '../types';

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
        style={{
          width: 'min(520px, 90vw)',
          maxHeight: '70vh',
          background: '#fff',
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
              background: '#e2e8f0',
              padding: '6px 12px',
              borderRadius: 12,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
        <p style={{ color: '#64748b', marginTop: 4 }}>Tap questions to answer them live.</p>
        <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
          {comments.map((comment) => (
            <article
              key={comment.id}
              style={{
                border: '1px solid #e2e8f0',
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
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{comment.timestamp}</span>
                  <span
                    style={{
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      color: '#2563eb',
                      border: '1px solid #bfdbfe',
                      borderRadius: 999,
                      padding: '2px 8px',
                    }}
                  >
                    {comment.role}
                  </span>
                </div>
                <p style={{ margin: '6px 0 0', color: '#475569' }}>{comment.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
