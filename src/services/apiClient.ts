import { supabaseFunctionsUrl, supabaseRest } from '../supabaseClient';
import { isServiceKind } from '../domain';
import type {
  AppProfile,
  AuthIntent,
  BookingDocument,
  BookingDraft,
  BookingMessage,
  FavoriteService,
  NotificationPreferences,
  PortalSnapshot,
  ServiceReview,
  TravelerBooking,
  TravelerNotification,
  TravelerStats,
} from '../types';
import {
  cleanMultilineText,
  cleanSingleLineText,
  isCouponCode,
  isPaymentMethod,
  isPaymentReference,
  isRecord,
  isSessionToken,
  isUuid,
  isValidEmail,
  isValidFullName,
  isValidJordanPhone,
  normalizeJordanPhone,
  safeExternalUrl,
} from '../validation';

export interface OtpChallenge {
  challengeId: string;
  phone: string;
  expiresAt: string;
  intent: AuthIntent;
}

const SESSION_STORAGE_KEY = 'safretak_phone_session';
const validRoles = new Set<AppProfile['role']>(['traveler', 'office', 'admin']);
const validBookingStatuses = new Set<TravelerBooking['status']>(['Pending', 'Confirmed', 'Completed', 'Cancelled']);
const validPaymentStatuses = new Set<TravelerBooking['paymentStatus']>(['unpaid', 'paid']);

export class ApiError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

export { isValidJordanPhone, normalizeJordanPhone } from '../validation';

