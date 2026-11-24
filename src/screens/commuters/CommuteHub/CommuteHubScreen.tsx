import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

import { colors } from '@/constants/theme';
import { useCommuterLocation } from '@/hooks/useCommuterLocation';
import { useCommuterProfile } from '@/hooks/useCommuterProfile';
import { buyLiveView } from '@/hooks/buyLiveView';
import { useJeepWatch } from '@/hooks/useJeepWatch';
import { LIVE_PASS_FARE, useLivePass } from '@/hooks/useLivePass';
import { useRoutesOnMyWay } from '@/screens/commuters/LiveTracking/useRoutesOnMyWay';
import { filterRoutes, getRecentViews } from '@/services/commuterService';
import type { RecentView, RouteFilter, TransitRoute } from '@/types/commuter';
import { formatPeso } from '@/utils/currency';
import { AppText } from '@packages/ui/AppText';
import { Avatar } from '@packages/ui/Avatar';
import { Badge } from '@packages/ui/Badge';
import { BalancePill } from '@packages/ui/BalancePill';
import { Button } from '@packages/ui/Button';
import { Card } from '@packages/ui/Card';
import { Icon } from '@packages/ui/Icon';
import { IconButton } from '@packages/ui/IconButton';
import { JeepWatchBanner } from '@packages/ui/JeepWatchBanner';
import { ScreenScroll } from '@packages/ui/ScreenScroll';
import { SectionHeader } from '@packages/ui/SectionHeader';
import { TopBar } from '@packages/ui/TopBar';

import { ConfirmTrackModal } from './ConfirmTrackModal';
import { hubFilterOptions, toTransitRoute } from './hubRoutes';
import { RouteCard } from './RouteCard';
import { styles } from './styles';

const FILTER_TEST_IDS: Record<RouteFilter, string> = {
  all: 'filter-all',
  jeepney: 'filter-jeepney',
  bus: 'filter-bus',
};

