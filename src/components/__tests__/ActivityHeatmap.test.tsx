import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { ActivityHeatmap } from '../UserProfilePanel';

type ActivityEntry = {
  id: string;
  label: string;
  timestamp: string;
  detail?: string;
  icon?: string;
};

function HeatmapHarness({ entries }: { entries: ActivityEntry[] }) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  return (
    <ActivityHeatmap entries={entries} selectedDay={selectedDay} onSelectDay={setSelectedDay} />
  );
}

const today = new Date();
const todayIso = today.toISOString().slice(0, 10);
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);
const yesterdayIso = yesterday.toISOString().slice(0, 10);

const sampleEntries: ActivityEntry[] = [
  {
    id: 'a1',
    label: 'Joined Spanish sprint',
    timestamp: `${todayIso}T12:00:00.000Z`,
    icon: '🎥',
  },
  {
    id: 'a2',
    label: 'Shared a clip',
    timestamp: `${yesterdayIso}T15:00:00.000Z`,
    icon: '🎬',
  },
];

describe('ActivityHeatmap', () => {
  it('toggles the daily detail list when a cell is selected', () => {
    render(<HeatmapHarness entries={sampleEntries} />);

    const todayCell = screen.getByTitle(`${todayIso} · 1 actions`);
    fireEvent.click(todayCell);

    expect(screen.getByText(/Joined Spanish sprint/i)).toBeInTheDocument();

    fireEvent.click(todayCell);
    expect(screen.queryByText(/Joined Spanish sprint/i)).not.toBeInTheDocument();
  });

  it('shows entries for another day when selected', () => {
    render(<HeatmapHarness entries={sampleEntries} />);
    const yesterdayCell = screen.getByTitle(`${yesterdayIso} · 1 actions`);

    fireEvent.click(yesterdayCell);
    expect(screen.getByText(/Shared a clip/i)).toBeInTheDocument();
  });
});
