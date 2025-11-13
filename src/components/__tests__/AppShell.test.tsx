import { render, screen, fireEvent } from '@testing-library/react';
import { AppShell } from '../../App';
import type { SkillTag, SessionCard, SkillClip, UserProfile, AuthUser } from '../../types';

const profile: UserProfile = {
  name: 'Jordan',
  timezone: 'UTC',
  learnTags: ['music'],
  teachTags: ['languages'],
  availability: ['Morning'],
  bio: 'Polyglot',
};

const authUser: AuthUser = {
  id: 'user@example.com',
  name: 'Jordan',
  email: 'user@example.com',
  provider: 'email',
};

const noop = () => {};

describe('AppShell user menu', () => {
  it('opens dropdown and routes to saved clips', () => {
    const handleSaved = jest.fn();
    render(
      <AppShell
        theme="light"
        phase="discovery"
        profile={profile}
        authUser={authUser}
        feedback={null}
        statusMessage={null}
        homeView="sessions"
        searchQuery=""
        onSearchChange={noop}
        categories={['music' as SkillTag]}
        selectedCategory="all"
        onSelectCategory={noop}
        onReturnHome={noop}
        onProfileClick={noop}
        onOpenSavedClips={handleSaved}
        onSelectView={noop}
        onToggleTheme={noop}
        isLoadingContent={false}
        navHidden={false}
        onSignOut={noop}
      >
        <div>content</div>
      </AppShell>,
    );

    fireEvent.click(screen.getByTestId('user-menu-trigger'));
    fireEvent.click(screen.getByRole('button', { name: /Saved clips/i }));
    expect(handleSaved).toHaveBeenCalled();
  });
});
