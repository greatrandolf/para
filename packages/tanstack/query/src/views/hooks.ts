import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useFunctionsClient } from '../QueryProvider';
import { viewsApi } from './api';
import type { Wallet } from './types';

export const viewKeys = { all: ['views'] as const, wallet: () => ['views', 'wallet'] as const };

/** The views API for one-off calls (rewarded ads); refreshes nothing by itself. */
export const useViewsApi = () => {
  const client = useFunctionsClient();
  return useMemo(() => viewsApi(client), [client]);
};

/** The commuter's wallet and live pass. */
export function useWallet(enabled = true) {
  const api = useViewsApi();
  return useQuery({
    queryKey: viewKeys.wallet(),
    queryFn: ({ signal }) => api.wallet(signal),
    enabled,
    staleTime: 30_000,
  });
}

/** Buys a ₱1 view; refreshes the wallet (balance and pass) after. */
export function useBuyView() {
  const api = useViewsApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.purchase,
    onSuccess: (result) => {
      if (result.pass) {
        queryClient.setQueryData<Wallet>(viewKeys.wallet(), (w) => (w ? { ...w, pass: result.pass } : w));
      }
      void queryClient.invalidateQueries({ queryKey: viewKeys.wallet() });
    },
  });
}

/** Starts a free "Notify me" watch. */
export function useStartWatch() {
  const api = useViewsApi();
  return useMutation({ mutationFn: api.watch });
}

/** Stops the watch. */
export function useCancelWatch() {
  const api = useViewsApi();
  return useMutation({ mutationFn: () => api.cancelWatch() });
}
