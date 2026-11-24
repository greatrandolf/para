import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import { SignUpScreen, validateSignUp } from './SignUpScreen';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  Redirect: () => null,
}));

const session = jest.requireMock('@/hooks/useSession').mockSession as { status: string; signUp: jest.Mock };

const fill = async (values: Record<string, string>) => {
  for (const [field, value] of Object.entries(values)) {
    await act(async () => fireEvent.changeText(screen.getByTestId(`sign-up-${field}`), value));
  }
};

describe('SignUpScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    session.status = 'signedOut';
  });

  it('validates the form', () => {
    expect(validateSignUp({ name: '', email: 'x', password: 'short', confirm: 'other' })).toEqual({
      name: 'Enter your name.',
      email: 'Enter a valid email address.',
      password: 'At least 8 characters, with letters and numbers.',
      confirm: 'The passwords do not match.',
    });
    expect(
      validateSignUp({ name: 'Juan', email: 'juan@example.com', password: 'secret123', confirm: 'secret123' }),
    ).toEqual({});
  });

  it('creates the account and opens the commuter app', async () => {
    await render(<SignUpScreen />);
    await fill({ name: 'Juan Dela Cruz', email: 'juan@example.com', password: 'secret123', confirm: 'secret123' });
    await act(async () => fireEvent.press(screen.getByTestId('sign-up-submit')));
    expect(session.signUp).toHaveBeenCalledWith({
      name: 'Juan Dela Cruz',
      email: 'juan@example.com',
      password: 'secret123',
      confirm: 'secret123',
    });
    expect(router.replace).toHaveBeenCalledWith('/commute');
  });

  it('shows errors and does not submit an invalid form', async () => {
    await render(<SignUpScreen />);
    await fill({ name: 'Juan', email: 'juan@example.com', password: 'secret123', confirm: 'secret124' });
    await act(async () => fireEvent.press(screen.getByTestId('sign-up-submit')));
    expect(screen.getByText('The passwords do not match.')).toBeOnTheScreen();
    expect(session.signUp).not.toHaveBeenCalled();
  });

  it('shows why the account could not be created', async () => {
    session.signUp.mockRejectedValueOnce(new Error('An account with this email already exists. Sign in instead.'));
    await render(<SignUpScreen />);
    await fill({ name: 'Juan', email: 'juan@example.com', password: 'secret123', confirm: 'secret123' });
    await act(async () => fireEvent.press(screen.getByTestId('sign-up-submit')));
    expect(screen.getByText('An account with this email already exists. Sign in instead.')).toBeOnTheScreen();
  });
});
