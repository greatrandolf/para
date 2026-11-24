import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { router } from 'expo-router';

import { colors } from '@/constants/theme';
const { buyLivePass } = jest.requireMock('@/hooks/useLivePass') as { buyLivePass: (code?: string) => void };

import { LiveTrackingScreen } from './LiveTrackingScreen';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), navigate: jest.fn() },
  useLocalSearchParams: () => mockParams,
}));

let mockParams: { route?: string; at?: string } = {};

const OPTIONS = [
  {
    code: '17D',
    name: 'Route 17D',
    badge: 'BEST OPTION',
    subtitle: 'Alternative route · 1 vehicle approaching',
    eta: '5 min',
    caption: 'ETA',
  },
  {
    code: '44B',
    name: 'Route 44B',
    badge: 'ALTERNATIVE',
    subtitle: '2 vehicles approaching',
    eta: '9 min',
    caption: 'ETA',
  },
  {
    code: '17B',
    name: 'Route 17B',
    badge: 'YOUR PREFERRED ROUTE',
    subtitle: '1 vehicle approaching',
    eta: '18 min',
    caption: '18m left',
  },
];

const panelFill = (id: 'apas' | 'colon') => {
  const style = screen.getByTestId(`direction-panel-${id}`).props.style as unknown;
  return (Array.isArray(style) ? Object.assign({}, ...style.flat().filter(Boolean)) : style) as {
    backgroundColor?: string;
  };
};

// Revision 11: the sheet below the map needs a ₱1 pass. Most tests check the paid view, so they buy passes first.
const payForAll = () => ['17D', '44B', '17B'].forEach((code) => buyLivePass(code));

