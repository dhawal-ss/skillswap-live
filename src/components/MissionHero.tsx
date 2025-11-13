interface MissionHeroProps {
  onBegin: () => void;
}

export function MissionHero({ onBegin }: MissionHeroProps) {
  return (
    <section
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '64px 24px',
        textAlign: 'center',
        background: 'var(--color-hero-gradient)',
        color: 'var(--color-hero-foreground)',
      }}
    >
      <div style={{ maxWidth: 780, display: 'grid', gap: 24 }}>
        <p
          style={{
            textTransform: 'uppercase',
            letterSpacing: 4,
            margin: 0,
            color: 'var(--color-hero-foreground-soft)',
          }}
        >
          Dhawal Ranka · Mission
        </p>
        <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', margin: 0 }}>
          Free, open-source learning for every curious mind.
        </h1>
        <p
          style={{
            fontSize: '1.1rem',
            lineHeight: 1.45,
            margin: 0,
            color: 'var(--color-hero-foreground)',
            opacity: 0.9,
            maxWidth: 860,
            alignSelf: 'center',
          }}
        >
          Why pay gatekeepers when every person carries a skill worth sharing? SkillSwap is a live,
          community-built classroom where you don’t need to be famous to teach or brave to learn. Share
          your craft, pick up a new one, and help another creator do the same —{' '}
          <span style={{ whiteSpace: 'nowrap' }}>all in one place.</span>
        </p>
        <button
          type="button"
          onClick={onBegin}
          style={{
            justifySelf: 'center',
            border: 'none',
            borderRadius: 999,
            padding: '14px 32px',
            fontSize: 18,
            fontWeight: 600,
            background: 'var(--color-warning)',
            color: '#0f172a',
            textShadow: '0 2px 6px rgba(15, 23, 42, 0.25)',
            cursor: 'pointer',
            boxShadow: '0 20px 45px rgba(15, 23, 42, 0.4)',
          }}
        >
          Start exploring
        </button>
      </div>
    </section>
  );
}
