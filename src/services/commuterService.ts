/**
 * Commuter data access. Reads static mock data synchronously today; a real
 * API can replace these getters later without touching screens (plan D11).
 */
import {
  commuterProfile,
  ledgerEntries,
  liveTrip,
  paymentChannels,
  recentViews,
  routeFilterOptions,
  routeOptions,
  topUpPackages,
  transitRoutes,
  walletSummary,
} from '@/services/mock/commuterData';
import type {
  CommuterProfile,
  LedgerEntry,
  LedgerFilter,
  LiveTrip,
  PaymentChannel,
  RecentView,
  RouteFilter,
  RouteFilterOption,
  RouteOption,
  TopUpPackage,
  TransitRoute,
  WalletSummary,
} from '@/types/commuter';

export const getCommuterProfile = (): CommuterProfile => commuterProfile;
export const getRoutes = (): TransitRoute[] => transitRoutes;
export const getRouteFilterOptions = (): RouteFilterOption[] => routeFilterOptions;
export const getRecentViews = (): RecentView[] => recentViews;
export const getLiveTrip = (): LiveTrip => liveTrip;
export const getRouteOptions = (): RouteOption[] => routeOptions;
export const getWalletSummary = (): WalletSummary => walletSummary;
export const getTopUpPackages = (): TopUpPackage[] => topUpPackages;
export const getPaymentChannels = (): PaymentChannel[] => paymentChannels;
export const getLedger = (): LedgerEntry[] => ledgerEntries;

/**
 * Filters routes by vehicle type and a case-insensitive query matched against
 * the route name, code and via line. Whitespace-only queries match everything.
 */
export function filterRoutes(routes: readonly TransitRoute[], filter: RouteFilter, query: string): TransitRoute[] {
  const needle = query.trim().toLowerCase();
  return routes.filter((route) => {
    if (filter !== 'all' && route.vehicleType !== filter) return false;
    if (!needle) return true;
    return [route.name, route.code, `#${route.code}`, route.via].some((field) => field.toLowerCase().includes(needle));
  });
}

/** `views` keeps every view entry (including ₱0 refunded views); `cashin` keeps cash-ins. */
export function filterLedger(entries: readonly LedgerEntry[], filter: LedgerFilter): LedgerEntry[] {
  if (filter === 'views') return entries.filter((entry) => entry.kind === 'view');
  if (filter === 'cashin') return entries.filter((entry) => entry.kind === 'cashIn');
  return [...entries];
}
