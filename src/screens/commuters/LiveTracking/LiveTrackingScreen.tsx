import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, View } from 'react-native';
import type { LatLng } from 'react-native-maps';

import { colors } from '@/constants/theme';
import { useCommuterLocation } from '@/hooks/useCommuterLocation';
import { useCommuterProfile } from '@/hooks/useCommuterProfile';
import { buyLiveView } from '@/hooks/buyLiveView';
import { liveViewAction } from '@/hooks/liveViewAction';
import { useOptionalSession } from '@/hooks/useSession';
import { watchAdForLiveView } from '@/hooks/watchAdForLiveView';
import { setPreferredRoute } from '@/services/preferredRoute';
import { adsSupported } from '@/services/rewardedAds';
import type { Route } from '@packages/tanstack/query/routes';
import { useViewsApi } from '@packages/tanstack/query/views';
import { useJeepWatch } from '@/hooks/useJeepWatch';
import { LIVE_PASS_FARE, useLivePass } from '@/hooks/useLivePass';
import { ConfirmTrackModal } from '@/screens/commuters/CommuteHub/ConfirmTrackModal';
import { getLiveTrip } from '@/services/commuterService';
import type { TravelDirection } from '@/types/commuter';
import { formatPeso } from '@/utils/currency';
import { AppText } from '@packages/ui/AppText';
import { Avatar } from '@packages/ui/Avatar';
import { BalancePill } from '@packages/ui/BalancePill';
import { Icon } from '@packages/ui/Icon';
import { JeepWatchBanner } from '@packages/ui/JeepWatchBanner';
import { TopBar } from '@packages/ui/TopBar';

import { CorridorMap } from './CorridorMap';
import { DirectionSwitch } from './DirectionSwitch';
import { RouteSummaryCard } from './RouteSummaryCard';
import { EtaSheet } from './EtaSheet';
import { RouteChips } from './RouteChips';
import { LiveMapSheet } from './LiveMapSheet';
import { LiveViewPayBar } from './LiveViewPayBar';
import { AD_LINK_ROOM, chipStyles, minimizedSheetHeight, styles } from './styles';
import { useCommuteOptions } from './useCommuteOptions';
import { checkPin, pinLabel, waitingPoint } from './waitingPin';
import { pinDirection } from './commuteOptions';
import { buildPath } from './livePath';

const laneOf = (route: Route, key: 'outbound' | 'inbound') =>
  (route.directions[key]?.waypoints ?? []).map((w) => ({
    latitude: w.lat,
    longitude: w.lng,
  }));

