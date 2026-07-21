import { CalendarCheck2, CheckCircle2, ChevronLeft, Clock3, CreditCard, MessageCircle, Search, ShieldCheck, TicketCheck, WalletCards, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { formatDate, formatMoney, serviceKinds } from '../domain';
import type { TravelerBooking } from '../types';
import { isIsoDate } from '../validation';

interface BookingsPageProps {
  bookings: TravelerBooking[];
  onOpenBooking: (booking: TravelerBooking) => void;
  onBrowseServices: () => void;
}

type BookingFilter = 'all' | 'active' | 'past' | 'cancelled';
const statusLabel: Record<TravelerBooking['status'], string> = { Pending: 'قيد المراجعة', Confirmed: 'مؤكد', Completed: 'مكتمل', Cancelled: 'ملغي' };

const primaryDate = (booking: TravelerBooking): string => {
  for (const field of ['travel_date', 'check_in', 'outbound_date', 'pickup_date']) if (isIsoDate(booking.bookingDetails[field])) return String(booking.bookingDetails[field]);
  return booking.createdAt;
};
const bookingProgress = (booking: TravelerBooking) => booking.status === 'Cancelled' ? 0 : booking.status === 'Pending' ? 34 : booking.status === 'Confirmed' ? 68 : 100;

export function BookingsPage({ bookings, onOpenBooking, onBrowseServices }: BookingsPageProps) {
  const [filter, setFilter] = useState<BookingFilter>('all');
  const [query, setQuery] = useState('');
  const counts = useMemo(() => ({
    all: bookings.length,
    active: bookings.filter((item) => item.status === 'Pending' || item.status === 'Confirmed').length,
    past: bookings.filter((item) => item.status === 'Completed').length,
    cancelled: bookings.filter((item) => item.status === 'Cancelled').length,
  }), [bookings]);
  const totalPaid = useMemo(() => bookings.filter((item) => item.paymentStatus === 'paid' && item.status !== 'Cancelled').reduce((sum, item) => sum + item.totalPrice, 0), [bookings]);
  const visible = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('ar');
    return bookings.filter((booking) => {
      const statusMatches = filter === 'all' || (filter === 'cancelled' ? booking.status === 'Cancelled' : filter === 'past' ? booking.status === 'Completed' : booking.status === 'Pending' || booking.status === 'Confirmed');
      const queryMatches = !term || [booking.referenceCode, booking.serviceName, booking.officeName].some((value) => value.toLocaleLowerCase('ar').includes(term));
      return statusMatches && queryMatches;
    });
  }, [bookings, filter, query]);

  return (
    <div className="page-stack page-enter bookings-dashboard">
      <section className="bookings-hero">
        <div className="bookings-hero-copy"><span>رحلاتك في مكان واحد</span><h1>حجوزاتي</h1><p>تابع حالة الطلب والدفع، افتح التذكرة الرقمية، تواصل مع المكتب وارفع المستندات المرتبطة بالحجز.</p></div>
        <div className="bookings-hero-mark"><TicketCheck size={34} /><strong>{counts.active}</strong><span>حجز نشط</span></div>
      </section>

      <section className="booking-overview-grid" aria-label="ملخص الحجوزات">
        <article><CalendarCheck2 size={20} /><div><span>إجمالي الحجوزات</span><strong>{counts.all}</strong></div></article>
        <article><Clock3 size={20} /><div><span>قيد المتابعة</span><strong>{counts.active}</strong></div></article>
        <article><CheckCircle2 size={20} /><div><span>رحلات مكتملة</span><strong>{counts.past}</strong></div></article>
        <article><WalletCards size={20} /><div><span>إجمالي المدفوع</span><strong>{formatMoney(totalPaid)}</strong></div></article>
      </section>

      <section className="bookings-toolbar">
        <div className="bookings-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value.slice(0, 80))} placeholder="ابحث برقم الحجز أو اسم الخدمة أو المكتب" aria-label="البحث في الحجوزات" /></div>
        <div className="booking-filter-tabs" role="tablist" aria-label="تصفية الحجوزات">
          {([
            ['all', 'الكل', counts.all], ['active', 'الحالية', counts.active], ['past', 'السابقة', counts.past], ['cancelled', 'الملغاة', counts.cancelled],
          ] as Array<[BookingFilter, string, number]>).map(([id, label, count]) => <button key={id} type="button" role="tab" aria-selected={filter === id} className={filter === id ? 'active' : ''} onClick={() => setFilter(id)}><span>{label}</span><b>{count}</b></button>)}
        </div>
      </section>

      {visible.length ? <div className="booking-list-pro">{visible.map((booking) => {
        const meta = serviceKinds[booking.serviceType]; const Icon = meta.icon; const progress = bookingProgress(booking); const ticketAvailable = booking.status === 'Confirmed' || booking.status === 'Completed';
        return <article key={booking.id} className={`booking-card-pro status-card-${booking.status.toLowerCase()}`}>
          <button type="button" className="booking-card-main" onClick={() => onOpenBooking(booking)}>
            <div className="booking-card-pro-icon"><Icon size={26} /></div>
            <div className="booking-card-pro-body">
              <div className="booking-card-pro-head"><div><span className="booking-reference">{booking.referenceCode}</span><h2>{booking.serviceName}</h2><p>{booking.officeName}</p></div><em className={`status-${booking.status.toLowerCase()}`}>{statusLabel[booking.status]}</em></div>
              <div className="booking-card-pro-meta"><span><CalendarCheck2 size={15} />{formatDate(primaryDate(booking))}</span><span><CreditCard size={15} />{booking.paymentStatus === 'paid' ? 'مدفوع' : 'بانتظار الدفع'}</span><span><ShieldCheck size={15} />طلب محفوظ وآمن</span></div>
              <div className="booking-progress"><div className="booking-progress-labels"><span className={progress >= 1 ? 'done' : ''}>تم الطلب</span><span className={progress >= 34 ? 'done' : ''}>مراجعة المكتب</span><span className={progress >= 68 ? 'done' : ''}>تأكيد الحجز</span><span className={progress >= 100 ? 'done' : ''}>اكتملت الخدمة</span></div><div className="booking-progress-track"><span style={{ width: `${progress}%` }} /></div></div>
              <div className="booking-card-pro-foot"><div><strong>{formatMoney(booking.totalPrice)}</strong><small>القيمة الإجمالية</small></div><div className="booking-feature-chips">{ticketAvailable ? <span><TicketCheck size={14} />التذكرة متاحة</span> : null}<span><MessageCircle size={14} />محادثة المكتب</span></div><span className="booking-open-action">فتح الحجز <ChevronLeft size={17} /></span></div>
            </div>
          </button>
        </article>;
      })}</div> : <EmptyState icon={filter === 'cancelled' ? XCircle : filter === 'past' ? CheckCircle2 : CalendarCheck2} title={query ? 'لا توجد نتائج مطابقة' : 'لا توجد حجوزات في هذا القسم'} description={query ? 'جرّب البحث برقم الحجز أو اسم الخدمة.' : filter === 'active' || filter === 'all' ? 'ابدأ باستعراض الخدمات وأرسل أول طلب حجز.' : 'ستظهر الحجوزات هنا حسب حالتها.'} actionLabel="استعراض الخدمات" onAction={onBrowseServices} />}
    </div>
  );
}
