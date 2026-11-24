import { fireEvent, render, screen } from '@testing-library/react-native';
import { Alert, Linking } from 'react-native';

import { EarningsPoolScreen } from './EarningsPoolScreen';
import { dayLabel, exactPeso, microPeso, payoutsForDay, periodRange } from './earningsText';

const mock = () => jest.requireMock('@packages/tanstack/query/driver').mockPayouts;
const earnings = () => jest.requireMock('@/hooks/useDriverEarnings').mockEarnings;

const unit = (vehicleId: string, unitCode: string, views: number, driverMicro: number) => ({
  vehicleId,
  unitCode,
  plate: `${unitCode}-P`,
  routeCode: '17B',
  ownerUid: 'f1',
  views,
  driverMicro,
  unitEarnedMicro: driverMicro / 0.6,
});

describe('EarningsPoolScreen (driver-unit-earnings)', () => {
  it('shows today, the history and the fleet payouts — and no old mock content', async () => {
    await render(<EarningsPoolScreen />);
    expect(screen.getByTestId('screen-earnings')).toBeOnTheScreen();
    expect(screen.getByTestId('today-by-unit')).toBeOnTheScreen();
    expect(screen.getByText('No ₱1 views yet today.')).toBeOnTheScreen();
    expect(screen.getByText('Earnings by unit')).toBeOnTheScreen();
    expect(screen.getByTestId('earnings-empty')).toBeOnTheScreen();
    expect(screen.getByText('Payouts from your fleet')).toBeOnTheScreen();
    for (const old of ['Instant GCash Cash-in', 'Guaranteed Base Duty Wage', 'Shared Route 17B Bonus Pool']) {
      expect(screen.queryByText(old)).toBeNull();
    }
  });

  it("shows today's earnings per unit driven, live", async () => {
    Object.assign(earnings(), {
      views: 5,
      driver: 2.4,
      units: [
        { vehicleId: 'v1', unitCode: 'PARA-00001', plate: 'GMD-7234', routeCode: '17B', views: 3, driver: 1.8 },
        { vehicleId: 'v7', unitCode: 'PARA-00007', plate: 'ABC-1234', routeCode: '17B', views: 2, driver: 0.6 },
      ],
    });
    await render(<EarningsPoolScreen />);
    expect(screen.getByTestId('today-total')).toHaveTextContent('₱2.40');
    expect(screen.getByTestId('today-unit-PARA-00001')).toHaveTextContent('GMD-7234 • 17B • 3 views', { exact: false });
    expect(screen.getByTestId('today-unit-PARA-00001')).toHaveTextContent('₱1.80', { exact: false });
    expect(screen.getByTestId('today-unit-PARA-00007')).toHaveTextContent('₱0.60', { exact: false });
  });

  it('shows a period by unit, each day with its units and payout, and a day down to each ₱1 view', async () => {
    mock().summary = {
      from: '2026-11-16',
      to: '2026-11-18',
      days: [
        {
          day: '2026-11-17',
          views: 5,
          driverMicro: 2_400_000,
          unitEarnedMicro: 4_000_000,
          driverPct: 60,
          units: [unit('v1', 'PARA-00001', 3, 1_800_000), unit('v7', 'PARA-00007', 2, 600_000)],
        },
      ],
      totals: {
        views: 5,
        driverMicro: 2_400_000,
        unitEarnedMicro: 4_000_000,
        units: [unit('v1', 'PARA-00001', 3, 1_800_000), unit('v7', 'PARA-00007', 2, 600_000)],
      },
      fleets: { f1: 'Mabolo Transport' },
    };
    mock().list = [
      {
        settlementId: 's1',
        fleetName: 'Mabolo Transport',
        periodStart: '2026-11-16',
        periodEnd: '2026-11-17',
        status: 'paid',
        receiptNo: 'PR-000007',
        payCentavos: 240,
        views: 5,
        gcashMasked: '0917 ••• 0001',
        payoutId: 'p1',
        driverResponse: null,
      },
    ];
    mock().days = {
      '2026-11-17': [
        {
          day: mock().summary.days[0],
          next: null,
          entries: [
            {
              id: 'e1',
              at: Date.parse('2026-11-17T09:42:00+08:00'),
              vehicleId: 'v7',
              unitCode: 'PARA-00007',
              plate: 'PARA-00007-P',
              routeCode: '17B',
              direction: 'inbound',
              sharedWith: 2,
              unitShareMicro: 500_000,
              driverMicro: 300_000,
            },
            {
              id: 'e2',
              at: Date.parse('2026-11-17T07:05:00+08:00'),
              vehicleId: 'v1',
              unitCode: 'PARA-00001',
              plate: 'PARA-00001-P',
              routeCode: '17B',
              direction: 'outbound',
              sharedWith: 8,
              unitShareMicro: 125_000,
              driverMicro: 75_000,
            },
          ],
        },
      ],
    };
    await render(<EarningsPoolScreen />);
    expect(screen.getByTestId('period-total')).toHaveTextContent('₱2.40');
    expect(screen.getByTestId('period-unit-PARA-00001')).toHaveTextContent('₱1.80', { exact: false });
    expect(screen.getByTestId('period-unit-PARA-00001')).toHaveTextContent('3 views • Mabolo Transport', {
      exact: false,
    });
    const day = screen.getByTestId('day-2026-11-17');
    expect(day).toHaveTextContent('PARA-00001 ₱1.80', { exact: false });
    expect(day).toHaveTextContent('PARA-00007 ₱0.60', { exact: false });
    expect(day).toHaveTextContent('Paid • PR-000007', { exact: false });
    expect(day).toHaveTextContent("60% of your unit's ₱4.00", { exact: false });

    await fireEvent.press(screen.getByRole('button', { name: /₱2\.40/ }));
    const detail = screen.getByTestId('day-detail-2026-11-17');
    expect(detail).toHaveTextContent('PARA-00001 • PARA-00001-P • 17B', { exact: false });
    expect(screen.getByTestId('entry-e1')).toHaveTextContent('17B • shared by 2 jeepneys', { exact: false });
    expect(screen.getByTestId('entry-e1')).toHaveTextContent('+₱0.30', { exact: false });
    expect(screen.getByTestId('entry-e2')).toHaveTextContent('+₱0.0750', { exact: false });
    expect(screen.getByTestId('entry-e2')).toHaveTextContent('shared by 8 jeepneys', { exact: false });
  });

  it('switches the period', async () => {
    await render(<EarningsPoolScreen />);
    await fireEvent.press(screen.getByRole('tab', { name: 'Last week' }));
    const last = mock().summaryRange.mock.calls.at(-1)[0];
    // Last week: a whole Monday-to-Sunday week, six days apart.
    expect((Date.parse(last.to) - Date.parse(last.from)) / 86_400_000).toBe(6);
  });

  it('still opens receipts and answers payouts', async () => {
    mock().list = [
      {
        settlementId: 's1',
        fleetName: 'Fleet Officer',
        periodStart: '2026-11-09',
        periodEnd: '2026-11-15',
        views: 21,
        unitEarnedMicro: 17_000_000,
        driverMicro: 10_200_000,
        payCentavos: 1020,
        status: 'paid',
        gcashMasked: '0917 ••• 0001',
        payoutId: 'p1',
        receiptNo: 'PR-000001',
        reference: '1009876543210',
        paidAt: 1,
        driverResponse: null,
      },
    ];
    mock().receiptUrl.mockImplementation(
      (_id: string, o: { onSuccess: (u: string) => void; onSettled?: () => void }) => {
        o.onSuccess('https://example.test/documentPdf?t=abc');
        o.onSettled?.();
      },
    );
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    mock().confirm.mockImplementation((_input: unknown, o: { onSettled?: () => void }) => o.onSettled?.());
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    await render(<EarningsPoolScreen />);
    await fireEvent.press(screen.getByTestId('receipt-s1'));
    expect(open).toHaveBeenCalledWith('https://example.test/documentPdf?t=abc');
    await fireEvent.press(screen.getByTestId('received-s1'));
    expect(mock().confirm).toHaveBeenCalledWith({ settlementId: 's1', response: 'received' }, expect.any(Object));
    open.mockRestore();
    alert.mockRestore();
  });

  it('labels the header icon buttons for screen readers', async () => {
    await render(<EarningsPoolScreen />);
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Driver profile' })).toBeOnTheScreen();
  });
});

