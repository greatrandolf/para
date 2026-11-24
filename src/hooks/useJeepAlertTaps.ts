import { router } from 'expo-router';
import { useEffect } from 'react';

import { notifications } from '@/services/pushNotifications';

/** Paths a "jeepney coming" alert may open. */
const ALLOWED = new Set(['/live-map']);

let handlerSet = false;

/**
 * Opens the Live Map when the commuter taps a "jeepney coming" alert (jeep-coming-alert), also when the tap launched
 * the app. While the app is open the in-app banner shows the alert instead of a system one.
 */
export function useJeepAlertTaps() {
  useEffect(() => {
    const N = notifications();
    if (!N) return;
    if (!handlerSet) {
      handlerSet = true;
      try {
        N.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowBanner: false,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
          }),
        });
      } catch {
        // No handler: the OS default applies.
      }
    }
    const open = (data: unknown) => {
      const d = data as { type?: string; url?: string } | undefined;
      if (d?.type !== 'jeep-coming') return;
      router.navigate(d.url && ALLOWED.has(d.url) ? (d.url as '/live-map') : '/live-map');
    };
    const last = N.getLastNotificationResponse();
    if (last) open(last.notification.request.content.data);
    const sub = N.addNotificationResponseReceivedListener((r) => open(r.notification.request.content.data));
    return () => sub.remove();
  }, []);
}