const friendlyMessages: Record<string, string> = {
  INVALID_PHONE: 'أدخل رقم هاتف أردني صحيح.',
  INVALID_PURPOSE: 'تعذر تحديد نوع العملية.',
  RATE_LIMITED: 'تم طلب رموز كثيرة. حاول بعد قليل.',
  CHALLENGE_NOT_FOUND: 'انتهت جلسة التحقق. اطلب رمزًا جديدًا.',
  OTP_EXPIRED: 'انتهت صلاحية رمز التحقق. اطلب رمزًا جديدًا.',
  OTP_ALREADY_USED: 'تم استخدام رمز التحقق سابقًا. اطلب رمزًا جديدًا.',
  TOO_MANY_ATTEMPTS: 'تم تجاوز عدد المحاولات. اطلب رمزًا جديدًا.',
  INVALID_OTP: 'رمز التحقق غير صحيح.',
  ACCOUNT_NOT_FOUND: 'لا يوجد حساب بهذا الرقم. اختر إنشاء حساب جديد.',
  ACCOUNT_EXISTS: 'هذا الرقم مسجل مسبقًا. اختر تسجيل الدخول.',
  ACCOUNT_DISABLED: 'هذا الحساب موقوف. تواصل مع إدارة المنصة.',
  SESSION_EXPIRED: 'انتهت جلسة الدخول. سجّل الدخول مرة أخرى.',
  SERVICE_NOT_FOUND: 'الخدمة غير متاحة حاليًا.',
  NO_SEATS: 'لا يوجد عدد كافٍ متاح للحجز.',
  INVALID_TRAVEL_DATE: 'اختر موعدًا متاحًا وصحيحًا.',
  INVALID_STAY_DATES: 'تأكد من تاريخ الدخول والخروج.',
  INVALID_PAYMENT_METHOD: 'طريقة الدفع المختارة غير متاحة.',
  INVALID_PAYMENT_REFERENCE: 'أدخل رقم مرجع دفع صحيح.',
  INVALID_BOOKING_DETAILS: 'راجع تفاصيل الحجز المدخلة.',
  INVALID_TRAVELERS: 'راجع بيانات المسافرين المطلوبة.',
  INVALID_TRAVELER_NAME: 'أدخل أسماء المسافرين كما تظهر في الوثائق.',
  INVALID_NATIONALITY: 'أدخل جنسية صحيحة لكل مسافر.',
  INVALID_TRAVELER_DOCUMENT: 'راجع نوع ورقم وثيقة كل مسافر.',
  INVALID_PASSPORT_EXPIRY: 'أدخل تاريخ انتهاء جواز السفر.',
  PASSPORT_EXPIRY_TOO_SOON: 'يجب أن يكون جواز السفر صالحًا لمدة 6 أشهر على الأقل من تاريخ السفر.',
  INVALID_QUANTITY: 'العدد المطلوب غير صحيح.',
  INVALID_NAME: 'أدخل اسمك الكامل بشكل صحيح.',
  INVALID_EMAIL: 'أدخل بريدًا إلكترونيًا صحيحًا أو اتركه فارغًا.',
  EMAIL_EXISTS: 'البريد الإلكتروني مستخدم بحساب آخر.',
  INVALID_COUPON: 'رمز الخصم غير صالح أو لا ينطبق على هذا الحجز.',
  PROFILE_INCOMPLETE: 'أكمل بيانات حسابك قبل تنفيذ هذا الطلب.',
  INVALID_SUPPORT_MESSAGE: 'اكتب تفاصيل واضحة للطلب.',
  SUPPORT_RATE_LIMITED: 'تم إرسال عدة طلبات مؤخرًا. حاول لاحقًا.',
  CANCELLATION_ALREADY_REQUESTED: 'تم إرسال طلب إلغاء لهذا الحجز مسبقًا.',
  BOOKING_NOT_FOUND: 'الحجز غير موجود أو لا يخص هذا الحساب.',
  BOOKING_NOT_CANCELLABLE: 'لا يمكن طلب إلغاء هذا الحجز في حالته الحالية.',
  REVIEW_NOT_ALLOWED: 'يمكن إضافة التقييم بعد اكتمال الحجز.',
  INVALID_REVIEW: 'أدخل تقييمًا وتعليقًا صحيحين.',
  MESSAGE_RATE_LIMITED: 'أرسلت رسائل كثيرة خلال وقت قصير.',
  INVALID_MESSAGE: 'اكتب رسالة صحيحة.',
  INVALID_DOCUMENT: 'اختر صورة أو ملف PDF صحيحًا بحجم لا يتجاوز 6MB.',
  INVALID_DOCUMENT_CONTENT: 'محتوى الملف لا يطابق نوعه.',
  DOCUMENT_LIMIT_REACHED: 'وصل هذا الحجز إلى الحد الأقصى للمستندات.',
  DOCUMENT_RATE_LIMITED: 'تم رفع ملفات كثيرة خلال وقت قصير. حاول لاحقًا.',
  DOCUMENT_UPLOAD_CLOSED: 'لا يمكن إضافة مستندات لهذا الحجز في حالته الحالية.',
  DOCUMENT_DELETE_CLOSED: 'لا يمكن حذف المستند في حالة الحجز الحالية.',
  DOCUMENT_NOT_FOUND: 'المستند غير موجود.',
  DOCUMENT_SERVICE_ERROR: 'تعذر الوصول إلى خدمة المستندات.',
  ACTIVE_BOOKINGS: 'لا يمكن طلب إغلاق الحساب قبل تسوية الحجوزات النشطة.',
  DELETION_ALREADY_REQUESTED: 'تم إرسال طلب إغلاق الحساب مسبقًا وهو قيد المراجعة.',
  CONNECTION_FAILED: 'تعذر الاتصال بالخادم. تحقق من الإنترنت وحاول مرة أخرى.',
  REQUEST_TIMEOUT: 'استغرق الاتصال وقتًا أطول من المتوقع. حاول مرة أخرى.',
};

const errorCodeFromMessage = (message?: string): string | undefined => {
  if (!message) return undefined;
  return Object.keys(friendlyMessages).find((code) => message.includes(code));
};

const throwDatabaseError = (message: string | undefined, fallback: string): never => {
  const code = errorCodeFromMessage(message);
  throw new ApiError(code ? friendlyMessages[code] : fallback, code);
};

const readSessionToken = (): string | null => {
  try {
    const token = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!token || !isSessionToken(token)) {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
    return token;
  } catch {
    return null;
  }
};

