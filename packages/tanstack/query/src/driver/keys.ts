/** Query keys for the signed-in driver. */
export const driverKeys = {
  all: ['driver'] as const,
  me: () => [...driverKeys.all, 'me'] as const,
  payouts: () => [...driverKeys.all, 'payouts'] as const,
  payBalance: () => [...driverKeys.all, 'payBalance'] as const,
  earnings: (from: string, to: string) => [...driverKeys.all, 'earnings', from, to] as const,
  earningsDay: (day: string) => [...driverKeys.all, 'earningsDay', day] as const,
};
