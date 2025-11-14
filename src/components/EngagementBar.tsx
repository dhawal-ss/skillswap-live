import { useEffect, useState, type CSSProperties } from 'react';
import { reactToClip, sendClipReaction } from '../services/api';

interface Props {
  clipId: string;
  initialLikes: number;
  initialSaves: number;
  initialComments: number;
  onComment: () => void;
  isSaved?: boolean;
  onToggleSave?: (next: boolean) => void;
  onReaction?: (emoji: string) => void;
}

export function EngagementBar({
  clipId,
  initialLikes,
  initialSaves,
  initialComments,
  onComment,
  isSaved = false,
  onToggleSave,
  onReaction,
}: Props) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(isSaved);
  const [saves, setSaves] = useState(initialSaves);

  useEffect(() => {
    setSaved(isSaved);
  }, [isSaved]);

  const toggleLike = async () => {
    setLiked((prev) => !prev);
    setLikes((prev) => (liked ? prev - 1 : prev + 1));
    try {
      await reactToClip(clipId, 'like');
    } catch (error) {
      console.error('Failed to send like', error);
    }
  };

  const toggleSave = async () => {
    const next = !saved;
    setSaved(next);
    setSaves((prev) => (next ? prev + 1 : Math.max(prev - 1, 0)));
    onToggleSave?.(next);
    try {
      await reactToClip(clipId, 'save');
    } catch (error) {
      console.error('Failed to save clip', error);
    }
  };

  const reactionOptions = [
    { emoji: '🔥', label: 'Send fire' },
    { emoji: '👏', label: 'Send clap' },
    { emoji: '💡', label: 'Send idea' },
    { emoji: '❤️', label: 'Send heart' },
  ];

  const sendQuickReaction = async (emoji: string) => {
    onReaction?.(emoji);
    try {
      await sendClipReaction(clipId, emoji);
    } catch (error) {
      console.error('Failed to send reaction', error);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <button type="button" onClick={toggleLike} style={chip(liked)}>
          ❤️ {likes}
        </button>
        <button type="button" onClick={onComment} style={chip(false)}>
          💬 {initialComments}
        </button>
        <button type="button" onClick={toggleSave} style={chip(saved)}>
          📌 {saves}
        </button>
        <button type="button" style={chip(false)}>
          ↗️ Share
        </button>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {reactionOptions.map((reaction) => (
          <button
            key={reaction.emoji}
            type="button"
            onClick={() => sendQuickReaction(reaction.emoji)}
            style={pill}
            aria-label={reaction.label}
          >
            {reaction.emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

const chip = (active: boolean): CSSProperties => ({
  borderRadius: 999,
  border: '1px solid var(--color-border-strong)',
  background: active ? 'var(--color-text-primary)' : 'var(--color-surface)',
  color: active ? 'var(--color-contrast-on-accent)' : 'var(--color-text-primary)',
  padding: '6px 14px',
  cursor: 'pointer',
});

const pill: CSSProperties = {
  borderRadius: 999,
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
  color: 'var(--color-text-primary)',
  padding: '4px 12px',
  cursor: 'pointer',
  fontSize: 18,
};
