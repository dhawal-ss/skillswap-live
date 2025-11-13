import { fireEvent, render, screen } from '@testing-library/react';
import { OnboardingFlow } from '../OnboardingFlow';

describe('OnboardingFlow', () => {
  it('completes using the default name when requirements met', () => {
    const onComplete = jest.fn();
    render(<OnboardingFlow defaultName="Alex" onComplete={onComplete} />);

    const cta = screen.getByRole('button', { name: /start exploring/i });
    expect(cta).toBeEnabled();

    fireEvent.click(cta);
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Alex',
        learnTags: expect.arrayContaining(['languages']),
      }),
    );
  });
});
