import { useEffect, useMemo, useRef, useState, type ComponentProps, type ComponentType, type ReactNode } from 'react';
import { Easing, Linking, Platform, Pressable, View } from 'react-native';
import MapView, { AnimatedRegion, Marker, MarkerAnimated, Polyline, type LatLng } from 'react-native-maps';

import { colors } from '@/constants/theme';
import type { CommuterLocation } from '@/hooks/useCommuterLocation';
import { mapsAvailable } from '@/services/maps';
import type { TravelDirection } from '@/types/commuter';
import type { DirectionKey, Route } from '@packages/tanstack/query/routes';
import { AppText } from '@packages/ui/AppText';
import { Icon } from '@packages/ui/Icon';
import { Button } from '@packages/ui/Button';
import { IconButton } from '@packages/ui/IconButton';

import { CORRIDOR_REGION } from './corridorRoute';
import { DirectionSwitch } from './DirectionSwitch';
import { turnTowards } from './jeepMotion';
import {
  approachSegments,
  boardingPoints,
  earlyBoardLane,
  NEAR_END_M,
  turnaroundTail,
  pinDirection,
  jeepIncoming,
  jeepPose,
  pickupPoint,
  pickupText,
  placeLiveJeep,
  seatsText,
} from './commuteOptions';
import { isMoving, onFix, step, type Motion } from './deadReckoning';
import { nearCorridor, offsetRight, poseAlong, slicePath, type RoutePath } from './livePath';
import { useLiveCorridor, type LiveJeep } from './useLiveCorridor';
import { MAP_HEIGHT, mapStyles as styles } from './styles';

type Props = {
  /** The selected route (drawn with its stops and live jeeps). */
  route?: Route;
  /** Live jeeps on the selected route. */
  jeeps: LiveJeep[];
  /** Code shown while the route loads. */
  routeCode: string;
  /** Routes still loading, or why they could not be shown. */
  loading?: boolean;
  error?: string;
  /** The commuter's location (stays on the phone). */
  me: CommuterLocation & { retry: () => void };
  /** No live pass for this route: draw the route only, no jeepneys (Revision 11). */
  locked?: boolean;
  /** Minutes left on the route's live pass, shown in the status pill. */
  minutesLeft?: number;
  /** The running pass came from a watched ad (ad-supported-live-view): "Ad view • N min left". */
  adPass?: boolean;
  /** Where the commuter is going: that lane is orange, its jeeps coming to the stop are orange. */
  direction: DirectionKey;
  onToggleDirection: () => void;
  /** Fill the parent instead of the fixed MAP_HEIGHT (live-map-bottom-sheet: the map under the route sheet). */
  fill?: boolean;
  /** Points at the bottom covered by a sheet: the controls sit above it and route framing leaves it clear. */
  bottomInset?: number;
  /**
   * waiting-pin: where the commuter will wait. When set, the boarding point and the coming/passed colours are worked
   * out from it instead of their GPS.
   */
  waitPin?: LatLng;
  /** Set or move the pin (the screen checks it), or clear it with `undefined`. Without it, no pin control shows. */
  onPinChange?: (pin: LatLng | undefined) => void;
  /** "Waiting pin • 350 m from you" for the pin pill. */
  pinLabel?: string;
  /** Placing the pin started (true) or ended with Wait here / Cancel (false). */
  onPlacingChange?: (placing: boolean) => void;
  /** direction-switch: Going to / Going back, shown under Wait here while placing (the sheet is hidden then). */
  directionOptions?: readonly { key: DirectionKey; label: string }[];
  selectedDirection?: DirectionKey;
  onSelectDirection?: (key: DirectionKey) => void;
  /**
   * waiting-pin lane: with a pin, the direction whose road is nearest the pin replaces the picked one. Its whole lane
   * is orange (the road jeeps come on and the ride after the pin); the other direction is grey.
   */
  followPin?: boolean;
  /** Paid: the ₱1 was shared from this spot, so the pin can no longer be set, moved or cleared. */
  pinLocked?: boolean;
};

/**
 * `MarkerAnimated` renders its children at runtime, but its published type omits them,
 * so the cast only adds `children` back.
 */
type AnimatedTiming = Parameters<AnimatedRegion['timing']>[0];

type AnimatedMarkerProps = Omit<ComponentProps<typeof Marker>, 'coordinate'> & {
  coordinate: AnimatedRegion;
  children?: ReactNode;
};
const AnimatedMarker = MarkerAnimated as unknown as ComponentType<AnimatedMarkerProps>;

/** Tracked lane is the brand orange; the opposite lane is a neutral slate. */
const LANE: Record<TravelDirection, { stroke: string; width: number }> = {
  colon: { stroke: colors.brand, width: 5 },
  apas: { stroke: colors.secondary, width: 5 },
};

