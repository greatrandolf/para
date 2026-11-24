import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { router } from 'expo-router';

import * as commuterService from '@/services/commuterService';

import { CommuteHubScreen } from './CommuteHubScreen';

jest.mock('expo-router', () => ({ router: { replace: jest.fn(), navigate: jest.fn() } }));

const ROUTE_CODES = ['17B', '04L'];

const visibleCodes = () => ROUTE_CODES.filter((code) => screen.queryByTestId(`route-card-${code}`) !== null);

const nearby = () => jest.requireMock('@/screens/commuters/LiveTracking/useRoutesOnMyWay').mockRoutesOnMyWay;

describe('CommuteHubScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows no watch banner without a "Notify me" watch', async () => {
    await render(<CommuteHubScreen />);
    expect(screen.queryByTestId('jeep-watch-banner')).toBeNull();
  });

  it('shows the free watch with minutes left, and Cancel stops it (jeep-coming-alert)', async () => {
    const watch = jest.requireMock('@/hooks/useJeepWatch').mockWatch;
    Object.assign(watch, { watch: { status: 'watching', until: Date.now() + 1_800_000 }, minutesLeft: 30 });
    await render(<CommuteHubScreen />);
    expect(screen.getByText('Watching for jeepneys coming your way')).toBeOnTheScreen();
    expect(screen.getByTestId('jeep-watch-banner-subtitle')).toHaveTextContent(/Free • 30 min left/);
    fireEvent.press(screen.getByRole('button', { name: 'Stop watching' }));
    expect(watch.cancel).toHaveBeenCalledTimes(1);
  });

  it('when a jeepney is coming, offers the ₱1 live view', async () => {
    const watch = jest.requireMock('@/hooks/useJeepWatch').mockWatch;
    Object.assign(watch, {
      watch: { status: 'coming', until: Date.now() + 600_000, coming: { count: 1, routeCodes: ['17B'], at: 0 } },
      minutesLeft: 10,
    });
    await render(<CommuteHubScreen />);
    expect(screen.getByText('17B is coming your way')).toBeOnTheScreen();
    expect(screen.getByTestId('jeep-watch-banner-view')).toHaveTextContent(/₱1(\.00)? view live/);
  });

  it('greets the signed-in commuter by the name they registered with', async () => {
    Object.assign(jest.requireMock('@/hooks/useSession').mockSession, {
      status: 'commuter',
      user: { uid: 'c1', displayName: 'Juan Dela Cruz', email: 'juan@example.com' },
    });
    await render(<CommuteHubScreen />);
    expect(screen.getByText('Mabuhay, Juan! 👋')).toBeOnTheScreen();
    expect(screen.getByLabelText('Avatar JC')).toBeOnTheScreen();
  });

  it('renders the design content', async () => {
    await render(<CommuteHubScreen />);
    expect(screen.getByTestId('screen-commute-hub')).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('Search route, terminal, or stop (e.g. Colon)')).toBeOnTheScreen();
    // Counted by live jeepneys, not routes: two routes listed, one jeepney live.
    expect(screen.getByText('All Transit (1)')).toBeOnTheScreen();
    expect(screen.getByText('Jeepneys Only (1)')).toBeOnTheScreen();
    expect(screen.getByText('Buses Only (0)')).toBeOnTheScreen();
    expect(screen.getAllByText('₱45.00').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole('button', { name: 'Cash-in' })).toBeOnTheScreen();
    expect(screen.getByText('Approved Transit Routes')).toBeOnTheScreen();
    expect(screen.getByText('Routes on your way • Live jeeps on the road')).toBeOnTheScreen();
    expect(screen.getByText('Recent Viewing Activity')).toBeOnTheScreen();
    expect(screen.getByText('Walay Driver = ₱0 Deduction Guarantee')).toBeOnTheScreen();
  });

  // Revision 10: routes on the commuter's way from the backend, with live jeeps on the road per direction.
  it('lists the routes on the way with jeeps on the road in each direction', async () => {
    await render(<CommuteHubScreen />);
    expect(visibleCodes()).toEqual(['17B', '04L']);

    const card = within(screen.getByTestId('route-card-17B'));
    expect(card.getByText('Apas ⇄ Sto. Niño')).toBeOnTheScreen();
    expect(card.getByText('Route #17B')).toBeOnTheScreen();
    expect(card.getByText('Apas → Sto. Niño')).toBeOnTheScreen();
    expect(card.getAllByText('1 on road')).toHaveLength(2); // the total badge and the outbound row
    const directions = within(screen.getByTestId('route-directions-17B'));
    expect(directions.getByText('Going to Sto. Niño')).toBeOnTheScreen();
    expect(directions.getByText('Going back to Apas')).toBeOnTheScreen();
    expect(directions.getAllByText(/on road$/).map((t) => t.props.children)).toEqual(['1 on road', '0 on road']);
    expect(card.getByText('14.8 km • 4 Stops')).toBeOnTheScreen();
    expect(card.getByText('₱15.00')).toBeOnTheScreen();
    expect(card.getByText('Live map locked • Pay ₱1')).toBeOnTheScreen();
  });

  it('never shows arrival times or approaching jeeps', async () => {
    await render(<CommuteHubScreen />);
    expect(screen.queryByText(/ETA/)).toBeNull();
    expect(screen.queryByText(/approach/i)).toBeNull();
  });

  it('shows a route with no jeep on the road as no-charge with a disabled button', async () => {
    await render(<CommuteHubScreen />);
    const card = within(screen.getByTestId('route-card-04L'));
    expect(card.getByText('0 on road (Offline)')).toBeOnTheScreen();
    expect(card.getByText('Walay Available Driver')).toBeOnTheScreen();
    expect(card.getByText('₱0 (No Charge)')).toBeOnTheScreen();
    expect(card.getByRole('button', { name: 'No Charge (₱0)' })).toBeDisabled();
    expect(card.queryByText('View Live (₱1)')).toBeNull();
  });

  it('says when routes are loading, failed, or none pass nearby', async () => {
    const saved = { ...nearby() };
    try {
      Object.assign(nearby(), { routes: [], loading: true });
      await render(<CommuteHubScreen />);
      expect(within(screen.getByTestId('routes-status')).getByText('Finding routes on your way…')).toBeOnTheScreen();

      Object.assign(nearby(), { loading: false, error: new Error('offline') });
      await render(<CommuteHubScreen />);
      expect(screen.getByText('Could not load routes: offline')).toBeOnTheScreen();

      Object.assign(nearby(), { error: null });
      await render(<CommuteHubScreen />);
      expect(screen.getByText('No routes pass near you yet.')).toBeOnTheScreen();
    } finally {
      Object.assign(nearby(), saved);
    }
  });

  it('filters routes by vehicle chip', async () => {
    await render(<CommuteHubScreen />);
    expect(visibleCodes()).toEqual(ROUTE_CODES);

    await fireEvent.press(screen.getByTestId('filter-jeepney'));
    expect(visibleCodes()).toEqual(ROUTE_CODES);
    expect(screen.getByTestId('filter-jeepney')).toBeSelected();

    await fireEvent.press(screen.getByTestId('filter-bus'));
    expect(visibleCodes()).toEqual([]);

    await fireEvent.press(screen.getByTestId('filter-all'));
    expect(visibleCodes()).toEqual(ROUTE_CODES);
  });

  it('filters by search text and shows the empty state', async () => {
    await render(<CommuteHubScreen />);
    await fireEvent.changeText(screen.getByTestId('route-search'), 'SM Cebu');
    expect(visibleCodes()).toEqual(['04L']);

    await fireEvent.changeText(screen.getByTestId('route-search'), 'zzz');
    expect(screen.getByText('No routes match your search')).toBeOnTheScreen();
    expect(visibleCodes()).toEqual([]);
  });

  it('opens the confirm drawer and cancels it', async () => {
    await render(<CommuteHubScreen />);
    await fireEvent.press(screen.getByTestId('view-live-17B'));

    const modal = within(screen.getByTestId('confirm-track-modal'));
    expect(modal.getByText('Apas ⇄ Sto. Niño')).toBeOnTheScreen();
    expect(modal.getByText('GPS View Access')).toBeOnTheScreen();
    expect(modal.getByText('₱1.00')).toBeOnTheScreen();
    expect(modal.getByText('₱44.00')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('cancel-track'));
    expect(screen.queryByTestId('confirm-track-modal')).toBeNull();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('confirms tracking and opens the Live Map on that route', async () => {
    await render(<CommuteHubScreen />);
    await fireEvent.press(screen.getByTestId('view-live-17B'));
    await fireEvent.press(screen.getByRole('button', { name: 'Confirm & Track (₱1)' }));
    expect(screen.queryByTestId('confirm-track-modal')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith({
      pathname: '/live-map',
      params: { route: '17B', at: expect.any(String) },
    });
  });

  // Revision 11: Confirm & Track buys the ₱1 pass; a second View Live on that route does not charge again.
  it('buys the live pass once and goes straight to the map after', async () => {
    jest.requireMock('@/hooks/useCommuterLocation').mockLocation.current = {
      status: 'granted',
      coordinate: { latitude: 10.3186, longitude: 123.8977 },
    };
    await render(<CommuteHubScreen />);
    await fireEvent.press(screen.getByTestId('view-live-17B'));
    await fireEvent.press(screen.getByRole('button', { name: 'Confirm & Track (₱1)' }));
    expect(screen.getAllByText('₱44.00').length).toBeGreaterThan(0);
    // The card shows the access time left instead of the price.
    expect(screen.getByTestId('live-access-17B')).toHaveTextContent('Live access • 15 min left');
    expect(within(screen.getByTestId('route-card-17B')).getByText('View Live')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('view-live-17B'));
    expect(screen.queryByTestId('confirm-track-modal')).toBeNull();
    expect(router.navigate).toHaveBeenCalledTimes(2);
    expect(screen.getAllByText('₱44.00').length).toBeGreaterThan(0);
  });

  it('opens the wallet from Cash-in and the balance pill', async () => {
    await render(<CommuteHubScreen />);
    await fireEvent.press(screen.getByTestId('cash-in-button'));
    await fireEvent.press(screen.getByTestId('balance-pill'));
    expect(router.navigate).toHaveBeenNthCalledWith(1, '/wallet');
    expect(router.navigate).toHaveBeenNthCalledWith(2, '/wallet');
  });

  it('re-opens the live map from recent activity', async () => {
    await render(<CommuteHubScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Re-open' }));
    expect(router.navigate).toHaveBeenCalledWith('/live-map');
  });

  it('clears the recent log and shows the empty state', async () => {
    await render(<CommuteHubScreen />);
    expect(screen.getByText('Viewed 12 mins ago • 2 vehicles tracked')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('clear-log'));

    expect(screen.queryByText('Viewed 12 mins ago • 2 vehicles tracked')).toBeNull();
    expect(screen.getByText('No recent views yet')).toBeOnTheScreen();
  });

  // Regression (D11): the guarantee copy hardcoded "₱45" instead of the profile balance.
  it('uses the profile balance in the guarantee copy', async () => {
    const real = commuterService.getCommuterProfile();
    const spy = jest.spyOn(commuterService, 'getCommuterProfile').mockReturnValue({ ...real, balance: 120 });
    await render(<CommuteHubScreen />);
    expect(screen.getByText(/imong ₱120 balance/)).toBeOnTheScreen();
    expect(screen.queryByText(/imong ₱45 balance/)).toBeNull();
    spy.mockRestore();
  });
});