describe('LiveTrackingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    payForAll();
  });

  it('renders the design content', async () => {
    await render(<LiveTrackingScreen />);
    expect(screen.getByTestId('screen-live-tracking')).toBeOnTheScreen();
    expect(screen.getByText('Commute Hub')).toBeOnTheScreen();
    expect(screen.getByText('Live Corridor')).toBeOnTheScreen();
    const summary = within(screen.getByTestId('route-summary'));
    expect(summary.getByText('Route 17B')).toBeOnTheScreen();
    expect(summary.getByText('YOUR PREFERRED ROUTE')).toBeOnTheScreen();
    expect(summary.getByText('5 vehicles approaching')).toBeOnTheScreen();
    expect(summary.getByText('3 min')).toBeOnTheScreen();
    expect(summary.getByText('18m left')).toBeOnTheScreen();
    expect(screen.getAllByText('Unit 14').length).toBeGreaterThan(0);
    expect(screen.getAllByText('4m away').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Unit 23/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('3m (Tracked)').length).toBeGreaterThan(0);
    expect(screen.getByTestId('live-map-canvas')).toBeOnTheScreen();
    expect(screen.getByText('Go to pickup point')).toBeOnTheScreen();
    // The map shows only the pickup point and the vehicles; other map text is hidden.
    expect(screen.queryByText('Making 1 stop first')).toBeNull();
    expect(screen.queryByText('SAFETY CENTRE')).toBeNull();
    expect(screen.getByText('Last GPS: 3s ago')).toBeOnTheScreen();
    expect(screen.getByText('VERIFIED RTK')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Report signal stale' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Switch' })).toBeOnTheScreen();
  });

  it('removes the ETA banner, route tags, direction pills and driver card (revision 4)', async () => {
    await render(<LiveTrackingScreen />);
    for (const id of ['eta-box', 'direction-selector', 'thank-driver', 'direction-apas', 'direction-colon']) {
      expect(screen.queryByTestId(id)).toBeNull();
    }
    for (const text of [
      'UNLOCKED ARRIVAL ETA',
      '3 MINS',
      'ON SCHEDULE',
      'Modern Jeep',
      'Mang Ernesto Santos',
      'Moving',
    ]) {
      expect(screen.queryByText(text)).toBeNull();
    }
    expect(screen.queryByRole('tab')).toBeNull();
  });

  // live-arrival-card: with a pass the sheet opens on the routes as chips (the route cards are no longer shown).
  it('shows the routes on the way as chips at the top of the sheet', async () => {
    await render(<LiveTrackingScreen />);
    const chips = within(screen.getByTestId('eta-sheet')).getByTestId('route-chips');
    expect(within(chips).getAllByRole('radio')).toHaveLength(3);
    for (const option of OPTIONS) expect(within(chips).getByTestId(`route-chip-${option.code}`)).toBeOnTheScreen();
    expect(screen.queryByTestId('route-options')).toBeNull();
  });

  // Revision 9: the preferred route is selected first, and the map follows the selected route.
  it('selects the preferred route by default and moves the selection when another chip is pressed', async () => {
    await render(<LiveTrackingScreen />);
    expect(screen.getByTestId('route-chip-17B')).toBeChecked();
    expect(screen.getByTestId('route-chip-44B')).not.toBeChecked();
    await fireEvent.press(screen.getByTestId('route-chip-44B'));
    expect(screen.getByTestId('route-chip-44B')).toBeChecked();
    expect(screen.getByTestId('route-chip-17B')).not.toBeChecked();
  });

  it('draws the selected route on the map', async () => {
    await render(<LiveTrackingScreen />);
    expect(screen.getByTestId('live-map-status')).toHaveTextContent('No jeeps live on Route 17B • 15 min left');
    await fireEvent.press(screen.getByTestId('route-chip-44B'));
    expect(screen.getByTestId('live-map-status')).toHaveTextContent('No jeeps live on Route 44B • 15 min left');
    expect(screen.getByLabelText('Route 44B live corridor map')).toBeOnTheScreen();
  });

  // Revision 10: View Live on a Commute hub card opens the map with that route selected.
  it('selects the route it was opened with', async () => {
    mockParams = { route: '44B', at: '1' };
    try {
      await render(<LiveTrackingScreen />);
      expect(screen.getByTestId('route-chip-44B')).toBeChecked();
      expect(screen.getByTestId('live-map-status')).toHaveTextContent('No jeeps live on Route 44B • 15 min left');
    } finally {
      mockParams = {};
    }
  });

  it('says why there are no routes', async () => {
    jest.requireMock('@/hooks/useLivePass').resetLivePasses();
    const commute = jest.requireMock('@/screens/commuters/LiveTracking/useCommuteOptions').mockCommute;
    const saved = { ...commute };
    Object.assign(commute, { options: [], preferred: undefined, notice: 'Route 17B is not running right now.' });
    try {
      await render(<LiveTrackingScreen />);
      expect(screen.getByTestId('route-chips-notice')).toHaveTextContent('Route 17B is not running right now.');
      expect(screen.queryByTestId('route-options')).toBeNull();
    } finally {
      Object.assign(commute, saved);
    }
  });

  // The route cards are no longer on the Live Map (live-arrival-card: chips instead); un-skip if they return.
  it.skip('uses token tones for the route options', async () => {
    await render(<LiveTrackingScreen />);
    expect(screen.getByTestId('route-option-17D-eta')).toHaveStyle({ color: colors.neonOrangeDeep });
    expect(screen.getByTestId('route-option-44B-eta')).toHaveStyle({ color: colors.onSurface });
    expect(screen.getByTestId('route-option-17B-eta')).toHaveStyle({ color: colors.preferredStrong });
    const best = within(screen.getByTestId('route-option-17D'));
    expect(best.getByText('BEST OPTION')).toHaveStyle({ color: colors.onBrandAction });
    expect(best.getByText('17D')).toHaveStyle({ color: colors.onBrandAction });
    expect(within(screen.getByTestId('route-option-17B')).getByText('YOUR PREFERRED ROUTE')).toHaveStyle({
      color: colors.preferredStrong,
    });
  });

  // Revision 4: nothing in a card is clamped, the name/badge row wraps and the ETA column keeps a fixed minimum width.
  // The route cards are no longer on the Live Map (live-arrival-card: chips instead); un-skip if they return.
  it.skip('never truncates the route option text', async () => {
    await render(<LiveTrackingScreen />);
    for (const option of OPTIONS) {
      const card = within(screen.getByTestId(`route-option-${option.code}`));
      for (const text of [option.code, option.name, option.badge, option.subtitle, option.caption]) {
        expect(card.getByText(text).props.numberOfLines).toBeUndefined();
      }
      expect(card.getByText(option.name).parent).toHaveStyle({ flexDirection: 'row', flexWrap: 'wrap' });
      expect(screen.getByTestId(`route-option-${option.code}-eta`).parent).toHaveStyle({ minWidth: 72, flexShrink: 0 });
    }
  });

  // The sample direction panels are hidden for now (EtaSheet SHOW_DIRECTION_PANELS); un-skip when shown again.
  it.skip('toggles the tracked direction panel with Switch and back again', async () => {
    await render(<LiveTrackingScreen />);
    expect(panelFill('colon').backgroundColor).toBe(colors.brandTint);
    expect(panelFill('apas').backgroundColor).not.toBe(colors.brandTint);

    await fireEvent.press(screen.getByTestId('direction-switch'));
    expect(panelFill('apas').backgroundColor).toBe(colors.brandTint);
    expect(panelFill('colon').backgroundColor).not.toBe(colors.brandTint);

    await fireEvent.press(screen.getByTestId('direction-switch'));
    expect(panelFill('colon').backgroundColor).toBe(colors.brandTint);
  });

  it('keeps the route selection when Switch changes the direction', async () => {
    await render(<LiveTrackingScreen />);
    await fireEvent.press(screen.getByTestId('route-chip-44B'));
    await fireEvent.press(screen.getByTestId('direction-switch'));
    expect(screen.getByTestId('route-chip-44B')).toBeChecked();
  });

  it('resets the last GPS time on Refresh', async () => {
    await render(<LiveTrackingScreen />);
    await fireEvent.press(screen.getByTestId('refresh-gps'));
    expect(screen.getByText('Last GPS: just now')).toBeOnTheScreen();
    expect(screen.queryByText('Last GPS: 3s ago')).toBeNull();
  });

  it('goes back to the Commute tab', async () => {
    await render(<LiveTrackingScreen />);
    await fireEvent.press(screen.getByTestId('back-to-hub'));
    expect(router.navigate).toHaveBeenCalledWith('/commute');
  });

  // Regression (D1): the non-shrinking ETA squeezed the tracked unit name to "Unit…".
  // Jest has no layout engine, so this pins the layout choice: the unit row wraps, so the
  // ETA drops to a second line before the name is cut (holds at 375 pt and 402 pt).
  // The sample direction panels are hidden for now (EtaSheet SHOW_DIRECTION_PANELS); un-skip when shown again.
  it.skip('lets the tracked unit row wrap so "Unit 23" is never cut', async () => {
    await render(<LiveTrackingScreen />);
    const names = screen.getAllByText('Unit 23 (GMD-1782)');
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(name.parent).toHaveStyle({ flexDirection: 'row', flexWrap: 'wrap' });
    }
  });

  // Regression (D6), updated for revision 4: the direction pills are gone, and the two
  // direction panels still share one row (no horizontal ScrollView).
  // The sample direction panels are hidden for now (EtaSheet SHOW_DIRECTION_PANELS); un-skip when shown again.
  it.skip('shows both direction panels side by side without a horizontal scroll', async () => {
    await render(<LiveTrackingScreen />);
    expect(screen.queryByTestId('direction-selector')).toBeNull();
    const colon = screen.getByTestId('direction-panel-colon');
    const apas = screen.getByTestId('direction-panel-apas');
    expect(colon.parent).toBe(apas.parent);
    expect(colon.parent).toHaveStyle({ flexDirection: 'row' });
    expect(colon.parent).not.toHaveProp('horizontal');
    for (const panel of [colon, apas]) expect(panel).toHaveStyle({ flex: 1 });
  });
});

