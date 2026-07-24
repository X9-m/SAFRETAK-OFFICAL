import { supabaseRest } from '../supabaseClient';
import type { PaymentMethod } from '../types';
import { readRoleToken } from './rolePortalClient';

export type BusinessRow = Record<string, unknown>;
export type BusinessSnapshot = Record<string, unknown> & {
  customers?: BusinessRow[];
  transactions?: BusinessRow[];
  stats?: BusinessRow;
  offices?: BusinessRow[];
  settlements?: BusinessRow[];
  settings?: BusinessRow;
};

const isRecord = (value: unknown): value is BusinessRow => typeof value === 'object' && value !== null && !Array.isArray(value);
const validPaymentMethods = new Set<PaymentMethod>(['CliQ', 'eFAWATEERcom', 'Cash at Office']);

const friendlyError = (message?: string): string => {
  const value = message || '';
  const errors: Array<[string, string]> = [
    ['FORBIDDEN', 'انتهت الجلسة أو لا تملك صلاحية تنفيذ العملية.'],
    ['OFFICE_NOT_FOUND', 'تعذر العثور على المكتب المرتبط بالحساب.'],
    ['INVALID_TRANSACTION', 'راجع نوع الحركة والمبلغ والتاريخ والوصف.'],
    ['TRANSACTION_NOT_FOUND', 'الحركة المالية غير موجودة أو لا تخص هذا المكتب.'],
    ['INVALID_SETTLEMENT', 'راجع المكتب والمبلغ وتاريخ التسوية.'],
    ['SETTLEMENT_EXCEEDS_DUE', 'مبلغ التسوية يتجاوز الرصيد المستحق على المكتب.'],
    ['SETTLEMENT_NOT_FOUND', 'سجل التسوية غير موجود.'],
    ['INVALID_FINANCE_SETTINGS', 'راجع العمولة وطرق الدفع، ويجب إبقاء طريقة دفع واحدة على الأقل.'],
    ['CONNECTION_FAILED', 'تعذر الاتصال بالخادم. تحقق من الإنترنت.'],
    ['REQUEST_TIMEOUT', 'استغرق الاتصال وقتًا أطول من المتوقع.'],
  ];
  return errors.find(([code]) => value.includes(code))?.[1] || 'تعذر تنفيذ العملية. راجع البيانات وحاول مرة أخرى.';
};

const requireToken = (): string => {
  const token = readRoleToken();
  if (!token) throw new Error('انتهت الجلسة. سجّل الدخول مرة أخرى.');
  return token;
};

const rpc = async <T = unknown>(name: string, parameters: Record<string, unknown>): Promise<T> => {
  const { data, error } = await supabaseRest.rpc<T>(name, parameters);
  if (error) throw new Error(friendlyError(error.message));
  return data as T;
};

const readSnapshot = (value: unknown): BusinessSnapshot => {
  if (!isRecord(value)) throw new Error('وصلت بيانات غير صالحة من الخادم.');
  return value as BusinessSnapshot;
};

export const businessPortalClient = {
  office: {
    async load(): Promise<BusinessSnapshot> {
      return readSnapshot(await rpc('get_office_business_snapshot', { p_session_token: requireToken() }));
    },
    saveTransaction(transactionId: string | null, payload: BusinessRow) {
      return rpc<string>('office_save_transaction', { p_session_token: requireToken(), p_transaction_id: transactionId, p_payload: payload });
    },
    deleteTransaction(transactionId: string) {
      return rpc('office_delete_transaction', { p_session_token: requireToken(), p_transaction_id: transactionId });
    },
  },
  admin: {
    async load(): Promise<BusinessSnapshot> {
      return readSnapshot(await rpc('get_admin_billing_snapshot', { p_session_token: requireToken() }));
    },
    saveSettlement(settlementId: string | null, payload: BusinessRow) {
      return rpc<string>('admin_save_settlement', { p_session_token: requireToken(), p_settlement_id: settlementId, p_payload: payload });
    },
    deleteSettlement(settlementId: string) {
      return rpc('admin_delete_settlement', { p_session_token: requireToken(), p_settlement_id: settlementId });
    },
    updateFinanceSettings(commissionPercentage: number, commissionFlat: number, cliq: boolean, efawateercom: boolean, cash: boolean) {
      return rpc('admin_update_finance_settings', {
        p_session_token: requireToken(),
        p_commission_percentage: commissionPercentage,
        p_commission_flat: commissionFlat,
        p_cliq: cliq,
        p_efawateercom: efawateercom,
        p_cash: cash,
      });
    },
  },
};

export const publicPaymentSettingsClient = {
  async load(): Promise<PaymentMethod[]> {
    const { data, error } = await supabaseRest.rpc<unknown>('get_public_payment_methods', {});
    if (error || !Array.isArray(data)) return ['CliQ', 'eFAWATEERcom', 'Cash at Office'];
    const methods = data.filter((value): value is PaymentMethod => typeof value === 'string' && validPaymentMethods.has(value as PaymentMethod));
    return methods.length ? methods : ['Cash at Office'];
  },
};
