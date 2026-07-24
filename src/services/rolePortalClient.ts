import { supabaseRest } from '../supabaseClient';
import { cleanSingleLineText, isSessionToken, isValidJordanPhone, normalizeJordanPhone } from '../validation';
import type { AppProfile, AppRole, AuthIntent } from '../types';

type PortalRole = 'office' | 'admin';

const SESSION_KEYS: Record<PortalRole, string> = {
  office: 'safretak_office_session',
  admin: 'safretak_admin_session',
};

const roleFromPath = (): PortalRole => window.location.pathname.startsWith('/admin') ? 'admin' : 'office';

export interface RoleOtpChallenge {
  challengeId: string;
  phone: string;
  expiresAt: string;
}

export type RolePortalSnapshot = Record<string, unknown> & {
  profile?: Record<string, unknown>;
  office?: Record<string, unknown>;
  stats?: Record<string, unknown>;
  services?: Array<Record<string, unknown>>;
  bookings?: Array<Record<string, unknown>>;
  payments?: Array<Record<string, unknown>>;
  employees?: Array<Record<string, unknown>>;
  complaints?: Array<Record<string, unknown>>;
  support_requests?: Array<Record<string, unknown>>;
  messages?: Array<Record<string, unknown>>;
  offices?: Array<Record<string, unknown>>;
  users?: Array<Record<string, unknown>>;
  ads?: Array<Record<string, unknown>>;
  categories?: Array<Record<string, unknown>>;
  settings?: Record<string, unknown> | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const isUuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const validRoles = new Set<AppRole>(['traveler', 'office', 'admin']);

const friendlyError = (message?: string): string => {
  const text = message || '';
  const entries: Array<[string, string]> = [
    ['FORBIDDEN', 'انتهت الجلسة أو لا تملك صلاحية الدخول لهذه البوابة.'],
    ['ACCOUNT_NOT_FOUND', 'لا يوجد حساب مرتبط بهذا الرقم.'],
    ['ACCOUNT_DISABLED', 'الحساب موقوف. تواصل مع إدارة المنصة.'],
    ['INVALID_OTP', 'رمز التحقق غير صحيح.'],
    ['OTP_EXPIRED', 'انتهت صلاحية رمز التحقق.'],
    ['TOO_MANY_ATTEMPTS', 'تم تجاوز عدد محاولات التحقق.'],
    ['RATE_LIMITED', 'تم طلب رموز كثيرة. حاول بعد قليل.'],
    ['OFFICE_NOT_FOUND', 'تعذر العثور على المكتب المرتبط بالحساب.'],
    ['SERVICE_NOT_FOUND', 'الخدمة غير موجودة أو لا تخص هذا المكتب.'],
    ['BOOKING_NOT_FOUND', 'الحجز غير موجود أو لا يخص هذا المكتب.'],
    ['PHONE_EXISTS', 'رقم الهاتف مستخدم بحساب آخر.'],
    ['CONNECTION_FAILED', 'تعذر الاتصال بالخادم. تحقق من الإنترنت.'],
    ['REQUEST_TIMEOUT', 'استغرق الاتصال وقتًا أطول من المتوقع.'],
  ];
  return entries.find(([code]) => text.includes(code))?.[1] || 'تعذر تنفيذ العملية. راجع البيانات وحاول مرة أخرى.';
};

const throwRpc = (message?: string): never => { throw new Error(friendlyError(message)); };

export const readRoleToken = (role: PortalRole = roleFromPath()): string | null => {
  try {
    const token = sessionStorage.getItem(SESSION_KEYS[role]);
    if (!token || !isSessionToken(token)) return null;
    return token;
  } catch { return null; }
};

const requireToken = (role: PortalRole = roleFromPath()): string => {
  const token = readRoleToken(role);
  if (!token) throw new Error('انتهت الجلسة. سجّل الدخول مرة أخرى.');
  return token;
};

const saveToken = (token: string, role: PortalRole): void => {
  if (!isSessionToken(token)) throw new Error('وصل رمز جلسة غير صالح.');
  sessionStorage.setItem(SESSION_KEYS[role], token);
};

const clearToken = (role: PortalRole = roleFromPath()): void => {
  try { sessionStorage.removeItem(SESSION_KEYS[role]); } catch { /* noop */ }
};

const mapProfile = (value: unknown): AppProfile | null => {
  const row = Array.isArray(value) ? value[0] : value;
  if (!isRecord(row)) return null;
  const id = typeof row.user_id === 'string' ? row.user_id : row.id;
  const role = row.role;
  const phone = cleanSingleLineText(row.phone, 20);
  if (!isUuid(id) || typeof role !== 'string' || !validRoles.has(role as AppRole) || !isValidJordanPhone(phone)) return null;
  return {
    id,
    fullName: cleanSingleLineText(row.full_name, 100),
    phone: normalizeJordanPhone(phone),
    email: cleanSingleLineText(row.email, 160) || null,
    role: role as AppRole,
    isActive: row.is_active === true,
    language: row.language === 'en' ? 'en' : 'ar',
    createdAt: typeof row.created_at === 'string' ? row.created_at : null,
  };
};

const rpc = async <T = unknown>(name: string, parameters: Record<string, unknown>): Promise<T> => {
  const { data, error } = await supabaseRest.rpc<T>(name, parameters);
  if (error) throwRpc(error.message);
  return data as T;
};

export const rolePortalClient = {
  async requestOtp(phoneInput: string): Promise<RoleOtpChallenge> {
    const phone = normalizeJordanPhone(phoneInput);
    if (!isValidJordanPhone(phone)) throw new Error('أدخل رقم هاتف أردني صحيح.');
    const data = await rpc<unknown>('request_phone_otp_flow', { p_phone: phone, p_purpose: 'login' satisfies AuthIntent });
    const row = Array.isArray(data) ? data[0] : null;
    if (!isRecord(row) || !isUuid(row.challenge_id) || typeof row.expires_at !== 'string') throw new Error('وصل رد تحقق غير صالح.');
    return { challengeId: row.challenge_id, phone: normalizeJordanPhone(String(row.normalized_phone)), expiresAt: row.expires_at };
  },

  async verifyOtp(challenge: RoleOtpChallenge, codeInput: string, expectedRole: PortalRole): Promise<AppProfile> {
    const code = codeInput.normalize('NFKC').replace(/\D/g, '');
    if (!/^\d{6}$/.test(code)) throw new Error('أدخل رمز التحقق المكوّن من 6 أرقام.');
    const data = await rpc<unknown>('verify_phone_otp_flow', {
      p_challenge_id: challenge.challengeId,
      p_phone: challenge.phone,
      p_code: code,
      p_purpose: 'login',
      p_full_name: null,
    });
    const row = Array.isArray(data) ? data[0] : null;
    if (!isRecord(row) || row.success !== true || typeof row.session_token !== 'string') throwRpc(isRecord(row) && typeof row.failure_code === 'string' ? row.failure_code : undefined);
    const profile = mapProfile(row);
    if (!profile || !profile.isActive || profile.role !== expectedRole) {
      await rpc('revoke_phone_session', { p_session_token: row.session_token }).catch(() => undefined);
      throw new Error(expectedRole === 'office' ? 'هذا الرقم ليس حساب مكتب سياحي.' : 'هذا الرقم ليس حساب إدارة.');
    }
    saveToken(row.session_token, expectedRole);
    return profile;
  },

  async getCurrentProfile(expectedRole: PortalRole): Promise<AppProfile | null> {
    const token = readRoleToken(expectedRole);
    if (!token) return null;
    const { data, error } = await supabaseRest.rpc<unknown>('get_phone_session', { p_session_token: token });
    if (error) { clearToken(expectedRole); return null; }
    const profile = mapProfile(data);
    if (!profile || profile.role !== expectedRole || !profile.isActive) { clearToken(expectedRole); return null; }
    return profile;
  },

  async loadSnapshot(): Promise<RolePortalSnapshot> {
    const data = await rpc<unknown>('get_role_portal_snapshot', { p_session_token: requireToken() });
    if (!isRecord(data)) throw new Error('وصلت بيانات بوابة غير صالحة.');
    return data as RolePortalSnapshot;
  },

  office: {
    saveService(serviceId: string | null, payload: Record<string, unknown>) {
      return rpc<string>('office_save_service', { p_session_token: requireToken('office'), p_service_id: serviceId, p_payload: payload });
    },
    updateBooking(bookingId: string, status: string, paymentStatus: string | null) {
      return rpc('office_update_booking', { p_session_token: requireToken('office'), p_booking_id: bookingId, p_status: status, p_payment_status: paymentStatus });
    },
    sendMessage(bookingId: string, body: string) {
      return rpc<string>('office_send_booking_message', { p_session_token: requireToken('office'), p_booking_id: bookingId, p_body: body });
    },
    saveEmployee(employeeId: string | null, fullName: string, jobTitle: string, permissionLevel: string, isActive: boolean) {
      return rpc<string>('office_save_employee', { p_session_token: requireToken('office'), p_employee_id: employeeId, p_full_name: fullName, p_job_title: jobTitle, p_permission_level: permissionLevel, p_is_active: isActive });
    },
    updateProfile(payload: Record<string, unknown>) {
      return rpc('office_update_profile', { p_session_token: requireToken('office'), p_payload: payload });
    },
  },

  admin: {
    updateOffice(officeId: string, approved: boolean, active: boolean, plan: string) {
      return rpc('admin_update_office', { p_session_token: requireToken('admin'), p_office_id: officeId, p_is_approved: approved, p_is_active: active, p_plan: plan });
    },
    updateUser(userId: string, active: boolean) {
      return rpc('admin_update_user', { p_session_token: requireToken('admin'), p_user_id: userId, p_is_active: active });
    },
    updateBooking(bookingId: string, status: string, paymentStatus: string) {
      return rpc('admin_update_booking', { p_session_token: requireToken('admin'), p_booking_id: bookingId, p_status: status, p_payment_status: paymentStatus });
    },
    updateService(serviceId: string, active: boolean, published: boolean) {
      return rpc('admin_update_service', { p_session_token: requireToken('admin'), p_service_id: serviceId, p_is_active: active, p_published: published });
    },
    updateSupport(requestId: string, status: string) {
      return rpc('admin_update_support', { p_session_token: requireToken('admin'), p_request_id: requestId, p_status: status });
    },
    resolveComplaint(complaintId: string, status: string, resolution: string) {
      return rpc('admin_resolve_complaint', { p_session_token: requireToken('admin'), p_complaint_id: complaintId, p_status: status, p_resolution: resolution });
    },
    updateSettings(commission: number, maintenance: boolean, supportPhone: string, supportEmail: string) {
      return rpc('admin_update_settings', { p_session_token: requireToken('admin'), p_commission: commission, p_maintenance: maintenance, p_support_phone: supportPhone, p_support_email: supportEmail });
    },
    saveAd(adId: string | null, payload: Record<string, unknown>) {
      return rpc<string>('admin_save_ad', { p_session_token: requireToken('admin'), p_ad_id: adId, p_payload: payload });
    },
    saveCategory(categoryId: string | null, payload: Record<string, unknown>) {
      return rpc<string>('admin_save_category', { p_session_token: requireToken('admin'), p_category_id: categoryId, p_payload: payload });
    },
    createOffice(payload: Record<string, unknown>) {
      return rpc<Record<string, unknown>>('admin_create_office', { p_session_token: requireToken('admin'), p_payload: payload });
    },
  },

  async logout(role: PortalRole = roleFromPath()): Promise<void> {
    const token = readRoleToken(role);
    clearToken(role);
    if (token) await supabaseRest.rpc('revoke_phone_session', { p_session_token: token }).catch(() => undefined);
  },
};
