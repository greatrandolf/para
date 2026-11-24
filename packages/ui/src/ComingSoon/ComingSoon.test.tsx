import { render, screen } from '@testing-library/react-native';

import { ComingSoon } from './ComingSoon';

describe('ComingSoon', () => {
  // Regression (D9): the Badge default `alignSelf: 'flex-start'` left the badge at the
  // card's left edge. ComingSoon must centre it through its own styles.
  it('centres the "Coming soon" badge', async () => {
    await render(<ComingSoon icon="history" title="Activity" description="Soon." />);
    expect(screen.getByTestId('coming-soon-badge')).toHaveStyle({ alignSelf: 'center' });
  });
});
