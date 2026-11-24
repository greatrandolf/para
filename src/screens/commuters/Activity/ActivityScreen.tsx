import { router } from 'expo-router';
import { View } from 'react-native';

import { useCommuterProfile } from '@/hooks/useCommuterProfile';
import { formatPeso } from '@/utils/currency';
import { Avatar } from '@packages/ui/Avatar';
import { BalancePill } from '@packages/ui/BalancePill';
import { ComingSoon } from '@packages/ui/ComingSoon';
import { ScreenScroll } from '@packages/ui/ScreenScroll';
import { TopBar } from '@packages/ui/TopBar';

import { styles } from './styles';

export function ActivityScreen() {
  const profile = useCommuterProfile();
  return (
    <View style={styles.root} testID="screen-activity">
      <TopBar
        variant="brand"
        subtitle="ACTIVITY"
        right={
          <>
            <BalancePill amount={formatPeso(profile.balance)} onPress={() => router.navigate('/wallet')} />
            <Avatar initials={profile.initials} />
          </>
        }
      />
      <ScreenScroll>
        <ComingSoon icon="history" title="Activity" description="Your trips and live-view history will appear here." />
      </ScreenScroll>
    </View>
  );
}

export default ActivityScreen;
