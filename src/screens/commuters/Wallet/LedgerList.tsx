import { View } from 'react-native';

import { colors } from '@/constants/theme';
import type { LedgerEntry } from '@/types/commuter';
import { formatPeso } from '@/utils/currency';
import { AppText } from '@packages/ui/AppText';
import { Badge } from '@packages/ui/Badge';
import { Card } from '@packages/ui/Card';
import { Icon } from '@packages/ui/Icon';

import { ledgerStyles as styles } from './styles';

/** Status text colours (W3/W4: the strong variants, never the bright accents). */
const STATUS_COLOR = {
  success: colors.liveStrong,
  neutral: colors.textMuted,
  warning: colors.amberStrong,
} as const;

/** Status dot colours (non-text). */
const STATUS_DOT = {
  success: colors.live,
  neutral: colors.textSubtle,
  warning: colors.amber,
} as const;

function amountColor(entry: LedgerEntry): string {
  if (entry.amount < 0) return colors.brandStrong;
  if (entry.amount > 0) return colors.liveStrong;
  return colors.onSurface;
}

type Props = { entries: LedgerEntry[] };

export function LedgerList({ entries }: Props) {
  if (entries.length === 0) {
    return (
      <Card style={styles.empty} testID="ledger-empty">
        <Icon name="receipt-long" size={28} color={colors.textMuted} />
        <AppText variant="bodyMd" color={colors.textMuted}>
          No transactions in this view
        </AppText>
      </Card>
    );
  }
  return (
    <>
      {entries.map((entry) => {
        const zero = entry.amount === 0;
        const iconStyle = zero ? styles.iconZero : entry.kind === 'cashIn' ? styles.iconCash : styles.iconView;
        const iconColor = zero ? colors.textMuted : entry.kind === 'cashIn' ? colors.liveStrong : colors.brand;
        return (
          <Card key={entry.id} style={styles.row} testID={`ledger-${entry.ref}`}>
            <View style={[styles.icon, iconStyle]}>
              <Icon name={entry.icon} size={20} color={iconColor} />
            </View>
            <View style={styles.body}>
              <AppText variant="headlineSm" weight="semibold" numberOfLines={1}>
                {entry.title}
              </AppText>
              <View style={styles.meta}>
                <AppText variant="bodySm" color={colors.textMuted}>
                  {entry.time}
                </AppText>
                <Badge label={entry.ref} tone="info" />
              </View>
              <View style={styles.status}>
                <View style={[styles.dot, { backgroundColor: STATUS_DOT[entry.statusTone] }]} />
                <AppText variant="labelBadge" color={STATUS_COLOR[entry.statusTone]}>
                  {entry.status}
                </AppText>
              </View>
            </View>
            <View style={styles.trailing}>
              <AppText variant="labelEta" tabular color={amountColor(entry)}>
                {formatPeso(entry.amount, { sign: true })}
              </AppText>
              <AppText variant="labelBadge" color={colors.textMuted} align="right">
                {entry.note}
              </AppText>
            </View>
          </Card>
        );
      })}
    </>
  );
}
