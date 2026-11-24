/**
 * Design system v3 (light) checks across rendered screens (plan step 22,
 * AC44–AC47, AC49, AC52), with the W2 user decision: orange fills that carry
 * text are bright #FF5500 with bold white labels.
 */
import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { renderRouter, screen as routerScreen } from 'expo-router/testing-library';
import type { ComponentType } from 'react';
import { processColor, StyleSheet, type TextStyle, type ViewStyle } from 'react-native';

import { tabScreenOptions } from '@/constants/navigation';
import { colors, gradients, typography } from '@/constants/theme';
import { AccountScreen } from '@/screens/commuters/Account';
import { ActivityScreen } from '@/screens/commuters/Activity';
import { CommuteHubScreen } from '@/screens/commuters/CommuteHub';
import { LiveTrackingScreen } from '@/screens/commuters/LiveTracking';
import { WalletScreen } from '@/screens/commuters/Wallet';
import { CorridorRadarScreen } from '@/screens/drivers/CorridorRadar';
import { DriverProfileScreen } from '@/screens/drivers/DriverProfile';
import { DutyHubScreen } from '@/screens/drivers/DutyHub';
import { EarningsPoolScreen } from '@/screens/drivers/EarningsPool';
import { TripsScreen } from '@/screens/drivers/Trips';
import { SignInScreen } from '@/screens/shared/SignIn';
const { buyLivePass } = jest.requireMock('@/hooks/useLivePass') as { buyLivePass: (code?: string) => void };

// Render every screen signed out, so SignIn shows instead of redirecting (the other screens don't depend on it).
beforeEach(() => {
  jest.requireMock('@/hooks/useSession').mockSession.status = 'signedOut';
});

const SCREENS: [string, ComponentType, string][] = [
  ['SignIn', SignInScreen, 'screen-sign-in'],
  ['CommuteHub', CommuteHubScreen, 'screen-commute-hub'],
  ['LiveTracking', LiveTrackingScreen, 'screen-live-tracking'],
  ['Wallet', WalletScreen, 'screen-wallet'],
  ['Activity', ActivityScreen, 'screen-activity'],
  ['Account', AccountScreen, 'screen-account'],
  ['DutyHub', DutyHubScreen, 'screen-duty-hub'],
  ['EarningsPool', EarningsPoolScreen, 'screen-earnings'],
  ['CorridorRadar', CorridorRadarScreen, 'screen-radar'],
  ['Trips', TripsScreen, 'screen-trips'],
  ['DriverProfile', DriverProfileScreen, 'screen-driver-profile'],
];

const textStyle = (node: { props: { style?: unknown } }) => StyleSheet.flatten(node.props.style as TextStyle) ?? {};
const viewStyle = (node: { props: { style?: unknown } }) => StyleSheet.flatten(node.props.style as ViewStyle) ?? {};

type JsonNode = { type: string; props: Record<string, unknown>; children: (JsonNode | string)[] | null };

/** The app's three font families; icon glyphs (vector-icon fonts) are excluded. */
const APP_FONT = /^(SpaceGrotesk|HankenGrotesk|JetBrainsMono)_/;

/**
 * Every app-font Text whose nearest filled ancestor is one of `fills` (all Text
 * when `fills` is omitted), with its flattened style.
 */
function textOn(fills: string[] | null, root: JsonNode | JsonNode[] | null): { text: string; style: TextStyle }[] {
  const out: { text: string; style: TextStyle }[] = [];
  const visit = (node: JsonNode | string, background: string | undefined) => {
    if (typeof node === 'string') return;
    const style = StyleSheet.flatten(node.props.style as ViewStyle) ?? {};
    const bg = typeof style.backgroundColor === 'string' ? style.backgroundColor : background;
    const fontFamily = String((StyleSheet.flatten(node.props.style as TextStyle) ?? {}).fontFamily);
    if (
      node.type === 'Text' &&
      APP_FONT.test(fontFamily) &&
      (fills === null || (bg !== undefined && fills.includes(bg)))
    ) {
      const text = (node.children ?? []).filter((c): c is string => typeof c === 'string').join('');
      if (text) out.push({ text, style: StyleSheet.flatten(node.props.style as TextStyle) ?? {} });
    }
    for (const child of node.children ?? []) visit(child, bg);
  };
  for (const node of Array.isArray(root) ? root : root ? [root] : []) visit(node, undefined);
  return out;
}

