import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import { mockSessions } from './data/mockSessions';
import { mockCreators } from './data/mockCreators';
import { mockClips } from './data/mockClips';
import { mockClipComments } from './data/mockClipComments';

jest.mock('./services/api', () => ({
  fetchSessions: () => Promise.resolve(mockSessions),
  fetchCreators: () => Promise.resolve(mockCreators),
  fetchClips: () => Promise.resolve(mockClips),
  fetchClipComments: () => Promise.resolve(mockClipComments),
}));

jest.mock('./services/matchmaking', () => ({
  requestMatch: (session: unknown) => Promise.resolve(session),
}));

describe('App integration', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(() => ({
        matches: false,
        media: '',
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  it('renders discovery content after onboarding', async () => {
    render(<App />);

    const heroCta = screen.getByRole('button', { name: /start exploring/i });
    fireEvent.click(heroCta);

    const displayNameField = await screen.findByPlaceholderText(/your name/i);
    fireEvent.change(displayNameField, { target: { value: 'Alex Creator' } });

    const emailField = screen.getByPlaceholderText(/you@example.com/i);
    fireEvent.change(emailField, { target: { value: 'alex@example.com' } });

    const ageField = screen.getByPlaceholderText(/13\+/i);
    fireEvent.change(ageField, { target: { value: '20' } });

    const continueButton = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(continueButton);

    const onboardingCta = await screen.findByRole('button', { name: /start exploring/i });
    fireEvent.click(onboardingCta);

    expect(await screen.findByText(/Here’s what matches your vibe today./i)).toBeInTheDocument();
  });
});
