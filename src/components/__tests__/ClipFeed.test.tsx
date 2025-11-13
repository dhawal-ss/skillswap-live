import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClipFeed } from '../ClipFeed';
import type { SkillClip, CreatorProfile, ClipComment, SessionCard } from '../../types';

const baseClip: SkillClip = {
  id: 'clip-test',
  title: 'Sample clip',
  creatorId: 'creator-1',
  previewUrl: 'https://placehold.co/600x400',
  videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  duration: 30,
  likes: 10,
  comments: 1,
  saves: 2,
  tags: ['music'],
};

const creators: CreatorProfile[] = [
  {
    id: 'creator-1',
    name: 'Casey',
    avatar: 'https://placehold.co/64x64',
    bio: 'Looper extraordinaire',
    languages: ['English'],
    specialty: ['music'],
    followers: 1200,
    upcomingSessions: 1,
    clipCount: 4,
  },
];

const comments: ClipComment[] = [];
const sessions: SessionCard[] = [];

describe('ClipFeed', () => {
  beforeAll(() => {
    Object.defineProperty(HTMLMediaElement.prototype, 'play', {
      configurable: true,
      value: jest.fn().mockResolvedValue(undefined),
    });
    Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
      configurable: true,
      value: jest.fn(),
    });
  });

  afterEach(() => {
    (HTMLMediaElement.prototype.play as jest.Mock).mockClear();
    (HTMLMediaElement.prototype.pause as jest.Mock).mockClear();
  });

  it('plays and pauses a clip when the media surface is toggled', async () => {
    render(
      <ClipFeed
        clips={[baseClip]}
        creators={creators}
        comments={comments}
        sessions={sessions}
        onJoinSession={jest.fn()}
        savedClipIds={[]}
        savedOnly={false}
        onToggleSave={jest.fn()}
      />,
    );

    const media = screen.getByTestId(`clip-media-${baseClip.id}`);
    await userEvent.click(media);
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();

    await userEvent.click(media);
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
  });
});
