import { useMemo, useState } from 'react';
import type { SkillTag, UserProfile } from '../types';

const skillCatalog: { label: string; value: SkillTag }[] = [
  { label: 'Languages', value: 'languages' },
  { label: 'Cooking & Food', value: 'cooking' },
  { label: 'Music & Audio', value: 'music' },
  { label: 'DIY & Fixes', value: 'diy' },
  { label: 'Productivity', value: 'productivity' },
  { label: 'Wellness', value: 'wellness' },
  { label: 'Technology', value: 'technology' },
];

const availabilityOptions = ['Morning', 'Midday', 'Evening', 'Weekend'];

interface Props {
  onComplete: (profile: UserProfile) => void;
}

const chipBase = {
  border: '1px solid #cbd5f5',
  borderRadius: '999px',
  padding: '8px 16px',
  cursor: 'pointer',
};

function ToggleChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...chipBase,
        background: active ? '#1d4ed8' : '#fff',
        color: active ? '#fff' : '#0f172a',
        fontWeight: 500,
      }}
    >
      {label}
    </button>
  );
}

export function OnboardingFlow({ onComplete }: Props) {
  const [name, setName] = useState('');
  const [learnTags, setLearnTags] = useState<SkillTag[]>(['languages']);
  const [teachTags, setTeachTags] = useState<SkillTag[]>([]);
  const [availability, setAvailability] = useState<string[]>(['Evening']);
  const timezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC',
    [],
  );

  const toggle = (list: SkillTag[], next: SkillTag, setter: (value: SkillTag[]) => void) => {
    setter(list.includes(next) ? list.filter((tag) => tag !== next) : [...list, next]);
  };

  const toggleAvailability = (slot: string) => {
    setAvailability((prev) =>
      prev.includes(slot) ? prev.filter((item) => item !== slot) : [...prev, slot],
    );
  };

  const canProceed = name.trim().length >= 2 && learnTags.length > 0;

  return (
    <section
      style={{
        maxWidth: 760,
        margin: '0 auto',
        padding: '64px 24px 96px',
        display: 'grid',
        gap: '32px',
      }}
    >
      <div>
        <p style={{ textTransform: 'uppercase', letterSpacing: 2, color: '#64748b' }}>
          Welcome to SkillSwap Live
        </p>
        <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', margin: '16px 0' }}>
          Learn something new in the next 10 minutes.
        </h1>
        <p style={{ color: '#475569', maxWidth: 520 }}>
          Set your intent so we can match you with the right person, across time zones and
          languages.
        </p>
      </div>

      <div style={{ display: 'grid', gap: 24 }}>
        <label style={{ display: 'grid', gap: 8 }}>
          <span style={{ fontWeight: 600 }}>What should we call you?</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Add a friendly name"
            style={{
              padding: '14px 16px',
              borderRadius: 14,
              border: '1px solid #cbd5f5',
              fontSize: 16,
            }}
          />
        </label>

        <div>
          <p style={{ fontWeight: 600, marginBottom: 12 }}>Skills you want to learn</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {skillCatalog.map((skill) => (
              <ToggleChip
                key={`learn-${skill.value}`}
                label={skill.label}
                active={learnTags.includes(skill.value)}
                onClick={() => toggle(learnTags, skill.value, setLearnTags)}
              />
            ))}
          </div>
        </div>

        <div>
          <p style={{ fontWeight: 600, marginBottom: 12 }}>Skills you can share</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {skillCatalog.map((skill) => (
              <ToggleChip
                key={`teach-${skill.value}`}
                label={skill.label}
                active={teachTags.includes(skill.value)}
                onClick={() => toggle(teachTags, skill.value, setTeachTags)}
              />
            ))}
          </div>
          <p style={{ color: '#94a3b8', marginTop: 8 }}>Optional, you can update later.</p>
        </div>

        <div>
          <p style={{ fontWeight: 600, marginBottom: 12 }}>When are you free?</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {availabilityOptions.map((slot) => (
              <ToggleChip
                key={slot}
                label={slot}
                active={availability.includes(slot)}
                onClick={() => toggleAvailability(slot)}
              />
            ))}
          </div>
          <p style={{ color: '#475569', marginTop: 8 }}>Timezone detected: {timezone}</p>
        </div>
      </div>

      <button
        type="button"
        disabled={!canProceed}
        onClick={() =>
          onComplete({
            name,
            timezone,
            learnTags,
            teachTags,
            availability,
          })
        }
        style={{
          border: 'none',
          borderRadius: 18,
          padding: '18px 32px',
          fontSize: 18,
          background: canProceed ? '#1e1b4b' : '#cbd5f5',
          color: canProceed ? '#fff' : '#94a3b8',
          cursor: canProceed ? 'pointer' : 'not-allowed',
          width: 'fit-content',
          justifySelf: 'flex-end',
        }}
      >
        Start exploring →
      </button>
    </section>
  );
}
