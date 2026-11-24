import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import { GoogleButton } from './GoogleButton';

jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));

let mockMode = 'native';
jest.mock('@/services/googleSignIn', () => ({
  googleSignInMode: () => mockMode,
  EMULATOR_GOOGLE_USER: { email: 'google.commuter@para.test' },
}));

const session = jest.requireMock('@/hooks/useSession').mockSession as { signInWithGoogle: jest.Mock };

describe('GoogleButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMode = 'native';
  });

  it('signs in with Google and opens the commuter app', async () => {
    const onError = jest.fn();
    await render(<GoogleButton onError={onError} />);
    await act(async () => fireEvent.press(screen.getByRole('button', { name: 'Continue with Google' })));
    expect(session.signInWithGoogle).toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith('/commute');
    expect(screen.queryByTestId('google-emulator-note')).toBeNull();
  });

  it('stays put when the user closes the Google picker', async () => {
    session.signInWithGoogle.mockResolvedValueOnce(false);
    await render(<GoogleButton onError={jest.fn()} />);
    await act(async () => fireEvent.press(screen.getByTestId('google-sign-in')));
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('reports errors to the screen', async () => {
    session.signInWithGoogle.mockRejectedValueOnce(new Error('Google sign-in is not turned on.'));
    const onError = jest.fn();
    await render(<GoogleButton onError={onError} />);
    await act(async () => fireEvent.press(screen.getByTestId('google-sign-in')));
    expect(onError).toHaveBeenLastCalledWith('Google sign-in is not turned on.');
  });

  it('says which test account the emulator uses', async () => {
    mockMode = 'emulator';
    await render(<GoogleButton onError={jest.fn()} />);
    expect(screen.getByTestId('google-emulator-note')).toBeOnTheScreen();
  });

  it('is hidden when Google sign-in is not set up', async () => {
    mockMode = 'unavailable';
    await render(<GoogleButton onError={jest.fn()} />);
    expect(screen.queryByTestId('google-sign-in')).toBeNull();
  });
});
