import { useEffect, useId } from 'react';

interface Step {
  title: string;
  body: string;
  targetSelector?: string;
}

interface Props {
  steps: Step[];
  current: number;
  onNext: () => void;
  onSkip: () => void;
}

export function GuidedTour({ steps, current, onNext, onSkip }: Props) {
  const step = steps[current];
  const titleId = useId();
  const bodyId = useId();

  useEffect(() => {
    if (!step?.targetSelector || typeof document === 'undefined') return;
    const node = document.querySelector<HTMLElement>(step.targetSelector);
    if (!node) return;
    node.setAttribute('data-tour-active', 'true');
    node.setAttribute('data-tour-step', String(current));
    return () => {
      node.removeAttribute('data-tour-active');
      node.removeAttribute('data-tour-step');
    };
  }, [step, current]);

  if (!step) return null;

  return (
    <div className="guided-tour" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={bodyId}>
      <div className="guided-tour__card">
        <p style={{ textTransform: 'uppercase', letterSpacing: 3, margin: 0, color: 'var(--color-text-subtle)' }}>
          Quick tour
        </p>
        <h3 id={titleId} style={{ margin: '0 0 8px' }}>
          {step.title}
        </h3>
        <p id={bodyId} style={{ margin: 0, color: 'var(--color-text-muted)' }}>
          {step.body}
        </p>
        <div className="guided-tour__steps">
          {steps.map((_, index) => (
            <span key={step.title + index} className={index === current ? 'active' : undefined} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            type="button"
            onClick={onSkip}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
            }}
          >
            Skip
          </button>
          <button
            type="button"
            onClick={onNext}
            style={{
              border: 'none',
              borderRadius: 12,
              padding: '10px 24px',
              background: 'var(--color-brand)',
              color: 'var(--color-contrast-on-accent)',
              cursor: 'pointer',
            }}
          >
            {current === steps.length - 1 ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
