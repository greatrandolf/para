import { renderRouter, screen, waitFor } from 'expo-router/testing-library';

import { FunctionsError } from '@packages/tanstack/query/client';

/**
 * The driver app goes back to activation only when access is really gone (turned off, driver deleted, or activated
 * on another phone). No assignment, a standby unit, or a stale token keeps the phone signed in.
 */
const { driverIdOf, phoneSessionEnded } = jest.requireActual<typeof import('@/hooks/useSession')>('@/hooks/useSession');
jest.mock('expo-keep-awake', () => ({ useKeepAwake: jest.fn() }));
const { useKeepAwake } = jest.requireMock('expo-keep-awake') as { useKeepAwake: jest.Mock };

const driverModule = jest.requireMock('@packages/tanstack/query/driver');
const session = () => jest.requireMock('@/hooks/useSession').mockSession;

const meWith = (patch: object) => {
  const base = driverModule.useDriverMe();
  return jest.spyOn(driverModule, 'useDriverMe').mockReturnValue({ ...base, ...patch });
};

beforeEach(() => jest.clearAllMocks());
afterEach(() => jest.restoreAllMocks());

describe('driver access', () => {
  // The screen stays on in the driver app, so the phone never sleeps and drops the live GPS.
  it('keeps the screen awake on the driver tabs', async () => {
    await renderRouter('./src/app', { initialUrl: '/duty' });
    await waitFor(() => expect(useKeepAwake).toHaveBeenCalledWith('para-driver'));
  });

  it('stays on the duty hub with no assigned vehicle', async () => {
    const base = driverModule.useDriverMe();
    meWith({ data: { ...base.data, assignment: null } });
    jest.requireMock('@/hooks/useDuty').mockDuty.assignmentId = null;
    jest.requireMock('@/hooks/useDuty').mockDuty.dutyStatus = 'off_duty';
    await renderRouter('./src/app', { initialUrl: '/duty' });
    expect(await screen.findByText('Not assigned yet')).toBeOnTheScreen();
    expect(screen.getByText('LIVE GPS DISABLED')).toBeOnTheScreen();
    expect(session().signOutPhone).not.toHaveBeenCalled();
  });

  it('refreshes a stale token and retries instead of signing out', async () => {
    const refetch = jest.fn();
    meWith({ data: undefined, error: new FunctionsError('unauthenticated', 'Your session has ended.'), refetch });
    await renderRouter('./src/app', { initialUrl: '/duty' });
    await waitFor(() => expect(refetch).toHaveBeenCalled());
    expect(session().refreshAccess).toHaveBeenCalled();
    expect(session().signOutPhone).not.toHaveBeenCalled();
  });

  it('signs out when the session is dead', async () => {
    session().refreshAccess.mockResolvedValueOnce(false);
    meWith({ data: undefined, error: new FunctionsError('unauthenticated', 'Your session has ended.') });
    await renderRouter('./src/app', { initialUrl: '/duty' });
    await waitFor(() => expect(session().signOutPhone).toHaveBeenCalled());
  });

  it('signs out at once when the fleet turned access off', async () => {
    meWith({
      data: undefined,
      error: new FunctionsError('permission-denied', 'Your app access was turned off. Ask your fleet for a new code.'),
    });
    await renderRouter('./src/app', { initialUrl: '/duty' });
    await waitFor(() =>
      expect(session().signOutPhone).toHaveBeenCalledWith(
        'Your app access was turned off. Ask your fleet for a new code.',
      ),
    );
    expect(session().refreshAccess).not.toHaveBeenCalled();
  });

  it('does not sign out when the backend is unreachable', async () => {
    meWith({ data: undefined, error: new FunctionsError('unavailable', 'Cannot reach the Para backend.') });
    await renderRouter('./src/app', { initialUrl: '/duty' });
    expect(await screen.findByText('Cannot reach the Para backend.')).toBeOnTheScreen();
    expect(session().signOutPhone).not.toHaveBeenCalled();
  });

  it('signs this phone out once the driver is activated on another phone or access is turned off', () => {
    expect(phoneSessionEnded('s1', 's1')).toBeUndefined();
    expect(phoneSessionEnded('s2', 's1')).toMatch(/activated on another phone/);
    expect(phoneSessionEnded(null, 's1')).toMatch(/access was turned off/);
  });

  it('knows a driver sign-in from its uid', () => {
    expect(driverIdOf('driver-abc123')).toBe('abc123');
    expect(driverIdOf('driver-')).toBeUndefined();
    expect(driverIdOf('xlWMJ5kYRm')).toBeUndefined();
  });
});
