import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { Alert } from 'react-native';

import * as driverService from '@/services/driverService';

import { DriverProfileScreen } from './DriverProfileScreen';

jest.mock('expo-router', () => ({ router: { replace: jest.fn(), navigate: jest.fn() } }));

describe('DriverProfileScreen', () => {
  beforeEach(() => jest.clearAllMocks());
  afterEach(() => jest.restoreAllMocks());

  it('renders the design content', async () => {
    await render(<DriverProfileScreen />);
    expect(screen.getByTestId('screen-driver-profile')).toBeOnTheScreen();
    expect(screen.getByText('Ernesto V. Santos')).toBeOnTheScreen();
    expect(screen.getByText('Active Master')).toBeOnTheScreen();
    expect(screen.getByText('4.9')).toBeOnTheScreen();
    expect(screen.getByText('2,410 safe trips')).toBeOnTheScreen();
    expect(screen.getByText('LTFRB Modern PUV Verified')).toBeOnTheScreen();
    expect(screen.getByText('RTK Telemetry Certified')).toBeOnTheScreen();
    expect(screen.getByText('Clean Driving Record 2026')).toBeOnTheScreen();
    expect(screen.getByText('96.4%')).toBeOnTheScreen();
    expect(screen.getByText('8.2 hrs')).toBeOnTheScreen();
    expect(screen.getByText('92/100')).toBeOnTheScreen();
    expect(screen.getByText('Assigned Unit & Route')).toBeOnTheScreen();
    expect(screen.getByText('GMD-1782')).toBeOnTheScreen();
    expect(screen.getByText('Isuzu NLR Class 2')).toBeOnTheScreen();
    expect(screen.getByText('Cooperative & Payouts')).toBeOnTheScreen();
    expect(screen.getByText('GCash Transit Wallet')).toBeOnTheScreen();
    expect(screen.getByText('0917-882-9421')).toBeOnTheScreen();
    expect(screen.getByText('₱42,150.00')).toBeOnTheScreen();
    expect(screen.getByText('Compliance & Document Vault')).toBeOnTheScreen();
    expect(screen.getByText('3 / 3 Valid')).toBeOnTheScreen();
    expect(screen.getByText("Professional Driver's License")).toBeOnTheScreen();
    expect(screen.getByText('LTFRB Operator CPC Franchise')).toBeOnTheScreen();
    expect(screen.getByText('PhilHealth & SSS Transit ID')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'End Shift & Submit Daily Manifest' })).toBeOnTheScreen();
    expect(screen.getByText('PARA OPERATOR V2.4.1 • CCSTC FLEET ID: 0042')).toBeOnTheScreen();
  });

  it('toggles the GCash payout switch', async () => {
    await render(<DriverProfileScreen />);
    const toggle = screen.getByRole('switch', { name: 'GCash daily auto-payout' });
    expect(toggle.props.value).toBe(true);

    await fireEvent(toggle, 'valueChange', false);
    expect(screen.getByTestId('gcash-switch').props.value).toBe(false);

    await fireEvent(screen.getByTestId('gcash-switch'), 'valueChange', true);
    expect(screen.getByTestId('gcash-switch').props.value).toBe(true);
  });

  it('has no sign-out: the day ends with End Shift', async () => {
    await render(<DriverProfileScreen />);
    expect(screen.queryByRole('button', { name: 'Sign out' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Change PIN' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'End Shift & Submit Daily Manifest' })).toBeOnTheScreen();
  });

  /** Presses End Shift and the dialog's "End Shift" button. Returns the dialog's title and message. */
  const confirmEndShift = async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    await fireEvent.press(screen.getByTestId('end-shift'));
    const [title, message, buttons] = alert.mock.calls[0];
    await act(async () => {
      buttons?.find((b) => b.text === 'End Shift')?.onPress?.();
    });
    return { title, message, alert };
  };

  it('ends the shift: completes the assignment, then locks the app behind the PIN', async () => {
    const session = jest.requireMock('@/hooks/useSession').mockSession;
    const duty = jest.requireMock('@/hooks/useDuty').mockDuty;
    await render(<DriverProfileScreen />);
    const { title, message } = await confirmEndShift();
    expect(title).toBe('End shift and submit manifest?');
    expect(message).toContain('completes your assignment on U-08');
    expect(duty.endShift).toHaveBeenCalled();
    expect(session.lock).toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith('/pin');
  });

  it('keeps the app open when the shift cannot be ended', async () => {
    const session = jest.requireMock('@/hooks/useSession').mockSession;
    const duty = jest.requireMock('@/hooks/useDuty').mockDuty;
    duty.endShift.mockRejectedValueOnce(new Error('No connection.'));
    await render(<DriverProfileScreen />);
    const { alert } = await confirmEndShift();
    expect(alert).toHaveBeenLastCalledWith('Shift not ended', 'No connection.');
    expect(session.lock).not.toHaveBeenCalled();
  });

  it('only locks the app when there is no assignment to end', async () => {
    const session = jest.requireMock('@/hooks/useSession').mockSession;
    const duty = jest.requireMock('@/hooks/useDuty').mockDuty;
    duty.assignmentId = null;
    await render(<DriverProfileScreen />);
    const { title } = await confirmEndShift();
    expect(title).toBe('End shift?');
    expect(duty.endShift).not.toHaveBeenCalled();
    expect(session.lock).toHaveBeenCalled();
  });

  it('does nothing when the driver cancels', async () => {
    const session = jest.requireMock('@/hooks/useSession').mockSession;
    const duty = jest.requireMock('@/hooks/useDuty').mockDuty;
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    await render(<DriverProfileScreen />);
    await fireEvent.press(screen.getByTestId('end-shift'));
    expect(alert).toHaveBeenCalled();
    expect(duty.endShift).not.toHaveBeenCalled();
    expect(session.lock).not.toHaveBeenCalled();
  });

  // Regression (D11): the profile avatar hardcoded initials="ES" instead of driver data.
  it('takes the profile avatar initials from the driver identity', async () => {
    const real = driverService.getDriverIdentity();
    const spy = jest.spyOn(driverService, 'getDriverIdentity').mockReturnValue({ ...real, fullInitials: 'XY' });
    await render(<DriverProfileScreen />);
    expect(screen.getByText('XY')).toBeOnTheScreen();
    spy.mockRestore();
  });
});