describe('font roles (AC47)', () => {
  it('uses Space Grotesk for headlines, Hanken Grotesk for body and JetBrains Mono for telemetry', async () => {
    await render(<SignInScreen />);
    expect(textStyle(screen.getByText('Para Live')).fontFamily).toMatch(/^SpaceGrotesk_/);

    await render(<CommuteHubScreen />);
    expect(textStyle(screen.getByText('Saan ang biyahe mo ngayon?')).fontFamily).toMatch(/^HankenGrotesk_/);
    expect(textStyle(screen.getByText('Approved Transit Routes')).fontFamily).toMatch(/^SpaceGrotesk_/);

    await render(<WalletScreen />);
    expect(textStyle(screen.getByText('TXN-83910')).fontFamily).toMatch(/^JetBrainsMono_/);

    await render(<CorridorRadarScreen />);
    expect(textStyle(screen.getByText('28')).fontFamily).toMatch(/^JetBrainsMono_/);

    ['17D', '44B', '17B'].forEach((code) => buyLivePass(code)); // the sheet needs a ₱1 pass (Revision 11)
    await render(<LiveTrackingScreen />);
    // Revision 4 route options: mono codes, badges and ETAs; Hanken Grotesk names.
    expect(textStyle(screen.getByTestId('route-option-17D-eta')).fontFamily).toMatch(/^JetBrainsMono_/);
    expect(textStyle(screen.getByText('17D')).fontFamily).toMatch(/^JetBrainsMono_700Bold$/);
    expect(textStyle(screen.getByText('BEST OPTION')).fontFamily).toMatch(/^JetBrainsMono_/);
    expect(textStyle(screen.getByText('Route 17D')).fontFamily).toMatch(/^HankenGrotesk_700Bold$/);
  });

  it('uses JetBrains Mono for the tab labels', async () => {
    expect(tabScreenOptions.tabBarLabelStyle).toMatchObject({ fontFamily: typography.labelBadge.fontFamily });
    jest.requireMock('@/hooks/useSession').mockSession.status = 'commuter';
    await renderRouter('./src/app', { initialUrl: '/commute' });
    expect(textStyle(routerScreen.getByText('Live Map')).fontFamily).toMatch(/^JetBrainsMono_/);
  });
});

describe('brand fills and the white-on-orange rule (AC45, AC46, W2)', () => {
  it('paints "Confirm & Track (₱1)" bright orange with a bold white label', async () => {
    await render(<CommuteHubScreen />);
    await fireEvent.press(screen.getByTestId('view-live-17B'));
    const button = screen.getByTestId('confirm-track');
    expect(viewStyle(button).backgroundColor).toBe(colors.brandAction);
    expect(colors.brandAction).toBe(colors.brand);
    const label = textStyle(screen.getByText('Confirm & Track (₱1)'));
    expect(label.color).toBe(colors.onBrandAction);
    expect(label.fontFamily).toMatch(/_700Bold$/);
  });

  it('paints the selected filter chip and route badges bright orange with white text', async () => {
    await render(<CommuteHubScreen />);
    expect(viewStyle(screen.getByTestId('filter-all')).backgroundColor).toBe(colors.brandAction);
    expect(textStyle(screen.getByText('All Transit (1)')).color).toBe(colors.onBrandAction);
    expect(textStyle(screen.getByText('Route #17B')).color).toBe(colors.onBrandAction);
  });

  // Revision 4: the ETA banner and route badges are gone; the best route option carries the W2 fills.
  // live-arrival-card: the Live Map's orange fills are now the selected route chip and the arrival card.
  it('draws the LiveTracking selected route chip in bright orange with bold white text', async () => {
    ['17D', '44B', '17B'].forEach((code) => buyLivePass(code)); // the sheet needs a ₱1 pass (Revision 11)
    await render(<LiveTrackingScreen />);
    const onOrange = textOn([colors.brandAction, colors.brandPressed], screen.toJSON() as JsonNode);
    expect(onOrange.map((t) => t.text)).toEqual(expect.arrayContaining(['17B']));
    const style = textStyle(within(screen.getByTestId('route-chip-17B')).getByText('17B'));
    expect(style.color).toBe(colors.onBrandAction);
    expect(style.fontFamily).toMatch(/_700Bold$/);
  });

  it.each(SCREENS)('%s: white text on the orange fills is always bold or large', async (_name, Screen) => {
    await render(<Screen />);
    for (const { text, style } of textOn(
      [colors.brand, colors.brandAction, colors.brandPressed],
      screen.toJSON() as JsonNode,
    )) {
      if (style.color !== colors.onBrandAction) continue;
      const bold = /_(600SemiBold|700Bold)$/.test(String(style.fontFamily));
      const large =
        (style.fontSize ?? 0) >= 24 || ((style.fontSize ?? 0) >= 18.66 && /_700Bold$/.test(String(style.fontFamily)));
      expect({ text, ok: bold || large }).toEqual({ text, ok: true });
    }
  });

  it('never uses the bright accents as a text colour on any screen (W3, W4)', async () => {
    const accents = new Set<unknown>([colors.brand, colors.live, colors.amber, colors.crimsonAlert]);
    for (const [, Screen] of SCREENS) {
      await render(<Screen />);
      for (const { text, style } of textOn(null, screen.toJSON() as JsonNode)) {
        expect({ text, accent: accents.has(style.color) }).toEqual({ text, accent: false });
      }
    }
  });
});

