import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import { PinLockScreen } from './PinLockScreen';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({}),
  Redirect: () => null,
}));

// The session mock from jest.setup.ts (one shared object), so tests can switch its state.
const session = jest.requireMock('@/hooks/useSession').mockSession as {
  pin: string;
  createPin: jest.Mock;
  unlock: jest.Mock;
  signOutPhone: jest.Mock;
};

const type = async (digits: string) => {
  for (const d of digits) await act(async () => fireEvent.press(screen.getByTestId(`pin-key-${d}`)));
};

describe('PinLockScreen', () => {
  beforeEach(() => jest.clearAllMocks());
  afterEach(() => {
    session.pin = 'unlocked';
  });

  it('sets a PIN after asking for it twice', async () => {
    session.pin = 'setup';
    await render(<PinLockScreen />);
    expect(screen.getByText('Set a PIN for this phone')).toBeOnTheScreen();
    await type('482913');
    expect(screen.getByText('Enter the PIN again')).toBeOnTheScreen();
    await type('482913');
    expect(session.createPin).toHaveBeenCalledWith('482913');
    expect(router.replace).toHaveBeenCalledWith('/duty');
  });

  it('starts over when the two PINs differ', async () => {
    session.pin = 'setup';
    await render(<PinLockScreen />);
    await type('482913');
    await type('111111');
    expect(session.createPin).not.toHaveBeenCalled();
    expect(screen.getByTestId('pin-message')).toHaveTextContent('The PINs did not match. Choose a PIN again.');
  });

  it('unlocks with the PIN and shows tries left when wrong', async () => {
    session.pin = 'locked';
    session.unlock.mockResolvedValueOnce({ ok: false, attemptsLeft: 4 });
    await render(<PinLockScreen />);
    expect(screen.getByText('Welcome back, Ernesto')).toBeOnTheScreen();
    await type('000000');
    expect(screen.getByTestId('pin-message')).toHaveTextContent('Wrong PIN. 4 tries left.');
    await type('482913');
    expect(router.replace).toHaveBeenCalledWith('/duty');
  });

  it('can sign the phone out from the lock screen', async () => {
    session.pin = 'locked';
    await render(<PinLockScreen />);
    await act(async () => fireEvent.press(screen.getByTestId('pin-forgot')));
    expect(session.signOutPhone).toHaveBeenCalled();
  });
});
