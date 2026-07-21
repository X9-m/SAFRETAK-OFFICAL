import {
  ArrowRight, CalendarDays, CheckCircle2, Clock3, CreditCard, ExternalLink, FileText, Headphones,
  Loader2, MessageCircle, Printer, ReceiptText, Send, ShieldCheck, Star, TicketCheck, Trash2,
  UploadCloud, UserRoundCheck, WalletCards, XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { formatDate, formatMoney, serviceKinds } from '../domain';
import { maskDocumentNumber, readBookingTravelers } from '../bookingPassengers';
import { apiClient } from '../services/apiClient';
import type { BookingDocument, BookingMessage, TravelerBooking } from '../types';
import { cleanMultilineText, isIsoDate, safeExternalUrl } from '../validation';

interface BookingDetailsPageProps {
  booking: TravelerBooking;
  onBack: () => void;
  onRequestCancellation: (booking: TravelerBooking) => Promise<void>;
  onSupport: (booking: TravelerBooking) => void;
  onOpenService?: () => void;
}

type BookingSection = 'overview' | 'ticket' | 'documents' | 'chat';
const statusLabel: Record<TravelerBooking['status'], string> = { Pending: 'قيد مراجعة المكتب', Confirmed: 'مؤكد', Completed: 'مكتمل', Cancelled: 'ملغي' };
const detailLabels: Record<string, string> = {
  travel_date: 'تاريخ الخدمة', check_in: 'تاريخ الدخول', check_out: 'تاريخ المغادرة', outbound_date: 'تاريخ السفر', return_date: 'تاريخ العودة',
  pickup_date: 'تاريخ الاستلام', quantity: 'عدد المسافرين', rooms: 'عدد الغرف', children: 'عدد الأطفال', room_type: 'فئة الغرفة', bed_type: 'نوع الأسرّة',
  trip_type: 'نوع الرحلة', cabin_class: 'درجة السفر', notes: 'ملاحظات', coupon_code: 'رمز الخصم', discount: 'قيمة الخصم', payment_reference: 'مرجع الدفع',
};
const valueLabels: Record<string, string> = { standard: 'قياسية', deluxe: 'ديلوكس', suite: 'جناح', single: 'فردي', double: 'مزدوج', twin: 'منفصل', one_way: 'ذهاب فقط', round_trip: 'ذهاب وعودة', economy: 'السياحية', business: 'رجال الأعمال', first: 'الأولى' };
const hiddenKeys = new Set(['base_price', 'pricing_units', 'add_on_ids', 'option_id', 'travelers']);
const displayValue = (key: string, value: unknown): string | null => {
  if (value === null || value === undefined || value === '') return null;
  if (key.includes('date') || key === 'check_in' || key === 'check_out') return isIsoDate(value) ? formatDate(String(value)) : null;
  if (key === 'discount' && Number.isFinite(Number(value))) return formatMoney(Number(value));
  if (typeof value === 'string') return valueLabels[value] || value;
  if (typeof value === 'number') return String(value);
  return null;
};
const statusStep = (status: TravelerBooking['status']) => status === 'Cancelled' ? 0 : status === 'Pending' ? 1 : status === 'Confirmed' ? 2 : 3;

export function BookingDetailsPage({ booking, onBack, onRequestCancellation, onSupport, onOpenService }: BookingDetailsPageProps) {
  const [activeSection, setActiveSection] = useState<BookingSection>('overview');
  const [messages, setMessages] = useState<BookingMessage[]>([]);
  const [message, setMessage] = useState('');
  const [documents, setDocuments] = useState<BookingDocument[]>([]);
  const [documentType, setDocumentType] = useState('هوية شخصية');
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [documentBusy, setDocumentBusy] = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [sending, setSending] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const messagesEnd = useRef<HTMLDivElement>(null);
  const documentInput = useRef<HTMLInputElement>(null);
  const meta = serviceKinds[booking.serviceType];
  const Icon = meta.icon;
  const invoiceUrl = safeExternalUrl(booking.invoiceUrl);
  const ticketAvailable = booking.status === 'Confirmed' || booking.status === 'Completed';
  const travelers = useMemo(() => readBookingTravelers(booking.bookingDetails.travelers), [booking.bookingDetails.travelers]);
  const detailRows = useMemo(() => Object.entries(booking.bookingDetails).filter(([key]) => !hiddenKeys.has(key)).map(([key, value]) => ({ key, label: detailLabels[key] || key.replaceAll('_', ' '), value: displayValue(key, value) })).filter((item): item is { key: string; label: string; value: string } => Boolean(item.value)).slice(0, 30), [booking.bookingDetails]);
  const step = statusStep(booking.status);

  const loadMessages = async () => {
    setLoadingMessages(true); setError('');
    try { setMessages(await apiClient.getBookingMessages(booking.id)); }
    catch (err) { setError(err instanceof Error ? err.message : 'تعذر تحميل المحادثة.'); }
    finally { setLoadingMessages(false); }
  };
  const loadDocuments = async () => {
    setLoadingDocuments(true);
    try { setDocuments(await apiClient.listBookingDocuments(booking.id)); }
    catch (err) { setError(err instanceof Error ? err.message : 'تعذر تحميل المستندات.'); }
    finally { setLoadingDocuments(false); }
  };
  useEffect(() => { void loadMessages(); void loadDocuments(); }, [booking.id]);
  useEffect(() => { messagesEnd.current?.scrollIntoView({ block: 'nearest' }); }, [messages]);

  const send = async (event: React.FormEvent) => {
    event.preventDefault(); const body = cleanMultilineText(message, 1500); if (!body) return;
    setSending(true); setError('');
    try { await apiClient.sendBookingMessage(booking.id, body); setMessage(''); await loadMessages(); }
    catch (err) { setError(err instanceof Error ? err.message : 'تعذر إرسال الرسالة.'); }
    finally { setSending(false); }
  };
  const uploadDocument = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
    setDocumentBusy('upload'); setError(''); setNotice('');
    try { const document = await apiClient.uploadBookingDocument(booking.id, documentType, file); setDocuments((current) => [document, ...current]); setNotice('تم رفع المستند وإرساله للمراجعة.'); }
    catch (err) { setError(err instanceof Error ? err.message : 'تعذر رفع المستند.'); }
    finally { setDocumentBusy(null); }
  };
  const deleteDocument = async (document: BookingDocument) => {
    setDocumentBusy(document.id); setError(''); setNotice('');
    try { await apiClient.deleteBookingDocument(document.id); setDocuments((current) => current.filter((item) => item.id !== document.id)); setNotice('تم حذف المستند.'); }
    catch (err) { setError(err instanceof Error ? err.message : 'تعذر حذف المستند.'); }
    finally { setDocumentBusy(null); }
  };
  const cancel = async () => {
    setCancelBusy(true); setError(''); setNotice('');
    try { await onRequestCancellation(booking); setNotice('تم إرسال طلب الإلغاء للمكتب للمراجعة.'); setConfirmCancel(false); }
    catch (err) { setError(err instanceof Error ? err.message : 'تعذر إرسال طلب الإلغاء.'); }
    finally { setCancelBusy(false); }
  };

  return <div className="page-stack page-enter booking-details-page-pro">
    <button type="button" className="back-button booking-back" onClick={onBack}><ArrowRight size={18} />العودة إلى حجوزاتي</button>

    <section className="booking-details-hero-pro">
      <div className="booking-hero-main">
        <div className="booking-icon-xl"><Icon size={31} /></div>
        <div><span className="booking-reference">{booking.referenceCode}</span><h1>{booking.serviceName}</h1><p>{booking.officeName}</p></div>
      </div>
      <div className="booking-hero-summary"><em className={`status-${booking.status.toLowerCase()}`}>{statusLabel[booking.status]}</em><strong>{formatMoney(booking.totalPrice)}</strong><small>{booking.paymentStatus === 'paid' ? 'تم الدفع' : 'بانتظار الدفع أو مراجعة المكتب'}</small></div>
    </section>

    <section className={`booking-status-journey ${booking.status === 'Cancelled' ? 'cancelled' : ''}`} aria-label="مراحل الحجز">
      {['تم إرسال الطلب', 'مراجعة المكتب', 'تأكيد الحجز', 'اكتملت الخدمة'].map((label, index) => <div key={label} className={step >= index ? 'done' : ''}><span>{step > index ? <CheckCircle2 size={16} /> : index + 1}</span><strong>{label}</strong></div>)}
    </section>

    {error ? <div className="form-notice error" role="alert">{error}</div> : null}{notice ? <div className="form-notice success" role="status">{notice}</div> : null}

    <nav className="booking-detail-tabs" aria-label="أقسام الحجز">
      {([
        ['overview', 'ملخص الحجز', ReceiptText], ['ticket', 'التذكرة والدفع', TicketCheck], ['documents', 'المسافرون والمستندات', FileText], ['chat', 'محادثة الحجز', MessageCircle],
      ] as const).map(([id, label, TabIcon]) => <button key={id} type="button" className={activeSection === id ? 'active' : ''} onClick={() => setActiveSection(id)}><TabIcon size={17} /><span>{label}</span>{id === 'chat' && messages.length ? <b>{messages.length}</b> : null}</button>)}
    </nav>

    <div className="booking-tab-panels">
      <section className={`booking-tab-panel ${activeSection === 'overview' ? 'active' : ''}`} aria-hidden={activeSection !== 'overview'}>
        <div className="booking-detail-layout-pro">
          <div className="booking-detail-main-pro">
            <article className="content-card booking-information-card"><div className="card-heading-row"><div><span className="section-kicker">البيانات الأساسية</span><h2>تفاصيل الحجز</h2></div>{onOpenService ? <button type="button" className="text-button" onClick={onOpenService}>عرض الخدمة</button> : null}</div><dl className="details-definition-grid pro-grid">{detailRows.map((item) => <div key={item.key}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl></article>
            <article className="content-card booking-office-card"><div className="booking-office-identity"><span><Headphones size={22} /></span><div><small>مكتب السياحة المسؤول</small><h2>{booking.officeName}</h2><p>يمكنك التواصل مع المكتب من تبويب المحادثة أو إرسال طلب مساعدة لسفرتك.</p></div></div><div className="booking-office-actions"><button type="button" className="secondary-button" onClick={() => setActiveSection('chat')}><MessageCircle size={16} />فتح المحادثة</button><button type="button" className="secondary-button" onClick={() => onSupport(booking)}><Headphones size={16} />مساعدة سفرتك</button></div></article>
          </div>
          <aside className="booking-detail-aside-pro">
            <article className="content-card booking-price-card"><WalletCards size={22} /><span>إجمالي الحجز</span><strong>{formatMoney(booking.totalPrice)}</strong><small>القيمة المسجلة في قاعدة البيانات عند تأكيد الطلب.</small></article>
            {(booking.status === 'Pending' || booking.status === 'Confirmed') ? <article className="content-card cancellation-card-pro"><XCircle size={22} /><h3>إدارة الحجز</h3><p>طلب الإلغاء يذهب للمكتب للمراجعة ولا يغيّر حالة الحجز مباشرة.</p>{confirmCancel ? <div className="cancel-confirm vertical"><span>تأكيد إرسال طلب الإلغاء؟</span><button type="button" className="danger-button" onClick={() => void cancel()} disabled={cancelBusy}>{cancelBusy ? <Loader2 className="spin" size={15} /> : <XCircle size={15} />}إرسال الطلب</button><button type="button" className="text-button" onClick={() => setConfirmCancel(false)} disabled={cancelBusy}>تراجع</button></div> : <button type="button" className="danger-button" onClick={() => setConfirmCancel(true)}><XCircle size={16} />طلب إلغاء الحجز</button>}</article> : null}
          </aside>
        </div>
      </section>

      <section className={`booking-tab-panel ${activeSection === 'ticket' ? 'active' : ''}`} aria-hidden={activeSection !== 'ticket'}>
        <div className="ticket-payment-layout">
          {ticketAvailable ? <article className="boarding-pass-card">
            <div className="boarding-pass-top"><div><span>SAFRETAK DIGITAL TICKET</span><h2>{booking.serviceName}</h2><p>{booking.officeName}</p></div><TicketCheck size={38} /></div>
            <div className="boarding-pass-grid"><div><span>رقم الحجز</span><strong dir="ltr">{booking.referenceCode}</strong></div><div><span>الحالة</span><strong>{statusLabel[booking.status]}</strong></div><div><span>طريقة الدفع</span><strong>{booking.paymentMethod === 'Cash at Office' ? 'الدفع في المكتب' : booking.paymentMethod}</strong></div><div><span>القيمة</span><strong>{formatMoney(booking.totalPrice)}</strong></div></div>
            <div className="boarding-pass-code"><div className="fake-qr" aria-hidden="true"><span /><span /><span /><span /><span /><span /><span /><span /><span /></div><div><small>رمز التحقق</small><code>{booking.qrCode ? booking.qrCode.slice(0, 90) : booking.referenceCode}</code></div></div>
            <button type="button" className="gold-button ticket-print" onClick={() => window.print()}><Printer size={17} />طباعة التذكرة</button>
          </article> : <article className="content-card ticket-waiting-card"><CalendarDays size={38} /><h2>التذكرة قيد الإصدار</h2><p>ستظهر التذكرة الرقمية هنا بعد اعتماد المكتب للحجز.</p><div className="waiting-reference"><span>رقم الطلب</span><strong dir="ltr">{booking.referenceCode}</strong></div></article>}
          <div className="ticket-payment-side">
            <article className="content-card payment-breakdown-card"><div className="card-heading-row"><div><span className="section-kicker">التحصيل المالي</span><h2>الدفع والمراجعة</h2></div><CreditCard size={22} /></div><dl><div><dt>حالة الدفع</dt><dd className={booking.paymentStatus === 'paid' ? 'paid' : ''}>{booking.paymentStatus === 'paid' ? 'مدفوع ومؤكد' : 'غير مدفوع'}</dd></div><div><dt>طريقة الدفع</dt><dd>{booking.paymentMethod === 'Cash at Office' ? 'الدفع في المكتب' : booking.paymentMethod}</dd></div><div><dt>تاريخ إنشاء الطلب</dt><dd>{formatDate(booking.createdAt)}</dd></div><div><dt>الإجمالي</dt><dd>{formatMoney(booking.totalPrice)}</dd></div></dl>{invoiceUrl ? <a className="secondary-button invoice-link" href={invoiceUrl} target="_blank" rel="noopener noreferrer"><FileText size={16} />فتح الفاتورة الرسمية</a> : null}</article>
            <article className="content-card secure-booking-note"><ShieldCheck size={23} /><div><h3>حجز محفوظ بحسابك</h3><p>بيانات الدفع والحالة تأتي من قاعدة البيانات ولا تعتمد على قيم المتصفح.</p></div></article>
          </div>
        </div>
      </section>

      <section className={`booking-tab-panel ${activeSection === 'documents' ? 'active' : ''}`} aria-hidden={activeSection !== 'documents'}>
        <div className="documents-travelers-layout">
          <article className="content-card booking-travelers-panel"><div className="card-heading-row"><div><span className="section-kicker">قائمة الركاب</span><h2>{booking.serviceType === 'car' ? 'بيانات السائق' : 'بيانات المسافرين'}</h2><p>أرقام الوثائق مخفية قبل وصولها للمتصفح.</p></div><UserRoundCheck size={22} /></div>{travelers.length ? <div className="booking-traveler-list">{travelers.map((traveler, index) => <article key={`${traveler.documentNumber}-${index}`}><span>{booking.serviceType === 'car' ? 'السائق' : `المسافر ${index + 1}`}</span><strong>{traveler.fullName}</strong><small>{traveler.nationality} · {traveler.documentType === 'passport' ? 'جواز سفر' : 'هوية شخصية'}</small><bdi dir="ltr">{maskDocumentNumber(traveler.documentNumber)}</bdi>{traveler.documentExpiry ? <em>انتهاء الوثيقة: {formatDate(traveler.documentExpiry)}</em> : null}</article>)}</div> : <div className="inline-empty">لا توجد بيانات مسافرين مطلوبة لهذا النوع من الخدمات.</div>}</article>

          <article className="content-card booking-documents-panel"><div className="card-heading-row"><div><span className="section-kicker">ملفات الطلب</span><h2>مستندات الحجز</h2><p>تُحفظ الملفات بشكل خاص وتظهر للمكتب للمراجعة.</p></div><FileText size={22} /></div>
            {loadingDocuments ? <div className="page-loader"><Loader2 className="spin" size={18} />جاري تحميل المستندات...</div> : documents.length ? <div className="booking-document-list">{documents.map((document) => <article key={document.id}><span className="document-file-icon"><FileText size={18} /></span><div><strong>{document.documentType}</strong><small>{document.originalName} · {(document.fileSize / 1024).toFixed(0)}KB</small><em className={`document-status ${document.status}`}>{document.status === 'approved' ? 'معتمد' : document.status === 'rejected' ? 'مرفوض — ارفع نسخة أوضح' : 'قيد المراجعة'}</em></div><div className="document-actions">{document.signedUrl ? <a href={document.signedUrl} target="_blank" rel="noopener noreferrer" aria-label="فتح المستند"><ExternalLink size={16} /></a> : null}{(booking.status === 'Pending' || booking.status === 'Confirmed') ? <button type="button" onClick={() => void deleteDocument(document)} disabled={Boolean(documentBusy)} aria-label="حذف المستند">{documentBusy === document.id ? <Loader2 className="spin" size={16} /> : <Trash2 size={16} />}</button> : null}</div></article>)}</div> : <div className="inline-empty">لا توجد مستندات مرفوعة لهذا الحجز.</div>}
            {(booking.status === 'Pending' || booking.status === 'Confirmed') ? <div className="document-upload-row"><label className="field-group"><span>نوع المستند</span><select value={documentType} onChange={(event) => setDocumentType(event.target.value)} disabled={Boolean(documentBusy)}><option>هوية شخصية</option><option>جواز سفر</option><option>تأشيرة</option><option>إيصال دفع</option><option>وثيقة حجز</option><option>وثيقة أخرى</option></select></label><input ref={documentInput} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" hidden onChange={(event) => void uploadDocument(event)} /><button type="button" className="gold-button upload-document-button" onClick={() => documentInput.current?.click()} disabled={Boolean(documentBusy)}>{documentBusy === 'upload' ? <Loader2 className="spin" size={16} /> : <UploadCloud size={16} />}رفع مستند</button><small>PDF أو صورة، بحد أقصى 6MB.</small></div> : <small className="field-hint">أُغلق رفع المستندات بعد انتهاء أو إلغاء الحجز.</small>}
          </article>
        </div>
      </section>

      <section className={`booking-tab-panel ${activeSection === 'chat' ? 'active' : ''}`} aria-hidden={activeSection !== 'chat'}>
        <article className="content-card booking-chat-pro"><div className="chat-header-pro"><div className="chat-office-avatar"><Headphones size={23} /></div><div><span>محادثة مرتبطة بالحجز</span><h2>{booking.officeName}</h2><p>المرجع: <bdi dir="ltr">{booking.referenceCode}</bdi></p></div><button type="button" className="secondary-button" onClick={() => onSupport(booking)}>دعم سفرتك</button></div>
          {loadingMessages ? <div className="page-loader"><Loader2 className="spin" size={18} />جاري تحميل الرسائل...</div> : <div className="chat-messages chat-messages-pro">{messages.length ? messages.map((item) => <article key={item.id} className={`chat-bubble ${item.sender}`}><strong>{item.sender === 'traveler' ? 'أنت' : item.sender === 'office' ? booking.officeName : 'سفرتك'}</strong><p>{item.body}</p><time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time></article>) : <div className="chat-empty-state"><MessageCircle size={28} /><strong>ابدأ المحادثة مع المكتب</strong><p>اكتب استفسارك عن الموعد، المستندات أو حالة الدفع.</p></div>}<div ref={messagesEnd} /></div>}
          <form className="chat-compose chat-compose-pro" onSubmit={send}><textarea value={message} onChange={(event) => setMessage(event.target.value.slice(0, 1500))} maxLength={1500} placeholder="اكتب رسالتك للمكتب..." disabled={sending || booking.status === 'Cancelled'} /><div><small>{message.length}/1500</small><button type="submit" className="gold-button" disabled={sending || !cleanMultilineText(message, 1500)}>{sending ? <Loader2 className="spin" size={16} /> : <Send size={16} />}إرسال الرسالة</button></div></form>
        </article>
      </section>
    </div>

    {booking.status === 'Completed' && booking.serviceId ? <section className="completed-booking-banner"><CheckCircle2 size={25} /><div><strong>اكتملت الخدمة بنجاح</strong><p>شارك تقييمك لمساعدة المسافرين الآخرين.</p></div>{onOpenService ? <button type="button" className="secondary-button" onClick={onOpenService}><Star size={16} />تقييم الخدمة</button> : null}</section> : null}
  </div>;
}
