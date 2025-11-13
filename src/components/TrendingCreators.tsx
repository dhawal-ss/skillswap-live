import type { CreatorProfile, SkillTag } from '../types';
import { formatSkillTag } from '../lib/tagLabels';

interface Props {
  creators: CreatorProfile[];
  onTuneTag?: (tag: SkillTag, intent: 'more' | 'less') => void;
  headline?: string;
  subhead?: string;
}

export function TrendingCreatorRail({
  creators,
  onTuneTag,
  headline = 'Trending teachers',
  subhead = 'Based on community saves',
}: Props) {
  if (!creators.length) return null;

  return (
    <div className="clip-trending">
      <div className="clip-trending__header">
        <strong>{headline}</strong>
        <span>{subhead}</span>
      </div>
      <div className="clip-trending__grid">
        {creators.map((creator) => {
          const primaryTag = creator.specialty[0];
          const primaryLabel = primaryTag ? formatSkillTag(primaryTag) : null;
          return (
            <button
              type="button"
              key={creator.id}
              className="clip-trending__card"
              onClick={() => primaryTag && onTuneTag?.(primaryTag, 'more')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img
                  src={creator.avatar}
                  alt={creator.name}
                  width={48}
                  height={48}
                  style={{ borderRadius: '50%' }}
                />
                <div>
                  <strong>{creator.name}</strong>
                  <p style={{ margin: 0, color: 'var(--color-text-subtle)', fontSize: 13 }}>
                    {primaryLabel ? `Boost ${primaryLabel}` : `${creator.specialty.length} skills`}
                  </p>
                </div>
              </div>
              <span style={{ color: 'var(--color-text-meta)', fontSize: 13 }}>
                {creator.followers.toLocaleString()} learners
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
