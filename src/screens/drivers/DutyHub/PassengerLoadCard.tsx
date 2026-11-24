import { useRef, useState, type ComponentRef } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { colors, elevation, radius, spacing } from '@/constants/theme';
import { AppText } from '@packages/ui/AppText';
import { Card } from '@packages/ui/Card';
import { Icon } from '@packages/ui/Icon';

import {
  LOAD_LABEL,
  clampSeats,
  loadLevel,
  loadPercent,
  loadPresets,
  seatsAtFraction,
  type LoadLevel,
} from './passengerLoad';

type Props = {
  /** The unit's seats. */
  capacity: number;
  occupied: number;
  onChange: (occupied: number) => void;
  routeCode?: string | null;
  /** Shown when the last change could not be sent. */
  error?: string;
};

const LEVEL_COLOR: Record<LoadLevel, { fill: string; tint: string; text: string }> = {
  empty: { fill: colors.liveStrong, tint: colors.liveTint, text: colors.liveStrong },
  light: { fill: colors.liveStrong, tint: colors.liveTint, text: colors.liveStrong },
  moderate: { fill: colors.amber, tint: colors.amberTint, text: colors.amberStrong },
  heavy: { fill: colors.brand, tint: colors.brandTint, text: colors.brandStrong },
  full: { fill: colors.crimsonAlert, tint: colors.errorTint, text: colors.error },
};

const THUMB = 56;
/** A finger has to move this far sideways (points) before the slider takes the drag. */
const DRAG_SLOP = 8;
const TRACK = 32;

/**
 * Revision 21: the driver sets how full the jeep is. A big slider (drag or tap anywhere on the track; snaps to whole
 * seats), quick presets and ±1. Plain React Native touch handling (responder props), so it ships over the air.
 */