describe('earnings text', () => {
  it('weeks run Monday to Sunday; months start on the 1st', () => {
    expect(periodRange('week', '2026-11-18')).toEqual({ from: '2026-11-16', to: '2026-11-18' });
    expect(periodRange('lastWeek', '2026-11-18')).toEqual({ from: '2026-11-09', to: '2026-11-15' });
    expect(periodRange('month', '2026-11-18')).toEqual({ from: '2026-11-01', to: '2026-11-18' });
    expect(periodRange('week', '2026-11-16')).toEqual({ from: '2026-11-16', to: '2026-11-16' });
  });

  it('days, amounts and payouts read plainly', () => {
    expect(dayLabel('2026-11-18', '2026-11-18')).toBe('Today');
    expect(dayLabel('2026-11-17', '2026-11-18')).toBe('Yesterday');
    expect(microPeso(2_409_999)).toBe('₱2.40');
    expect(exactPeso(75_000)).toBe('₱0.0750');
    expect(exactPeso(300_000)).toBe('₱0.30');
    const payouts = [
      { periodStart: '2026-11-16', periodEnd: '2026-11-17', status: 'paid', receiptNo: 'PR-1' },
      { periodStart: '2026-11-17', periodEnd: '2026-11-22', status: 'unpaid', receiptNo: null },
    ] as never;
    // A mid-week request splits Nov 17 across two payouts.
    expect(payoutsForDay(payouts, '2026-11-17').map((p) => p.label)).toEqual(['Paid • PR-1', 'Payout pending']);
    expect(payoutsForDay(payouts, '2026-11-20').map((p) => p.label)).toEqual(['Payout pending']);
  });
});
