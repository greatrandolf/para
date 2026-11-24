import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import { AccountScreen } from './AccountScreen';

jest.mock('expo-router', () => ({ router: { replace: jest.fn(), navigate: jest.fn() } }));

describe('AccountScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows the Coming soon placeholder', async () => {
    await render(<AccountScreen />);
    expect(screen.getByTestId('screen-account')).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Account' })).toBeOnTheScreen();
    expect(screen.getByText('Coming soon')).toBeOnTheScreen();
  });

  it('signs out and returns to sign-in with replace', async () => {
    const session = jest.requireMock('@/hooks/useSession').mockSession;
    await render(<AccountScreen />);
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Sign out' }));
    });
    expect(session.signOutPhone).toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith('/');
  });
});