/**
 * Expo Go only ships Apple Maps, so the Google provider renders nothing there. Set
 * EXPO_PUBLIC_MAPS_PROVIDER=google in a development build (with the Google Maps key) to hide all basemap text.
 */
const GOOGLE_BASEMAP = process.env.EXPO_PUBLIC_MAPS_PROVIDER === 'google';

/**
 * Google basemap with every label, POI and transit icon turned off, so only the
 * roads and land are drawn. Needs the Google provider (see the Google Maps key note in the summary).
 */
const NO_TEXT_MAP_STYLE = [
  {
    featureType: 'all',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

/** Fastest a jeep can swing its nose, in degrees per second (a real steering limit for a jeepney). */
const MAX_TURN_DEG_PER_S = 60;

/** How often the nose eases towards the route bearing; short steps make turns look continuous. */
const TURN_TICK_MS = 100;

/** Icon size relative to its drawn size (1 = full size). */
const JEEP_SCALE = 0.8;

/**
 * Google Maps (Android) rotates markers natively and keeps a `flat` marker fixed to the map while the map turns.
 * Apple Maps (iOS) does not, so there the icon view turns itself.
 */
const NATIVE_MARKER_ROTATION = Platform.OS === 'android';

/** How long Android keeps re-drawing a marker's picture after its icon changes. */
const SNAPSHOT_MS = 500;

/** The jeep is drawn nose-to-the-right (facing east), so it turns by heading minus 90. */
const VEHICLE_FACING_OFFSET = 90;

const PICKUP_BOX = { width: 240, height: 56, ringX: 28 } as const;

/** The waiting pin's height (head and stem): its tip sits on the spot. */
const PIN_BOX_HEIGHT = 48;

/** Revision 13: the commuter's direction of travel is the orange lane; the other direction is slate. */
const laneStyle = (key: DirectionKey, mine: DirectionKey) => (key === mine ? LANE.colon : LANE.apas);
const other = (key: DirectionKey): DirectionKey => (key === 'outbound' ? 'inbound' : 'outbound');

/** Screen gap between a lane's centre line and the road's, so "going to" and "going back" sit side by side. */
const LANE_GAP_PX = 5;

/**
 * Up close, each lane is at least this far from the road's centre line (metres): about the middle of a real lane,
 * so the two directions stay apart on the road instead of merging.
 */
const MIN_LANE_OFFSET_M = 2.5;

/**
 * Metres per screen point for a map showing `latitudeDelta` degrees over the map's height, rounded to a power of
 * two so the lanes are only recomputed when the zoom changes noticeably.
 */
const metresPerPoint = (latitudeDelta: number, height = MAP_HEIGHT) => {
  const exact = (latitudeDelta * 111_320) / Math.max(height, 1);
  return 2 ** Math.round(Math.log2(Math.max(exact, 0.05)));
};

/** How long Recenter takes to turn the map north-up before framing the route. */
const TURN_UP_MS = 250;

/**
 * The map's floating direction pill and Recenter button. Hidden for now (2026-11-19, the user's request); the direction
 * is still picked in the confirm drawer and the sheet's Switch. Set to true to show them again.
 */
const SHOW_MAP_CONTROLS = false;

/** Map padding when framing the route. */
const FIT_PADDING = { top: 40, right: 40, bottom: 40, left: 40 };

/**
 * The commuter's corridor on a real map: the route and stops from the database (drawn along the road), and every
 * jeep sharing live GPS on it, moving along the route.
 */
/** The live map, or a notice when this build cannot draw maps (Android without a Google Maps key). */
export function CorridorMap(props: Props) {
  if (!mapsAvailable()) return <MapUnavailable fill={props.fill} />;
  return <LiveCorridorMap {...props} />;
}

function MapUnavailable({ fill }: { fill?: boolean }) {
  return (
    <View style={[fill ? styles.fill : styles.bleed, styles.mapUnavailable]} testID="map-unavailable">
      <Icon name="map" size={32} color={colors.textMuted} />
      <AppText variant="bodyMd" weight="bold" color={colors.onSurface}>
        Map not available in this build
      </AppText>
      <AppText variant="bodySm" color={colors.textMuted} style={styles.mapUnavailableText}>
        This Android build has no Google Maps key. Live jeeps still run; ask the Para team for an updated app.
      </AppText>
    </View>
  );
}

function LiveCorridorMap({
  route,
  jeeps: routeJeeps,
  routeCode,
  loading,
  error,
  me,
  locked,
  minutesLeft,
  adPass,
  direction: pickedDirection,
  onToggleDirection,
  fill,
  bottomInset = 0,
  waitPin,
  onPinChange,
  pinLabel,
  onPlacingChange,
  directionOptions,
  selectedDirection,
  onSelectDirection,
  followPin,
  pinLocked,
}: Props) {
  const mapRef = useRef<MapView>(null);
  // Route framing keeps clear of a sheet covering the bottom of the map.
  const fitPadding = { ...FIT_PADDING, bottom: FIT_PADDING.bottom + bottomInset };
  const lift = bottomInset ? { transform: [{ translateY: -bottomInset }] } : undefined;
  // The map's drawn height (fixed, or measured when it fills its parent), for the lane spacing.
  const heightRef = useRef(MAP_HEIGHT);
  const corridor = useLiveCorridor(route, routeJeeps);
  // waiting-pin lane: the side of the street the pin is on is the commuter's direction.
  // Locked (no paid access): the default colours, whatever the pin (the picked direction orange, the other grey).
  // With a pin, the picked direction (direction-switch) is the pin's lane.
  const pinLane = followPin && !locked && waitPin && corridor.paths ? pickedDirection : undefined;
  const direction = pinLane ?? pickedDirection;
  // The pin is also close to the other direction's road: jeeps coming that way stop there too, so both lanes count.
  const pinBothWays = !!pinLane && !!corridor.paths && !!waitPin && !pinDirection(corridor.paths, waitPin, pinLane);
  // early-boarding: the pin is on the road of the direction that turns into the picked one (locked or not). The
  // commuter boards there and rides round the turnaround, so that road is where they board and its jeeps come.
  const earlyLane =
    followPin && waitPin && corridor.paths ? earlyBoardLane(corridor.paths, waitPin, pickedDirection) : undefined;
  const boardKey = earlyLane ?? direction;
  const allPoints = useMemo(
    () => (corridor.paths ? [...corridor.paths.outbound.points, ...corridor.paths.inbound.points] : []),
    [corridor.paths],
  );

  // Recenter: north up again (the map may have been turned), then frame the whole route.
  const fitRoute = () => {
    const map = mapRef.current;
    if (!map) return;
    // North-up first; frame the route once that turn is done (two camera moves at once fight each other on iOS).
    map.animateCamera({ heading: 0, pitch: 0 }, { duration: TURN_UP_MS });
    setTimeout(() => {
      // The commuter too, when they are near the route (not when they are across town).
      const withMe = waitAt && pickup && pickup.distance < 3_000 ? [...allPoints, waitAt] : allPoints;
      if (withMe.length > 1)
        map.fitToCoordinates(withMe, {
          edgePadding: fitPadding,
          animated: true,
        });
      else map.animateToRegion(CORRIDOR_REGION, 500);
    }, TURN_UP_MS + 50);
  };

  // Frame the route once it has loaded, and again whenever another route is selected.
  const framedId = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!route || framedId.current === route.id || allPoints.length < 2) return;
    framedId.current = route.id;
    mapRef.current?.fitToCoordinates(allPoints, {
      edgePadding: { ...FIT_PADDING, bottom: FIT_PADDING.bottom + bottomInset },
      animated: true,
    });
  }, [allPoints, route, bottomInset]);

  // Tapping the map hides or shows the pickup banner only; the pickup point and vehicles stay visible.
  const [detailsVisible, setDetailsVisible] = useState(true);

  // waiting-pin: the commuter decides where they wait. While placing, the waving pin stays steady in the middle of
  // the map and they move the map under it, then tap "Wait here" (as in ride-hailing apps).
  const [placing, setPlacingState] = useState(false);
  // Once paid the pin is fixed: no setting, moving or clearing it.
  const canChangePin = !!onPinChange && !pinLocked;
  // The screen hides the route sheet while placing, for a bigger map (shown again on Wait here or Cancel).
  const setPlacing = (value: boolean) => {
    setPlacingState(value);
    onPlacingChange?.(value);
  };
  const startPlacing = () => {
    // Start from the current pin, else where the commuter stands, else the middle of the map.
    const from = waitPin ?? myLocation;
    const map = mapRef.current;
    if (from && map) {
      center.current = from;
      map.animateCamera({ center: from }, { duration: 400 });
    }
    setPlacing(true);
  };
  const confirmPlacing = () => {
    setPlacing(false);
    onPinChange?.(center.current);
  };
  const toggleDetails = () => setDetailsVisible((visible) => !visible);

  // Compass direction the map is turned to (0 = north at the top). Icons subtract it so they line up with the road.
  const [cameraHeading, setCameraHeading] = useState(0);
  const handleRegionChange = () => {
    mapRef.current
      ?.getCamera()
      .then((camera) => setCameraHeading(camera.heading))
      .catch(() => undefined);
  };

  // Only jeeps actually on this corridor: a fix kilometres away is bad GPS (or an emulator's default location).
  const jeeps = useMemo(
    () =>
      corridor.paths
        ? corridor.jeeps.filter((j) => nearCorridor(corridor.paths as Record<DirectionKey, RoutePath>, j.coordinate))
        : [],
    [corridor.jeeps, corridor.paths],
  );

  // The commuter's own location (stays on the phone) and the nearest stop to board at.
  const myLocation = me.status === 'granted' ? me.coordinate : undefined;
  // waiting-pin: the pin, when set, stands in for the commuter's GPS (the same point the ₱1 is shared from).
  const waitAt = waitPin ?? myLocation;
  // The waving pin: the pin, else the commuter's current location (while placing it is drawn steady over the map).
  const pinAt = placing ? undefined : waitAt;
  // The middle of the map, where "Set waiting pin" drops the pin.
  const center = useRef<LatLng>({ latitude: CORRIDOR_REGION.latitude, longitude: CORRIDOR_REGION.longitude });
  // A few dozen stops at most: cheap enough to work out on every render.
  // Where to board on the commuter's direction of travel: on the road where they stand (jeepneys pick up along it),
  // else the closest stop. The same rule decides which jeepneys share their ₱1.
  const pickup = waitAt ? pickupPoint(corridor.namedStops[boardKey], corridor.paths?.[boardKey], waitAt) : undefined;
  const directionLabel = corridor.route?.directions[boardKey]?.label;
  const pickupLines = pickup ? pickupText(pickup, directionLabel) : undefined;
  // Where the commuter boards on each direction, so jeeps that already passed can be told apart. Two projections
  // onto the road: cheap enough per render, and markers only react when the result changes (they compare it as text).
  const boards =
    corridor.paths && waitAt
      ? boardingPoints(corridor.namedStops, corridor.paths, waitAt, pinBothWays ? undefined : boardKey)
      : undefined;

  // Each direction drawn on its own side of the road, a fixed few points apart at any zoom.
  const [mpp, setMpp] = useState(() => metresPerPoint(CORRIDOR_REGION.latitudeDelta));
  const laneOffsetM = Math.max(MIN_LANE_OFFSET_M, mpp * LANE_GAP_PX);
  // Each direction a few points to its own side of the road (Revision 20), so where both use the same street the
  // orange and grey lines run side by side instead of on top of each other.
  const lanes = useMemo(
    () =>
      corridor.paths
        ? {
            outbound: offsetRight(corridor.paths.outbound.points, laneOffsetM),
            inbound: offsetRight(corridor.paths.inbound.points, laneOffsetM),
          }
        : undefined,
    [corridor.paths, laneOffsetM],
  );

  // turnaround-approach: with a boarding point, both lanes are grey and only the road leading to it is orange (up to
  // the boarding point, and across the turnaround from the end of the other direction).
  // Orange only where incoming jeeps run: the road leading to the boarding point (both ways with a pin), within the
  // 3 km a commuter would wait. Jeeps that passed or are too far to wait for are grey, like the rest of the road.
  // With a waiting pin, its whole lane is orange instead (the road in and the ride after the pin), plus, when the pin
  // is also close to the other direction, the half of that road leading its jeeps to the pin.
  const approachBoards = earlyLane
    ? undefined
    : pinLane && boards
      ? pinBothWays
        ? { [other(pinLane)]: boards[other(pinLane)] }
        : undefined
      : boards;
  const approach =
    corridor.paths && approachBoards && !locked
      ? approachSegments(corridor.paths, approachBoards)
          .map((seg) => ({
            ...seg,
            points: offsetRight(
              slicePath((corridor.paths as Record<DirectionKey, RoutePath>)[seg.key], seg.from, seg.to),
              laneOffsetM,
            ),
          }))
          .filter((seg) => seg.points.length > 1)
      : undefined;

  // turnaround-tail: a pin near the start of the picked direction also colours the last 1 km of the other direction
  // (locked or not): those jeeps turn round and come to the pin. Further from the start, the default colours.
  const tail =
    followPin && waitPin && corridor.paths && !earlyLane
      ? turnaroundTail(corridor.paths, waitPin, direction)
      : undefined;
  // early-boarding: the road the commuter boards on is orange from up to NEAR_END_M (2 km) before the pin (incoming jeeps) to its
  // end at the turnaround (their ride round it), then their own direction (orange as the picked lane).
  const earlyBoard = earlyLane ? boards?.[earlyLane] : undefined;
  const early =
    earlyLane && earlyBoard && corridor.paths
      ? {
          key: earlyLane,
          from: Math.max(0, earlyBoard.along - NEAR_END_M),
          to: corridor.paths[earlyLane].length,
        }
      : undefined;
  const earlyPoints =
    early && corridor.paths ? offsetRight(slicePath(corridor.paths[early.key], early.from, early.to), laneOffsetM) : [];
  const tailPoints =
    tail && corridor.paths ? offsetRight(slicePath(corridor.paths[tail.key], tail.from, tail.to), laneOffsetM) : [];
  const overlays = [
    ...(approach ?? []),
    ...(tail && tailPoints.length > 1 ? [{ ...tail, points: tailPoints }] : []),
    ...(early && earlyPoints.length > 1 ? [{ ...early, points: earlyPoints }] : []),
  ];

  const routeLabel = `Route ${route?.code ?? routeCode}`;
  const status = error
    ? error
    : loading || corridor.loading
      ? `Loading ${routeLabel}…`
      : locked
        ? `${routeLabel} • live jeepneys locked`
        : jeeps.length === 0
          ? `No jeeps live on ${routeLabel}`
          : `${jeeps.length} ${jeeps.length === 1 ? 'jeep' : 'jeeps'} live on ${routeLabel}`;

  const timeLeft =
    !locked && minutesLeft !== undefined ? ` • ${adPass ? 'Ad view • ' : ''}${minutesLeft} min left` : '';

  return (
    <View
      style={fill ? styles.fill : styles.bleed}
      onLayout={fill ? (e) => (heightRef.current = e.nativeEvent.layout.height) : undefined}>
      <MapView
        ref={mapRef}
        style={fill ? styles.fill : { height: MAP_HEIGHT }}
        provider={GOOGLE_BASEMAP ? 'google' : undefined}
        customMapStyle={GOOGLE_BASEMAP ? NO_TEXT_MAP_STYLE : undefined}
        mapType={GOOGLE_BASEMAP ? undefined : 'mutedStandard'}
        showsPointsOfInterests={!GOOGLE_BASEMAP ? false : undefined}
        initialRegion={CORRIDOR_REGION}
        testID="live-map-canvas"
        accessibilityLabel={`${routeLabel} live corridor map`}
        toolbarEnabled={false}
        showsCompass={false}
        // The waiting commuter is drawn with the app's orange ring (below), not the platform's blue dot.
        showsUserLocation={false}
        rotateEnabled
        pitchEnabled={false}
        onRegionChange={handleRegionChange}
        onRegionChangeComplete={(region) => {
          center.current = { latitude: region.latitude, longitude: region.longitude };
          setMpp(metresPerPoint(region.latitudeDelta, heightRef.current));
        }}
        onPress={toggleDetails}
        onLongPress={canChangePin && !placing ? (e) => onPinChange?.(e.nativeEvent.coordinate) : undefined}>
        {lanes
          ? // The other direction first, so the commuter's orange lane is drawn on top. With a boarding point both are
            // grey here and the approach is drawn orange over them.
            [other(direction), direction].map((key) => (
              <Polyline
                key={key}
                coordinates={lanes[key]}
                strokeColor={approach && !pinLane ? LANE.apas.stroke : laneStyle(key, direction).stroke}
                strokeWidth={laneStyle(key, direction).width}
                lineCap="round"
                lineJoin="round"
              />
            ))
          : null}
        {overlays.map((seg) => (
          <Polyline
            // Keyed by where it starts and ends: Apple Maps does not redraw a line whose points change, so a moved
            // waiting pin draws fresh lines instead of leaving the old pin's orange behind.
            key={`approach-${seg.key}-${Math.round(seg.from)}-${Math.round(seg.to)}`}
            coordinates={seg.points}
            strokeColor={LANE.colon.stroke}
            strokeWidth={LANE.colon.width}
            lineCap="round"
            lineJoin="round"
            zIndex={2}
          />
        ))}

        {(['outbound', 'inbound'] as const).flatMap((key) =>
          corridor.stops[key].map((stop, i) => (
            <StillMarker key={`${key}-${i}`} coordinate={stop} anchor={{ x: 0.5, y: 0.5 }} redrawKey={direction}>
              <View style={[styles.routeStop, key !== direction && styles.routeStopInbound]} />
            </StillMarker>
          )),
        )}

        {corridor.paths
          ? jeeps.map((jeep) => (
              <LiveJeepMarker
                key={jeep.driverId}
                jeep={jeep}
                paths={corridor.paths as Record<DirectionKey, RoutePath>}
                // Orange while it runs the commuter's direction and has not reached their stop; grey once it has
                // passed, or when it runs the other way (Revisions 12, 13). Without the commuter's location: orange
                // for every jeep on their direction.
                incoming={
                  boards
                    ? jeepIncoming(corridor.paths as Record<DirectionKey, RoutePath>, jeep, boards)
                    : placeLiveJeep(corridor.paths as Record<DirectionKey, RoutePath>, jeep)?.key === direction
                }
                cameraHeading={cameraHeading}
              />
            ))
          : null}

        {pickup && waitAt ? (
          <>
            {/* Where to board (the stop, or the spot on the road), highlighted. */}
            <StillMarker
              coordinate={pickup.coordinate}
              anchor={{ x: 0.5, y: 0.5 }}
              redrawKey={`${pickup.name}-${pickup.onRoad}-${pickup.coordinate.latitude.toFixed(5)},${pickup.coordinate.longitude.toFixed(5)}`}>
              <View style={styles.boardStop} testID="pickup-stop" />
            </StillMarker>
          </>
        ) : null}

        {myLocation && (waitPin || placing) ? (
          // With a pin elsewhere, the commuter is a small dot (the card is on the pin).
          <StillMarker coordinate={myLocation} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.meDot} testID="commuter-location-dot" />
          </StillMarker>
        ) : null}

        {pinAt ? (
          // waiting-pin: the waving pin is where the commuter waits: on them (their current location) until they set
          // a pin somewhere else. It carries the boarding card.
          <Marker
            coordinate={pinAt}
            anchor={{ x: PICKUP_BOX.ringX / PICKUP_BOX.width, y: 1 }}
            centerOffset={{ x: PICKUP_BOX.width / 2 - PICKUP_BOX.ringX, y: -PIN_BOX_HEIGHT / 2 }}
            zIndex={5}
            tracksViewChanges={Platform.OS === 'android'}>
            <View
              style={styles.pinBox}
              testID={waitPin ? 'waiting-pin' : 'commuter-location'}
              accessibilityLabel={waitPin ? 'Waiting pin' : 'You'}>
              <View style={styles.pinHead}>
                <View style={styles.pinIcon}>
                  <Icon name="hail" size={18} color={colors.onBrand} />
                </View>
                <View style={styles.pinStem} />
              </View>
              {detailsVisible && pickupLines ? (
                <View style={[styles.pickupCard, styles.pinCard]}>
                  <AppText variant="bodySm" weight="bold" color={colors.onSurface} numberOfLines={1}>
                    {pickupLines.title}
                  </AppText>
                  <AppText variant="labelBadge" color={colors.textMuted} numberOfLines={1}>
                    {pickupLines.detail}
                  </AppText>
                </View>
              ) : null}
            </View>
          </Marker>
        ) : null}
      </MapView>

      <View style={styles.liveStatus} pointerEvents="none" testID="live-map-status">
        <View style={[styles.liveStatusDot, jeeps.length === 0 && styles.liveStatusDotIdle]} />
        <AppText variant="labelBadge" weight="bold" color={colors.onSurface}>
          {`${status}${timeLeft}`}
        </AppText>
      </View>

      {placing ? (
        <>
          {/* The pin's tip is the middle of the map: the spot the commuter picks. */}
          <View style={styles.placingPin} pointerEvents="none" testID="placing-pin">
            <View style={styles.pinIcon}>
              <Icon name="hail" size={18} color={colors.onBrand} />
            </View>
            <View style={styles.pinStem} />
          </View>
          <View style={styles.placingCard} testID="placing-card">
            <AppText variant="bodySm" weight="bold" color={colors.onSurface}>
              Move the map to where you will wait
            </AppText>
            <AppText variant="labelBadge" color={colors.textMuted}>
              The jeepneys coming to this spot share your ₱1.
            </AppText>
            <View style={styles.placingActions}>
              <Button
                label="Cancel"
                variant="tonal"
                size="sm"
                flex
                testID="cancel-waiting-pin"
                onPress={() => setPlacing(false)}
              />
              <Button
                label="Wait here"
                icon="hail"
                size="sm"
                flex
                testID="confirm-waiting-pin"
                onPress={confirmPlacing}
              />
            </View>
            {directionOptions && onSelectDirection ? (
              <View style={styles.placingDirections}>
                <DirectionSwitch options={directionOptions} selected={selectedDirection} onSelect={onSelectDirection} />
              </View>
            ) : null}
          </View>
        </>
      ) : onPinChange && pinLocked ? (
        waitPin ? (
          // Paid: the pin stays where the ₱1 was shared from.
          <View
            style={styles.pinPill}
            testID="waiting-pin-pill"
            accessibilityLabel={`${pinLabel ?? 'Waiting pin'}. Fixed while your live view runs`}>
            <Icon name="hail" size={16} color={colors.brandStrong} />
            <AppText
              variant="labelBadge"
              weight="bold"
              color={colors.onSurface}
              numberOfLines={1}
              style={styles.shrink}>
              {pinLabel ?? 'Waiting pin'}
            </AppText>
            <Icon name="lock" size={16} color={colors.textMuted} />
          </View>
        ) : null
      ) : onPinChange ? (
        waitPin ? (
          <View style={styles.pinPill} testID="waiting-pin-pill">
            <Pressable
              style={styles.pinPillMain}
              accessibilityRole="button"
              accessibilityLabel={`${pinLabel ?? 'Waiting pin'}. Move pin`}
              testID="move-waiting-pin"
              onPress={startPlacing}>
              <Icon name="hail" size={16} color={colors.brandStrong} />
              <AppText
                variant="labelBadge"
                weight="bold"
                color={colors.onSurface}
                numberOfLines={1}
                style={styles.shrink}>
                {pinLabel ?? 'Waiting pin'}
              </AppText>
              <Icon name="edit-location-alt" size={16} color={colors.brandStrong} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear waiting pin"
              testID="clear-waiting-pin"
              hitSlop={12}
              onPress={() => onPinChange(undefined)}>
              <Icon name="close" size={16} color={colors.textMuted} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={styles.pinPill}
            accessibilityRole="button"
            accessibilityHint="Pick where you will wait by moving the map under the pin. You can also long-press the map."
            testID="set-waiting-pin"
            onPress={startPlacing}>
            <Icon name="add-location-alt" size={16} color={colors.brandStrong} />
            <AppText variant="labelBadge" weight="bold" color={colors.onSurface}>
              Set waiting pin
            </AppText>
          </Pressable>
        )
      ) : null}

      {me.status === 'denied' || me.status === 'off' ? (
        <Pressable
          style={[styles.locationHint, onPinChange && styles.locationHintLow]}
          accessibilityRole="button"
          testID="location-hint"
          onPress={() => (me.status === 'denied' ? void Linking.openSettings() : me.retry())}>
          <Icon name="location-off" size={16} color={colors.onSurface} />
          <AppText variant="labelBadge" weight="bold" color={colors.onSurface}>
            {me.status === 'denied'
              ? 'Allow location to find your nearest stop'
              : 'Turn on Location Services to find your nearest stop'}
          </AppText>
        </Pressable>
      ) : null}

      {SHOW_MAP_CONTROLS && corridor.route ? (
        <Pressable
          style={[styles.directionToggle, lift]}
          accessibilityRole="button"
          accessibilityLabel={`${directionLabel ?? 'Direction'}. Switch direction`}
          testID="map-direction-toggle"
          onPress={onToggleDirection}>
          <View style={styles.directionDot} />
          <AppText variant="labelBadge" weight="bold" color={colors.onSurface} numberOfLines={1} style={styles.shrink}>
            {directionLabel ?? ''}
          </AppText>
          <Icon name="swap-vert" size={18} color={colors.brandStrong} />
        </Pressable>
      ) : null}

      {SHOW_MAP_CONTROLS ? (
        <IconButton
          icon="near-me"
          variant="tonal"
          iconColor={colors.ink}
          accessibilityLabel="Recenter map"
          testID="recenter-map"
          onPress={fitRoute}
          style={[styles.fab, lift]}
        />
      ) : null}
    </View>
  );
}

