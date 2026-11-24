import type { BottomTabNavigationOptions } from 'expo-router/js-tabs';

import type { IconName } from '@packages/ui/Icon';

import { colors, typography } from './theme';

export type TabSpec = {
  /** Route file name inside the group. */
  name: string;
  title: string;
  icon: IconName;
};

/** Commuter tabs (plan D1). */
export const commuterTabs: TabSpec[] = [
  { name: 'commute', title: 'Commute', icon: 'commute' },
  { name: 'live-map', title: 'Live Map', icon: 'location-on' },
  // { name: 'activity', title: 'Activity', icon: 'history' },
  { name: 'wallet', title: 'Wallet', icon: 'payments' },
  { name: 'account', title: 'Account', icon: 'account-circle' },
];

/** Driver tabs (plan D2). */
export const driverTabs: TabSpec[] = [
  { name: 'duty', title: 'Duty', icon: 'sensors' },
  { name: 'earnings', title: 'Earnings', icon: 'payments' },
  { name: 'radar', title: 'Radar', icon: 'radar' },
  { name: 'trips', title: 'Trips', icon: 'alt-route' },
  { name: 'profile', title: 'Profile', icon: 'badge' },
];

/**
 * Shared JS tab bar styling (plan D3 and Navigation section, v3 light).
 * The active label uses `brandStrong` (small orange text never uses `brand`);
 * `TabBarIcon` paints the focused icon and its dot in `brand`.
 */
export const tabScreenOptions: BottomTabNavigationOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.brandStrong,
  tabBarInactiveTintColor: colors.textMuted,
  tabBarStyle: {
    backgroundColor: colors.surfaceCard,
    borderTopColor: colors.borderSubtle,
    borderTopWidth: 1,
  },
  // DESIGN `label-badge` (JetBrains Mono 500, 11/14, 0.88 tracking).
  tabBarLabelStyle: { ...typography.labelBadge },
  sceneStyle: { backgroundColor: colors.canvas },
};