export function PassengerLoadCard({ capacity, occupied, onChange, routeCode, error }: Props) {
  const seats = clampSeats(occupied, capacity);
  const pct = loadPercent(seats, capacity);
  const level = loadLevel(seats, capacity);
  const tone = LEVEL_COLOR[level];

  // Track width (for drawing) and its left edge on screen (measured when a touch starts).
  const [width, setWidth] = useState(0);
  const sliderRef = useRef<ComponentRef<typeof View>>(null);
  const originX = useRef(0);
  const seatsAt = (pageX: number) =>
    seatsAtFraction((pageX - originX.current - THUMB / 2) / Math.max(1, width - THUMB), capacity);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const touchStart = useRef({ x: 0, y: 0, dragging: false });
  // Where the track starts on screen, then the seats under the finger.
  const setFromPageX = (pageX: number) =>
    sliderRef.current?.measure((_x: number, _y: number, _w: number, _h: number, left: number) => {
      originX.current = left;
      onChange(seatsAt(pageX));
    });

  const thumbLeft = capacity > 0 ? (seats / capacity) * Math.max(0, width - THUMB) : 0;

  return (
    <Card style={styles.card} testID="passenger-load-card">
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Icon name="airline-seat-recline-normal" size={20} color={colors.crimsonAlert} />
        </View>
        <AppText variant="headlineSm" style={styles.flex} accessibilityRole="header">
          LIVE PASSENGER LOAD
        </AppText>
        <View style={[styles.badge, { backgroundColor: tone.tint }]} testID="load-level">
          <View style={[styles.badgeDot, { backgroundColor: tone.fill }]} />
          <AppText variant="labelBadge" weight="bold" color={tone.text}>
            {LOAD_LABEL[level]}
          </AppText>
        </View>
      </View>

      <View style={styles.figures}>
        <View style={styles.pctRow}>
          <AppText variant="metricDisplay" tabular testID="load-percent">
            {`${pct}%`}
          </AppText>
          <AppText variant="bodyMd" color={colors.textMuted}>
            load
          </AppText>
        </View>
        <View style={styles.seatsCol}>
          <AppText variant="headlineSm" tabular testID="load-seats">
            <AppText variant="headlineSm" color={colors.error} tabular>
              {seats}
            </AppText>
            {` / ${capacity}`}
            <AppText variant="bodySm" color={colors.textMuted}>
              {'  Occupied'}
            </AppText>
          </AppText>
          <AppText variant="bodySm" weight="bold" color={colors.liveStrong} testID="load-available">
            {`${capacity - seats} ${capacity - seats === 1 ? 'seat' : 'seats'} available`}
          </AppText>
        </View>
      </View>

      <View
        style={styles.slider}
        onLayout={onLayout}
        testID="load-slider"
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Passenger load"
        accessibilityValue={{ min: 0, max: capacity, now: seats, text: `${seats} of ${capacity} seats, ${pct}%` }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) =>
          onChange(clampSeats(seats + (e.nativeEvent.actionName === 'increment' ? 1 : -1), capacity))
        }
        ref={sliderRef}
        // Only a sideways drag moves the slider; an up/down swipe that starts here scrolls the page and leaves the
        // value alone. A short tap (finger barely moved) sets the value where it lands.
        onTouchStart={(e) => {
          touchStart.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY, dragging: false };
        }}
        onStartShouldSetResponder={() => false}
        onMoveShouldSetResponder={(e) => {
          if (!e?.nativeEvent) return false;
          const t = touchStart.current;
          const dx = Math.abs(e.nativeEvent.pageX - t.x);
          const dy = Math.abs(e.nativeEvent.pageY - t.y);
          return dx > DRAG_SLOP && dx > dy * 1.5;
        }}
        onResponderTerminationRequest={() => false}
        onResponderGrant={(e) => {
          touchStart.current.dragging = true;
          setFromPageX(e.nativeEvent.pageX);
        }}
        onResponderMove={(e) => onChange(seatsAt(e.nativeEvent.pageX))}
        onTouchEnd={(e) => {
          const t = touchStart.current;
          const moved = Math.hypot(e.nativeEvent.pageX - t.x, e.nativeEvent.pageY - t.y);
          if (!t.dragging && moved <= DRAG_SLOP) setFromPageX(e.nativeEvent.pageX);
        }}>
        <View style={styles.track}>
          <View style={[styles.fill, { width: thumbLeft + THUMB / 2, backgroundColor: tone.fill }]} />
        </View>
        <View style={[styles.thumb, { left: thumbLeft }]} pointerEvents="none">
          <View style={[styles.thumbCore, { backgroundColor: tone.fill }]}>
            <Icon name="swap-horiz" size={22} color={colors.onBrand} />
          </View>
        </View>
      </View>
      {/* <View style={styles.ticks}>
        {['0% (Empty)', '25%', '50%', '75%', '100% (Full)'].map((t, i) => (
          <AppText key={t} variant="labelBadge" weight="bold" color={i === 4 ? colors.error : colors.textMuted}>
            {t}
          </AppText>
        ))}
      </View> */}

      

      <View style={styles.footer}>
        <Icon name="sync" size={18} color={colors.liveStrong} />
        <AppText variant="bodySm" color={colors.textMuted} style={styles.flex}>
          {`Auto-broadcasted to commuters${routeCode ? ` on Route ${routeCode}` : ''} radar.`}
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="One less passenger"
          onPress={() => onChange(clampSeats(seats - 1, capacity))}
          testID="load-minus"
          style={styles.step}>
          <AppText variant="headlineSm">-1</AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="One more passenger"
          onPress={() => onChange(clampSeats(seats + 1, capacity))}
          testID="load-plus"
          style={styles.step}>
          <AppText variant="headlineSm" color={colors.error}>
            +1
          </AppText>
        </Pressable>
      </View>

      <AppText variant="labelBadge" weight="bold" color={colors.textMuted}>
        QUICK SELECT PRESETS
      </AppText>
      <View style={styles.presets}>
        {loadPresets(capacity).map((p) => {
          const active = p.seats === seats;
          return (
            <Pressable
              key={p.key}
              accessibilityRole="button"
              accessibilityLabel={`${p.label}, ${p.seats} seats`}
              accessibilityState={{ selected: active }}
              onPress={() => onChange(p.seats)}
              testID={`load-preset-${p.key}`}
              style={[styles.preset, active && styles.presetActive]}>
              <AppText variant="bodyMd" weight="bold" color={p.key === 'standing' ? colors.error : colors.onSurface}>
                {p.label}
              </AppText>
              <AppText variant="bodySm" weight="bold" color={colors.textMuted}>
                {`${p.seats} Seats`}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {error ? (
        <AppText variant="bodySm" color={colors.error} accessibilityRole="alert" testID="load-error">
          {error}
        </AppText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.errorTint,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  badgeDot: { width: 8, height: 8, borderRadius: radius.full },
  figures: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.sm },
  pctRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
  seatsCol: { alignItems: 'flex-end' },
  slider: { height: THUMB + 8, justifyContent: 'center' },
  track: {
    height: TRACK,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainerHigh,
    overflow: 'hidden',
  },
  fill: { height: TRACK, borderRadius: radius.full },
  thumb: {
    position: 'absolute',
    width: THUMB,
    height: THUMB,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceCard,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: elevation.level2,
  },
  thumbCore: { width: 36, height: 36, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  ticks: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -spacing.sm },
  presets: { flexDirection: 'row', gap: spacing.sm },
  preset: {
    flex: 1,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetActive: { borderColor: colors.brand, backgroundColor: colors.brandTint },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerLow,
  },
  step: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceCard,
    boxShadow: elevation.level1,
  },
});
