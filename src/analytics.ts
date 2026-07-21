import type { ServiceKind, TravelerBooking } from './types.ts';

export interface SpendingBreakdownItem {
  kind: ServiceKind;
  label: string;
  amount: number;
  bookingCount: number;
  percentage: number;
}

const spendingLabels: Record<ServiceKind, string> = {
  trip: 'رحلات',
  intl_trip: 'دولية',
  hotel: 'فنادق',
  car: 'سيارات',
  flight: 'طيران',
  bus_train: 'نقل',
  hajj_umrah: 'حج وعمرة',
  insurance: 'تأمين',
  visa: 'تأشيرات',
  consultation: 'استشارة',
};

export const buildSpendingBreakdown = (bookings: TravelerBooking[]): SpendingBreakdownItem[] => {
  const totals = new Map<ServiceKind, { amount: number; bookingCount: number }>();
  for (const booking of bookings) {
    if (booking.paymentStatus !== 'paid' || booking.status === 'Cancelled') continue;
    if (!Number.isFinite(booking.totalPrice) || booking.totalPrice <= 0) continue;
    const current = totals.get(booking.serviceType) || { amount: 0, bookingCount: 0 };
    totals.set(booking.serviceType, {
      amount: current.amount + booking.totalPrice,
      bookingCount: current.bookingCount + 1,
    });
  }
  const totalAmount = Array.from(totals.values()).reduce((sum, item) => sum + item.amount, 0);
  if (totalAmount <= 0) return [];
  return Array.from(totals.entries())
    .map(([kind, value]) => ({
      kind,
      label: spendingLabels[kind],
      amount: value.amount,
      bookingCount: value.bookingCount,
      percentage: Math.min(100, Math.max(0, (value.amount / totalAmount) * 100)),
    }))
    .sort((a, b) => b.amount - a.amount || a.label.localeCompare(b.label, 'ar'));
};
