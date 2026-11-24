import { render, screen } from '@testing-library/react-native';

import { TripsScreen } from './TripsScreen';

describe('TripsScreen', () => {
  it('shows the Coming soon placeholder in the driver top bar style', async () => {
    await render(<TripsScreen />);
    expect(screen.getByTestId('screen-trips')).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Trips' })).toBeOnTheScreen();
    expect(screen.getByText('Coming soon')).toBeOnTheScreen();
    expect(screen.getByText('DRV-0042')).toBeOnTheScreen();
    expect(screen.getByText('₱1,420.50')).toBeOnTheScreen();
  });
});
