import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';

import { commuterTabs, tabScreenOptions } from '@/constants/navigation';
import { useJeepAlertTaps } from '@/hooks/useJeepAlertTaps';
import { useSession } from '@/hooks/useSession';
import { useStarterCredit } from '@/hooks/useStarterCredit';
import { ParaAdHost } from '@/screens/commuters/ParaAd';
import { TabBarIcon } from '@packages/ui/TabBarIcon';

/** Commuter tabs open only for a signed-in commuter. */
export default function CommuterTabsLayout() {
  const session = useSession();
  useJeepAlertTaps();
  // starter-credit-per-device: ₱3 for the first account on this phone.
  useStarterCredit();
  if (session.status === 'loading') return null;
  if (session.status === 'signedOut') return <Redirect href="/" />;
  if (session.status === 'driver') return <Redirect href="/pin" />;
  return (
    <>
      <Tabs screenOptions={tabScreenOptions}>
        {commuterTabs.map((tab) => (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.title,
              tabBarButtonTestID: `tab-${tab.name}`,
              tabBarIcon: ({ color, focused }) => <TabBarIcon name={tab.icon} color={color} focused={focused} />,
            }}
          />
        ))}
      </Tabs>
      {/* para-ads: a local business's ad, shown when the ad flow asks for one. */}
      <ParaAdHost />
    </>
  );
}