/**
 * A marker whose picture rarely changes (stops, the commuter's ring). Android draws a marker's view as a captured
 * picture and shows nothing until one is taken, so it captures for a moment after mounting and after `redrawKey`
 * changes, then stops (cheap to pan and zoom). iOS draws the view directly.
 */
function StillMarker({ redrawKey, ...props }: ComponentProps<typeof Marker> & { redrawKey?: string }) {
  const [captured, setCaptured] = useState<string | null>(null);
  const key = redrawKey ?? '';
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const done = setTimeout(() => setCaptured(key), SNAPSHOT_MS);
    return () => clearTimeout(done);
  }, [key]);
  return <Marker {...props} tracksViewChanges={Platform.OS === 'android' && captured !== key} />;
}

type LiveJeepMarkerProps = {
  jeep: LiveJeep;
  /** Still coming to the commuter's stop (orange), or already passed it / going the other way (grey). */
  incoming: boolean;
  /** The selected route's road per direction: the jeep moves along its lane. */
  paths: Record<DirectionKey, RoutePath>;
  cameraHeading: number;
};

/** A fix off the route: glide straight there in this time. */
const OFF_ROUTE_MOVE_MS = 1_000;

/** How often the jeep steps along the road; each step eases linearly into the next, so it reads as one motion. */
const STEP_MS = 200;