export function LiveTrackingScreen() {
  const profile = useCommuterProfile();
  const trip = getLiveTrip();
  const me = useCommuterLocation();
  const myLocation = me.status === 'granted' ? me.coordinate : undefined;
  // waiting-pin: where the commuter will wait. With a pin, the routes, the boarding point and the jeepneys that share
  // the ₱1 are worked out from the pin, so they can pay while still walking there. Stays on the phone.
  const [waitPin, setWaitPin] = useState<LatLng | undefined>(undefined);
  // While placing the pin, the route sheet and pay button are hidden so the map is bigger.
  const [placingPin, setPlacingPin] = useState(false);
  const waitAt = waitingPoint(waitPin, myLocation);
  const changePin = (pin: LatLng | undefined) => {
    if (pin) {
      const check = checkPin(pin, myLocation);
      if (!check.ok) {
        Alert.alert('Too far to wait there', check.message);
        return;
      }
    }
    setWaitPin(pin);
  };
  // Where the commuter is going (Switch, or the map's direction pill): outbound is the sample's "towards Colon".
  const [direction, setDirection] = useState<TravelDirection>(trip.defaultDirection);
  const routeDirection = direction === 'colon' ? 'outbound' : 'inbound';
  // waiting-pin lane: with a pin, the direction is the lane the pin is on (per route, its nearest road), so the ETA,
  // the map and the ₱1 share follow that lane; without one, the picked direction.
  const commute = useCommuteOptions(
    profile.preferredRouteCode,
    waitAt,
    waitPin ? `pin:${routeDirection}` : routeDirection,
  );

  // The selected route: the preferred one until the commuter picks another row (kept while it is still listed).
  // Opened from a route card's View Live: select that route (again on every View Live, which sends a new `at`).
  const { route: routeParam, at: openedAt } = useLocalSearchParams<{
    route?: string;
    at?: string;
  }>();
  const [pickedCode, setPickedCode] = useState<string | undefined>(routeParam);
  const paramKey = routeParam ? `${routeParam}|${openedAt ?? ''}` : undefined;
  const [seenParam, setSeenParam] = useState(paramKey);
  if (paramKey !== seenParam) {
    setSeenParam(paramKey);
    if (routeParam) setPickedCode(routeParam);
  }
  const selected =
    commute.options.find((option) => option.code === pickedCode) ??
    commute.options.find((option) => option.routeId === commute.preferred?.id) ??
    commute.options[0];
  // The lane the pin is on for the selected route (its road, else the line through its stops), sent with ₱1 and ads.
  const selectedPaths =
    waitPin && selected
      ? (commute.pathsByRoute[selected.routeId] ?? {
          outbound: buildPath(laneOf(selected.route, 'outbound')),
          inbound: buildPath(laneOf(selected.route, 'inbound')),
        })
      : undefined;
  // The pin's lane, or both lanes (undefined) when the pin is also close to the other direction's road.
  const wayDirection = waitPin && selectedPaths ? pinDirection(selectedPaths, waitPin, routeDirection) : routeDirection;
  // Routes are free to see; live jeepneys on a route need a ₱1 pass (Revision 11).
  // One ₱1 pass covers every route on the way and shows only the jeepneys that shared it (shared-view-earnings).
  const pass = useLivePass();
  const jeepWatch = useJeepWatch();
  const paid = pass.has(selected?.code);
  const liveJeeps = selected ? (commute.jeepsByRoute[selected.routeId] ?? []) : [];
  const paidJeeps = liveJeeps.filter((j) => pass.driverIds.includes(j.driverId));
  const [paying, setPaying] = useState(false);
  const [headingPicked, setHeadingPicked] = useState(false);
  // ad-supported-live-view: ₱1 or more pays (15 min); under ₱1 a rewarded ad gives a few minutes, never a top-up pop-up.
  const action = liveViewAction({
    hasJeeps: liveJeeps.length > 0,
    canPay: pass.canPay,
    // para-ads: a running Para Ad works in the apps even where Google's can't play; web has no ads (plan §6).
    adsAvailable: pass.adsEnabled && (adsSupported() || (pass.paraAds && Platform.OS !== 'web')),
  });
  const viewsApi = useViewsApi();
  const session = useOptionalSession();
  const uid = session && 'user' in session ? session.user?.uid : undefined;
  const [watchingAd, setWatchingAd] = useState(false);
  // preferred-route: the route the commuter picks becomes their preferred route (saved on the phone), so it opens
  // selected next time and carries the "YOUR PREFERRED ROUTE" badge.
  const pickRoute = (code: string) => {
    setPickedCode(code);
    setPreferredRoute(uid, code);
  };
  const confirmPay = () => {
    // Never pay or watch without a picked direction (the drawer's button is off until then).
    if (!headingPicked && !waitPin) return;
    setPaying(false);
    if (action === 'ad') {
      setWatchingAd(true);
      // A watched ad unlocks only the selected route (₱1 unlocks every route on the way).
      const adRoute = selected ? { id: selected.routeId, code: selected.code } : undefined;
      void watchAdForLiveView(viewsApi, pass, uid, waitAt, wayDirection, jeepWatch, adRoute).finally(() =>
        setWatchingAd(false),
      );
      return;
    }
    void buyLiveView(pass, waitAt, wayDirection, jeepWatch);
  };

  const [lastGps, setLastGps] = useState(`${trip.lastGpsSeconds}s ago`);

  // The commuter must say where they are going before paying (the ₱1 goes to the jeepneys coming their way): the map's
  // direction pill or the confirm drawer's choice. Until then the drawer's Confirm & Track stays off.
  const pickHeading = (key: 'outbound' | 'inbound') => {
    setDirection(key === 'outbound' ? 'colon' : 'apas');
    setHeadingPicked(true);
  };
  const toggleDirection = () => pickHeading(routeDirection === 'outbound' ? 'inbound' : 'outbound');
  const headings = selected
    ? (['outbound', 'inbound'] as const).map((key) => ({
        key,
        label: selected.route.directions[key]?.label ?? (key === 'outbound' ? 'Outbound' : 'Inbound'),
      }))
    : undefined;
  const vehiclesApproaching = trip.directions.find((option) => option.id === direction)?.units.length ?? 0;

  // Watch Ad has the small top-up link under it, so the collapsed sheet needs a little more room.
  const adLinkRoom = !paid && selected && action === 'ad' ? AD_LINK_ROOM : 0;
  // The minimized sheet stops just under the route list, measured on the phone (any screen or text size).
  const [routesHeight, setRoutesHeight] = useState(0);
  const [payBarHeight, setPayBarHeight] = useState(0);
  const sheetCollapsed = minimizedSheetHeight(paid, routesHeight, !paid && selected ? payBarHeight : 0, adLinkRoom);
  // The map fills the screen; its controls and route framing stay above the collapsed sheet.
  const renderMap = () => (
    <CorridorMap
      route={selected?.route}
      jeeps={paid ? paidJeeps : []}
      locked={!!selected && !paid}
      minutesLeft={pass.minutesLeft(selected?.code)}
      adPass={pass.passKind === 'ad'}
      direction={routeDirection}
      onToggleDirection={toggleDirection}
      routeCode={selected?.code ?? profile.preferredRouteCode}
      loading={commute.loading}
      error={commute.options.length === 0 && !commute.loading ? commute.notice : undefined}
      me={me}
      waitPin={waitPin}
      onPinChange={changePin}
      pinLabel={waitPin ? pinLabel(waitPin, myLocation) : undefined}
      followPin
      pinLocked={paid}
      fill
      bottomInset={placingPin ? 0 : sheetCollapsed}
      onPlacingChange={setPlacingPin}
      directionOptions={headings}
      selectedDirection={headingPicked ? routeDirection : undefined}
      onSelectDirection={pickHeading}
    />
  );

  return (
    <View style={styles.root} testID="screen-live-tracking">
      <TopBar
        variant="custom"
        left={
          <>
            <Pressable
              testID="back-to-hub"
              accessibilityRole="button"
              accessibilityLabel="Commute Hub"
              onPress={() => router.navigate('/commute')}
              style={styles.back}>
              <Icon name="arrow-back" size={24} color={colors.brand} />
              <AppText variant="labelBadge" weight="bold" color={colors.onSurface} style={styles.backText}>
                Commute Hub
              </AppText>
            </Pressable>
            <View style={styles.divider} />
            <View style={styles.titleBlock}>
              <View style={styles.titleRow}>
                <AppText
                  variant="headlineSm"
                  weight="bold"
                  numberOfLines={1}
                  style={styles.title}
                  accessibilityRole="header">
                  Live Corridor
                </AppText>
                <View style={styles.liveDot} />
              </View>
              <AppText variant="labelBadge" color={colors.textMuted} numberOfLines={1}>
                ON-DEMAND VIEW (₱1.00)
              </AppText>
            </View>
          </>
        }
        right={
          <>
            <BalancePill amount={formatPeso(profile.balance)} onPress={() => router.navigate('/wallet')} />
            <Avatar initials={profile.initials} />
          </>
        }
      />
      {/* live-map-bottom-sheet: the map is the main view; the routes are a draggable sheet over it. */}
      <View style={styles.mapArea}>
        {renderMap()}
        {placingPin ? null : (
          <LiveMapSheet paid={paid} collapsed={sheetCollapsed}>
            {paid ? (
              <EtaSheet
                trip={trip}
                routeOptions={commute.options}
                selectedCode={selected?.code}
                selected={selected}
                directionLabel={selected?.route.directions[routeDirection]?.label}
                passKind={pass.passKind}
                onSelectRoute={pickRoute}
                directionOptions={headings}
                onSelectDirection={pickHeading}
                selectedDirection={headingPicked ? routeDirection : undefined}
                routesNotice={commute.notice}
                direction={direction}
                lastGps={lastGps}
                onSwitch={toggleDirection}
                onRefresh={() => setLastGps('just now')}
                onRoutesLayout={(e) => setRoutesHeight(Math.ceil(e.nativeEvent.layout.height))}
              />
            ) : (
              <>
                <View
                  style={chipStyles.minimized}
                  onLayout={(e) => setRoutesHeight(Math.ceil(e.nativeEvent.layout.height))}>
                  {jeepWatch.watch ? (
                    <JeepWatchBanner
                      status={jeepWatch.watch.status === 'coming' ? 'coming' : 'watching'}
                      minutesLeft={jeepWatch.minutesLeft}
                      count={jeepWatch.watch.coming?.count}
                      routeCodes={jeepWatch.watch.coming?.routeCodes}
                      fare={formatPeso(LIVE_PASS_FARE)}
                      byAd={action === 'ad'}
                      // Through the confirm drawer, so the commuter picks their direction first.
                      onView={() => setPaying(true)}
                      onCancel={() => void jeepWatch.cancel().catch(() => undefined)}
                      busy={jeepWatch.busy || pass.buying}
                    />
                  ) : null}
                  {/* <RouteSummaryCard trip={trip} vehiclesApproaching={vehiclesApproaching} /> */}
                  <RouteChips
                    codes={commute.options.map((option) => option.code)}
                    selectedCode={selected?.code}
                    onSelect={pickRoute}
                    notice={commute.notice}
                  />
                </View>
                {headings ? (
                  <DirectionSwitch
                    options={headings}
                    selected={headingPicked ? routeDirection : undefined}
                    onSelect={pickHeading}
                  />
                ) : null}
                {/* Room under the chips so the floating button never covers them. */}
                {selected ? <View style={action === 'ad' ? chipStyles.spacerAd : chipStyles.spacer} /> : null}
              </>
            )}
          </LiveMapSheet>
        )}
        {!paid && selected && !placingPin ? (
          <LiveViewPayBar
            action={action}
            routeCode={selected.code}
            watchingAd={watchingAd}
            onView={() => setPaying(true)}
            onTopUp={() => router.navigate('/wallet')}
            onLayout={(e) => setPayBarHeight(Math.ceil(e.nativeEvent.layout.height))}
          />
        ) : null}
      </View>

      <ConfirmTrackModal
        mode={action === 'ad' ? 'ad' : 'pay'}
        adMinutes={pass.adMinutes}
        route={paying && selected ? { name: `Route ${selected.code}`, trackPassFare: LIVE_PASS_FARE } : null}
        balance={profile.balance}
        onCancel={() => setPaying(false)}
        onConfirm={confirmPay}
        // With a waiting pin, jeeps coming either way count: no direction to pick.
        headings={waitPin ? undefined : headings}
        heading={headingPicked ? routeDirection : undefined}
        onPickHeading={pickHeading}
      />
    </View>
  );
}

export default LiveTrackingScreen;
