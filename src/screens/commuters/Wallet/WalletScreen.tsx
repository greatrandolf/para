import { useMemo, useState } from 'react';
import { Alert, View } from 'react-native';

import { colors } from '@/constants/theme';
import { useCommuterProfile } from '@/hooks/useCommuterProfile';
import {
  filterLedger,
  getLedger,
  getPaymentChannels,
  getTopUpPackages,
  getWalletSummary,
} from '@/services/commuterService';
import type { LedgerFilter, PaymentChannelId } from '@/types/commuter';
import { formatPeso } from '@/utils/currency';
import { AppText } from '@packages/ui/AppText';
import { Avatar } from '@packages/ui/Avatar';
import { Badge } from '@packages/ui/Badge';
import { BalancePill } from '@packages/ui/BalancePill';
import { Button } from '@packages/ui/Button';
import { Card } from '@packages/ui/Card';
import { GradientCard } from '@packages/ui/GradientCard';
import { Icon } from '@packages/ui/Icon';
import { ScreenScroll } from '@packages/ui/ScreenScroll';
import { SectionHeader } from '@packages/ui/SectionHeader';
import { SegmentedControl, type SegmentOption } from '@packages/ui/SegmentedControl';
import { TopBar } from '@packages/ui/TopBar';

import { LedgerList } from './LedgerList';
import { PaymentChannels } from './PaymentChannels';
import { styles } from './styles';
import { TopUpGrid } from './TopUpGrid';

export function WalletScreen() {
  const profile = useCommuterProfile();
  const summary = getWalletSummary();
  const packages = getTopUpPackages();
  const channels = getPaymentChannels();
  const ledger = getLedger();

  const [amount, setAmount] = useState(50);
  const [channelId, setChannelId] = useState<PaymentChannelId>('gcash');
  const [ledgerFilter, setLedgerFilter] = useState<LedgerFilter>('all');

  const channelName = channels.find((channel) => channel.id === channelId)?.name ?? '';
  const visibleLedger = useMemo(() => filterLedger(ledger, ledgerFilter), [ledger, ledgerFilter]);
  const balance = formatPeso(summary.balance);

  const ledgerOptions: SegmentOption<LedgerFilter>[] = [
    { value: 'all', label: `All (${summary.ledgerCount})`, testID: 'ledger-filter-all' },
    { value: 'views', label: 'Views (-₱1)', testID: 'ledger-filter-views' },
    { value: 'cashin', label: 'Cash-In (+₱)', testID: 'ledger-filter-cashin' },
  ];

  const cashIn = () => Alert.alert('Demo only', 'Cash-in is not available in this demo build.');

  return (
    <View style={styles.root} testID="screen-wallet">
      <TopBar
        variant="brand"
        subtitle="WALLET"
        right={
          <>
            <BalancePill amount={balance} />
            <Avatar initials={profile.initials} />
          </>
        }
      />
      <ScreenScroll>
        <Card padding="sm" style={styles.notice}>
          <Icon name="verified-user" size={18} color={colors.liveStrong} />
          <AppText variant="bodySm" weight="semibold" color={colors.liveStrong} style={styles.noticeText}>
            Instant GPS pass issuance. Powered by BSP-regulated e-wallet gateways.
          </AppText>
        </Card>

        <GradientCard preset="credits" style={styles.credits} testID="credits-card">
          <View style={styles.creditsTop}>
            <View style={styles.creditsLabel}>
              <Icon name="toll" size={16} color={colors.brand} />
              <AppText variant="labelBadge" weight="semibold" color={colors.textMuted}>
                COMMUTER TRANSIT CREDITS
              </AppText>
            </View>
            <Badge label="Active Pass" tone="live" dot />
          </View>
          <View style={styles.amountRow}>
            <AppText variant="headlineLgMobile" color={colors.brandStrong} tabular testID="wallet-balance">
              {balance}
            </AppText>
            <AppText variant="labelBadge" color={colors.textMuted}>
              PHP
            </AppText>
          </View>
          <View style={styles.creditsInfo}>
            <Icon name="radar" size={18} color={colors.brand} />
            <AppText variant="bodySm" weight="semibold" style={styles.flex}>
              {`Equates to ${summary.sessionsAvailable} vehicle live tracking sessions (₱1/session)`}
            </AppText>
          </View>
          <View style={styles.creditsNote}>
            <Icon name="info" size={14} color={colors.textMuted} />
            <AppText variant="labelBadge" color={colors.textMuted} style={styles.flex}>
              Non-withdrawable credits • Used exclusively for Para Live tracking services
            </AppText>
          </View>
        </GradientCard>

        <SectionHeader
          title="Top-Up Commuter Wallet"
          icon="add-card"
          right={<Badge label="Zero Fee Promo" tone="fareSolid" />}
        />
        <TopUpGrid packages={packages} selected={amount} onSelect={setAmount} />

        <AppText variant="labelTelemetry" weight="bold" style={styles.channelLabel}>
          Payment Channel
        </AppText>
        <PaymentChannels channels={channels} selected={channelId} onSelect={setChannelId} />

        <Button
          label={`Cash In ₱${amount} via ${channelName}`}
          icon="bolt"
          size="lg"
          fullWidth
          textVariant="headlineSm"
          onPress={cashIn}
          testID="cashin-cta"
        />

        <SectionHeader
          title="Transit Ledger"
          icon="receipt-long"
          right={
            <AppText variant="labelBadge" color={colors.textMuted}>
              Real-time sync
            </AppText>
          }
        />
        <SegmentedControl<LedgerFilter>
          options={ledgerOptions}
          value={ledgerFilter}
          onChange={setLedgerFilter}
          accessibilityLabel="Ledger filter"
        />
        <View style={styles.ledgerList}>
          <LedgerList entries={visibleLedger} />
        </View>

        <Card style={styles.guarantee}>
          <View style={styles.guaranteeIcon}>
            <Icon name="verified" size={22} color={colors.onDark} />
          </View>
          <View style={styles.guaranteeBody}>
            <AppText variant="headlineSm" weight="bold">
              100% Fair-Transit Guarantee
            </AppText>
            <AppText variant="bodySm" color={colors.textMuted}>
              If no jeepneys ping within 3 minutes of tracking on your route, ₱1 is automatically refunded to your
              wallet.
            </AppText>
          </View>
        </Card>
      </ScreenScroll>
    </View>
  );
}

export default WalletScreen;
