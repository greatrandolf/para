import { Pressable, View } from 'react-native';

import { colors } from '@/constants/theme';
import type { RouteOption, RouteOptionTone } from '@/types/commuter';
import { AppText } from '@packages/ui/AppText';

import type { RouteUnit } from './commuteOptions';
import { optionStyles as styles } from './styles';

type Props = {
  /** With `units`, the selected route lists its jeeps under its card (route-units). */
  options: (RouteOption & { units?: RouteUnit[] })[];
  /** Code of the selected route (drawn on the map). */
  selectedCode?: string;
  onSelect: (code: string) => void;
  /** Shown instead of the list when there are no options (loading, error, nothing on the way). */
  notice?: string;
};

type ToneColors = { tileText: string; badgeText: string; eta: string };

/**
 * Text colours per tone (revision 4). Fills live in `optionStyles`.
 * - best: bright `brandAction` tile and badge with bold white text (W2); large `neonOrangeDeep` ETA (W3).
 * - alternative: `ink` tile with white text, neutral grey badge, `onSurface` ETA.
 * - preferred: blue tile with white text, blue-tint badge with blue text, blue ETA.
 */
const TONE_COLORS: Record<RouteOptionTone, ToneColors> = {
  best: { tileText: colors.onBrandAction, badgeText: colors.onBrandAction, eta: colors.neonOrangeDeep },
  alternative: { tileText: colors.onDark, badgeText: colors.textMuted, eta: colors.onSurface },
  preferred: { tileText: colors.onDark, badgeText: colors.preferredStrong, eta: colors.preferredStrong },
};

const TILE_STYLES = {
  best: styles.tileBest,
  alternative: styles.tileAlternative,
  preferred: styles.tilePreferred,
} as const;
const BADGE_STYLES = {
  best: styles.badgeBest,
  alternative: styles.badgeAlternative,
  preferred: styles.badgePreferred,
} as const;

/**
 * Live Map route options (revision 4): a radio group of tappable route cards.
 * Exactly one card is selected; the selected card has a `brandTint` fill and a 2 px `brand` border.
 * Revision 9: the screen owns the selection, so the map follows it.
 * preferred-route: the selected route (also the commuter's preferred route) is always the first row.
 */
/** The selected (preferred) route first, the others in their order. */
export const selectedFirst = <T extends { code: string }>(options: readonly T[], selectedCode?: string): T[] => {
  const picked = options.find((o) => o.code === selectedCode);
  return picked ? [picked, ...options.filter((o) => o !== picked)] : [...options];
};

export function RouteOptions({ options, selectedCode, onSelect, notice }: Props) {
  if (options.length === 0) {
    return notice ? (
      <AppText variant="bodySm" color={colors.textMuted} testID="route-options-notice">
        {notice}
      </AppText>
    ) : null;
  }

  return (
    <View style={styles.list} accessibilityRole="radiogroup" accessibilityLabel="Route options" testID="route-options">
      {/* The selected route (the commuter's preferred route) is the first row. */}
      {selectedFirst(options, selectedCode).map((option) => {
        const checked = option.code === selectedCode;
        const tone = TONE_COLORS[option.tone];
        return (
          <View key={option.code} style={styles.item}>
            <Pressable
              testID={`route-option-${option.code}`}
              accessibilityRole="radio"
              accessibilityState={{ checked }}
              accessibilityLabel={`${option.name}, ${option.badge}, ${option.subtitle}, ${option.eta} ${option.etaCaption}`}
              onPress={() => onSelect(option.code)}
              style={[styles.card, checked ? styles.cardSelected : styles.cardIdle]}>
              <View style={[styles.tile, TILE_STYLES[option.tone]]}>
                <AppText variant="labelTelemetry" weight="bold" color={tone.tileText}>
                  {option.code}
                </AppText>
              </View>

              <View style={styles.body}>
                <View style={styles.titleRow}>
                  <AppText variant="bodyMd" weight="bold" color={colors.onSurface} style={styles.name}>
                    {option.name}
                  </AppText>
                  <View style={[styles.badge, BADGE_STYLES[option.tone]]}>
                    <AppText
                      variant="labelBadge"
                      weight="bold"
                      color={tone.badgeText}
                      uppercase
                      style={styles.badgeLabel}>
                      {option.badge}
                    </AppText>
                  </View>
                </View>
                <AppText variant="bodySm" color={colors.textMuted}>
                  {option.subtitle}
                </AppText>
              </View>

              <View style={styles.eta}>
                <AppText variant="labelEta" color={tone.eta} tabular testID={`route-option-${option.code}-eta`}>
                  {option.eta}
                </AppText>
                <AppText variant="labelBadge" color={colors.textMuted}>
                  {option.etaCaption}
                </AppText>
              </View>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
