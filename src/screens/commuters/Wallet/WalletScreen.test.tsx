import { fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { WalletScreen } from './WalletScreen';

jest.mock('expo-router', () => ({ router: { replace: jest.fn(), navigate: jest.fn() } }));

const LEDGER_REFS = ['TXN-83910', 'TXN-83742', 'CAS-19402', 'REV-00214'];
const visibleRefs = () => LEDGER_REFS.filter((ref) => screen.queryByTestId(`ledger-${ref}`) !== null);

describe('WalletScreen', () => {
  afterEach(() => jest.restoreAllMocks());

  it('renders the design content', async () => {
    await render(<WalletScreen />);
    expect(screen.getByTestId('screen-wallet')).toBeOnTheScreen();
    expect(screen.getByText('COMMUTER TRANSIT CREDITS')).toBeOnTheScreen();
    expect(screen.getByTestId('wallet-balance')).toHaveTextContent('₱45.00');
    expect(screen.getAllByText('Active Pass').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Equates to 45 vehicle live tracking sessions/)).toBeOnTheScreen();
    expect(screen.getByText('Top-Up Commuter Wallet')).toBeOnTheScreen();
    expect(screen.getByText('Zero Fee Promo')).toBeOnTheScreen();
    for (const amount of ['₱20', '₱40', '₱50', '₱100']) expect(screen.getByText(amount)).toBeOnTheScreen();
    expect(screen.getByText('POPULAR')).toBeOnTheScreen();
    expect(screen.getByText('BEST VALUE')).toBeOnTheScreen();
    for (const name of ['GCash', 'Maya', 'ShopeePay', '7-Eleven']) expect(screen.getByText(name)).toBeOnTheScreen();
    expect(screen.getByText('Transit Ledger')).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'All (18)' })).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Views (-₱1)' })).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Cash-In (+₱)' })).toBeOnTheScreen();
    expect(screen.getAllByText('-₱1.00')).toHaveLength(2);
    expect(screen.getByText('+₱50.00')).toBeOnTheScreen();
    expect(screen.getByText('₱0.00')).toBeOnTheScreen();
    expect(visibleRefs()).toEqual(LEDGER_REFS);
    expect(screen.getByText('100% Fair-Transit Guarantee')).toBeOnTheScreen();
  });

  it('defaults to ₱50 via GCash and updates the CTA after selection', async () => {
    await render(<WalletScreen />);
    expect(screen.getByRole('button', { name: 'Cash In ₱50 via GCash' })).toBeOnTheScreen();
    expect(screen.getByTestId('package-50')).toBeSelected();
    expect(screen.getByTestId('channel-gcash')).toBeSelected();

    await fireEvent.press(screen.getByTestId('package-100'));
    await fireEvent.press(screen.getByTestId('channel-maya'));

    expect(screen.getByRole('button', { name: 'Cash In ₱100 via Maya' })).toBeOnTheScreen();
    expect(screen.getByTestId('package-100')).toBeSelected();
    expect(screen.getByTestId('channel-maya')).toBeSelected();
    for (const id of ['package-20', 'package-40', 'package-50']) expect(screen.getByTestId(id)).not.toBeSelected();
    for (const id of ['channel-gcash', 'channel-shopeepay', 'channel-seven-eleven']) {
      expect(screen.getByTestId(id)).not.toBeSelected();
    }
  });

  it('filters the ledger', async () => {
    await render(<WalletScreen />);
    await fireEvent.press(screen.getByTestId('ledger-filter-views'));
    expect(visibleRefs()).toEqual(['TXN-83910', 'TXN-83742', 'REV-00214']);

    await fireEvent.press(screen.getByTestId('ledger-filter-cashin'));
    expect(visibleRefs()).toEqual(['CAS-19402']);
    expect(screen.getByText('Cash-in via GCash')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('ledger-filter-all'));
    expect(visibleRefs()).toEqual(LEDGER_REFS);
  });

  it('shows the demo alert on Cash In and keeps the balance', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    await render(<WalletScreen />);

    await fireEvent.press(screen.getByTestId('cashin-cta'));

    expect(alert).toHaveBeenCalledWith('Demo only', 'Cash-in is not available in this demo build.');
    expect(screen.getByTestId('wallet-balance')).toHaveTextContent('₱45.00');
  });
});
