import type { CSSProperties } from 'react';

type LogoSize = 'sm' | 'md' | 'lg';

interface LogoProps {
  size?: LogoSize;
  tagline?: string;
  align?: 'left' | 'center';
}

const sizeMap: Record<LogoSize, { fontSize: string; arrow: { width: number; height: number } }> = {
  sm: { fontSize: '1rem', arrow: { width: 32, height: 12 } },
  md: { fontSize: '1.35rem', arrow: { width: 40, height: 16 } },
  lg: { fontSize: '1.8rem', arrow: { width: 56, height: 22 } },
};

export function Logo({ size = 'md', tagline, align = 'left' }: LogoProps) {
  const { fontSize, arrow } = sizeMap[size];

  const containerStyles: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: align === 'center' ? 'center' : 'flex-start',
    gap: 8,
  };

  const wordmarkStyles: CSSProperties = {
    display: 'flex',
    alignItems: 'baseline',
    gap: 6,
    fontWeight: 700,
    fontSize,
    lineHeight: 1,
  };

  return (
    <div style={containerStyles}>
      <div style={wordmarkStyles} aria-label="SkillSwap Live">
        <span>SkillSwap</span>
        <span style={{ color: 'var(--color-brand)' }}>Live</span>
        <span style={{ display: 'inline-flex', width: arrow.width, height: arrow.height, color: 'var(--color-brand)' }}>
          <Arrow width={arrow.width} height={arrow.height} />
        </span>
      </div>
      {tagline && (
        <span style={{ color: 'var(--color-text-subtle)', fontSize: size === 'lg' ? '1rem' : '0.85rem' }}>{tagline}</span>
      )}
    </div>
  );
}

function Arrow({ width, height }: { width: number; height: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 40 16" aria-hidden="true" focusable="false" style={{ display: 'block' }}>
      <path d="M2 8L12 2V5H22V11H12V14Z" fill="currentColor" />
      <path d="M38 8L28 14V11H18V5H28V2Z" fill="currentColor" />
    </svg>
  );
}
