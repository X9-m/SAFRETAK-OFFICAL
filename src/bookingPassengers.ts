import type { BookingTraveler, ServiceKind, TravelerDocumentType } from './types.ts';
import {
  addDaysIso,
  cleanSingleLineText,
  isIsoDate,
  isValidDocumentNumber,
  isValidFullName,
  isValidNationality,
} from './validation.ts';

export interface BookingTravelerDraft {
  fullName: string;
  nationality: string;
  documentType: TravelerDocumentType;
  documentNumber: string;
  documentExpiry: string;
}

const passportRequiredKinds = new Set<ServiceKind>(['intl_trip', 'flight', 'hajj_umrah', 'insurance', 'visa']);
const manifestOptionalKinds = new Set<ServiceKind>(['consultation']);

export const requiresTravelerManifest = (kind: ServiceKind): boolean => !manifestOptionalKinds.has(kind);
export const requiresPassport = (kind: ServiceKind): boolean => passportRequiredKinds.has(kind);

export const travelerManifestCount = (kind: ServiceKind, quantity: number): number => {
  if (!requiresTravelerManifest(kind)) return 0;
  if (kind === 'car') return 1;
  return Math.max(1, Math.min(10, Number.isInteger(quantity) ? quantity : 1));
};

export const createTravelerDraft = (index: number, primaryName = ''): BookingTravelerDraft => ({
  fullName: index === 0 ? cleanSingleLineText(primaryName, 100) : '',
  nationality: 'أردني',
  documentType: 'national_id',
  documentNumber: '',
  documentExpiry: '',
});

export const syncTravelerDrafts = (
  current: BookingTravelerDraft[],
  count: number,
  primaryName = '',
  forcePassport = false,
): BookingTravelerDraft[] => Array.from({ length: count }, (_, index) => {
  const existing = current[index] || createTravelerDraft(index, primaryName);
  return {
    ...existing,
    fullName: existing.fullName || (index === 0 ? cleanSingleLineText(primaryName, 100) : ''),
    documentType: forcePassport ? 'passport' : existing.documentType,
  };
});

export const validateTravelerManifest = (
  travelers: BookingTravelerDraft[],
  kind: ServiceKind,
  expectedCount: number,
  travelDate: string,
): string | null => {
  if (!requiresTravelerManifest(kind)) return null;
  if (!Array.isArray(travelers) || travelers.length !== expectedCount) return 'راجع عدد بيانات المسافرين.';
  const passportRequired = requiresPassport(kind);
  const minimumExpiry = isIsoDate(travelDate) ? addDaysIso(travelDate, 180) : '';

  for (let index = 0; index < travelers.length; index += 1) {
    const traveler = travelers[index];
    const label = kind === 'car' ? 'السائق' : `المسافر ${index + 1}`;
    if (!isValidFullName(traveler.fullName)) return `أدخل اسم ${label} بشكل صحيح.`;
    if (!isValidNationality(traveler.nationality)) return `أدخل جنسية ${label} بشكل صحيح.`;
    if (passportRequired && traveler.documentType !== 'passport') return `${label}: جواز السفر مطلوب لهذه الخدمة.`;
    if (traveler.documentType !== 'national_id' && traveler.documentType !== 'passport') return `${label}: اختر نوع وثيقة صحيحًا.`;
    if (!isValidDocumentNumber(traveler.documentNumber)) return `${label}: أدخل رقم وثيقة صحيحًا.`;
    if (traveler.documentType === 'passport') {
      if (!isIsoDate(traveler.documentExpiry)) return `${label}: أدخل تاريخ انتهاء جواز السفر.`;
      if (minimumExpiry && traveler.documentExpiry < minimumExpiry) return `${label}: يجب أن يكون الجواز صالحًا لمدة 6 أشهر على الأقل من تاريخ السفر.`;
    }
  }
  return null;
};

export const sanitizeTravelerManifest = (travelers: BookingTravelerDraft[]): BookingTraveler[] => travelers.map((traveler) => ({
  fullName: cleanSingleLineText(traveler.fullName, 100),
  nationality: cleanSingleLineText(traveler.nationality, 50),
  documentType: traveler.documentType,
  documentNumber: cleanSingleLineText(traveler.documentNumber, 20).toUpperCase(),
  documentExpiry: traveler.documentType === 'passport' && isIsoDate(traveler.documentExpiry) ? traveler.documentExpiry : null,
}));

export const readBookingTravelers = (value: unknown): BookingTraveler[] => {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 10).map((item): BookingTraveler | null => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
    const row = item as Record<string, unknown>;
    const fullName = cleanSingleLineText(row.full_name ?? row.fullName, 100);
    const nationality = cleanSingleLineText(row.nationality, 50);
    const documentType = row.document_type === 'passport' || row.documentType === 'passport' ? 'passport' : row.document_type === 'national_id' || row.documentType === 'national_id' ? 'national_id' : null;
    const documentNumber = cleanSingleLineText(row.document_number ?? row.documentNumber, 20).toUpperCase();
    const rawExpiry = row.document_expiry ?? row.documentExpiry;
    const documentExpiry = isIsoDate(rawExpiry) ? rawExpiry : null;
    const maskedDocument = /^•{4,6}[A-Z0-9]{4}$/.test(documentNumber) || documentNumber === '••••';
    if (!isValidFullName(fullName) || !isValidNationality(nationality) || !documentType || (!isValidDocumentNumber(documentNumber) && !maskedDocument)) return null;
    return { fullName, nationality, documentType, documentNumber, documentExpiry };
  }).filter((item): item is BookingTraveler => Boolean(item));
};

export const maskDocumentNumber = (value: string): string => {
  const clean = cleanSingleLineText(value, 20).toUpperCase();
  if (clean.length <= 4) return clean;
  return `${'•'.repeat(Math.min(6, clean.length - 4))}${clean.slice(-4)}`;
};