/**
 * One live jeep, moving smoothly between GPS fixes along its lane (Revision 18, `deadReckoning`): it glides to each
 * new fix, keeps going at the same speed for up to one more fix-to-fix distance if the next fix is late, then waits;
 * it never moves backwards. A fix more than 50 m off the route is shown where it is (straight glide).
 */
function LiveJeepMarker({ jeep, incoming, paths, cameraHeading }: LiveJeepMarkerProps) {
  const first = jeepPose(paths, jeep);
  const [region] = useState(() => new AnimatedRegion({ ...first.coordinate, latitudeDelta: 0, longitudeDelta: 0 }));
  const [heading, setHeading] = useState(first.bearing);
  const target = useRef(first.bearing);
  const motion = useRef<Motion | undefined>(undefined);

  // Android draws a marker's view as a picture: re-take it briefly when the icon changes (first draw, colour), then
  // stop, so rotating the map or the marker costs nothing.
  const [snapshotDone, setSnapshotDone] = useState<boolean | null>(null);
  const snapshotting = snapshotDone !== incoming;
  useEffect(() => {
    if (!NATIVE_MARKER_ROTATION) return;
    const done = setTimeout(() => setSnapshotDone(incoming), SNAPSHOT_MS);
    return () => clearTimeout(done);
  }, [incoming]);

  const moveTo = (coordinate: LatLng, duration: number) =>
    region
      .timing({
        ...coordinate,
        latitudeDelta: 0,
        longitudeDelta: 0,
        toValue: 0,
        duration,
        easing: Easing.linear,
        useNativeDriver: false,
      } as AnimatedTiming)
      .start();

  // A new fix: on the route it feeds the motion rules; off the route the jeep glides straight to it.
  useEffect(() => {
    const pose = jeepPose(paths, jeep);
    const lane = pose.snapped ? placeLiveJeep(paths, jeep) : undefined;
    if (!lane) {
      motion.current = undefined;
      moveTo(pose.coordinate, OFF_ROUTE_MOVE_MS);
      target.current = pose.bearing;
      return;
    }
    const before = motion.current;
    motion.current = onFix(motion.current, { lane: lane.key, distance: lane.distance, at: jeep.at });
    if (!before || before.lane !== motion.current.lane || motion.current.shown !== before.shown) {
      // First fix, another lane, or a jump: place it at once.
      const at = poseAlong(paths[lane.key], motion.current.shown);
      moveTo(at.coordinate, STEP_MS);
      target.current = at.bearing;
    }
    // moveTo only reads `region`, which never changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jeep, paths]);

  // The motion clock: step along the lane and turn the nose with the road while moving.
  useEffect(() => {
    const tick = setInterval(() => {
      const m = motion.current;
      if (!m?.lane || !isMoving(m)) return;
      motion.current = step(m, STEP_MS / 1000);
      const at = poseAlong(paths[m.lane], motion.current.shown);
      moveTo(at.coordinate, STEP_MS);
      target.current = at.bearing;
    }, STEP_MS);
    const turn = setInterval(() => {
      setHeading((current) => turnTowards(current, target.current, (MAX_TURN_DEG_PER_S * TURN_TICK_MS) / 1000));
    }, TURN_TICK_MS);
    return () => {
      clearInterval(tick);
      clearInterval(turn);
    };
    // moveTo only reads `region`, which never changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paths]);

  return (
    <AnimatedMarker
      coordinate={region}
      anchor={{ x: 0.5, y: 0.5 }}
      title={jeep.unitCode}
      description={[jeep.plate, jeep.seats ? seatsText(jeep.seats.free) : ''].filter(Boolean).join(' • ')}
      {...(NATIVE_MARKER_ROTATION
        ? {
            // Android (Google Maps): the map turns the marker itself. `flat` keeps it fixed to the map, so its
            // nose follows the road while the map rotates; only the colour change needs a new snapshot.
            flat: true,
            rotation: heading - VEHICLE_FACING_OFFSET,
            tracksViewChanges: snapshotting,
          }
        : // iOS (Apple Maps): the icon turns itself, minus the map's own rotation.
          { tracksViewChanges: true })}>
      <JeepIcon
        incoming={incoming}
        rotation={NATIVE_MARKER_ROTATION ? 0 : heading - cameraHeading - VEHICLE_FACING_OFFSET}
      />
    </AnimatedMarker>
  );
}

/**
 * Top-down jeep, front to the right: a dark outline, a white body, a blue windshield and an orange front cap, with an
 * orange glow while it is coming to the commuter's stop. Once it has passed: a grey body and slate cap, no glow.
 */
function JeepIcon({ incoming, rotation }: { incoming: boolean; rotation: number }) {
  return (
    <View
      testID={incoming ? 'jeep-incoming' : 'jeep-passed'}
      style={[
        styles.jeepGlow,
        incoming && styles.jeepGlowColon,
        { transform: [{ rotate: `${rotation}deg` }, { scale: JEEP_SCALE }] },
      ]}>
      <View style={styles.jeepOutline} />
      <View style={[styles.jeepBody, !incoming && styles.jeepBodyApas]} />
      <View style={styles.jeepWindshield} />
      <View style={[styles.jeepCap, !incoming && styles.jeepCapApas]} />
    </View>
  );
}
