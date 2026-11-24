import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { Platform } from 'react-native';

import { ActivateDeviceScreen, looksLikeActivation } from './ActivateDeviceScreen';

let mockParams: { code?: string } = {};
jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
  useLocalSearchParams: () => mockParams,
  Redirect: () => null,
}));
jest.mock('expo-camera', () => ({
  CameraView: () => null,
  useCameraPermissions: () => [{ granted: true }, jest.fn()],
}));

// The session mock from jest.setup.ts (one shared object), so tests can switch its state.
const session = jest.requireMock('@/hooks/useSession').mockSession as {
  status: string;
  activate: jest.Mock;
};
const CODE = 'p2lZ9CAmJjJfv6vFdbdHN1qcCdN8xqfuL442-k05FMc';

describe('ActivateDeviceScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    session.status = 'signedOut';
    mockParams = {};
  });
  afterAll(() => {
    session.status = 'driver';
  });

  it('recognises only Para activation codes', () => {
    expect(looksLikeActivation(`para://activate?code=${CODE}`)).toBe(true);
    expect(looksLikeActivation(CODE)).toBe(true);
    expect(looksLikeActivation('https://example.com')).toBe(false);
  });

  it('offers scanning, and activates from a pasted link', async () => {
    await render(<ActivateDeviceScreen />);
    expect(screen.getByText('Activate the driver app')).toBeOnTheScreen();
    if (Platform.OS !== 'web') expect(screen.getByTestId('activate-scan')).toBeOnTheScreen();
    await act(async () => fireEvent.press(screen.getByText('Paste link instead')));
    await act(async () => fireEvent.changeText(screen.getByTestId('activate-input'), `para://activate?code=${CODE}`));
    await act(async () => fireEvent.press(screen.getByTestId('activate-submit')));
    expect(session.activate).toHaveBeenCalledWith(`para://activate?code=${CODE}`);
    expect(router.replace).toHaveBeenCalledWith('/pin');
  });

  it('activates straight from the deep link', async () => {
    mockParams = { code: CODE };
    await render(<ActivateDeviceScreen />);
    await act(async () => undefined);
    expect(session.activate).toHaveBeenCalledWith(CODE);
  });

  it('shows why activation failed', async () => {
    session.activate.mockRejectedValueOnce(new Error('This code has expired. Ask your fleet to show a new one.'));
    mockParams = { code: CODE };
    await render(<ActivateDeviceScreen />);
    await act(async () => undefined);
    expect(screen.getByTestId('activate-error')).toBeOnTheScreen();
    expect(screen.getByText('This code has expired. Ask your fleet to show a new one.')).toBeOnTheScreen();
  });
});