describe('light backgrounds (AC44)', () => {
  it.each(SCREENS)('%s root uses the canvas background', async (_name, Screen, testID) => {
    await render(<Screen />);
    expect(viewStyle(screen.getByTestId(testID)).backgroundColor).toBe(colors.canvas);
  });

  it('draws a white tab bar over a canvas scene', () => {
    expect(tabScreenOptions.tabBarStyle).toMatchObject({
      backgroundColor: colors.surfaceCard,
      borderTopColor: colors.borderSubtle,
      borderTopWidth: 1,
    });
    expect(tabScreenOptions.sceneStyle).toMatchObject({ backgroundColor: colors.canvas });
    expect(tabScreenOptions.tabBarActiveTintColor).toBe(colors.brandStrong);
    expect(tabScreenOptions.tabBarInactiveTintColor).toBe(colors.textMuted);
  });

  it('sets the light keyboard and muted placeholder on the search input', async () => {
    await render(<CommuteHubScreen />);
    const input = screen.getByTestId('route-search');
    expect(input.props.keyboardAppearance).toBe('light');
    expect(input.props.placeholderTextColor).toBe(colors.textMuted);
  });

  it('keeps the SignIn, CommuteHub and LiveTracking cards white (AC52)', async () => {
    await render(<CommuteHubScreen />);
    expect(viewStyle(screen.getByTestId('route-card-17B')).backgroundColor).toBe(colors.surfaceCard);
    ['17D', '44B', '17B'].forEach((code) => buyLivePass(code)); // the sheet needs a ₱1 pass (Revision 11)
    await render(<LiveTrackingScreen />);
    expect(viewStyle(screen.getByTestId('eta-sheet')).backgroundColor).toBe(colors.surfaceCard);
    await render(<SignInScreen />);
    expect(viewStyle(screen.getByTestId('sign-in-card')).backgroundColor).toBe(colors.surfaceCard);
  });
});

