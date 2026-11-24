import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { useOptionalSession } from '@/hooks/useSession';
import { getDeviceIdentity } from '@/services/deviceId';
import { useViewsApi, useWallet, viewKeys } from '@packages/tanstack/query/views';

/**
 * The welcome credit (starter-credit-per-device): when a new commuter's wallet can still claim it, sends this phone's
 * id once; the backend adds ₱3 (by default) only for the first account on the device. The balance just updates; no
 * pop-up.
 */
export function useStarterCredit() {
  const session = useOptionalSession();
  const commuter = session?.status === 'commuter';
  const wallet = useWallet(commuter);
  const api = useViewsApi();
  const queryClient = useQueryClient();
  const tried = useRef<string | undefined>(undefined);
  const uid = session && 'user' in session ? session.user?.uid : undefined;
  const eligible = commuter && wallet.data?.starterEligible === true;

  useEffect(() => {
    if (!eligible || !uid || tried.current === uid) return;
    tried.current = uid;
    void (async () => {
      const device = await getDeviceIdentity();
      if (!device) return;
      await api.claimStarter(device);
      await queryClient.invalidateQueries({ queryKey: viewKeys.wallet() });
    })().catch(() => {
      // Try again next launch.
      tried.current = undefined;
    });
  }, [eligible, uid, api, queryClient]);
}
