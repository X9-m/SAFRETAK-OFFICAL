import {
  BedDouble,
  BusFront,
  CarFront,
  FileCheck2,
  HeartPulse,
  Landmark,
  Compass,
  MessageCircleQuestion,
  Plane,
  type LucideIcon,
} from 'lucide-react';
import type { ServiceKind } from './types';
import { isIsoDate } from './validation';

export interface ServiceKindMeta {
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  accent: string;
}

export const serviceKinds: Record<ServiceKind, ServiceKindMeta> = {
  trip: { label: 'رحلات داخلية', shortLabel: 'رحلات', icon: Compass, accent: 'رحلات داخل الأردن' },
  intl_trip: { label: 'رحلات خارجية', shortLabel: 'دولية', icon: Plane, accent: 'باقات خارج الأردن' },
  hotel: { label: 'فنادق وإقامات', shortLabel: 'فنادق', icon: BedDouble, accent: 'خيارات إقامة موثوقة' },
  car: { label: 'تأجير سيارات', shortLabel: 'سيارات', icon: CarFront, accent: 'سيارات حسب احتياجك' },
  flight: { label: 'حجوزات طيران', shortLabel: 'طيران', icon: Plane, accent: 'رحلات جوية' },
  bus_train: { label: 'حافلات وقطارات', shortLabel: 'نقل', icon: BusFront, accent: 'تنقل بين المدن' },
  hajj_umrah: { label: 'حج وعمرة', shortLabel: 'حج وعمرة', icon: Landmark, accent: 'برامج دينية مرخصة' },
  insurance: { label: 'تأمين سفر', shortLabel: 'تأمين', icon: HeartPulse, accent: 'تغطية أثناء السفر' },
  visa: { label: 'تأشيرات', shortLabel: 'تأشيرات', icon: FileCheck2, accent: 'متابعة معاملات التأشيرة' },
  consultation: { label: 'استشارة سفر', shortLabel: 'استشارة', icon: MessageCircleQuestion, accent: 'مساعدة في تخطيط الرحلة' },
};

export const isServiceKind = (value: unknown): value is ServiceKind =>
  typeof value === 'string' && Object.prototype.hasOwnProperty.call(serviceKinds, value);

export const formatMoney = (value: number): string => {
  const safeValue = Number.isFinite(value) && value >= 0 ? value : 0;
  return new Intl.NumberFormat('ar-JO', {
    style: 'currency',
    currency: 'JOD',
    maximumFractionDigits: 2,
  }).format(safeValue);
};

export const formatDate = (value: string): string => {
  const date = isIsoDate(value) ? new Date(`${value}T12:00:00Z`) : new Date(value);
  if (!Number.isFinite(date.getTime())) return 'تاريخ غير متاح';
  return new Intl.DateTimeFormat('ar-JO', {
    timeZone: 'Asia/Amman',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};