describe('LiveTrackingScreen without a live pass (Revision 11)', () => {
  const commute = () => jest.requireMock('@/screens/commuters/LiveTracking/useCommuteOptions').mockCommute;
  const withJeep = (code: string) => ({
    [`route-${code}`]: [{ driverId: 'd1', coordinate: { latitude: 0, longitude: 0 } }],
  });
  afterEach(() => {
    commute().jeepsByRoute = {};
  });

  it('shows the routes as chips, hides the route list, and draws no jeepneys', async () => {
    await render(<LiveTrackingScreen />);
    expect(screen.queryByTestId('eta-sheet')).toBeNull();
    expect(screen.queryByTestId('route-options')).toBeNull();
    for (const code of ['17D', '44B', '17B']) expect(screen.getByTestId(`route-chip-${code}`)).toBeOnTheScreen();
    expect(screen.getByTestId('route-chip-17B')).toBeChecked();
    expect(screen.getByTestId('live-map-status')).toHaveTextContent('Route 17B • live jeepneys locked');
    expect(screen.queryByText(/ETA/)).toBeNull();
  });

  it('selects a chip and offers ₱1 only when jeepneys are live on it', async () => {
    commute().jeepsByRoute = withJeep('17B');
    await render(<LiveTrackingScreen />);
    expect(screen.getByText('View live jeepneys (₱1)')).toBeOnTheScreen();
    expect(screen.getByTestId('pay-live-view')).toBeEnabled();

    await fireEvent.press(screen.getByTestId('route-chip-44B'));
    expect(screen.getByTestId('route-chip-44B')).toBeChecked();
    expect(screen.getByTestId('live-map-status')).toHaveTextContent('Route 44B • live jeepneys locked');
    expect(screen.getByText('No live jeepneys (₱0)')).toBeOnTheScreen();
    expect(screen.getByTestId('pay-live-view')).toBeDisabled();
  });

  it('unlocks the route after paying ₱1, and takes it off the balance', async () => {
    commute().jeepsByRoute = withJeep('17B');
    jest.requireMock('@/hooks/useCommuterLocation').mockLocation.current = {
      status: 'granted',
      coordinate: { latitude: 10.3186, longitude: 123.8977 },
    };
    await render(<LiveTrackingScreen />);
    expect(screen.getByText('₱45.00')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('pay-live-view'));
    expect(within(screen.getByTestId('confirm-track-modal')).getByText('Route 17B')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('heading-outbound'));
    await fireEvent.press(screen.getByTestId('confirm-track'));

    expect(screen.getByTestId('eta-sheet')).toBeOnTheScreen();
    // The chips move into the paid sheet, above the arrival card.
    expect(within(screen.getByTestId('eta-sheet')).getByTestId('route-chips')).toBeOnTheScreen();
    expect(screen.queryByTestId('pay-live-view')).toBeNull();
    // Unlocked: the map shows live jeepneys again (none here, since tests have no road path to place them on).
    expect(screen.getByTestId('live-map-status')).not.toHaveTextContent('locked');
    expect(screen.getByTestId('live-map-status')).toHaveTextContent(/• 15 min left$/);
    expect(screen.getByText('₱44.00')).toBeOnTheScreen();
  });

  // The ₱1 goes to the jeepneys coming the commuter's way: they say which way first.
  it('keeps Confirm & Track off until the commuter picks where they are going', async () => {
    commute().jeepsByRoute = withJeep('17B');
    await render(<LiveTrackingScreen />);
    await fireEvent.press(screen.getByTestId('pay-live-view'));
    const confirm = screen.getByTestId('confirm-track');
    expect(confirm).toBeDisabled();
    expect(screen.getByTestId('heading-hint')).toBeOnTheScreen();
    await fireEvent.press(confirm);
    expect(screen.getByText('₱45.00')).toBeOnTheScreen(); // nothing paid

    await fireEvent.press(screen.getByTestId('heading-inbound'));
    expect(screen.getByTestId('heading-inbound')).toBeChecked();
    expect(screen.getByTestId('heading-outbound')).not.toBeChecked();
    expect(screen.queryByTestId('heading-hint')).toBeNull();
    expect(screen.getByTestId('confirm-track')).toBeEnabled();
  });

  // The map's direction pill is hidden for now (CorridorMap SHOW_MAP_CONTROLS); un-skip when it is shown again.
  it.skip('counts the map direction pill as picking a direction', async () => {
    commute().jeepsByRoute = withJeep('17B');
    await render(<LiveTrackingScreen />);
    await fireEvent.press(screen.getByTestId('map-direction-toggle'));
    await fireEvent.press(screen.getByTestId('pay-live-view'));
    expect(screen.getByTestId('confirm-track')).toBeEnabled();
  });

  // Shared-view-earnings: one ₱1 pass covers every route on the commuter's way.
  it('stays unlocked on every route during the pass', async () => {
    buyLivePass('17B');
    await render(<LiveTrackingScreen />);
    await fireEvent.press(screen.getByTestId('route-chip-44B'));
    expect(screen.getByTestId('route-chip-44B')).toBeChecked();
    expect(screen.getByTestId('eta-sheet')).toBeOnTheScreen();
  });
});

