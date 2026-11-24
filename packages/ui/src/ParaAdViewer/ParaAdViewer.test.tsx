import { fireEvent, render, screen } from '@testing-library/react-native';

import { colors } from '../theme';
import { ParaAdViewer } from './ParaAdViewer';

const base = {
  businessName: 'Lechon ni Inday',
  headline: 'Best lechon in Cebu',
  imageUrl: 'https://example.test/photo.jpg',
  minutes: 3,
  onContinue: jest.fn(),
  onClose: jest.fn(),
};

describe('ParaAdViewer', () => {
  it('is a full-screen black photo viewer with the whole photo fitted', async () => {
    await render(<ParaAdViewer {...base} secondsLeft={4} testID="viewer" />);
    expect(screen.getByTestId('viewer')).toHaveStyle({ flex: 1, backgroundColor: colors.photoBackdrop });
    expect(screen.getByTestId('para-ad-photo').props.resizeMode).toBe('contain');
  });

  it('shows Sponsored, the business and headline, and keeps Continue off during the countdown', async () => {
    await render(<ParaAdViewer {...base} secondsLeft={4} />);
    expect(screen.getByText('Sponsored')).toBeTruthy();
    expect(screen.getByText('Lechon ni Inday')).toBeTruthy();
    expect(screen.getByText('Best lechon in Cebu')).toBeTruthy();
    expect(screen.getByTestId('para-ad-continue')).toBeDisabled();
    expect(screen.getByText('Live view unlocks in 4')).toBeTruthy();
  });

  it('turns Continue on at zero and calls it', async () => {
    const onContinue = jest.fn();
    await render(<ParaAdViewer {...base} secondsLeft={0} onContinue={onContinue} />);
    expect(screen.getByTestId('para-ad-continue')).toBeEnabled();
    await fireEvent.press(screen.getByTestId('para-ad-continue'));
    expect(onContinue).toHaveBeenCalled();
  });

  it('hides the close button during the countdown and shows it after', async () => {
    const onClose = jest.fn();
    await render(<ParaAdViewer {...base} secondsLeft={3} onClose={onClose} />);
    expect(screen.queryByTestId('para-ad-close')).toBeNull();
    await render(<ParaAdViewer {...base} secondsLeft={0} onClose={onClose} />);
    await fireEvent.press(screen.getByTestId('para-ad-close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows the link button only with a label', async () => {
    const onCta = jest.fn();
    await render(<ParaAdViewer {...base} secondsLeft={2} ctaLabel="Order now" onCta={onCta} />);
    await fireEvent.press(screen.getByTestId('para-ad-cta'));
    expect(onCta).toHaveBeenCalled();
    await render(<ParaAdViewer {...base} secondsLeft={2} />);
    expect(screen.queryByTestId('para-ad-cta')).toBeNull();
  });
});
