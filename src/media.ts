import type { ServiceKind } from './types';

const serviceFallbacks: Record<ServiceKind, string> = {
  trip: '/media/fallback-trip.svg',
  intl_trip: '/media/fallback-intl_trip.svg',
  hotel: '/media/fallback-hotel.svg',
  car: '/media/fallback-car.svg',
  flight: '/media/fallback-flight.svg',
  bus_train: '/media/fallback-bus_train.svg',
  hajj_umrah: '/media/fallback-hajj_umrah.svg',
  insurance: '/media/fallback-insurance.svg',
  visa: '/media/fallback-visa.svg',
  consultation: '/media/fallback-consultation.svg',
};

export const serviceImageFallback = (kind: ServiceKind): string => serviceFallbacks[kind] || '/media/fallback-service.svg';
export const officeImageFallback = '/media/fallback-office.svg';
export const adImageFallback = '/media/fallback-ad.svg';