// live-arrival-card: with a pass, the sheet opens on the unlocked arrival ETA and the next jeep's route and plate.
describe('LiveTrackingScreen arrival card', () => {
  const commute = () => jest.requireMock('@/screens/commuters/LiveTracking/useCommuteOptions').mockCommute;
  afterEach(() => {
    const opt = commute().options.find((o: { code: string }) => o.code === '17B');
    delete opt.boardName;
    delete opt.nextJeep;
    delete opt.minutes;
  });

  it('shows the minutes, where to board, and the next jeep', async () => {
    const opt = commute().options.find((o: { code: string }) => o.code === '17B');
    Object.assign(opt, {
      minutes: 3,
      boardName: 'Escario Capitol',
      nextJeep: { driverId: 'd1', plate: 'GMD-1782', unitCode: 'PARA-0006', seats: { free: 7, capacity: 22 } },
    });
    buyLivePass('17B');
    await render(<LiveTrackingScreen />);
    const sheet = screen.getByTestId('eta-sheet');
    expect(within(sheet).getByTestId('arrival-eta-minutes')).toHaveTextContent('3MINS');
    expect(within(sheet).getByText('Board at: Escario Capitol')).toBeOnTheScreen();
    expect(within(sheet).getByTestId('vehicle-plate')).toHaveTextContent('GMD-1782');
    expect(within(sheet).getByTestId('vehicle-summary')).toHaveTextContent('PARA-0006', { exact: false });
    // seat-availability: the tracked jeep's seats.
    expect(within(sheet).getByTestId('seat-availability-left')).toHaveTextContent('7 seats left');
    expect(within(sheet).getByText('15 / 22 Passengers Boarded')).toBeOnTheScreen();
  });

  it('keeps the seat card for the tracked jeep when its driver has not updated the count', async () => {
    const opt = commute().options.find((o: { code: string }) => o.code === '17B');
    Object.assign(opt, {
      minutes: 3,
      boardName: 'Escario Capitol',
      nextJeep: { driverId: 'd1', plate: 'GMD-1782', unitCode: 'PARA-0006' },
    });
    buyLivePass('17B');
    await render(<LiveTrackingScreen />);
    const sheet = screen.getByTestId('eta-sheet');
    expect(within(sheet).getByTestId('seat-availability-left')).toHaveTextContent('Not updated');
  });
});

