import { View } from 'react-native';

import { getDriverIdentity } from '@/services/driverService';
import { formatPeso } from '@/utils/currency';
import { ComingSoon } from '@packages/ui/ComingSoon';
import { ScreenScroll } from '@packages/ui/ScreenScroll';
import { TopBar } from '@packages/ui/TopBar';

import { styles } from './styles';

export function TripsScreen() {
  const driver = getDriverIdentity();
  return (
    <View style={styles.root} testID="screen-trips">
      <TopBar
        variant="driver"
        driverId={driver.id}
        driverName={driver.shortName}
        statusLabel={driver.status}
        balance={formatPeso(driver.walletBalance)}
      />
      <ScreenScroll>
        <ComingSoon
          icon="alt-route"
          title="Trips"
          description="Your completed trips and route logs will appear here."
        />
      </ScreenScroll>
    </View>
  );
}

export default TripsScreen;