export function CommuteHubScreen() {
  const profile = useCommuterProfile();
  const me = useCommuterLocation();
  const myLocation = me.status === 'granted' ? me.coordinate : undefined;
  // The preferred route and the routes on the commuter's way, with live jeeps on the road per direction.
  const nearby = useRoutesOnMyWay(profile.preferredRouteCode, myLocation);
  const routes = useMemo(
    () => nearby.routes.map((r) => toTransitRoute(r, nearby.jeepsByRoute[r.id] ?? [], nearby.pathsByRoute[r.id])),
    [nearby.routes, nearby.jeepsByRoute, nearby.pathsByRoute],
  );
  const filterOptions = useMemo(() => hubFilterOptions(routes), [routes]);

  const [filter, setFilter] = useState<RouteFilter>('all');
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<RecentView[]>(getRecentViews);
  const [pendingRoute, setPendingRoute] = useState<TransitRoute | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  const visibleRoutes = useMemo(() => filterRoutes(routes, filter, query), [routes, filter, query]);
  const balance = formatPeso(profile.balance);
  const openWallet = () => router.navigate('/wallet');
  const openLiveMap = () => router.navigate('/live-map');

  // View Live opens the Live Map with that route selected; confirming buys its ₱1 live pass (Revision 11).
  const pass = useLivePass();
  const jeepWatch = useJeepWatch();
  const openRouteLive = (code: string) =>
    // `at` makes a second View Live on the same route select it again.
    router.navigate({
      pathname: '/live-map',
      params: { route: code, at: String(Date.now()) },
    });
  const viewLive = (route: TransitRoute) => {
    if (pass.has(route.code))
      openRouteLive(route.code); // already paid: no second charge
    // Under ₱1 (ad-supported-live-view): the Live Map offers View live jeepneys (Watch Ads), no pop-up here.
    else if (!pass.canPay) openRouteLive(route.code);
    else setPendingRoute(route);
  };
  // ₱1 for live jeepneys on all routes on the way, shared by the ones coming (shared-view-earnings).
  const confirmTrack = () => {
    const code = pendingRoute?.code;
    setPendingRoute(null);
    void buyLiveView(pass, myLocation, undefined, jeepWatch).then(() => (code ? openRouteLive(code) : openLiveMap()));
  };
  // jeep-coming-alert: a jeepney is now coming for the commuter's free watch.
  const viewComing = () => {
    if (!pass.canPay) {
      openLiveMap(); // watch an ad there (ad-supported-live-view)
      return;
    }
    void buyLiveView(pass, myLocation, undefined, jeepWatch).then((live) => {
      if (live) openLiveMap();
    });
  };

  return (
    <View style={styles.root} testID="screen-commute-hub">
      <TopBar
        variant="brand"
        subtitle="COMMUTE"
        right={
          <>
            <BalancePill amount={balance} onPress={openWallet} testID="balance-pill" />
            <Avatar initials={profile.initials} />
          </>
        }
      />
      <ScreenScroll>
        {jeepWatch.watch ? (
          <JeepWatchBanner
            status={jeepWatch.watch.status === 'coming' ? 'coming' : 'watching'}
            minutesLeft={jeepWatch.minutesLeft}
            count={jeepWatch.watch.coming?.count}
            routeCodes={jeepWatch.watch.coming?.routeCodes}
            fare={formatPeso(LIVE_PASS_FARE)}
            byAd={!pass.canPay}
            onView={viewComing}
            onCancel={() => void jeepWatch.cancel().catch(() => undefined)}
            busy={jeepWatch.busy || pass.buying}
          />
        ) : null}
        <View style={styles.greetingRow}>
          <View style={styles.greetingText}>
            <AppText variant="headlineMd" accessibilityRole="header">
              {`Mabuhay, ${profile.firstName}! 👋`}
            </AppText>
            <AppText variant="bodyMd" color={colors.textMuted}>
              Saan ang biyahe mo ngayon?
            </AppText>
          </View>
          <IconButton icon="commute" variant="fare" accessibilityLabel="Commute options" />
        </View>

        <View style={[styles.search, searchFocused && styles.searchFocused]} testID="route-search-field">
          <Icon name="location-on" size={22} color={colors.brand} />
          <TextInput
            testID="route-search"
            accessibilityLabel="Search routes"
            placeholder="Search route, terminal, or stop (e.g. Colon)"
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.brand}
            cursorColor={colors.brand}
            keyboardAppearance="light"
            value={query}
            onChangeText={setQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            style={styles.searchInput}
          />
          <Icon name="my-location" size={20} color={colors.textMuted} />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroller}
          contentContainerStyle={styles.chips}>
          {filterOptions.map((option) => {
            const selected = option.value === filter;
            // Selected chip: bright orange with a bold white label (W2, reference "To Apas").
            const tint = selected ? colors.onBrandAction : colors.onSurface;
            return (
              <Pressable
                key={option.value}
                testID={FILTER_TEST_IDS[option.value]}
                accessibilityRole="button"
                accessibilityLabel={option.label}
                accessibilityState={{ selected }}
                onPress={() => setFilter(option.value)}
                style={[styles.chip, selected && styles.chipSelected]}>
                <Icon name={option.icon} size={16} color={tint} />
                <AppText variant="labelBadge" weight={selected ? 'bold' : 'semibold'} color={tint}>
                  {option.label}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>

        <Card variant="fare" style={styles.balanceCard}>
          <View style={styles.balanceRow}>
            <View style={styles.balanceIcon}>
              <Icon name="payments" size={22} color={colors.amberTint} />
            </View>
            <View style={styles.balanceText}>
              <View style={styles.amountRow}>
                <AppText variant="metricDisplay" tabular color={colors.textMuted}>
                  {balance}
                </AppText>
                <AppText variant="labelBadge" color={colors.textMuted}>
                  BALANCE
                </AppText>
              </View>
              <AppText variant="bodySm" color={colors.textMuted}>
                {`${profile.balance} instant live views available`}
              </AppText>
            </View>

            <Button
              label="+ Cash-in"
              size="sm"
              variant="tonal"
              color={colors.amberTint}
              style={{ backgroundColor: colors.onAmber }}
              icon="add-circle"
              onPress={openWallet}
              accessibilityLabel="Cash-in"
              testID="cash-in-button"
            />
          </View>
          <View style={styles.guaranteeBox}>
            <View style={styles.guaranteeRow}>
              <Icon name="verified" size={16} color={colors.liveStrong} />
              <AppText variant="bodySm" weight="bold" style={styles.guaranteeText}>
                ₱1 Viewing Access • Active Verified Drivers Only
              </AppText>
              <Badge label="₱0 If Inactive" tone="live" />
            </View>
            <View style={styles.guaranteeRow}>
              <Icon name="shield" size={16} color={colors.liveStrong} />
              <AppText variant="bodySm" color={colors.textMuted} style={styles.guaranteeText}>
                Walay Driver / No GPS = Automatic ₱0 Deduction
              </AppText>
              <AppText variant="labelBadge" weight="semibold" color={colors.liveStrong}>
                GUARANTEED REFUND
              </AppText>
            </View>
          </View>
        </Card>

        <SectionHeader
          title="Approved Transit Routes"
          titleVariant="headlineMd"
          subtitle="Routes on your way • Live jeeps on the road"
          right={
            <View style={styles.sectionBadges}>
              <Badge label="LIVE RADAR" tone="live" dot />
              <Badge label="Verified Drivers Only" tone="live" />
            </View>
          }
        />

        <View style={styles.list}>
          {nearby.loading || nearby.error || routes.length === 0 ? (
            <Card style={styles.empty} testID="routes-status">
              <Icon name={nearby.loading ? 'route' : 'search-off'} size={32} color={colors.textMuted} />
              <AppText variant="bodyMd" color={colors.textMuted} align="center">
                {nearby.loading
                  ? 'Finding routes on your way…'
                  : nearby.error
                    ? `Could not load routes: ${nearby.error.message}`
                    : 'No routes pass near you yet.'}
              </AppText>
            </Card>
          ) : visibleRoutes.length === 0 ? (
            <Card style={styles.empty} testID="routes-empty">
              <Icon name="search-off" size={32} color={colors.textMuted} />
              <AppText variant="headlineSm">No routes match your search</AppText>
              <AppText variant="bodySm" color={colors.textMuted} align="center">
                Try another route name, terminal or stop, or switch the transit filter.
              </AppText>
            </Card>
          ) : (
            visibleRoutes.map((route) => (
              <RouteCard
                key={route.id}
                route={route}
                onViewLive={viewLive}
                minutesLeft={pass.minutesLeft(route.code)}
              />
            ))
          )}
        </View>

        <View style={styles.recentHeader}>
          <AppText variant="headlineSm" weight="bold" accessibilityRole="header">
            Recent Viewing Activity
          </AppText>
          {recent.length > 0 ? (
            <Button label="Clear Log" variant="ghost" size="sm" onPress={() => setRecent([])} testID="clear-log" />
          ) : null}
        </View>
        {recent.length === 0 ? (
          <Card style={styles.empty} testID="recent-empty">
            <Icon name="history" size={28} color={colors.textMuted} />
            <AppText variant="bodyMd" color={colors.textMuted}>
              No recent views yet
            </AppText>
          </Card>
        ) : (
          recent.map((item) => (
            <Card key={item.id} style={styles.recentRow} testID={`recent-${item.id}`}>
              <View style={styles.recentIcon}>
                <Icon name="history" size={22} color={colors.brand} />
              </View>
              <View style={styles.recentBody}>
                <View style={styles.recentTitleRow}>
                  <AppText variant="headlineSm">{item.routeName}</AppText>
                  <Badge label={item.status} tone="live" />
                </View>
                <AppText variant="bodySm" color={colors.textMuted}>
                  {`Viewed ${item.viewedAgo} • ${item.vehiclesTracked} vehicles tracked`}
                </AppText>
              </View>
              <Button label="Re-open" size="sm" variant="tonal" onPress={openLiveMap} testID={`reopen-${item.id}`} />
            </Card>
          ))
        )}

        <Card style={styles.guaranteeCard}>
          <Icon name="verified-user" size={22} color={colors.brand} />
          <View style={styles.guaranteeCardBody}>
            <View style={styles.guaranteeTitleRow}>
              <AppText variant="headlineSm" style={styles.flex}>
                Walay Driver = ₱0 Deduction Guarantee
              </AppText>
              <Badge label="Zero-Risk" tone="live" />
            </View>
            <AppText variant="bodySm" color={colors.textMuted}>
              {`Dili ma-bawasan ang imong ${formatPeso(profile.balance, { decimals: 0 })} balance kung walay active driver o GPS telemetry nga nagbiyahe sa napiling ruta. Active verified drivers ra ang pabayron og ₱1 viewing pass with real-time GPS tracking.`}
            </AppText>
          </View>
        </Card>
      </ScreenScroll>

      <ConfirmTrackModal
        route={pendingRoute}
        balance={profile.balance}
        onCancel={() => setPendingRoute(null)}
        onConfirm={confirmTrack}
      />
    </View>
  );
}

export default CommuteHubScreen;