describe('LiveTrackingScreen direction of travel (Revision 13)', () => {
  // The map's direction pill is hidden for now (CorridorMap SHOW_MAP_CONTROLS); un-skip when it is shown again.
  it.skip('shows where the commuter is going on the map and switches it', async () => {
    const commute = jest.requireMock('@/screens/commuters/LiveTracking/useCommuteOptions').mockCommute;
    const route = commute.options.find((o: { code: string }) => o.code === '17B').route;
    const saved = { out: route.directions.outbound.label, back: route.directions.inbound.label };
    route.directions.outbound.label = 'Going to Sto. Niño';
    route.directions.inbound.label = 'Going back to Apas';
    try {
      await render(<LiveTrackingScreen />);
      const toggle = screen.getByTestId('map-direction-toggle');
      expect(within(toggle).getByText('Going to Sto. Niño')).toBeOnTheScreen();
      await fireEvent.press(toggle);
      expect(within(screen.getByTestId('map-direction-toggle')).getByText('Going back to Apas')).toBeOnTheScreen();
    } finally {
      route.directions.outbound.label = saved.out;
      route.directions.inbound.label = saved.back;
    }
  });
});

// ad-supported-live-view: under ₱1, View live jeepneys (Watch Ads) for 3 minutes; never a top-up pop-up.
describe('LiveTrackingScreen with less than ₱1 (Watch Ads)', () => {
  const commute = () => jest.requireMock('@/screens/commuters/LiveTracking/useCommuteOptions').mockCommute;
  const ads = () => jest.requireMock('@/services/rewardedAds').mockAds;
  const api = () => jest.requireMock('@packages/tanstack/query/views').mockViewsApi;
  beforeEach(() => {
    commute().jeepsByRoute = { 'route-17B': [{ driverId: 'd1', coordinate: { latitude: 0, longitude: 0 } }] };
    jest.requireMock('@/hooks/useLivePass').setLiveBalance(0);
    jest.requireMock('@/hooks/useCommuterLocation').mockLocation.current = {
      status: 'granted',
      coordinate: { latitude: 10.3186, longitude: 123.8977 },
    };
  });
  afterEach(() => {
    commute().jeepsByRoute = {};
    ads().supported = true;
  });

  it('offers Watch Ad and a small "Top up ₱1 • no ads" link, with no pop-up', async () => {
    const alert = jest.spyOn(require('react-native').Alert, 'alert');
    await render(<LiveTrackingScreen />);
    expect(screen.getByText('Watch Ad')).toBeOnTheScreen();
    expect(screen.getByText('Top up ₱1 • no ads')).toBeOnTheScreen();
    expect(alert).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId('top-up-link'));
    expect(router.navigate).toHaveBeenCalledWith('/wallet');
    alert.mockRestore();
  });

  it('asks the direction, then watches the ad for 3 minutes of live view on the picked route only', async () => {
    await render(<LiveTrackingScreen />);
    await fireEvent.press(screen.getByTestId('pay-live-view'));
    expect(screen.getByTestId('ad-summary')).toHaveTextContent('3 min free', { exact: false });
    expect(screen.getByTestId('ad-route-only')).toHaveTextContent('Route 17B only');
    const watch = screen.getByTestId('confirm-track');
    expect(watch).toHaveTextContent('Watch ad • 3 min free', { exact: false });
    expect(watch).toBeDisabled(); // direction first, as for ₱1
    await fireEvent.press(screen.getByTestId('heading-inbound'));
    await fireEvent.press(screen.getByTestId('confirm-track'));
    expect(api().adViewStart).toHaveBeenCalledWith({
      lat: 10.3186,
      lng: 123.8977,
      direction: 'inbound',
      routeId: 'route-17B',
    });
    const { showRewardedAd } = jest.requireMock('@/services/rewardedAds');
    expect(showRewardedAd).toHaveBeenCalledWith({ userId: expect.any(String), customData: 'ad1' });
  });

  // waiting-pin: with a pin, the jeepneys that share the view are the ones coming to the pin, not to the commuter's GPS.
  it('sends the waiting pin, not GPS, once a pin is set', async () => {
    const { CORRIDOR_REGION } = jest.requireActual('./corridorRoute');
    await render(<LiveTrackingScreen />);
    await fireEvent.press(screen.getByTestId('set-waiting-pin'));
    await fireEvent.press(screen.getByTestId('confirm-waiting-pin'));
    expect(screen.getByTestId('waiting-pin')).toBeOnTheScreen();
    expect(screen.getByTestId('waiting-pin-pill')).toHaveTextContent(/Waiting pin • .+ from you/);
    await fireEvent.press(screen.getByTestId('pay-live-view'));
    // With a pin the drawer asks no direction: the sheet's Going to / Going back (direction-switch) is sent.
    expect(screen.queryByTestId('heading-picker')).toBeNull();
    await fireEvent.press(screen.getByTestId('confirm-track'));
    expect(api().adViewStart).toHaveBeenCalledWith({
      lat: CORRIDOR_REGION.latitude,
      lng: CORRIDOR_REGION.longitude,
      direction: 'outbound',
      routeId: 'route-17B',
    });
  });

  it('goes back to GPS when the pin is cleared', async () => {
    await render(<LiveTrackingScreen />);
    await fireEvent.press(screen.getByTestId('set-waiting-pin'));
    await fireEvent.press(screen.getByTestId('confirm-waiting-pin'));
    await fireEvent.press(screen.getByTestId('clear-waiting-pin'));
    expect(screen.queryByTestId('waiting-pin')).toBeNull();
    expect(screen.getByTestId('set-waiting-pin')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('pay-live-view'));
    await fireEvent.press(screen.getByTestId('heading-outbound'));
    await fireEvent.press(screen.getByTestId('confirm-track'));
    expect(api().adViewStart).toHaveBeenCalledWith(expect.objectContaining({ lat: 10.3186, lng: 123.8977 }));
  });

  // direction-switch: Going to / Going back under the chips; the pick is what the ₱1 / ad sends with a pin.
  it('picks Going to or Going back from the sheet and sends it', async () => {
    await render(<LiveTrackingScreen />);
    expect(screen.getByTestId('direction-picker')).toBeOnTheScreen();
    expect(screen.getByTestId('direction-inbound')).not.toBeChecked();
    await fireEvent.press(screen.getByTestId('direction-inbound'));
    expect(screen.getByTestId('direction-inbound')).toBeChecked();
    await fireEvent.press(screen.getByTestId('set-waiting-pin'));
    await fireEvent.press(screen.getByTestId('confirm-waiting-pin'));
    await fireEvent.press(screen.getByTestId('pay-live-view'));
    await fireEvent.press(screen.getByTestId('confirm-track'));
    expect(api().adViewStart).toHaveBeenCalledWith(expect.objectContaining({ direction: 'inbound' }));
  });

  // A bigger map while placing: the route sheet and pay button come back on Wait here or Cancel.
  it('hides the route sheet and pay button while placing the pin', async () => {
    await render(<LiveTrackingScreen />);
    expect(screen.getByTestId('route-chips')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('set-waiting-pin'));
    expect(screen.queryByTestId('route-chips')).toBeNull();
    expect(screen.queryByTestId('pay-live-view')).toBeNull();
    // Going to / Going back stay available, under Wait here.
    await fireEvent.press(within(screen.getByTestId('placing-card')).getByTestId('direction-inbound'));
    expect(screen.getByTestId('direction-inbound')).toBeChecked();
    await fireEvent.press(screen.getByTestId('confirm-waiting-pin'));
    expect(screen.getByTestId('route-chips')).toBeOnTheScreen();
    expect(screen.getByTestId('pay-live-view')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('move-waiting-pin'));
    expect(screen.queryByTestId('route-chips')).toBeNull();
    await fireEvent.press(screen.getByTestId('cancel-waiting-pin'));
    expect(screen.getByTestId('route-chips')).toBeOnTheScreen();
  });

  it('keeps the waving pin steady while the map moves, and cancels without pinning', async () => {
    await render(<LiveTrackingScreen />);
    await fireEvent.press(screen.getByTestId('set-waiting-pin'));
    expect(screen.getByTestId('placing-pin')).toBeOnTheScreen();
    expect(screen.getByText('Move the map to where you will wait')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('cancel-waiting-pin'));
    expect(screen.queryByTestId('placing-pin')).toBeNull();
    expect(screen.queryByTestId('waiting-pin')).toBeNull();
    // A placed pin can be moved again from its pill.
    await fireEvent.press(screen.getByTestId('set-waiting-pin'));
    await fireEvent.press(screen.getByTestId('confirm-waiting-pin'));
    await fireEvent.press(screen.getByTestId('move-waiting-pin'));
    expect(screen.getByTestId('placing-pin')).toBeOnTheScreen();
  });

  it('shows the commuter as the waving pin until a pin is set', async () => {
    await render(<LiveTrackingScreen />);
    expect(screen.getByTestId('commuter-location')).toHaveProp('accessibilityLabel', 'You');
    await fireEvent.press(screen.getByTestId('set-waiting-pin'));
    await fireEvent.press(screen.getByTestId('confirm-waiting-pin'));
    expect(screen.getByTestId('waiting-pin')).toBeOnTheScreen();
    expect(screen.getByTestId('commuter-location-dot')).toBeOnTheScreen();
  });

  it('fixes the pin once paid: no moving, clearing or long-press', async () => {
    await render(<LiveTrackingScreen />);
    await fireEvent.press(screen.getByTestId('set-waiting-pin'));
    await fireEvent.press(screen.getByTestId('confirm-waiting-pin'));
    payForAll();
    await screen.rerender(<LiveTrackingScreen />);
    expect(screen.getByTestId('waiting-pin-pill')).toHaveTextContent(/Waiting pin/);
    expect(screen.queryByTestId('move-waiting-pin')).toBeNull();
    expect(screen.queryByTestId('clear-waiting-pin')).toBeNull();
    expect(screen.queryByTestId('set-waiting-pin')).toBeNull();
  });

  it('refuses a pin more than 2 km from the commuter', async () => {
    const alert = jest.spyOn(require('react-native').Alert, 'alert');
    // The commuter is in Manila; the map's middle is in Cebu.
    jest.requireMock('@/hooks/useCommuterLocation').mockLocation.current = {
      status: 'granted',
      coordinate: { latitude: 14.5995, longitude: 120.9842 },
    };
    await render(<LiveTrackingScreen />);
    await fireEvent.press(screen.getByTestId('set-waiting-pin'));
    await fireEvent.press(screen.getByTestId('confirm-waiting-pin'));
    expect(alert).toHaveBeenCalledWith('Too far to wait there', 'Pin a spot within 2.0 km of you.');
    expect(screen.queryByTestId('waiting-pin')).toBeNull();
    alert.mockRestore();
  });

  it('lets a commuter without location pay from a pin', async () => {
    jest.requireMock('@/hooks/useCommuterLocation').mockLocation.current = { status: 'denied' };
    await render(<LiveTrackingScreen />);
    await fireEvent.press(screen.getByTestId('set-waiting-pin'));
    await fireEvent.press(screen.getByTestId('confirm-waiting-pin'));
    expect(screen.getByTestId('waiting-pin-pill')).toHaveTextContent('Waiting pin', { exact: false });
    await fireEvent.press(screen.getByTestId('pay-live-view'));
    await fireEvent.press(screen.getByTestId('confirm-track'));
    expect(api().adViewStart).toHaveBeenCalled();
  });

  it('offers Top up to view live where ads cannot play (web, older app)', async () => {
    ads().supported = false;
    await render(<LiveTrackingScreen />);
    expect(screen.getByText('Top up to view live')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('pay-live-view'));
    expect(router.navigate).toHaveBeenCalledWith('/wallet');
  });
});
