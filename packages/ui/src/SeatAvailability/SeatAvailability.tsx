import { View } from 'react-native';

import { AppText } from '../AppText';
import { colors } from '../theme';
import { styles } from './styles';

export type SeatLevel = 'roomy' | 'comfortable' | 'almostFull' | 'full';

const LEVEL: Record<SeatLevel, { label: string; fill: string; text: string }> = {
  roomy: { label: 'ROOMY', fill: colors.live, text: colors.liveStrong },
  comfortable: { label: 'COMFORTABLE', fill: colors.amber, text: colors.amberStrong },
  almostFull: { label: 'ALMOST FULL', fill: colors.brandAction, text: colors.brandStrong },
  full: { label: 'FULL', fill: colors.crimsonAlert, text: colors.error },
};

/** How full a jeep is: under half roomy, under 80% comfortable, then almost full, and full with no seat left. */
export function seatLevel(boarded: number, capacity: number): SeatLevel {
  if (capacity <= 0 || boarded >= capacity) return 'full';
  const ratio = boarded / capacity;
  return ratio < 0.5 ? 'roomy' : ratio < 0.8 ? 'comfortable' : 'almostFull';
}

const SEGMENTS = 4;

export type SeatAvailabilityProps = {
  /** Passengers on board and the jeep's seats (from the driver's passenger load). */
  boarded: number;
  capacity: number;
  testID?: string;
};

/**
 * Seat availability on the tracked jeep (seat-availability): "N SEATS LEFT", a 4-part bar filled by how full it is,
 * and "boarded / seats Passengers Boarded" with a level word (roomy, comfortable, almost full, full).
 */
export function SeatAvailability(props: SeatAvailabilityProps | { unknown: true; testID?: string }) {
  if ('unknown' in props) return <SeatsUnknown testID={props.testID} />;
  return <SeatsKnown {...props} />;
}

/** No recent passenger count from the driver: the card stays, with an empty bar and a note. */
function SeatsUnknown({ testID }: { testID?: string }) {
  return (
    <View
      style={styles.card}
      testID={testID}
      accessible
      accessibilityLabel="Seat availability: not updated recently by the driver">
      <AppText variant="headlineSm" weight="bold">
        Seat Availability
      </AppText>
      <View style={styles.pill}>
        <AppText variant="bodyLg" weight="bold" color={colors.textMuted} uppercase testID={testID ? `${testID}-left` : undefined}>
          Not updated
        </AppText>
      </View>
      <View style={styles.bar}>
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <View key={i} style={styles.segment} />
        ))}
      </View>
      <AppText variant="bodyMd" color={colors.textMuted}>
        The driver has not updated the passenger count in the last 30 minutes.
      </AppText>
    </View>
  );
}

function SeatsKnown({ boarded, capacity, testID }: SeatAvailabilityProps) {
  const left = Math.max(0, capacity - boarded);
  const level = LEVEL[seatLevel(boarded, capacity)];
  const filled = capacity > 0 ? Math.min(SEGMENTS, Math.ceil((boarded / capacity) * SEGMENTS)) : SEGMENTS;
  return (
    <View
      style={styles.card}
      testID={testID}
      accessible
      accessibilityLabel={`Seat availability: ${left} ${left === 1 ? 'seat' : 'seats'} left, ${boarded} of ${capacity} passengers boarded, ${level.label.toLowerCase()}`}>
      <AppText variant="headlineSm" weight="bold">
        Seat Availability
      </AppText>
      <View style={styles.pill}>
        <AppText variant="bodyLg" weight="bold" color={level.text} uppercase testID={testID ? `${testID}-left` : undefined}>
          {left === 0 ? 'No seats left' : `${left} ${left === 1 ? 'seat' : 'seats'} left`}
        </AppText>
      </View>
      <View style={styles.bar}>
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <View
            key={i}
            style={[styles.segment, i < filled && { backgroundColor: level.fill }]}
            testID={testID ? `${testID}-segment-${i}` : undefined}
          />
        ))}
      </View>
      <View style={styles.footer}>
        <AppText variant="bodyMd" color={colors.textMuted} tabular>
          {`${boarded} / ${capacity} Passengers Boarded`}
        </AppText>
        <AppText variant="headlineSm" color={level.text} testID={testID ? `${testID}-level` : undefined}>
          {level.label}
        </AppText>
      </View>
    </View>
  );
}
