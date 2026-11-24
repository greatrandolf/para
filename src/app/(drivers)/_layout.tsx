import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { useKeepAwake } from 'expo-keep-awake';
import { useEffect, useRef } from 'react';

import { driverTabs, tabScreenOptions } from '@/constants/navigation';
import { DutyProvider } from '@/hooks/useDuty';
import { useSession } from '@/hooks/useSession';
import { FunctionsError } from '@packages/tanstack/query/client';
import { useDriverMe } from '@packages/tanstack/query/driver';
import { TabBarIcon } from '@packages/ui/TabBarIcon';

/**
 * Keeps the screen on while any driver tab is open, so the phone does not sleep and drop the live GPS the commuters
 * see (iOS and Android slow down or stop location updates once the screen locks). Released when the driver leaves.
 */
function KeepDriverScreenAwake() {
  useKeepAwake('para-driver');
  return null;
}

/** Driver tabs open only on an activated, unlocked phone. */
export default function DriverTabsLayout() {
  const session = useSession();
  const unlocked = session.status === 'driver' && session.pin === 'unlocked';
  const me = useDriverMe(unlocked);

  // Only lost access sends the phone back to activation: the fleet turned access off or deleted the driver, or
  // Para was activated on another phone. "unauthenticated" can also be a stale token, so refresh it first and
  // retry once; only a dead session (or the same answer with a fresh token) signs out.
  const accessError =
    me.error instanceof FunctionsError && ['permission-denied', 'unauthenticated'].includes(me.error.code)
      ? me.error
      : undefined;
  const retried = useRef(false);
  useEffect(() => {
    if (!accessError) return;
    let cancelled = false;
    void (async () => {
      if (accessError.code === 'unauthenticated' && !retried.current) {
        retried.current = true;
        if (await session.refreshAccess()) {
          if (!cancelled) void me.refetch();
          return;
        }
      }
      if (cancelled) return;
      await session.signOutPhone(
        accessError.code === 'permission-denied'
          ? accessError.message
          : 'This phone was signed out by your fleet, or Para was activated on another phone. Ask your fleet for a new activation code.',
      );
    })();
    return () => {
      cancelled = true;
    };
    // React to each new access error only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessError]);
  useEffect(() => {
    if (me.isSuccess) retried.current = false;
  }, [me.isSuccess]);

  if (session.status === 'loading') return null;
  if (session.status === 'signedOut') return <Redirect href="/activate" />;
  if (session.status === 'commuter') return <Redirect href="/commute" />;
  if (session.pin !== 'unlocked') return <Redirect href="/pin" />;

  return (
    // Live assignment and GPS run on every driver tab.
    <DutyProvider>
      <KeepDriverScreenAwake />
      <Tabs screenOptions={tabScreenOptions}>
        {driverTabs.map((tab) => (
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
    </DutyProvider>
  );
}
