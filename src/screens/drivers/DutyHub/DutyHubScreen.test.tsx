import { formatPeso } from '@/utils/currency';
import { act, fireEvent, render, screen, within } from '@testing-library/react-native';

import { DutyHubScreen, REPORT_FEEDBACK_MS } from './DutyHubScreen';

describe('DutyHubScreen', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the design content', async () => {
    await render(<DutyHubScreen />);
    expect(screen.getByTestId('screen-duty-hub')).toBeOnTheScreen();
    expect(screen.getByText('DRIVER HUB')).toBeOnTheScreen();
    expect(screen.getByText('ON DUTY')).toBeOnTheScreen();
    expect(screen.getAllByText('DRV-0042').length).toBeGreaterThan(0);
    expect(screen.getByTestId('my-assignment')).toBeOnTheScreen();
    expect(screen.getByTestId('broadcast-card')).toBeOnTheScreen();
    expect(screen.getByTestId('tracking-toggle')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Report Delay / Issue' })).toBeOnTheScreen();
    expect(screen.getByText("TODAY'S INSTANT DAILY EARNINGS")).toBeOnTheScreen();
    expect(screen.getByTestId('today-views')).toHaveTextContent('No views shared with your unit yet today.');
    // Shared-view-earnings: no Route View Bonus Pool and no ₱20 duty base.
    expect(screen.queryByText('Route View Bonus Pool Sharing')).toBeNull();
    expect(screen.queryByText(/Duty Base/)).toBeNull();
    expect(screen.getByText('Dispatcher Support')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Call Hotline' })).toBeOnTheScreen();
  });

  // driver-pay-balance: today's earnings are only today; "To be paid" is everything not paid yet, across days.
  it('shows what is still to be paid next to today', async () => {
    jest.requireMock('@packages/tanstack/query/driver').mockPayouts.balance = {
      toPayMicro: 1_440_000,
      toPayViews: 5,
      settledUnpaid: { driverMicro: 1_440_000, views: 5, payCentavos: 144 },
      pending: { views: 0, driverMicro: 0, sources: {} },
    };
    await render(<DutyHubScreen />);
    expect(screen.getByTestId('to-pay-amount')).toHaveTextContent('₱1.44');
    expect(screen.getByTestId('to-pay')).toHaveTextContent('5 views since your last payout', { exact: false });
  });

  // Fleet-driver-payouts: the fleet pays weekly by GCash (no more daily 11:59 PM auto-release).
  it('says the fleet pays weekly by GCash', async () => {
    await render(<DutyHubScreen />);
    expect(screen.getByTestId('payout-note')).toHaveTextContent('Paid weekly by Fleet Officer to your GCash every Monday');
    expect(screen.queryByText(/11:59 PM/)).toBeNull();
  });

  it("shows today's shared ₱1 views and the driver's percentage share of the unit", async () => {
    Object.assign(jest.requireMock('@/hooks/useDriverEarnings').mockEarnings, {
      views: 12,
      driver: 0.9,
      unit: 1.5,
      driverPct: 60,
    });
    await render(<DutyHubScreen />);
    expect(screen.getByTestId('today-earnings')).toHaveTextContent(formatPeso(0.9));
    expect(screen.getByTestId('today-views')).toHaveTextContent(`12 views today • 60% of your unit's ${formatPeso(1.5)}`);
  });

  it('shows the percentage the backend used (dynamic share)', async () => {
    Object.assign(jest.requireMock('@/hooks/useDriverEarnings').mockEarnings, {
      views: 1,
      driver: 0.07,
      unit: 0.1,
      driverPct: 70,
    });
    await render(<DutyHubScreen />);
    expect(screen.getByTestId('today-views')).toHaveTextContent(`1 view today • 70% of your unit's ${formatPeso(0.1)}`);
  });

  it('Stop Tracking puts the assignment on break', async () => {
    const duty = jest.requireMock('@/hooks/useDuty').mockDuty;
    await render(<DutyHubScreen />);
    expect(screen.getByText('BROADCASTING LIVE')).toBeOnTheScreen();
    expect(within(screen.getByTestId('my-assignment')).getByText('In service')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Stop Tracking (Break)' }));
    expect(duty.setBreak).toHaveBeenCalledWith(true);
  });

  it('shows the break and Resume Tracking ends it', async () => {
    const duty = jest.requireMock('@/hooks/useDuty').mockDuty;
    duty.dutyStatus = 'on_break';
    duty.tracking = { state: 'off' };
    await render(<DutyHubScreen />);
    expect(screen.getByText('ON BREAK')).toBeOnTheScreen();
    expect(screen.getByText('TRACKING PAUSED • NO GPS SENT')).toBeOnTheScreen();
    expect(within(screen.getByTestId('my-assignment')).getByText('On break')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Resume Tracking' }));
    expect(duty.setBreak).toHaveBeenCalledWith(false);
  });

  it('cannot toggle tracking without an assignment', async () => {
    const duty = jest.requireMock('@/hooks/useDuty').mockDuty;
    duty.assignmentId = null;
    duty.dutyStatus = 'off_duty';
    duty.tracking = { state: 'off' };
    await render(<DutyHubScreen />);
    expect(screen.getByText('NO ASSIGNED VEHICLE')).toBeOnTheScreen();
    expect(screen.getByText('LIVE GPS DISABLED')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Start Tracking' })).toBeDisabled();
  });

  it('offers Settings when location permission is denied', async () => {
    const duty = jest.requireMock('@/hooks/useDuty').mockDuty;
    duty.tracking = { state: 'denied', message: 'Allow location for Para in Settings.' };
    await render(<DutyHubScreen />);
    expect(screen.getByText('LOCATION OFF')).toBeOnTheScreen();
    expect(screen.getByText('Allow location for Para in Settings.')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Open Settings' })).toBeOnTheScreen();
  });

  it('shows Reported! and reverts after the feedback delay', async () => {
    jest.useFakeTimers();
    await render(<DutyHubScreen />);

    await fireEvent.press(screen.getByTestId('report-delay'));
    expect(screen.getByRole('button', { name: 'Reported!' })).toBeOnTheScreen();

    await act(async () => {
      jest.advanceTimersByTime(REPORT_FEEDBACK_MS - 100);
    });
    expect(screen.getByRole('button', { name: 'Reported!' })).toBeOnTheScreen();

    await act(async () => {
      jest.advanceTimersByTime(200);
    });
    expect(screen.getByRole('button', { name: 'Report Delay / Issue' })).toBeOnTheScreen();
  });

  it('clears the report timer on unmount', async () => {
    jest.useFakeTimers();
    const clearSpy = jest.spyOn(globalThis, 'clearTimeout');
    const { unmount } = await render(<DutyHubScreen />);
    await fireEvent.press(screen.getByTestId('report-delay'));

    await unmount();

    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });
});
