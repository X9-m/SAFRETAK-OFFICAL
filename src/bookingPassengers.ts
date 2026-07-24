import type { BookingTraveler, FlightPassengerType, ServiceKind, TravelerDocumentType } from './types.ts';
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
  passengerType: FlightPassengerType;
  birthDate: string;
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
  passengerType: 'adult',
  birthDate: '',
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
    passengerType: existing.passengerType || 'adult',
    birthDate: existing.birthDate || '',
  };
});

const yearsBefore = (isoDate: string, years: number): string => {
  if (!isIsoDate(isoDate)) return '';
  const [year, month, day] = isoDate.split('-').map(Number);
  const targetYear = year - years;
  const lastDay = new Date(Date.UTC(targetYear, month, 0)).getUTCDate();
  return `${targetYear.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${Math.min(day, lastDay).toString().padStart(2, '0')}`;
};

const validateFlightAge = (traveler: BookingTravelerDraft, travelDate: string, label: string): string | null => {
  if (!isIsoDate(traveler.birthDate) || traveler.birthDate > travelDate) return `${label}: أدخل تاريخ ميلاد صحيحًا.`;
  const twelveYearsBefore = yearsBefore(travelDate, 12);
  const twoYearsBefore = yearsBefore(travelDate, 2);
  if (traveler.passengerType === 'adult' && traveler.birthDate > twelveYearsBefore) return `${label}: عمر البالغ يجب أن يكون 12 سنة أو أكثر يوم السفر.`;
  if (traveler.passengerType === 'child' && (traveler.birthDate <= twelveYearsBefore || traveler.birthDate > twoYearsBefore)) return `${label}: عمر الطفل يجب أن يكون من سنتين إلى أقل من 12 سنة.`;
  if (traveler.passengerType === 'infant' && traveler.birthDate <= twoYearsBefore) return `${label}: عمر الرضيع يجب أن يكون أقل من سنتين يوم السفر.`;
  return null;
};

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
    if (kind === 'flight') {
      if (!['adult', 'child', 'infant'].includes(traveler.passengerType)) return `${label}: اختر فئة عمر صحيحة.`;
      const ageError = validateFlightAge(traveler, travelDate, label);
      if (ageError) return ageError;
    }
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
  passengerType: traveler.passengerType,
  birthDate: isIsoDate(traveler.birthDate) ? traveler.birthDate : null,
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
    const rawPassengerType = row.passenger_type ?? row.passengerType;
    const passengerType = rawPassengerType === 'adult' || rawPassengerType === 'child' || rawPassengerType === 'infant' ? rawPassengerType : undefined;
    const rawBirthDate = row.birth_date ?? row.birthDate;
    const birthDate = isIsoDate(rawBirthDate) ? rawBirthDate : null;
    const maskedDocument = /^•{4,6}[A-Z0-9]{4}$/.test(documentNumber) || documentNumber === '••••';
    if (!isValidFullName(fullName) || !isValidNationality(nationality) || !documentType || (!isValidDocumentNumber(documentNumber) && !maskedDocument)) return null;
    return { fullName, nationality, documentType, documentNumber, documentExpiry, passengerType, birthDate };
  }).filter((item): item is BookingTraveler => Boolean(item));
};

export const maskDocumentNumber = (value: string): string => {
  const clean = cleanSingleLineText(value, 20).toUpperCase();
  if (clean.length <= 4) return clean;
  return `${'•'.repeat(Math.min(6, clean.length - 4))}${clean.slice(-4)}`;
};
