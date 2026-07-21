import { supabaseRest } from '../supabaseClient';
import { isServiceKind } from '../domain';
import type { CatalogAddOn, CatalogOption, CatalogService, PlatformAd, ServiceCategory, TravelOffice } from '../types';
import {
  clampFiniteNumber,
  cleanMultilineText,
  cleanSingleLineText,
  isIsoDate,
  isRecord,
  isUuid,
  safeExternalUrl,
  safeImageUrl,
} from '../validation';

interface CatalogPayload {
  services: CatalogService[];
  offices: TravelOffice[];
  categories: ServiceCategory[];
  ads: PlatformAd[];
}

const mapOffice = (value: unknown): TravelOffice | null => {
  if (!isRecord(value) || !isUuid(value.id)) return null;
  const name = cleanSingleLineText(value.name, 120);
  if (name.length < 2) return null;
  return {
    id: value.id,
    name,
    logoUrl: safeImageUrl(value.logo_url),
    coverUrl: safeImageUrl(value.cover_url),
    rating: clampFiniteNumber(value.rating, 0, 5, 0),
    description: cleanMultilineText(value.description, 1200) || null,
    location: cleanSingleLineText(value.location, 160) || null,
  };
};

const mapCategory = (value: unknown): ServiceCategory | null => {
  if (!isRecord(value) || !isUuid(value.id)) return null;
  const nameAr = cleanSingleLineText(value.name_ar, 100);
  const nameEn = cleanSingleLineText(value.name_en, 100);
  const slug = cleanSingleLineText(value.slug, 80);
  if (!nameAr || !nameEn || !slug) return null;
  return {
    id: value.id,
    nameAr,
    nameEn,
    slug,
    icon: cleanSingleLineText(value.icon, 80) || null,
    sortOrder: Number.isInteger(value.sort_order) ? Number(value.sort_order) : 0,
  };
};

const mapStringArray = (value: unknown, itemLimit: number, lengthLimit: number): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, itemLimit)
    .map((item) => cleanSingleLineText(item, lengthLimit))
    .filter(Boolean);
};

const mapAddOns = (details: Record<string, unknown>): CatalogAddOn[] => {
  const raw = details.add_ons;
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 20).map((item): CatalogAddOn | null => {
    if (!isRecord(item)) return null;
    const id = cleanSingleLineText(item.id, 50);
    const label = cleanSingleLineText(item.label_ar ?? item.label, 100);
    const price = Number(item.price);
    if (!/^[a-z0-9_-]{1,50}$/i.test(id) || !label || !Number.isFinite(price) || price < 0 || price > 100000) return null;
    return { id, label, price };
  }).filter((item): item is CatalogAddOn => Boolean(item));
};

const mapOptions = (details: Record<string, unknown>): CatalogOption[] => {
  const raw = details.options;
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 20).map((item): CatalogOption | null => {
    if (!isRecord(item)) return null;
    const id = cleanSingleLineText(item.id, 50);
    const label = cleanSingleLineText(item.label_ar ?? item.label, 100);
    const priceDelta = Number(item.price_delta ?? item.priceDelta ?? 0);
    if (!/^[a-z0-9_-]{1,50}$/i.test(id) || !label || !Number.isFinite(priceDelta) || priceDelta < 0 || priceDelta > 100000) return null;
    return { id, label, priceDelta };
  }).filter((item): item is CatalogOption => Boolean(item));
};

