import { fireEvent, render, screen } from '@testing-library/react-native';

import type { DriverPayout } from '@packages/tanstack/query/driver';

import { FleetPayouts, weekLabel, type FleetPayoutsProps } from './FleetPayouts';

const base: DriverPayout = {
  settlementId: 'fleetA_2026-11-09',
  fleetName: 'Mabolo Transport',
  periodStart: '2026-11-09',
  periodEnd: '2026-11-15',
  views: 21,
  unitEarnedMicro: 17_000_000,
  driverMicro: 10_200_000,
  payCentavos: 1020,
  status: 'paid',
  gcashMasked: '0917 ••• 0001',
  payoutId: 'fleetA_2026-11-09_juan',
  receiptNo: 'PR-000001',
  reference: '1009876543210',
  paidAt: Date.parse('2026-11-17T10:00:00+08:00'),
  driverResponse: null,
};

const setup = async (payouts: DriverPayout[] | undefined, props: Partial<FleetPayoutsProps> = {}) => {
  const handlers = { onRetry: jest.fn(), onReceipt: jest.fn(), onReceived: jest.fn(), onProblem: jest.fn() };
  await render(<FleetPayouts payouts={payouts} loading={false} {...handlers} {...props} />);
  return handlers;
};

describe('FleetPayouts', () => {
  it('labels a Monday–Sunday week', () => {
    expect(weekLabel('2026-11-09', '2026-11-15')).toBe('Nov 9 – Nov 15');
  });

  it('explains weekly fleet payouts when there are none yet', async () => {
    await setup([]);
    expect(screen.getByText('Payouts from your fleet')).toBeOnTheScreen();
    expect(screen.getByText(/Every Monday your fleet pays last week/)).toBeOnTheScreen();
  });

  it('shows a paid week with its receipt, and the driver can open it and confirm', async () => {
    const h = await setup([base]);
    expect(screen.getByText('Nov 9 – Nov 15')).toBeOnTheScreen();
    expect(screen.getByText('Mabolo Transport • 21 views')).toBeOnTheScreen();
    expect(screen.getByText('Receipt PR-000001 • GCash 0917 ••• 0001')).toBeOnTheScreen();
    expect(screen.getByText('₱10.20')).toBeOnTheScreen();
    expect(screen.getByText('Paid')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId(`receipt-${base.settlementId}`));
    expect(h.onReceipt).toHaveBeenCalledWith(base);
    await fireEvent.press(screen.getByTestId(`received-${base.settlementId}`));
    expect(h.onReceived).toHaveBeenCalledWith(base);
    await fireEvent.press(screen.getByTestId(`problem-${base.settlementId}`));
    expect(h.onProblem).toHaveBeenCalledWith(base);
  });

  it('shows the answer instead of the buttons once the driver replied', async () => {
    await setup([{ ...base, driverResponse: { response: 'problem', note: 'Not received', at: 1 } }]);
    expect(screen.getByText('Problem reported')).toBeOnTheScreen();
    expect(screen.queryByTestId(`received-${base.settlementId}`)).toBeNull();
  });

  it('shows pending and carried weeks without receipt buttons', async () => {
    await setup([
      { ...base, status: 'unpaid', payoutId: null, receiptNo: null, reference: null, paidAt: null },
      {
        ...base,
        settlementId: 'fleetA_2026-11-02',
        periodStart: '2026-11-02',
        periodEnd: '2026-11-08',
        status: 'carried',
        payCentavos: 0,
      },
    ]);
    expect(screen.getByText('Pending')).toBeOnTheScreen();
    expect(screen.getByText('Your fleet sends this to GCash 0917 ••• 0001')).toBeOnTheScreen();
    expect(screen.getByText('Carried over')).toBeOnTheScreen();
    expect(screen.getByText('Under ₱0.01 — added to next week')).toBeOnTheScreen();
    expect(screen.queryByText('Receipt')).toBeNull();
  });

  it('offers a retry when payouts could not be loaded', async () => {
    const h = await setup(undefined, { error: 'Your payouts could not be loaded.' });
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(h.onRetry).toHaveBeenCalled();
  });
});
