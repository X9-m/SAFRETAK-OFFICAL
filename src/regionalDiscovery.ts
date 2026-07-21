import type { CatalogService } from './types';
import { cleanSearchText } from './validation.ts';

export type JordanRegionKey =
  | 'amman'
  | 'irbid'
  | 'zarqa'
  | 'balqa'
  | 'madaba'
  | 'aqaba'
  | 'maan'
  | 'karak'
  | 'tafilah'
  | 'jerash'
  | 'ajloun'
  | 'mafraq';

export interface JordanRegion {
  key: JordanRegionKey;
  label: string;
  latitude: number;
  longitude: number;
  aliases: string[];
}

export const JORDAN_REGIONS: JordanRegion[] = [
  { key: 'amman', label: 'عمّان', latitude: 31.9539, longitude: 35.9106, aliases: ['عمان', 'عمّان', 'amman'] },
  { key: 'irbid', label: 'إربد', latitude: 32.5569, longitude: 35.8479, aliases: ['اربد', 'إربد', 'irbid', 'الشمال'] },
  { key: 'zarqa', label: 'الزرقاء', latitude: 32.0728, longitude: 36.088, aliases: ['الزرقاء', 'زرقاء', 'zarqa'] },
  { key: 'balqa', label: 'البلقاء', latitude: 32.0392, longitude: 35.7272, aliases: ['البلقاء', 'السلط', 'salt', 'البحر الميت', 'dead sea'] },
  { key: 'madaba', label: 'مادبا', latitude: 31.7195, longitude: 35.7939, aliases: ['مادبا', 'madaba', 'جبل نيبو', 'نيبو'] },
  { key: 'aqaba', label: 'العقبة', latitude: 29.5321, longitude: 35.0063, aliases: ['العقبة', 'عقبة', 'aqaba'] },
  { key: 'maan', label: 'معان', latitude: 30.194, longitude: 35.7342, aliases: ['معان', 'maan', 'البتراء', 'petra', 'وادي رم', 'wadi rum'] },
  { key: 'karak', label: 'الكرك', latitude: 31.1853, longitude: 35.7048, aliases: ['الكرك', 'كرك', 'karak'] },
  { key: 'tafilah', label: 'الطفيلة', latitude: 30.8375, longitude: 35.6044, aliases: ['الطفيلة', 'طفيلة', 'tafilah', 'ضانا', 'dana'] },
  { key: 'jerash', label: 'جرش', latitude: 32.2747, longitude: 35.8961, aliases: ['جرش', 'jerash'] },
  { key: 'ajloun', label: 'عجلون', latitude: 32.3333, longitude: 35.7528, aliases: ['عجلون', 'ajloun'] },
  { key: 'mafraq', label: 'المفرق', latitude: 32.3429, longitude: 36.208, aliases: ['المفرق', 'مفرق', 'mafraq', 'ام الجمال', 'أم الجمال'] },
];

const toRadians = (value: number): number => value * Math.PI / 180;

const distanceKm = (latitudeA: number, longitudeA: number, latitudeB: number, longitudeB: number): number => {
  const earthRadius = 6371;
  const latitudeDelta = toRadians(latitudeB - latitudeA);
  const longitudeDelta = toRadians(longitudeB - longitudeA);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(toRadians(latitudeA)) * Math.cos(toRadians(latitudeB)) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const findRegionByKey = (key: string | null | undefined): JordanRegion | null =>
  JORDAN_REGIONS.find((region) => region.key === key) || null;

export const resolveJordanRegion = (latitude: number, longitude: number): JordanRegion | null => {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < 28.7 || latitude > 33.7 || longitude < 34.7 || longitude > 39.5) return null;

  return JORDAN_REGIONS
    .map((region) => ({ region, distance: distanceKm(latitude, longitude, region.latitude, region.longitude) }))
    .sort((left, right) => left.distance - right.distance)[0]?.region || null;
};

const serviceRegionalText = (service: CatalogService): string => cleanSearchText([
  service.location,
  service.office.location,
  service.title,
  service.description,
].filter(Boolean).join(' '));

export const serviceMatchesRegion = (service: CatalogService, region: JordanRegion): boolean => {
  const haystack = serviceRegionalText(service);
  return region.aliases.some((alias) => haystack.includes(cleanSearchText(alias)));
};

const priorityForService = (service: CatalogService): number => {
  if (service.type === 'hajj_umrah') return 3;
  if (service.type === 'trip' || service.type === 'intl_trip') return 2;
  return 1;
};

export const rankRegionalServices = (services: CatalogService[]): CatalogService[] => [...services].sort((left, right) => {
  const typePriority = priorityForService(right) - priorityForService(left);
  if (typePriority) return typePriority;
  if (right.rating !== left.rating) return right.rating - left.rating;
  const rightSeats = right.seatsRemaining ?? -1;
  const leftSeats = left.seatsRemaining ?? -1;
  if (rightSeats !== leftSeats) return rightSeats - leftSeats;
  return left.title.localeCompare(right.title, 'ar');
});

export interface RegionalRecommendations {
  services: CatalogService[];
  mode: 'regional' | 'fallback';
}

export const recommendRegionalServices = (
  services: CatalogService[],
  region: JordanRegion | null,
  limit = 6,
): RegionalRecommendations => {
  if (region) {
    const regional = rankRegionalServices(services.filter((service) => serviceMatchesRegion(service, region)));
    if (regional.length) return { services: regional.slice(0, limit), mode: 'regional' };
  }

  const tripFallback = services.filter((service) => ['hajj_umrah', 'trip', 'intl_trip'].includes(service.type));
  return {
    services: rankRegionalServices(tripFallback.length ? tripFallback : services).slice(0, limit),
    mode: 'fallback',
  };
};
