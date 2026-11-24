/** Query keys for routes. */
export const routeKeys = {
  all: ['routes'] as const,
  list: () => [...routeKeys.all, 'list'] as const,
  detail: (routeId: string) => [...routeKeys.all, 'detail', routeId] as const,
  commute: (preferredCode: string) => [...routeKeys.all, 'commute', preferredCode] as const,
  nearby: (lat: number, lng: number) => [...routeKeys.all, 'nearby', lat, lng] as const,
};
