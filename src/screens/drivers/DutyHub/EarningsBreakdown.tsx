import { View } from 'react-native';

import { colors } from '@/constants/theme';
import type { SourceSplit } from '@/hooks/useDriverEarnings';
import { formatPeso } from '@/utils/currency';
import { AppText } from '@packages/ui/AppText';

import { styles } from './styles';

type Props = {
  /** Today's share by source (undefined for days recorded before sources were kept). */
  sources?: SourceSplit;
  /** Everything not paid yet, in pesos, and its views (undefined while loading). */
  toPay?: { amount: number; views: number };
};

const SOURCES: { key: keyof SourceSplit; label: string }[] = [
  { key: 'paid', label: '₱1 views' },
  { key: 'ad', label: 'Google Ads' },
  { key: 'paraAd', label: 'Para Ads' },
];

/**
 * Under today's earnings (driver-pay-balance): today's share by where the money came from (₱1 views, Google ads,
 * Para Ads), and what the fleet still has to pay the driver, across days, since their last payout.
 */
export function EarningsBreakdown({ sources, toPay }: Props) {
  return (
    <View style={styles.breakdown}>
      {sources ? (
        <View style={styles.sources} testID="today-sources">
          {SOURCES.map((s) => (
            <View key={s.key} style={styles.source} testID={`source-${s.key}`}>
              <AppText variant="labelBadge" color={colors.textMuted} numberOfLines={1}>
                {s.label}
              </AppText>
              <AppText variant="bodyMd" weight="bold" tabular>
                {formatPeso(sources[s.key])}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}
      {toPay ? (
        <View style={styles.toPay} testID="to-pay">
          <View style={styles.toPayText}>
            <AppText variant="bodyMd" weight="bold">
              To be paid
            </AppText>
            <AppText variant="bodySm" color={colors.textMuted}>
              {toPay.views === 0
                ? 'Nothing waiting. You are all paid.'
                : `${toPay.views} ${toPay.views === 1 ? 'view' : 'views'} since your last payout`}
            </AppText>
          </View>
          <AppText variant="labelEta" color={colors.neonOrangeDeep} tabular testID="to-pay-amount">
            {formatPeso(toPay.amount)}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}
