import { View, type StyleProp, type ViewStyle } from 'react-native';

import { styles, toneColors } from './styles';

export type ProgressTone = keyof typeof toneColors;

export type ProgressSegment = { value: number; tone: ProgressTone };

export type ProgressBarProps = {
  /** 0–1. Values outside the range are clamped. */
  value: number;
  tone?: ProgressTone;
  /** Optional second segment drawn after the first (two-tone bars). */
  secondary?: ProgressSegment;
  height?: number;
  trackColor?: string;
  accessibilityLabel?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

/** Clamps a progress value to 0–1. Non-finite values become 0. */
export function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function ProgressBar({
  value,
  tone = 'brand',
  secondary,
  height = 8,
  trackColor,
  accessibilityLabel,
  testID,
  style,
}: ProgressBarProps) {
  const first = clampProgress(value);
  const second = secondary ? Math.min(clampProgress(secondary.value), 1 - first) : 0;
  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round((first + second) * 100) }}
      style={[styles.track, { height }, trackColor ? { backgroundColor: trackColor } : null, style]}>
      <View testID={testID ? `${testID}-fill` : undefined} style={[styles.fill, { width: `${first * 100}%`, backgroundColor: toneColors[tone] }]} />
      {secondary ? (
        <View
          testID={testID ? `${testID}-fill-2` : undefined}
          style={[styles.fill, { width: `${second * 100}%`, backgroundColor: toneColors[secondary.tone] }]}
        />
      ) : null}
    </View>
  );
}