const writeSessionToken = (token: string): void => {
  if (!isSessionToken(token)) throw new ApiError('تعذر حفظ جلسة الدخول.', 'INVALID_SESSION');
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, token);
  } catch {
    throw new ApiError('المتصفح يمنع حفظ جلسة الدخول.', 'SESSION_STORAGE_BLOCKED');
  }
};

const clearSessionToken = (): void => {
  try { sessionStorage.removeItem(SESSION_STORAGE_KEY); } catch { /* noop */ }
};

const getRequiredSessionToken = (): string => {
  const token = readSessionToken();
  if (!token) throw new ApiError(friendlyMessages.SESSION_EXPIRED, 'SESSION_EXPIRED');
  return token;
};

const validDateTime = (value: unknown): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value));

const mapProfile = (value: unknown): AppProfile | null => {
  if (!isRecord(value)) return null;
  const id = typeof value.user_id === 'string' ? value.user_id : value.id;
  const role = value.role;
  const phone = cleanSingleLineText(value.phone, 20);
  if (!isUuid(id) || typeof role !== 'string' || !validRoles.has(role as AppProfile['role']) || !isValidJordanPhone(phone)) return null;
  const language = value.language === 'en' ? 'en' : 'ar';
  return {
    id,
    fullName: cleanSingleLineText(value.full_name, 100),
    phone: normalizeJordanPhone(phone),
    email: cleanSingleLineText(value.email, 160) || null,
    role: role as AppProfile['role'],
    isActive: value.is_active === true,
    language,
    createdAt: validDateTime(value.created_at) ? value.created_at : null,
  };
};

const mapBooking = (value: unknown): TravelerBooking | null => {
  if (!isRecord(value) || !isUuid(value.id) || !isUuid(value.office_id) || !isServiceKind(value.service_type)) return null;
  if (typeof value.status !== 'string' || !validBookingStatuses.has(value.status as TravelerBooking['status'])) return null;
  if (typeof value.payment_status !== 'string' || !validPaymentStatuses.has(value.payment_status as TravelerBooking['paymentStatus'])) return null;
  const totalPrice = Number(value.total_price);
  if (!Number.isFinite(totalPrice) || totalPrice < 0 || !validDateTime(value.created_at)) return null;
  return {
    id: value.id,
    referenceCode: cleanSingleLineText(value.reference_code, 40),
    serviceId: isUuid(value.service_id) ? value.service_id : null,
    officeId: value.office_id,
    serviceType: value.service_type,
    serviceName: cleanSingleLineText(value.service_name, 160),
    officeName: cleanSingleLineText(value.office_name, 120),
    bookingDetails: isRecord(value.booking_details) ? value.booking_details : {},
    totalPrice,
    paymentMethod: cleanSingleLineText(value.payment_method, 40),
    paymentStatus: value.payment_status as TravelerBooking['paymentStatus'],
    status: value.status as TravelerBooking['status'],
    qrCode: cleanSingleLineText(value.qr_code, 500) || null,
    invoiceUrl: cleanSingleLineText(value.invoice_url, 500) || null,
    documents: Array.isArray(value.documents) ? value.documents.filter(isRecord).slice(0, 30) : [],
    createdAt: value.created_at,
    updatedAt: validDateTime(value.updated_at) ? value.updated_at : value.created_at,
  };
};

const mapNotification = (value: unknown): TravelerNotification | null => {
  if (!isRecord(value) || !isUuid(value.id) || !validDateTime(value.created_at)) return null;
  const titleAr = cleanSingleLineText(value.title_ar, 160);
  if (!titleAr) return null;
  return {
    id: value.id,
    bookingId: isUuid(value.booking_id) ? value.booking_id : null,
    type: cleanSingleLineText(value.type, 80),
    titleAr,
    descriptionAr: cleanMultilineText(value.description_ar, 1200),
    isRead: value.is_read === true,
    requiresAction: value.requires_action === true,
    createdAt: value.created_at,
  };
};

const mapFavorite = (value: unknown): FavoriteService | null => {
  if (!isRecord(value) || !isUuid(value.service_id) || !validDateTime(value.created_at)) return null;
  return { serviceId: value.service_id, createdAt: value.created_at };
};

