const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;
const MULTILINE_CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SESSION_TOKEN_PATTERN = /^[0-9a-f]{64}$/i;
const PERSON_NAME_ALLOWED_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u;
const PERSON_NAME_LETTERS_PATTERN = /[\p{L}\p{M}]/gu;
const SAFE_REFERENCE_PATTERN = /^[A-Za-z0-9_-]{6,40}$/;
const SAFE_COUPON_PATTERN = /^[A-Za-z0-9_-]{3,30}$/;
const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const DOCUMENT_NUMBER_PATTERN = /^[A-Z0-9]{5,20}$/i;

export const PAYMENT_METHODS = ['CliQ', 'eFAWATEERcom', 'Cash at Office'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const normalizeJordanPhone = (value: string): string => {
  const digits = value.normalize('NFKC').replace(/\D/g, '');
  if (/^009627\d{8}$/.test(digits)) return `+${digits.slice(2)}`;
  if (/^9627\d{8}$/.test(digits)) return `+${digits}`;
  if (/^07\d{8}$/.test(digits)) return `+962${digits.slice(1)}`;
  if (/^7\d{8}$/.test(digits)) return `+962${digits}`;
  return value.trim();
};

export const isValidJordanPhone = (value: string): boolean => /^\+9627\d{8}$/.test(normalizeJordanPhone(value));
export const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
export const isUuid = (value: unknown): value is string => typeof value === 'string' && UUID_PATTERN.test(value);
export const isSessionToken = (value: unknown): value is string => typeof value === 'string' && SESSION_TOKEN_PATTERN.test(value);

export const cleanSingleLineText = (value: unknown, maxLength: number): string => {
  if (typeof value !== 'string') return '';
  return value.normalize('NFKC').replace(CONTROL_CHARACTERS, '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
};

export const cleanMultilineText = (value: unknown, maxLength: number): string => {
  if (typeof value !== 'string') return '';
  return value.normalize('NFKC').replace(/\r\n?/g, '\n').replace(MULTILINE_CONTROL_CHARACTERS, '').replace(/[\t ]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, maxLength);
};

export const cleanSearchText = (value: string): string => cleanSingleLineText(value, 100).toLocaleLowerCase('ar-JO');

export const isValidFullName = (value: unknown): value is string => {
  const clean = cleanSingleLineText(value, 100);
  if (clean.length < 2 || clean.length > 100 || !PERSON_NAME_ALLOWED_PATTERN.test(clean)) return false;
  return (clean.match(PERSON_NAME_LETTERS_PATTERN) || []).length >= 2;
};

export const isValidNationality = (value: unknown): value is string => {
  const clean = cleanSingleLineText(value, 50);
  if (clean.length < 2 || clean.length > 50 || !PERSON_NAME_ALLOWED_PATTERN.test(clean)) return false;
  return (clean.match(PERSON_NAME_LETTERS_PATTERN) || []).length >= 2;
};

export const normalizeDocumentNumber = (value: unknown): string => cleanSingleLineText(value, 20).replace(/[\s-]+/g, '').toUpperCase();
export const isValidDocumentNumber = (value: unknown): boolean => DOCUMENT_NUMBER_PATTERN.test(normalizeDocumentNumber(value));

export const isValidEmail = (value: unknown): value is string => {
  if (value === '' || value === null || value === undefined) return true;
  const clean = cleanSingleLineText(value, 160);
  return clean.length <= 160 && EMAIL_PATTERN.test(clean);
};

export const clampFiniteNumber = (value: unknown, minimum: number, maximum: number, fallback = minimum): number => {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(maximum, Math.max(minimum, parsed));
};

export const asInteger = (value: unknown, minimum: number, maximum: number): number | null => {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) return null;
  return parsed;
};

export const isPaymentMethod = (value: unknown): value is PaymentMethod => typeof value === 'string' && PAYMENT_METHODS.includes(value as PaymentMethod);
export const isPaymentReference = (value: unknown): boolean => typeof value === 'string' && SAFE_REFERENCE_PATTERN.test(value.trim());
export const isCouponCode = (value: unknown): boolean => typeof value === 'string' && SAFE_COUPON_PATTERN.test(value.trim());

export const isIsoDate = (value: unknown): value is string => {
  if (typeof value !== 'string' || !ISO_DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

export const getJordanTodayIso = (date = new Date()): string => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Amman', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
};

export const addDaysIso = (value: string, days: number): string => {
  if (!isIsoDate(value)) return '';
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
};

export const daysBetween = (start: string, end: string): number => {
  if (!isIsoDate(start) || !isIsoDate(end)) return 0;
  return Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000);
};

export const isBookableDate = (value: unknown, today = getJordanTodayIso()): value is string => isIsoDate(value) && value >= today;
export const getBookableDates = (values: unknown, today = getJordanTodayIso()): string[] => !Array.isArray(values) ? [] : [...new Set(values.filter((value): value is string => isBookableDate(value, today)))].sort();

export const safeImageUrl = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.startsWith('/')) return trimmed;
  try { const url = new URL(trimmed); return url.protocol === 'https:' ? url.toString() : null; } catch { return null; }
};

export const safeExternalUrl = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  try { const url = new URL(value.trim()); return url.protocol === 'https:' ? url.toString() : null; } catch { return null; }
};

export const secondsUntil = (isoDate: string, now = Date.now()): number => {
  const timestamp = Date.parse(isoDate);
  if (!Number.isFinite(timestamp)) return 0;
  return Math.max(0, Math.ceil((timestamp - now) / 1000));
};

export const formatCountdown = (seconds: number): string => {
  const safe = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safe / 60).toString().padStart(2, '0')}:${(safe % 60).toString().padStart(2, '0')}`;
};