const mapService = (value: unknown): CatalogService | null => {
  if (!isRecord(value) || !isUuid(value.id) || !isUuid(value.office_id) || !isServiceKind(value.type)) return null;
  const office = mapOffice(value.travel_offices);
  if (!office) return null;
  const title = cleanSingleLineText(value.title, 160);
  const price = Number(value.price);
  if (title.length < 2 || !Number.isFinite(price) || price < 0) return null;
  const category = value.service_categories ? mapCategory(value.service_categories) : null;
  const details = isRecord(value.details) ? value.details : {};
  const itinerary = Array.isArray(value.itinerary) ? value.itinerary.slice(0, 50) : [];
  const rawSeats = value.seats_remaining;
  const seatsRemaining = rawSeats === null || rawSeats === undefined
    ? null
    : Number.isInteger(Number(rawSeats)) && Number(rawSeats) >= 0
      ? Number(rawSeats)
      : null;

  return {
    id: value.id,
    officeId: value.office_id,
    categoryId: isUuid(value.category_id) ? value.category_id : null,
    type: value.type,
    title,
    description: cleanMultilineText(value.description, 4000),
    price,
    rating: clampFiniteNumber(value.rating, 0, 5, 0),
    imageUrl: safeImageUrl(value.image_url),
    images: Array.isArray(value.images)
      ? value.images.map(safeImageUrl).filter((item): item is string => Boolean(item)).slice(0, 12)
      : [],
    location: cleanSingleLineText(value.location, 160) || null,
    terms: cleanMultilineText(value.terms, 5000) || null,
    cancellationPolicy: cleanMultilineText(value.cancellation_policy, 3000) || null,
    availableDates: Array.isArray(value.available_dates)
      ? [...new Set(value.available_dates.filter((item): item is string => isIsoDate(item)))].sort()
      : [],
    duration: cleanSingleLineText(value.duration, 120) || null,
    seatsRemaining,
    itinerary,
    included: mapStringArray(value.included, 30, 160),
    details,
    addOns: mapAddOns(details),
    options: mapOptions(details),
    office,
    category,
  };
};

const mapAd = (value: unknown, now = Date.now()): PlatformAd | null => {
  if (!isRecord(value) || !isUuid(value.id)) return null;
  const startsAt = typeof value.starts_at === 'string' ? Date.parse(value.starts_at) : Number.NaN;
  const endsAt = typeof value.ends_at === 'string' ? Date.parse(value.ends_at) : Number.NaN;
  if (Number.isFinite(startsAt) && startsAt > now) return null;
  if (Number.isFinite(endsAt) && endsAt <= now) return null;
  const titleAr = cleanSingleLineText(value.title_ar, 140);
  const imageUrl = safeImageUrl(value.image_url);
  if (!titleAr || !imageUrl) return null;
  return {
    id: value.id,
    titleAr,
    titleEn: cleanSingleLineText(value.title_en, 140),
    imageUrl,
    link: safeExternalUrl(value.link),
  };
};

export const catalogClient = {
  async loadCatalog(): Promise<CatalogPayload> {
    const [servicesResult, officesResult, categoriesResult, adsResult] = await Promise.all([
      supabaseRest.select('services', {
        select: `
          id, office_id, category_id, type, title, description, price, rating,
          image_url, images, location, terms, cancellation_policy, available_dates,
          duration, seats_remaining, itinerary, included, details,
          travel_offices!inner(id, name, logo_url, cover_url, rating, description, location),
          service_categories(id, name_ar, name_en, slug, icon, sort_order)
        `,
        filters: { is_active: 'eq.true', published_at: 'not.is.null' },
        order: 'published_at.desc.nullslast',
      }),
      supabaseRest.select('travel_offices', {
        select: 'id, name, logo_url, cover_url, rating, description, location',
        filters: { is_active: 'eq.true', is_approved: 'eq.true' },
        order: 'rating.desc',
      }),
      supabaseRest.select('service_categories', {
        select: 'id, name_ar, name_en, slug, icon, sort_order',
        filters: { is_active: 'eq.true' },
        order: 'sort_order.asc',
      }),
      supabaseRest.select('platform_ads', {
        select: 'id, title_ar, title_en, image_url, link, starts_at, ends_at',
        filters: { is_active: 'eq.true' },
        order: 'sort_order.asc',
      }),
    ]);

    const firstError = servicesResult.error || officesResult.error || categoriesResult.error || adsResult.error;
    if (firstError) throw new Error('تعذر تحميل بيانات المنصة. حاول تحديث الصفحة.');

    return {
      services: (servicesResult.data || []).map(mapService).filter((item): item is CatalogService => Boolean(item)),
      offices: (officesResult.data || []).map(mapOffice).filter((item): item is TravelOffice => Boolean(item)),
      categories: (categoriesResult.data || []).map(mapCategory).filter((item): item is ServiceCategory => Boolean(item)),
      ads: (adsResult.data || []).map(mapAd).filter((item): item is PlatformAd => Boolean(item)),
    };
  },
};
