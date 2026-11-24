import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useFunctionsClient } from '../QueryProvider';
import { driverApi } from './api';
import { driverKeys } from './keys';
import type { ConfirmPayoutInput } from './types';

export const useDriverApi = () => {
  const client = useFunctionsClient();
  return useMemo(() => driverApi(client), [client]);
};

/**
 * The signed-in driver and their current assignment. The driver app's live assignment listener (Firestore
 * onSnapshot) refreshes it as soon as the fleet changes something; the one-minute poll is a fallback.
 */
export function useDriverMe(enabled = true) {
  const api = useDriverApi();
  return useQuery({
    queryKey: driverKeys.me(),
    queryFn: ({ signal }) => api.me(signal),
    enabled,
    refetchInterval: 60_000,
  });
}

/** The driver's weekly payouts from their fleet (fleet-driver-payouts). */
export function useDriverPayouts(enabled = true) {
  const api = useDriverApi();
  return useQuery({ queryKey: driverKeys.payouts(), queryFn: ({ signal }) => api.payouts(signal), enabled });
}

/** What the driver is still owed (driver-pay-balance), refreshed every minute. */
export function useDriverPayBalance(enabled = true) {
  const api = useDriverApi();
  return useQuery({
    queryKey: driverKeys.payBalance(),
    queryFn: ({ signal }) => api.payBalance(signal),
    enabled,
    refetchInterval: 60_000,
  });
}

/** "I received it" / "Report a problem". */
export function useConfirmPayout() {
  const api = useDriverApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ConfirmPayoutInput) => api.confirmPayout(input),
    onSettled: () => qc.invalidateQueries({ queryKey: driverKeys.payouts() }),
  });
}

/** Gets a short-lived receipt PDF URL (the screen opens it). */
export function useReceiptUrl() {
  const api = useDriverApi();
  return useMutation({ mutationFn: (payoutId: string) => api.receiptUrl(payoutId) });
}

/** What the driver earned per day and per unit over a period (refreshed every minute while shown). */
export function useEarningsSummary(range: { from: string; to: string }, enabled = true) {
  const api = useDriverApi();
  return useQuery({
    queryKey: driverKeys.earnings(range.from, range.to),
    queryFn: ({ signal }) => api.earningsSummary(range, signal),
    enabled,
    refetchInterval: 60_000,
  });
}

/** One day's ₱1 views that paid the driver, newest first, 50 per page (`fetchNextPage` for more). */
export function useEarningsDay(day: string | undefined) {
  const api = useDriverApi();
  return useInfiniteQuery({
    queryKey: driverKeys.earningsDay(day ?? ''),
    queryFn: ({ pageParam, signal }) => api.earningsDay({ day: day as string, cursor: pageParam }, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.next ?? undefined,
    enabled: !!day,
  });
}