describe('semantic colours (AC49, AC50)', () => {
  it('matches the light reference on the Duty hub', async () => {
    await render(<DutyHubScreen />);
    expect(textStyle(screen.getByText('Active Duty')).color).toBe(colors.liveStrong);
    expect(textStyle(screen.getByText('Verified Driver')).color).toBe(colors.liveStrong);
    expect(textStyle(screen.getByText('Credited Daily')).color).toBe(colors.liveStrong);
    expect(screen.getByTestId('broadcast-card-gradient').props.colors).toEqual(
      gradients.broadcast.map((c) => processColor(c)),
    );
    expect(screen.getByTestId('daily-earnings-card-gradient').props.colors).toEqual(
      gradients.dailyEarnings.map((c) => processColor(c)),
    );
    const total = textStyle(screen.getByText('₱68.5'));
    expect(total.color).toBe(colors.neonOrangeDeep);
    expect(total).toMatchObject({
      fontFamily: typography.metricDisplay.fontFamily,
      fontSize: typography.metricDisplay.fontSize,
    });
    expect(viewStyle(screen.getByTestId('duty-direction-apas')).backgroundColor).toBe(colors.brandAction);
    expect(viewStyle(screen.getByTestId('payout-log')).backgroundColor).toBe(colors.brandAction);
  });

  it('switches the broadcast card to the slate paused preset', async () => {
    jest.requireMock('@/hooks/useDuty').mockDuty.dutyStatus = 'on_break';
    await render(<DutyHubScreen />);
    expect(screen.getByTestId('broadcast-card-gradient').props.colors).toEqual(
      gradients.broadcastPaused.map((c) => processColor(c)),
    );
  });

  it('uses the danger fill for SOS Dispatch and green text for positive amounts', async () => {
    await render(<CorridorRadarScreen />);
    expect(viewStyle(screen.getByTestId('sos-dispatch')).backgroundColor).toBe(colors.crimsonAlert);
    expect(textStyle(screen.getByText('SOS Dispatch')).color).toBe(colors.onDark);

    await render(<WalletScreen />);
    expect(textStyle(screen.getByText('+₱50.00')).color).toBe(colors.liveStrong);

    // Earnings history (driver-unit-earnings): each ₱1 view's amount is a positive, green amount.
    const m = jest.requireMock('@packages/tanstack/query/driver').mockPayouts;
    const day = {
      day: '2026-11-17',
      views: 1,
      driverMicro: 300_000,
      unitEarnedMicro: 500_000,
      driverPct: 60,
      units: [],
    };
    m.summary = { from: '2026-11-16', to: '2026-11-17', days: [day], totals: { ...day, units: [] }, fleets: {} };
    m.days = {
      '2026-11-17': [
        {
          day,
          next: null,
          entries: [
            {
              id: 'e1',
              at: Date.parse('2026-11-17T09:00:00+08:00'),
              vehicleId: 'v1',
              unitCode: 'PARA-00001',
              plate: '',
              routeCode: '17B',
              direction: 'inbound',
              sharedWith: 2,
              unitShareMicro: 500_000,
              driverMicro: 300_000,
            },
          ],
        },
      ],
    };
    await render(<EarningsPoolScreen />);
    await fireEvent.press(screen.getByRole('button', { name: /, ₱0\.30$/ }));
    expect(textStyle(screen.getByText('+₱0.30')).color).toBe(colors.liveStrong);
  });

  it('sets the GCash Switch colours from tokens', async () => {
    await render(<DriverProfileScreen />);
    const toggle = screen.getByTestId('gcash-switch');
    expect(toggle.props.onTintColor ?? toggle.props.trackColor?.true).toBe(colors.brand);
    expect(toggle.props.thumbTintColor ?? toggle.props.thumbColor).toBe(colors.surfaceCard);
  });
});

describe('no dark or v2 leftovers in source (AC44, AC52)', () => {
  type Fs = {
    readdirSync: (path: string, options: { withFileTypes: true }) => { name: string; isDirectory: () => boolean }[];
    readFileSync: (path: string, encoding: 'utf8') => string;
  };
  // The project tsconfig only loads Jest types, so `fs` is typed locally here.
  const fs = jest.requireActual<Fs>('fs');
  const ROOT = expect.getState().testPath!.replace(/src\/__tests__\/design-system\.test\.tsx$/, '');

  const sources = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = `${dir}/${entry.name}`;
      if (entry.isDirectory()) return path.endsWith('packages/ui/src/theme') ? [] : sources(path);
      return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [path] : [];
    });

  const files = [...sources(`${ROOT}src`), ...sources(`${ROOT}packages`)];

  it.each([
    ['cyan tokens', /colors\.(cyan|cyanTint|onCyan|pulseCyan)\b/],
    ['cyan elevation', /glowCyan|focusCyan/],
    [
      'silent role keys',
      /colors\.(tertiary|tertiaryContainer|onSecondaryFixed|onSecondaryFixedVariant|secondaryFixed|errorContainer|onErrorContainer|primary)\b/,
    ],
    ['colors.surface as a fill', /colors\.surface\b/],
    ['dark keyboard', /keyboardAppearance="dark"/],
    ['white scroll indicator', /indicatorStyle="white"/],
    ['DarkTheme', /DarkTheme/],
    ['light status bar', /style="light"/],
  ])('has no %s outside the theme', (_label, pattern) => {
    expect(files.length).toBeGreaterThan(50);
    expect(files.filter((file) => pattern.test(fs.readFileSync(file, 'utf8'))).map((f) => f.replace(ROOT, ''))).toEqual(
      [],
    );
  });
});
