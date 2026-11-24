import { router } from 'expo-router';
import { View } from 'react-native';

import { useSession } from '@/hooks/useSession';
import { useCommuterProfile } from '@/hooks/useCommuterProfile';
import { formatPeso } from '@/utils/currency';
import { Avatar } from '@packages/ui/Avatar';
import { BalancePill } from '@packages/ui/BalancePill';
import { ComingSoon } from '@packages/ui/ComingSoon';
import { ScreenScroll } from '@packages/ui/ScreenScroll';
import { TopBar } from '@packages/ui/TopBar';

import { styles } from './styles';

export function AccountScreen() {
  const profile = useCommuterProfile();
  const session = useSession();
  return (
    <View style={styles.root} testID="screen-account">
      <TopBar
        variant="brand"
        subtitle="ACCOUNT"
        right={
          <>
            <BalancePill amount={formatPeso(profile.balance)} onPress={() => router.navigate('/wallet')} />
            <Avatar initials={profile.initials} />
          </>
        }
      />
      <ScreenScroll>
        <ComingSoon
          icon="account-circle"
          title="Account"
          description="Profile, saved routes and settings will appear here."
          actionLabel="Sign out"
          actionIcon="logout"
          onAction={() => {
            void session.signOutPhone().then(() => router.replace('/'));
          }}
          actionTestID="sign-out"
        />
      </ScreenScroll>
    </View>
  );
}

export default AccountScreen;
