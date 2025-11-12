import { useState } from 'react';
import type { SessionCard } from '../types';

interface Props {
  session: SessionCard;
  onSubmit: (payload: { rating: number; tags: string[]; notes: string }) => void;
}

const tagOptions = ['Clarity', 'Fun', 'Pace', 'Needs follow-up', 'Too advanced'];

export function FeedbackSheet({ session, onSubmit }: Props) {
  const [rating, setRating] = useState<number>(0);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const toggleTag = (tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag],
    );
  };

  return (
    <section
      style={{
        padding: '48px 24px 80px',
        maxWidth: 760,
        margin: '0 auto',
        textAlign: 'center',
        display: 'grid',
        gap: 24,
      }}
    >
      <div>
        <p style={{ color: '#94a3b8', margin: 0 }}>How was your exchange with</p>
        <h2 style={{ margin: '8px 0 0' }}>{session.host}</h2>
        <p style={{ color: '#475569' }}>{session.title}</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            style={{
              width: 54,
              height: 54,
              borderRadius: '50%',
              border: '2px solid #cbd5f5',
              background: rating >= value ? '#fde047' : '#fff',
              fontSize: 18,
              cursor: 'pointer',
            }}
          >
            {value}
          </button>
        ))}
      </div>

      <div>
        <p style={{ fontWeight: 600 }}>Tag the vibe (optional)</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
          {tagOptions.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              style={{
                padding: '8px 16px',
                borderRadius: 999,
                border: '1px solid #cbd5f5',
                background: activeTags.includes(tag) ? '#1d4ed8' : '#fff',
                color: activeTags.includes(tag) ? '#fff' : '#0f172a',
                cursor: 'pointer',
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <textarea
        placeholder="Leave a quick note for the host (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        style={{
          borderRadius: 16,
          border: '1px solid #cbd5f5',
          padding: 16,
          minHeight: 140,
        }}
      />

      <button
        type="button"
        disabled={!rating}
        onClick={() => onSubmit({ rating, tags: activeTags, notes })}
        style={{
          padding: '16px 32px',
          borderRadius: 18,
          border: 'none',
          background: rating ? '#0f172a' : '#cbd5f5',
          color: rating ? '#fff' : '#94a3b8',
          fontSize: 18,
          cursor: rating ? 'pointer' : 'not-allowed',
          justifySelf: 'center',
        }}
      >
        Send feedback
      </button>
    </section>
  );
}
