import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { Text as MockText } from 'react-native';

import { SignInScreen, isEmail } from './SignInScreen';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn() },
  Redirect: ({ href }: { href: string }) => <MockText testID="redirect">{href}</MockText>,
}));

const session = jest.requireMock('@/hooks/useSession').mockSession as {
  status: string;
  signIn: jest.Mock;
  resetPassword: jest.Mock;
};

describe('SignInScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    session.status = 'signedOut';
  });

  it('checks email addresses', () => {
    expect(isEmail('juan@example.com')).toBe(true);
    expect(isEmail('juan@')).toBe(false);
  });

  it('shows the form and the driver activation link', async () => {
    await render(<SignInScreen />);
    expect(screen.getByRole('header', { name: 'Para Live' })).toBeOnTheScreen();
    expect(screen.getByTestId('sign-in-email')).toBeOnTheScreen();
    expect(screen.getByTestId('sign-in-submit')).toBeOnTheScreen();
    await act(async () => fireEvent.press(screen.getByTestId('activate-driver-link')));
    expect(router.push).toHaveBeenCalledWith('/activate');
  });

  it('asks for a valid email and a password before signing in', async () => {
    await render(<SignInScreen />);
    await act(async () => fireEvent.press(screen.getByTestId('sign-in-submit')));
    expect(screen.getByText('Enter a valid email address.')).toBeOnTheScreen();
    expect(screen.getByText('Enter your password.')).toBeOnTheScreen();
    expect(session.signIn).not.toHaveBeenCalled();
  });

  it('signs in and opens the commuter app', async () => {
    await render(<SignInScreen />);
    await act(async () => fireEvent.changeText(screen.getByTestId('sign-in-email'), ' juan@example.com '));
    await act(async () => fireEvent.changeText(screen.getByTestId('sign-in-password'), 'secret123'));
    await act(async () => fireEvent.press(screen.getByTestId('sign-in-submit')));
    expect(session.signIn).toHaveBeenCalledWith(' juan@example.com ', 'secret123');
    expect(router.replace).toHaveBeenCalledWith('/commute');
  });

  it('shows why sign-in failed', async () => {
    session.signIn.mockRejectedValueOnce(new Error('The email or password is incorrect.'));
    await render(<SignInScreen />);
    await act(async () => fireEvent.changeText(screen.getByTestId('sign-in-email'), 'juan@example.com'));
    await act(async () => fireEvent.changeText(screen.getByTestId('sign-in-password'), 'nope12345'));
    await act(async () => fireEvent.press(screen.getByTestId('sign-in-submit')));
    expect(screen.getByText('The email or password is incorrect.')).toBeOnTheScreen();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('sends a password reset to the typed email', async () => {
    await render(<SignInScreen />);
    await act(async () => fireEvent.changeText(screen.getByTestId('sign-in-email'), 'juan@example.com'));
    await act(async () => fireEvent.press(screen.getByTestId('sign-in-forgot')));
    expect(session.resetPassword).toHaveBeenCalledWith('juan@example.com');
    expect(screen.getByTestId('sign-in-info')).toBeOnTheScreen();
  });

  it('sends an activated driver to the PIN screen and a commuter to the app', async () => {
    session.status = 'driver';
    await render(<SignInScreen />);
    expect(screen.getByTestId('redirect')).toHaveTextContent('/pin');
    session.status = 'commuter';
    await render(<SignInScreen />);
    expect(screen.getByTestId('redirect')).toHaveTextContent('/commute');
  });
});
