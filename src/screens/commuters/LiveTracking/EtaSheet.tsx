import { View, type LayoutChangeEvent } from 'react-native';

import type { LiveTrip, RouteOption, TravelDirection } from '@/types/commuter';
import { ArrivalEtaCard } from '@packages/ui/ArrivalEtaCard';
import { SeatAvailability } from '@packages/ui/SeatAvailability';

import { DirectionPanels } from './DirectionPanels';
import { DirectionSwitch } from './DirectionSwitch';
import type { DirectionKey } from '@packages/tanstack/query/routes';
import { GpsStatusRow } from './GpsStatusRow';
import { PassStatusCard } from './PassStatusCard';
import { RouteChips } from './RouteChips';
import { RouteUnits } from './RouteUnits';
import { SheetActions } from './SheetActions';
import { BOARD_ON_ROAD_M, type CommuteOption } from './commuteOptions';
import { formatDistance } from './livePath';
import { VehicleSummary } from './VehicleSummary';
import { sheetStyles as styles } from './styles';

/**
 * The "To Apas / To Colon" panels show sample units only. Hidden for now (route-units, 2026-11-21): the selected
 * route's real jeeps are listed under its card instead. Set to true to show them again.
 */
const SHOW_DIRECTION_PANELS = false;

type Props = {
  trip: LiveTrip;
  routeOptions: RouteOption[];
  selectedCode?: string;
  /** The selected route with its next jeep and boarding stop (live-arrival-card). */
  selected?: CommuteOption;
  /** Where the commuter is going on it, e.g. "Going to Legaspi St". */
  directionLabel?: string;
  /** How the view was unlocked: ₱1 or a watched ad (the arrival card's tag). */
  passKind?: 'paid' | 'ad';
  onSelectRoute: (code: string) => void;
  /** direction-switch: "Going to" / "Going back" on the selected route. */
  directionOptions?: readonly { key: DirectionKey; label: string }[];
  selectedDirection?: DirectionKey;
  onSelectDirection?: (key: DirectionKey) => void;
  routesNotice?: string;
  /** The route list's size, for the minimized sheet. */
  onRoutesLayout?: (e: LayoutChangeEvent) => void;
  direction: TravelDirection;
  lastGps: string;
  onSwitch: () => void;
  onRefresh: () => void;
};

/**
 * What the Live Map sheet shows with a pass (live-map-bottom-sheet, live-arrival-card, route-units), top to bottom:
 * the routes on the commuter's way as chips, the unlocked arrival ETA, the next jeep's route, unit and plate, its seat
 * availability (seat-availability), the jeeps on the selected route (a dropdown), then GPS, pass and actions.
 */
export function EtaSheet({
  trip,
  routeOptions,
  selectedCode,
  selected,
  directionLabel,
  passKind,
  onSelectRoute,
  directionOptions,
  selectedDirection,
  onSelectDirection,
  routesNotice,
  onRoutesLayout,
  direction,
  lastGps,
  onSwitch,
  onRefresh,
}: Props) {
  return (
    <View style={styles.sections} testID="eta-sheet">
      <RouteChips
        codes={routeOptions.map((o) => o.code)}
        selectedCode={selectedCode}
        onSelect={onSelectRoute}
        notice={routesNotice}
        onLayout={onRoutesLayout}
      />
      {directionOptions && onSelectDirection ? (
        <DirectionSwitch options={directionOptions} selected={selectedDirection} onSelect={onSelectDirection} />
      ) : null}
      {selected ? (
        <>
          <ArrivalEtaCard
            minutes={selected.minutes}
            stopName={selected.boardName}
            detail={boardDetail(selected.boardDistance)}
            tag={passKind === 'ad' ? 'Ad view' : passKind === 'paid' ? '₱1 paid' : undefined}
            testID="arrival-eta"
          />
          <VehicleSummary
            routeCode={selected.code}
            routeName={selected.route.name}
            directionLabel={directionLabel}
            unitCode={selected.nextJeep?.unitCode}
            plate={selected.nextJeep?.plate}
          />
          {/* seat-availability: the tracked jeep's seats. Always shown for a tracked jeep; "Not updated" when its driver
              has not set the passenger load in the last 30 minutes. */}
          {selected.nextJeep ? (
            selected.nextJeep.seats ? (
              <SeatAvailability
                boarded={Math.max(0, selected.nextJeep.seats.capacity - selected.nextJeep.seats.free)}
                capacity={selected.nextJeep.seats.capacity}
                testID="seat-availability"
              />
            ) : (
              <SeatAvailability unknown testID="seat-availability" />
            )
          ) : null}
          {selected.units?.length ? <RouteUnits routeCode={selected.code} units={selected.units} /> : null}
        </>
      ) : null}
      {SHOW_DIRECTION_PANELS ? <DirectionPanels directions={trip.directions} selected={direction} /> : null}
      <GpsStatusRow lastGps={lastGps} accuracyNote={trip.accuracyNote} />
      <PassStatusCard pass={trip.pass} />
      <SheetActions onRefresh={onRefresh} onSwitch={onSwitch} />
    </View>
  );
}

/** The arrival card's second line: on the road where they stand, or how far to walk to the stop. */
export function boardDetail(distance: number | undefined): string | undefined {
  if (distance === undefined) return undefined;
  return distance <= BOARD_ON_ROAD_M ? "You're on the road" : `${formatDistance(distance)} walk to board`;
}
