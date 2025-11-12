import { useState } from 'react';
import { reactToClip } from '../services/api';

interface Props {
  clipId: string;
  initialLikes: number;
  initialSaves: number;
  initialComments: number;
  onComment: () => void;
}

export function EngagementBar({
  clipId,
  initialLikes,
  initialSaves,
  initialComments,
  onComment,
}: Props) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saves, setSaves] = useState(initialSaves);

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
    setSaved((prev) => !prev);
    setSaves((prev) => (saved ? prev - 1 : prev + 1));
    try {
      await reactToClip(clipId, 'save');
    } catch (error) {
      console.error('Failed to save clip', error);
    }
  };

  return (
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
  );
}

const chip = (active: boolean): React.CSSProperties => ({
  borderRadius: 999,
  border: '1px solid #cbd5f5',
  background: active ? '#0f172a' : '#fff',
  color: active ? '#fff' : '#0f172a',
  padding: '6px 14px',
  cursor: 'pointer',
});