const mapStats = (value: unknown): TravelerStats => {
  const row = isRecord(value) ? value : {};
  const safe = (key: string) => Math.max(0, Number.isFinite(Number(row[key])) ? Number(row[key]) : 0);
  return {
    totalBookings: safe('total_bookings'),
    confirmedBookings: safe('confirmed_bookings'),
    completedBookings: safe('completed_bookings'),
    cancelledBookings: safe('cancelled_bookings'),
    totalSpent: safe('total_spent'),
  };
};

const mapPreferences = (value: unknown): NotificationPreferences => {
  const row = isRecord(value) ? value : {};
  return {
    bookingUpdates: row.booking_updates !== false,
    promotions: row.promotions === true,
    serviceAlerts: row.service_alerts !== false,
  };
};

const validDocumentMime = new Set<BookingDocument['mimeType']>(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

const mapBookingDocument = (value: unknown): BookingDocument | null => {
  if (!isRecord(value) || !isUuid(value.id) || !isUuid(value.booking_id) || !validDateTime(value.created_at)) return null;
  if (typeof value.mime_type !== 'string' || !validDocumentMime.has(value.mime_type as BookingDocument['mimeType'])) return null;
  const status = value.status === 'approved' || value.status === 'rejected' ? value.status : 'pending_review';
  const fileSize = Number(value.file_size);
  if (!Number.isInteger(fileSize) || fileSize < 1 || fileSize > 6 * 1024 * 1024) return null;
  return {
    id: value.id,
    bookingId: value.booking_id,
    originalName: cleanSingleLineText(value.original_name, 180),
    documentType: cleanSingleLineText(value.document_type, 80),
    mimeType: value.mime_type as BookingDocument['mimeType'],
    fileSize,
    status,
    createdAt: value.created_at,
    signedUrl: safeExternalUrl(value.signed_url),
  };
};

const documentRequest = async (path: string, init: RequestInit, timeoutMs = 45000): Promise<unknown> => {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${supabaseFunctionsUrl}/booking-documents${path}`, {
      ...init,
      signal: controller.signal,
      headers: { ...(init.headers || {}), 'x-safretak-session': getRequiredSessionToken() },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const code = isRecord(payload) && typeof payload.error === 'string' ? payload.error : 'DOCUMENT_SERVICE_ERROR';
      throw new ApiError(friendlyMessages[code] || 'تعذر تنفيذ عملية المستند.', code);
    }
    return payload;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') throw new ApiError(friendlyMessages.REQUEST_TIMEOUT, 'REQUEST_TIMEOUT');
    throw new ApiError(friendlyMessages.CONNECTION_FAILED, 'CONNECTION_FAILED');
  } finally { window.clearTimeout(timer); }
};

const parseProfileResponse = (data: unknown): AppProfile => {
  const profile = mapProfile(Array.isArray(data) ? data[0] : data);
  if (!profile || profile.role !== 'traveler' || !profile.isActive) throw new ApiError(friendlyMessages.ACCOUNT_DISABLED, 'ACCOUNT_DISABLED');
  return profile;
};

export const apiClient = {
  async requestPhoneOtp(phoneInput: string, intent: AuthIntent): Promise<OtpChallenge> {
    const phone = normalizeJordanPhone(phoneInput);
    if (!isValidJordanPhone(phone)) throw new ApiError(friendlyMessages.INVALID_PHONE, 'INVALID_PHONE');
    const { data, error } = await supabaseRest.rpc('request_phone_otp_flow', { p_phone: phone, p_purpose: intent });
    if (error) throwDatabaseError(error.message, 'تعذر تجهيز رمز التحقق.');
    const row = Array.isArray(data) ? data[0] : null;
    if (!isRecord(row) || !isUuid(row.challenge_id) || !validDateTime(row.expires_at) || row.purpose !== intent) {
      throw new ApiError('وصل رد غير صالح من خدمة التحقق.', 'INVALID_SERVER_RESPONSE');
    }
    return { challengeId: row.challenge_id, phone: normalizeJordanPhone(String(row.normalized_phone)), expiresAt: row.expires_at, intent };
  },

  async verifyPhoneOtp(challenge: OtpChallenge, otpCode: string, fullName = ''): Promise<{ profile: AppProfile }> {
    const code = otpCode.normalize('NFKC').replace(/\D/g, '');
    const cleanName = cleanSingleLineText(fullName, 100);
    if (!isUuid(challenge.challengeId)) throw new ApiError(friendlyMessages.CHALLENGE_NOT_FOUND, 'CHALLENGE_NOT_FOUND');
    if (!/^\d{6}$/.test(code)) throw new ApiError('أدخل رمز التحقق المكوّن من 6 أرقام.', 'INVALID_OTP');
    if (challenge.intent === 'signup' && !isValidFullName(cleanName)) throw new ApiError(friendlyMessages.INVALID_NAME, 'INVALID_NAME');

    const { data, error } = await supabaseRest.rpc('verify_phone_otp_flow', {
      p_challenge_id: challenge.challengeId,
      p_phone: challenge.phone,
      p_code: code,
      p_purpose: challenge.intent,
      p_full_name: challenge.intent === 'signup' ? cleanName : null,
    });
    if (error) throwDatabaseError(error.message, 'تعذر التحقق من الرمز.');
    const row = Array.isArray(data) ? data[0] : null;
    if (!isRecord(row) || row.success !== true || typeof row.session_token !== 'string') {
      const codeValue = isRecord(row) && typeof row.failure_code === 'string' ? row.failure_code : 'INVALID_OTP';
      throw new ApiError(friendlyMessages[codeValue] || 'تعذر التحقق من الرمز.', codeValue);
    }
    writeSessionToken(row.session_token);
    return { profile: parseProfileResponse(row) };
  },

  async getCurrentProfile(): Promise<AppProfile | null> {
    const token = readSessionToken();
    if (!token) return null;
    const { data, error } = await supabaseRest.rpc('get_phone_session', { p_session_token: token });
    if (error) {
      clearSessionToken();
      return null;
    }
    try { return parseProfileResponse(data); } catch { clearSessionToken(); return null; }
  },

  async loadPortalSnapshot(): Promise<PortalSnapshot> {
    const token = getRequiredSessionToken();
    const [profileResult, portalResult, favoritesResult, preferencesResult] = await Promise.all([
      supabaseRest.rpc('get_phone_session', { p_session_token: token }),
      supabaseRest.rpc('get_phone_portal_snapshot', { p_session_token: token }),
      supabaseRest.rpc('list_traveler_favorites', { p_token: token }),
      supabaseRest.rpc('read_traveler_notification_preferences', { p_token: token }),
    ]);
    const firstError = profileResult.error || portalResult.error || favoritesResult.error || preferencesResult.error;
    if (firstError) throwDatabaseError(firstError.message, 'تعذر تحميل حسابك.');
    const profile = parseProfileResponse(profileResult.data);
    if (!isRecord(portalResult.data)) throw new ApiError('وصلت بيانات حساب غير صالحة.', 'INVALID_SERVER_RESPONSE');
    const bookings = Array.isArray(portalResult.data.bookings)
      ? portalResult.data.bookings.map(mapBooking).filter((item): item is TravelerBooking => Boolean(item)).slice(0, 100)
      : [];
    const notifications = Array.isArray(portalResult.data.notifications)
      ? portalResult.data.notifications.map(mapNotification).filter((item): item is TravelerNotification => Boolean(item)).slice(0, 100)
      : [];
    const preferencesRow = Array.isArray(preferencesResult.data) ? preferencesResult.data[0] : preferencesResult.data;
    const stats = bookings.reduce<TravelerStats>((total, booking) => ({
      totalBookings: total.totalBookings + 1,
      confirmedBookings: total.confirmedBookings + (booking.status === 'Confirmed' ? 1 : 0),
      completedBookings: total.completedBookings + (booking.status === 'Completed' ? 1 : 0),
      cancelledBookings: total.cancelledBookings + (booking.status === 'Cancelled' ? 1 : 0),
      totalSpent: total.totalSpent + (booking.paymentStatus === 'paid' ? booking.totalPrice : 0),
    }), { totalBookings: 0, confirmedBookings: 0, completedBookings: 0, cancelledBookings: 0, totalSpent: 0 });
    return {
      profile,
      bookings,
      notifications,
      favorites: Array.isArray(favoritesResult.data) ? favoritesResult.data.map(mapFavorite).filter((item): item is FavoriteService => Boolean(item)) : [],
      notificationPreferences: mapPreferences(preferencesRow),
      stats,
    };
  },

  async updateProfile(fullName: string, email: string | null, language: 'ar' | 'en'): Promise<AppProfile> {
    const cleanName = cleanSingleLineText(fullName, 100);
    const cleanEmail = cleanSingleLineText(email || '', 160);
    if (!isValidFullName(cleanName)) throw new ApiError(friendlyMessages.INVALID_NAME, 'INVALID_NAME');
    if (!isValidEmail(cleanEmail)) throw new ApiError(friendlyMessages.INVALID_EMAIL, 'INVALID_EMAIL');
    const { data, error } = await supabaseRest.rpc('update_traveler_profile', {
      p_token: getRequiredSessionToken(),
      p_name: cleanName,
      p_email: cleanEmail || null,
      p_language: language,
    });
    if (error) throwDatabaseError(error.message, 'تعذر حفظ بيانات الحساب.');
    return parseProfileResponse(data);
  },

  async createBooking(input: BookingDraft): Promise<TravelerBooking> {
    if (!isUuid(input.serviceId) || !isRecord(input.details)) throw new ApiError(friendlyMessages.INVALID_BOOKING_DETAILS, 'INVALID_BOOKING_DETAILS');
    if (!isPaymentMethod(input.paymentMethod)) throw new ApiError(friendlyMessages.INVALID_PAYMENT_METHOD, 'INVALID_PAYMENT_METHOD');
    const paymentReference = cleanSingleLineText(input.paymentReference, 40);
    if (input.paymentMethod !== 'Cash at Office' && !isPaymentReference(paymentReference)) throw new ApiError(friendlyMessages.INVALID_PAYMENT_REFERENCE, 'INVALID_PAYMENT_REFERENCE');
    const couponCode = cleanSingleLineText(input.couponCode, 30).toUpperCase();
    if (couponCode && !isCouponCode(couponCode)) throw new ApiError('رمز الخصم غير صالح.', 'INVALID_COUPON');
    const { data, error } = await supabaseRest.rpc('create_phone_booking_v2', {
      p_session_token: getRequiredSessionToken(),
      p_service_id: input.serviceId,
      p_booking_details: input.details,
      p_payment_method: input.paymentMethod,
      p_payment_reference: paymentReference || null,
      p_coupon_code: couponCode || null,
    });
    if (error) throwDatabaseError(error.message, 'تعذر إنشاء الحجز.');
    const booking = mapBooking(Array.isArray(data) ? data[0] : data);
    if (!booking) throw new ApiError('وصل رد حجز غير صالح.', 'INVALID_SERVER_RESPONSE');
    return booking;
  },

  async requestBookingCancellation(booking: TravelerBooking): Promise<void> {
    if (!isUuid(booking.id) || !['Pending', 'Confirmed'].includes(booking.status)) throw new ApiError(friendlyMessages.BOOKING_NOT_CANCELLABLE, 'BOOKING_NOT_CANCELLABLE');
    const { error } = await supabaseRest.rpc('request_phone_booking_cancellation', { p_session_token: getRequiredSessionToken(), p_booking_id: booking.id });
    if (error) throwDatabaseError(error.message, 'تعذر إرسال طلب الإلغاء.');
  },

  async markNotificationsRead(notificationId?: string): Promise<void> {
    const { error } = await supabaseRest.rpc('mark_phone_notifications_read_v2', {
      p_session_token: getRequiredSessionToken(),
      p_notification_id: notificationId && isUuid(notificationId) ? notificationId : null,
    });
    if (error) throwDatabaseError(error.message, 'تعذر تحديث الإشعارات.');
  },

  async toggleFavorite(serviceId: string, favorite: boolean): Promise<void> {
    if (!isUuid(serviceId)) throw new ApiError(friendlyMessages.SERVICE_NOT_FOUND, 'SERVICE_NOT_FOUND');
    const { error } = await supabaseRest.rpc('set_phone_favorite', { p_session_token: getRequiredSessionToken(), p_service_id: serviceId, p_favorite: favorite });
    if (error) throwDatabaseError(error.message, 'تعذر تحديث المفضلة.');
  },

  async updateNotificationPreferences(preferences: NotificationPreferences): Promise<NotificationPreferences> {
    const { data, error } = await supabaseRest.rpc('set_phone_notification_preferences', {
      p_session_token: getRequiredSessionToken(),
      p_booking_updates: preferences.bookingUpdates,
      p_promotions: preferences.promotions,
      p_service_alerts: preferences.serviceAlerts,
    });
    if (error) throwDatabaseError(error.message, 'تعذر حفظ إعدادات الإشعارات.');
    return mapPreferences(Array.isArray(data) ? data[0] : data);
  },

  async submitSupport(subject: string, message: string, bookingId?: string): Promise<void> {
    const cleanSubject = cleanSingleLineText(subject, 120);
    const cleanMessage = cleanMultilineText(message, 1500);
    if (cleanSubject.length < 3 || cleanMessage.length < 10) throw new ApiError(friendlyMessages.INVALID_SUPPORT_MESSAGE, 'INVALID_SUPPORT_MESSAGE');
    const { error } = await supabaseRest.rpc('submit_phone_support_v2', {
      p_session_token: getRequiredSessionToken(),
      p_subject: cleanSubject,
      p_message: cleanMessage,
      p_booking_id: bookingId && isUuid(bookingId) ? bookingId : null,
    });
    if (error) throwDatabaseError(error.message, 'تعذر إرسال طلب الدعم.');
  },

  async getServiceReviews(serviceId: string): Promise<ServiceReview[]> {
    if (!isUuid(serviceId)) return [];
    const { data, error } = await supabaseRest.rpc('get_phone_service_reviews', { p_session_token: readSessionToken(), p_service_id: serviceId });
    if (error) throwDatabaseError(error.message, 'تعذر تحميل التقييمات.');
    if (!Array.isArray(data)) return [];
    return data.map((value): ServiceReview | null => {
      if (!isRecord(value) || !isUuid(value.id) || !isUuid(value.service_id) || !validDateTime(value.created_at)) return null;
      const rating = Number(value.rating);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) return null;
      return { id: value.id, serviceId: value.service_id, travelerName: cleanSingleLineText(value.traveler_name, 100), rating, comment: cleanMultilineText(value.comment, 1000), createdAt: value.created_at, isMine: value.is_mine === true };
    }).filter((item): item is ServiceReview => Boolean(item));
  },

  async submitReview(serviceId: string, rating: number, comment: string): Promise<ServiceReview> {
    const cleanComment = cleanMultilineText(comment, 1000);
    if (!isUuid(serviceId) || !Number.isInteger(rating) || rating < 1 || rating > 5 || cleanComment.length < 3) throw new ApiError(friendlyMessages.INVALID_REVIEW, 'INVALID_REVIEW');
    const { data, error } = await supabaseRest.rpc('submit_phone_service_review', { p_session_token: getRequiredSessionToken(), p_service_id: serviceId, p_rating: rating, p_comment: cleanComment });
    if (error) throwDatabaseError(error.message, 'تعذر حفظ التقييم.');
    const reviews = await this.getServiceReviews(serviceId);
    const mine = reviews.find((item) => item.isMine);
    if (!mine) throw new ApiError('تعذر قراءة التقييم بعد حفظه.', 'INVALID_SERVER_RESPONSE');
    return mine;
  },

  async getBookingMessages(bookingId: string): Promise<BookingMessage[]> {
    if (!isUuid(bookingId)) return [];
    const { data, error } = await supabaseRest.rpc('get_phone_booking_messages', { p_session_token: getRequiredSessionToken(), p_booking_id: bookingId });
    if (error) throwDatabaseError(error.message, 'تعذر تحميل المحادثة.');
    if (!Array.isArray(data)) return [];
    return data.map((value): BookingMessage | null => {
      if (!isRecord(value) || !isUuid(value.id) || !isUuid(value.booking_id) || !validDateTime(value.created_at)) return null;
      const sender = value.sender === 'office' || value.sender === 'system' ? value.sender : 'traveler';
      const body = cleanMultilineText(value.body, 1500);
      if (!body) return null;
      return { id: value.id, bookingId: value.booking_id, sender, body, createdAt: value.created_at };
    }).filter((item): item is BookingMessage => Boolean(item));
  },

  async sendBookingMessage(bookingId: string, body: string): Promise<void> {
    const cleanBody = cleanMultilineText(body, 1500);
    if (!isUuid(bookingId) || cleanBody.length < 1) throw new ApiError(friendlyMessages.INVALID_MESSAGE, 'INVALID_MESSAGE');
    const { error } = await supabaseRest.rpc('send_phone_booking_message', { p_session_token: getRequiredSessionToken(), p_booking_id: bookingId, p_body: cleanBody });
    if (error) throwDatabaseError(error.message, 'تعذر إرسال الرسالة.');
  },

  async listBookingDocuments(bookingId: string): Promise<BookingDocument[]> {
    if (!isUuid(bookingId)) throw new ApiError(friendlyMessages.BOOKING_NOT_FOUND, 'BOOKING_NOT_FOUND');
    const payload = await documentRequest(`?booking_id=${encodeURIComponent(bookingId)}`, { method: 'GET' });
    if (!isRecord(payload) || !Array.isArray(payload.documents)) return [];
    return payload.documents.map(mapBookingDocument).filter((item): item is BookingDocument => Boolean(item));
  },

  async uploadBookingDocument(bookingId: string, documentType: string, file: File): Promise<BookingDocument> {
    const cleanType = cleanSingleLineText(documentType, 80);
    if (!isUuid(bookingId) || cleanType.length < 2 || !validDocumentMime.has(file.type as BookingDocument['mimeType']) || file.size < 1 || file.size > 6 * 1024 * 1024) {
      throw new ApiError(friendlyMessages.INVALID_DOCUMENT, 'INVALID_DOCUMENT');
    }
    const form = new FormData();
    form.set('booking_id', bookingId);
    form.set('document_type', cleanType);
    form.set('file', file, cleanSingleLineText(file.name, 180) || 'document');
    const payload = await documentRequest('', { method: 'POST', body: form });
    const document = isRecord(payload) ? mapBookingDocument(payload.document) : null;
    if (!document) throw new ApiError('وصل رد مستند غير صالح.', 'INVALID_SERVER_RESPONSE');
    return document;
  },

  async deleteBookingDocument(documentId: string): Promise<void> {
    if (!isUuid(documentId)) throw new ApiError(friendlyMessages.DOCUMENT_NOT_FOUND, 'DOCUMENT_NOT_FOUND');
    await documentRequest('', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ document_id: documentId }) });
  },

  async requestAccountClosure(): Promise<void> {
    const { error } = await supabaseRest.rpc('request_phone_account_closure', { p_token: getRequiredSessionToken() });
    if (error) throwDatabaseError(error.message, 'تعذر إرسال طلب إغلاق الحساب.');
  },

  async logout(): Promise<void> {
    const token = readSessionToken();
    clearSessionToken();
    if (!token) return;
    const { error } = await supabaseRest.rpc('revoke_phone_session', { p_session_token: token });
    if (error) throw new ApiError('تم تسجيل الخروج من الجهاز، لكن تعذر إغلاق الجلسة بالكامل.', errorCodeFromMessage(error.message));
  },
};
