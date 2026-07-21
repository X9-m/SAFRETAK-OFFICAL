import type { PortalTab } from './components/PortalShell';

export type PortalRoute =
  | { page: 'tab'; tab: PortalTab }
  | { page: 'service'; tab: 'services'; serviceId: string }
  | { page: 'office'; tab: 'services'; officeId: string }
  | { page: 'booking'; tab: 'bookings'; bookingId: string }
  | { page: 'favorites'; tab: 'services' };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isRouteUuid = (value: unknown): value is string => typeof value === 'string' && UUID_PATTERN.test(value);
const validTabs = new Set<PortalTab>(['home', 'services', 'bookings', 'account']);

export const parsePortalHash = (hash: string): PortalRoute => {
  const clean = hash.replace(/^#\/?/, '').replace(/\/+$/, '');
  const [first = 'home', second] = clean.split('/');
  if (first === 'service' && isRouteUuid(second)) return { page: 'service', tab: 'services', serviceId: second };
  if (first === 'office' && isRouteUuid(second)) return { page: 'office', tab: 'services', officeId: second };
  if (first === 'booking' && isRouteUuid(second)) return { page: 'booking', tab: 'bookings', bookingId: second };
  if (first === 'favorites') return { page: 'favorites', tab: 'services' };
  if (validTabs.has(first as PortalTab)) return { page: 'tab', tab: first as PortalTab };
  return { page: 'tab', tab: 'home' };
};

export const portalHash = (tab: PortalTab): string => `#/${tab}`;
export const serviceHash = (serviceId: string): string => isRouteUuid(serviceId) ? `#/service/${serviceId}` : '#/services';
export const officeHash = (officeId: string): string => isRouteUuid(officeId) ? `#/office/${officeId}` : '#/services';
export const bookingHash = (bookingId: string): string => isRouteUuid(bookingId) ? `#/booking/${bookingId}` : '#/bookings';
export const favoritesHash = (): string => '#/favorites';
