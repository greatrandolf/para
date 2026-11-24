import { render, screen } from '@testing-library/react-native';

import { ActivityScreen } from './ActivityScreen';

jest.mock('expo-router', () => ({ router: { replace: jest.fn(), navigate: jest.fn() } }));

describe('ActivityScreen', () => {
  it('shows the Coming soon placeholder in the commuter top bar style', async () => {
    await render(<ActivityScreen />);
    expect(screen.getByTestId('screen-activity')).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Activity' })).toBeOnTheScreen();
    expect(screen.getByText('Coming soon')).toBeOnTheScreen();
    expect(screen.getByText('Para Live')).toBeOnTheScreen();
    expect(screen.getByText('₱45.00')).toBeOnTheScreen();
  });
});
