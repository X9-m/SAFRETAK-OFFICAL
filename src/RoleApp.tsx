import { type FormEvent, useCallback, useEffect, useState } from 'react';
import {
  BadgeDollarSign, BookOpenCheck, Building2, CalendarDays, CheckCircle2, ChevronLeft,
  CircleAlert, ClipboardList, CreditCard, LayoutDashboard, Loader2, LogIn, LogOut,
  Megaphone, Menu, MessageSquareText, PackagePlus, Pencil, Plus, RefreshCcw, Save, Search,
  Settings, ShieldCheck, Tags, TicketCheck, ToggleLeft, ToggleRight, Users, X,
} from 'lucide-react';
import { rolePortalClient, type RoleOtpChallenge, type RolePortalSnapshot } from './services/rolePortalClient';
import type { AppProfile } from './types';
import { formatCountdown, secondsUntil } from './validation';

type ExpectedRole = 'office' | 'admin';
type Row = Record<string, unknown>;
type OfficeTab = 'overview' | 'services' | 'bookings' | 'employees' | 'finance' | 'profile';
type AdminTab = 'overview' | 'offices' | 'users' | 'bookings' | 'services' | 'complaints' | 'support' | 'ads' | 'categories' | 'settings';
type PortalTab = OfficeTab | AdminTab;

const rowArray = (value: unknown): Row[] => Array.isArray(value) ? value.filter((item): item is Row => typeof item === 'object' && item !== null && !Array.isArray(item)) : [];
const text = (row: Row | null | undefined, key: string, fallback = ''): string => typeof row?.[key] === 'string' ? String(row[key]) : fallback;
const bool = (row: Row | null | undefined, key: string, fallback = false): boolean => typeof row?.[key] === 'boolean' ? Boolean(row[key]) : fallback;
const numeric = (row: Row | null | undefined, key: string, fallback = 0): number => Number.isFinite(Number(row?.[key])) ? Number(row?.[key]) : fallback;
const idOf = (row: Row): string => text(row, 'id');
const formatMoney = (value: unknown): string => new Intl.NumberFormat('ar-JO', { style: 'currency', currency: 'JOD', maximumFractionDigits: 2 }).format(Number(value) || 0);
const formatDate = (value: unknown): string => {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) return '—';
  return new Intl.DateTimeFormat('ar-JO', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Amman' }).format(new Date(value));
};
const serviceLabels: Record<string, string> = {
  trip: 'رحلة داخلية', intl_trip: 'رحلة خارجية', hotel: 'فندق وإقامة', car: 'تأجير سيارة', flight: 'حجز طيران',
  bus_train: 'حافلات وقطارات', hajj_umrah: 'حج وعمرة', insurance: 'تأمين سفر', visa: 'تأشيرات', consultation: 'استشارة سفر',
};
const bookingLabels: Record<string, string> = { Pending: 'قيد المراجعة', Confirmed: 'مؤكد', Completed: 'مكتمل', Cancelled: 'ملغي' };

function RoleLogin({ expectedRole, onAuthenticated }: { expectedRole: ExpectedRole; onAuthenticated: (profile: AppProfile) => void }) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [challenge, setChallenge] = useState<RoleOtpChallenge | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!challenge || step !== 'otp') return undefined;
    const update = () => setSeconds(secondsUntil(challenge.expiresAt));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [challenge, step]);

  const requestCode = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setBusy(true);
    try { const next = await rolePortalClient.requestOtp(phone); setChallenge(next); setPhone(next.phone); setCode(''); setStep('otp'); }
    catch (err) { setError(err instanceof Error ? err.message : 'تعذر إرسال رمز الدخول.'); }
    finally { setBusy(false); }
  };
  const verify = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setBusy(true);
    try { onAuthenticated(await rolePortalClient.verifyOtp(challenge!, code, expectedRole)); }
    catch (err) { setError(err instanceof Error ? err.message : 'تعذر تسجيل الدخول.'); }
    finally { setBusy(false); }
  };

  return <main className="role-auth-page" dir="rtl">
    <div className="lattice" aria-hidden="true" />
    <section className="auth-card role-auth-card screen-enter">
      <header className="brand"><div className="logo-circle"><img src="/safretak-logo.jpeg" alt="شعار سفرتك" className="app-logo" /></div><h1>سفرتك</h1><p>{expectedRole === 'office' ? 'بوابة مكاتب السياحة' : 'لوحة إدارة المنصة'}</p></header>
      <div className="login-heading"><ShieldCheck size={22} /><div><h2>{step === 'phone' ? 'دخول آمن برقم الهاتف' : 'تأكيد رمز الدخول'}</h2><p>{expectedRole === 'office' ? 'استخدم رقم الهاتف المرتبط بترخيص المكتب.' : 'هذه البوابة مخصصة لحسابات إدارة سفرتك فقط.'}</p></div></div>
      {step === 'phone' ? <form className="form-area" onSubmit={requestCode}>
        <label className="field-group"><span>رقم الهاتف</span><div className="input-box"><input type="tel" dir="ltr" value={phone} onChange={(event) => setPhone(event.target.value.replace(/[^+\d\s()-]/g, '').slice(0, 18))} placeholder="07XXXXXXXX" disabled={busy} autoFocus /><LogIn size={17} /></div></label>
        {error ? <div className="login-alert" role="alert">{error}</div> : null}
        <button className="gold-button" type="submit" disabled={busy || phone.length < 9}>{busy ? <Loader2 className="spin" size={17} /> : <LogIn size={17} />}إرسال رمز الدخول</button>
      </form> : <form className="form-area" onSubmit={verify}>
        <div className="otp-phone">{phone}</div>
        <label className="field-group"><span>رمز التحقق</span><div className="input-box otp-input"><input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" dir="ltr" maxLength={6} autoFocus disabled={busy || seconds <= 0} /><MessageSquareText size={17} /></div></label>
        <div className={`mode-note ${seconds <= 0 ? 'expired' : ''}`}>{seconds <= 0 ? 'انتهت صلاحية الرمز.' : `صلاحية الرمز ${formatCountdown(seconds)}`}</div>
        {error ? <div className="login-alert" role="alert">{error}</div> : null}
        <button className="gold-button" type="submit" disabled={busy || code.length !== 6 || seconds <= 0}>{busy ? <Loader2 className="spin" size={17} /> : <CheckCircle2 size={17} />}تأكيد الدخول</button>
        <button className="text-action" type="button" onClick={() => { setStep('phone'); setChallenge(null); setError(''); }} disabled={busy}>تعديل رقم الهاتف</button>
      </form>}
      <footer className="secure-note"><ShieldCheck size={15} /><span>الجلسة مرتبطة بالحساب والصلاحية، ولا تمنح الوصول لبيانات مكتب آخر.</span></footer>
    </section>
  </main>;
}

const officeNav: Array<{ id: OfficeTab; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard }, { id: 'services', label: 'الخدمات والرحلات', icon: PackagePlus },
  { id: 'bookings', label: 'الحجوزات', icon: TicketCheck }, { id: 'employees', label: 'الموظفون', icon: Users },
  { id: 'finance', label: 'المالية', icon: BadgeDollarSign }, { id: 'profile', label: 'ملف المكتب', icon: Building2 },
];
const adminNav: Array<{ id: AdminTab; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard }, { id: 'offices', label: 'المكاتب', icon: Building2 },
  { id: 'users', label: 'المستخدمون', icon: Users }, { id: 'bookings', label: 'الحجوزات', icon: TicketCheck },
  { id: 'services', label: 'الخدمات', icon: PackagePlus }, { id: 'complaints', label: 'الشكاوى', icon: CircleAlert },
  { id: 'support', label: 'طلبات الدعم', icon: MessageSquareText }, { id: 'ads', label: 'الإعلانات', icon: Megaphone },
  { id: 'categories', label: 'التصنيفات', icon: Tags }, { id: 'settings', label: 'الإعدادات', icon: Settings },
];

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: typeof LayoutDashboard }) {
  return <article className="role-stat-card"><span><Icon size={20} /></span><div><small>{label}</small><strong>{value}</strong></div></article>;
}

function Toolbar({ title, description, search, onSearch, action }: { title: string; description: string; search?: string; onSearch?: (value: string) => void; action?: React.ReactNode }) {
  return <header className="role-page-heading"><div><h1>{title}</h1><p>{description}</p></div><div className="role-heading-actions">{onSearch ? <label className="role-search"><Search size={16} /><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="بحث..." /></label> : null}{action}</div></header>;
}

function Empty({ textValue }: { textValue: string }) { return <div className="role-empty"><ClipboardList size={28} /><p>{textValue}</p></div>; }

interface ServiceDraft {
  id: string | null; type: string; title: string; description: string; price: string; location: string; duration: string;
  seats: string; imageUrl: string; images: string; included: string; dates: string; active: boolean; published: boolean;
}
const emptyService: ServiceDraft = { id: null, type: 'trip', title: '', description: '', price: '', location: '', duration: '', seats: '', imageUrl: '', images: '', included: '', dates: '', active: true, published: true };

function ServiceEditor({ draft, onChange, onClose, onSave, busy }: { draft: ServiceDraft; onChange: (draft: ServiceDraft) => void; onClose: () => void; onSave: () => void; busy: boolean }) {
  return <div className="role-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="role-dialog role-dialog-wide" role="dialog" aria-modal="true">
    <header><div><PackagePlus size={20} /><h2>{draft.id ? 'تعديل الخدمة' : 'إضافة خدمة أو رحلة'}</h2></div><button className="icon-button" type="button" onClick={onClose}><X size={18} /></button></header>
    <div className="role-form-grid">
      <label><span>نوع الخدمة</span><select value={draft.type} onChange={(event) => onChange({ ...draft, type: event.target.value })}>{Object.entries(serviceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="span-2"><span>العنوان</span><input value={draft.title} onChange={(event) => onChange({ ...draft, title: event.target.value })} maxLength={160} /></label>
      <label><span>السعر بالدينار</span><input type="number" min="0" step="0.01" value={draft.price} onChange={(event) => onChange({ ...draft, price: event.target.value })} /></label>
      <label><span>الموقع</span><input value={draft.location} onChange={(event) => onChange({ ...draft, location: event.target.value })} /></label>
      <label><span>المدة</span><input value={draft.duration} onChange={(event) => onChange({ ...draft, duration: event.target.value })} /></label>
      <label><span>المقاعد المتبقية</span><input type="number" min="0" value={draft.seats} onChange={(event) => onChange({ ...draft, seats: event.target.value })} /></label>
      <label className="span-3"><span>الوصف</span><textarea value={draft.description} onChange={(event) => onChange({ ...draft, description: event.target.value })} rows={4} /></label>
      <label className="span-3"><span>رابط الصورة الرئيسية</span><input dir="ltr" value={draft.imageUrl} onChange={(event) => onChange({ ...draft, imageUrl: event.target.value })} /></label>
      <label className="span-3"><span>صور إضافية — رابط في كل سطر</span><textarea dir="ltr" value={draft.images} onChange={(event) => onChange({ ...draft, images: event.target.value })} rows={3} /></label>
      <label className="span-2"><span>المشمولات — عنصر في كل سطر</span><textarea value={draft.included} onChange={(event) => onChange({ ...draft, included: event.target.value })} rows={3} /></label>
      <label><span>المواعيد — YYYY-MM-DD</span><textarea dir="ltr" value={draft.dates} onChange={(event) => onChange({ ...draft, dates: event.target.value })} rows={3} /></label>
      <label className="role-check"><input type="checkbox" checked={draft.active} onChange={(event) => onChange({ ...draft, active: event.target.checked })} /><span>الخدمة فعّالة</span></label>
      <label className="role-check"><input type="checkbox" checked={draft.published} onChange={(event) => onChange({ ...draft, published: event.target.checked })} /><span>منشورة للمسافرين</span></label>
    </div>
    <footer><button className="secondary-button" type="button" onClick={onClose}>إلغاء</button><button className="gold-button compact" type="button" onClick={onSave} disabled={busy || draft.title.trim().length < 2 || !draft.price}>{busy ? <Loader2 className="spin" size={16} /> : <Save size={16} />}حفظ الخدمة</button></footer>
  </section></div>;
}

function OfficePortal({ activeTab: tab, snapshot, reload, runAction }: { activeTab: OfficeTab; snapshot: RolePortalSnapshot; reload: () => Promise<void>; runAction: (action: () => Promise<unknown>, success: string) => Promise<void> }) {
  const goTab = (next: OfficeTab) => window.dispatchEvent(new CustomEvent('role-tab-change', { detail: next }));
  const [search, setSearch] = useState('');
  const [serviceDraft, setServiceDraft] = useState<ServiceDraft | null>(null);
  const [employeeDraft, setEmployeeDraft] = useState<Row | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Row | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const office = snapshot.office || {};
  const stats = snapshot.stats || {};
  const services = rowArray(snapshot.services);
  const bookings = rowArray(snapshot.bookings);
  const employees = rowArray(snapshot.employees);
  const payments = rowArray(snapshot.payments);
  const messages = rowArray(snapshot.messages);

  const filtered = useCallback((rows: Row[], keys: string[]) => {
    const query = search.trim().toLocaleLowerCase('ar-JO');
    if (!query) return rows;
    return rows.filter((row) => keys.some((key) => text(row, key).toLocaleLowerCase('ar-JO').includes(query)));
  }, [search]);

  const editService = (row?: Row) => {
    if (!row) { setServiceDraft({ ...emptyService }); return; }
    const list = (key: string) => Array.isArray(row[key]) ? (row[key] as unknown[]).filter((item): item is string => typeof item === 'string').join('\n') : '';
    setServiceDraft({
      id: idOf(row), type: text(row, 'type', 'trip'), title: text(row, 'title'), description: text(row, 'description'),
      price: String(numeric(row, 'price')), location: text(row, 'location'), duration: text(row, 'duration'), seats: row.seats_remaining == null ? '' : String(row.seats_remaining),
      imageUrl: text(row, 'image_url'), images: list('images'), included: list('included'), dates: list('available_dates'), active: bool(row, 'is_active', true), published: Boolean(row.published_at),
    });
  };
  const saveService = async () => {
    if (!serviceDraft) return; setBusy(true);
    const lines = (value: string) => value.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean);
    await runAction(() => rolePortalClient.office.saveService(serviceDraft.id, {
      type: serviceDraft.type, title: serviceDraft.title.trim(), description: serviceDraft.description.trim(), price: Number(serviceDraft.price),
      location: serviceDraft.location.trim() || null, duration: serviceDraft.duration.trim() || null, seats_remaining: serviceDraft.seats === '' ? null : Number(serviceDraft.seats),
      image_url: serviceDraft.imageUrl.trim() || null, images: lines(serviceDraft.images), included: lines(serviceDraft.included), available_dates: lines(serviceDraft.dates),
      itinerary: [], details: {}, is_active: serviceDraft.active, published: serviceDraft.published,
    }), serviceDraft.id ? 'تم تحديث الخدمة.' : 'تمت إضافة الخدمة.');
    setBusy(false); setServiceDraft(null);
  };

  const renderOverview = () => <>
    <Toolbar title={`مرحبًا، ${text(office, 'name', 'مكتب سفرتك')}`} description="إدارة الخدمات والحجوزات والفريق من مكان واحد." action={<button className="secondary-button compact" type="button" onClick={() => void reload()}><RefreshCcw size={15} />تحديث</button>} />
    <div className="role-stats-grid"><StatCard label="الخدمات" value={numeric(stats, 'services')} icon={PackagePlus} /><StatCard label="الخدمات المنشورة" value={numeric(stats, 'published_services')} icon={BookOpenCheck} /><StatCard label="الحجوزات" value={numeric(stats, 'bookings')} icon={TicketCheck} /><StatCard label="قيد المراجعة" value={numeric(stats, 'pending_bookings')} icon={CalendarDays} /><StatCard label="الإيرادات المدفوعة" value={formatMoney(stats.revenue)} icon={BadgeDollarSign} /><StatCard label="الموظفون الفعّالون" value={numeric(stats, 'employees')} icon={Users} /></div>
    <div className="role-dashboard-columns"><section className="role-card"><h2>أحدث الحجوزات</h2>{bookings.length ? bookings.slice(0, 5).map((row) => <button key={idOf(row)} className="role-list-row" type="button" onClick={() => { setSelectedBooking(row); goTab('bookings'); }}><div><strong>{text(row, 'service_name')}</strong><small>{text(row, 'traveler_name')} · {text(row, 'reference_code')}</small></div><span className={`status-pill ${text(row, 'status').toLowerCase()}`}>{bookingLabels[text(row, 'status')] || text(row, 'status')}</span></button>) : <Empty textValue="لا توجد حجوزات بعد." />}</section><section className="role-card"><h2>الخدمات الأعلى تقييمًا</h2>{services.length ? [...services].sort((a,b) => numeric(b,'rating')-numeric(a,'rating')).slice(0,5).map((row) => <button key={idOf(row)} className="role-list-row" type="button" onClick={() => { editService(row); goTab('services'); }}><div><strong>{text(row, 'title')}</strong><small>{serviceLabels[text(row, 'type')] || text(row, 'type')}</small></div><b>{numeric(row, 'rating').toFixed(1)} ★</b></button>) : <Empty textValue="أضف أول خدمة للمكتب." />}</section></div>
  </>;

  const renderServices = () => {
    const list = filtered(services, ['title','description','location','type']);
    return <><Toolbar title="الخدمات والرحلات" description="إضافة وتعديل ونشر كل عروض المكتب." search={search} onSearch={setSearch} action={<button className="gold-button compact" type="button" onClick={() => editService()}><Plus size={16} />إضافة خدمة</button>} />
      <div className="role-card role-table-card">{list.length ? <div className="role-table"><div className="role-tr role-th"><span>الخدمة</span><span>النوع</span><span>السعر</span><span>التوفر</span><span>الحالة</span><span>إجراء</span></div>{list.map((row) => <div className="role-tr" key={idOf(row)}><span><strong>{text(row,'title')}</strong><small>{text(row,'location','بدون موقع')}</small></span><span>{serviceLabels[text(row,'type')] || text(row,'type')}</span><span>{formatMoney(row.price)}</span><span>{row.seats_remaining == null ? 'مفتوح' : String(row.seats_remaining)}</span><span><i className={bool(row,'is_active') && row.published_at ? 'dot active' : 'dot'} />{bool(row,'is_active') ? (row.published_at ? 'منشورة' : 'مسودة') : 'متوقفة'}</span><span><button className="icon-action" type="button" onClick={() => editService(row)} aria-label="تعديل"><Pencil size={16} /></button></span></div>)}</div> : <Empty textValue="لا توجد خدمات مطابقة." />}</div>
    </>;
  };

  const renderBookings = () => {
    const list = filtered(bookings, ['reference_code','service_name','traveler_name','traveler_phone','status']);
    const bookingMessages = selectedBooking ? messages.filter((row) => text(row,'booking_id') === idOf(selectedBooking)) : [];
    return <><Toolbar title="الحجوزات" description="تأكيد الطلبات وتحديث الدفع والتواصل مع المسافر." search={search} onSearch={setSearch} />
      <div className="role-split"><div className="role-card role-table-card">{list.length ? list.map((row) => <button key={idOf(row)} className={`booking-select ${selectedBooking && idOf(selectedBooking)===idOf(row) ? 'active' : ''}`} type="button" onClick={() => setSelectedBooking(row)}><div><strong>{text(row,'service_name')}</strong><small>{text(row,'reference_code')} · {text(row,'traveler_name')}</small></div><span>{formatMoney(row.total_price)}</span><i className={`status-pill ${text(row,'status').toLowerCase()}`}>{bookingLabels[text(row,'status')] || text(row,'status')}</i></button>) : <Empty textValue="لا توجد حجوزات." />}</div>
      <aside className="role-card sticky-card">{selectedBooking ? <><h2>{text(selectedBooking,'reference_code')}</h2><dl className="role-details"><div><dt>المسافر</dt><dd>{text(selectedBooking,'traveler_name')}</dd></div><div><dt>الهاتف</dt><dd dir="ltr">{text(selectedBooking,'traveler_phone')}</dd></div><div><dt>الخدمة</dt><dd>{text(selectedBooking,'service_name')}</dd></div><div><dt>الإجمالي</dt><dd>{formatMoney(selectedBooking.total_price)}</dd></div></dl><div className="role-form-grid single"><label><span>حالة الحجز</span><select defaultValue={text(selectedBooking,'status')} id="office-booking-status">{Object.keys(bookingLabels).map((value) => <option key={value}>{value}</option>)}</select></label><label><span>حالة الدفع</span><select defaultValue={text(selectedBooking,'payment_status')} id="office-payment-status"><option value="unpaid">غير مدفوع</option><option value="paid">مدفوع</option></select></label><button className="gold-button compact" type="button" onClick={() => void runAction(() => rolePortalClient.office.updateBooking(idOf(selectedBooking),(document.getElementById('office-booking-status') as HTMLSelectElement).value,(document.getElementById('office-payment-status') as HTMLSelectElement).value),'تم تحديث الحجز.')}>حفظ حالة الحجز</button></div><h3>المحادثة</h3><div className="role-chat">{bookingMessages.map((row) => <article key={idOf(row)} className={text(row,'sender')}><p>{text(row,'body')}</p><small>{formatDate(row.created_at)}</small></article>)}{!bookingMessages.length ? <small>لا توجد رسائل بعد.</small> : null}</div><div className="message-compose"><textarea value={message} onChange={(event) => setMessage(event.target.value.slice(0,1500))} placeholder="اكتب رسالة للمسافر" /><button type="button" className="gold-button compact" disabled={!message.trim()} onClick={() => void runAction(async () => { await rolePortalClient.office.sendMessage(idOf(selectedBooking),message); setMessage(''); },'تم إرسال الرسالة.')}><MessageSquareText size={15} />إرسال</button></div></> : <Empty textValue="اختر حجزًا لعرض التفاصيل." />}</aside></div>
    </>;
  };

  const renderEmployees = () => {
    const list = filtered(employees, ['full_name','job_title','permission_level']);
    const draft = employeeDraft || {};
    return <><Toolbar title="فريق المكتب" description="إدارة الموظفين ومستويات الصلاحية الداخلية." search={search} onSearch={setSearch} action={<button className="gold-button compact" type="button" onClick={() => setEmployeeDraft({ is_active: true, permission_level: 'Edit Bookings' })}><Plus size={16} />إضافة موظف</button>} />
      {employeeDraft ? <section className="role-card inline-editor"><h2>{idOf(draft) ? 'تعديل موظف' : 'إضافة موظف'}</h2><div className="role-form-grid"><label><span>الاسم الكامل</span><input value={text(draft,'full_name')} onChange={(event) => setEmployeeDraft({ ...draft, full_name:event.target.value })} /></label><label><span>المسمى الوظيفي</span><input value={text(draft,'job_title')} onChange={(event) => setEmployeeDraft({ ...draft, job_title:event.target.value })} /></label><label><span>الصلاحية</span><select value={text(draft,'permission_level','Edit Bookings')} onChange={(event) => setEmployeeDraft({ ...draft, permission_level:event.target.value })}><option>Edit Bookings</option><option>Manage Services</option><option>Finance View</option><option>Full Access</option></select></label><label className="role-check"><input type="checkbox" checked={bool(draft,'is_active',true)} onChange={(event) => setEmployeeDraft({ ...draft, is_active:event.target.checked })} /><span>حساب فعّال</span></label></div><footer><button className="secondary-button compact" type="button" onClick={() => setEmployeeDraft(null)}>إلغاء</button><button className="gold-button compact" type="button" onClick={() => void runAction(async () => { await rolePortalClient.office.saveEmployee(idOf(draft)||null,text(draft,'full_name'),text(draft,'job_title'),text(draft,'permission_level','Edit Bookings'),bool(draft,'is_active',true)); setEmployeeDraft(null); },'تم حفظ الموظف.')}><Save size={15} />حفظ</button></footer></section> : null}
      <div className="role-cards-list">{list.length ? list.map((row) => <article className="role-card mini-card" key={idOf(row)}><div><span className="avatar-badge">{text(row,'full_name','م').slice(0,2)}</span><div><h3>{text(row,'full_name')}</h3><p>{text(row,'job_title')}</p><small>{text(row,'permission_level')}</small></div></div><div><span className={bool(row,'is_active') ? 'status-pill confirmed' : 'status-pill cancelled'}>{bool(row,'is_active') ? 'فعّال' : 'موقوف'}</span><button className="icon-action" type="button" onClick={() => setEmployeeDraft(row)}><Pencil size={16} /></button></div></article>) : <Empty textValue="لا يوجد موظفون مسجلون." />}</div>
    </>;
  };

  const renderFinance = () => <><Toolbar title="المالية والمدفوعات" description="ملخص الإيرادات وسجل الدفعات المرتبطة بحجوزات المكتب." search={search} onSearch={setSearch} /><div className="role-stats-grid"><StatCard label="الإيرادات المدفوعة" value={formatMoney(stats.revenue)} icon={BadgeDollarSign} /><StatCard label="عدد الدفعات" value={payments.length} icon={CreditCard} /><StatCard label="الحجوزات المكتملة" value={bookings.filter((row)=>text(row,'status')==='Completed').length} icon={CheckCircle2} /></div><div className="role-card role-table-card">{payments.length ? <div className="role-table"><div className="role-tr role-th"><span>الحجز</span><span>الخدمة</span><span>المبلغ</span><span>الطريقة</span><span>الحالة</span><span>التاريخ</span></div>{filtered(payments,['reference_code','service_name','payment_method','status']).map((row)=><div className="role-tr" key={idOf(row)}><span>{text(row,'reference_code')}</span><span>{text(row,'service_name')}</span><span>{formatMoney(row.amount)}</span><span>{text(row,'payment_method')}</span><span>{text(row,'status')}</span><span>{formatDate(row.created_at)}</span></div>)}</div> : <Empty textValue="لا توجد دفعات مسجلة بعد." />}</div></>;
  const renderProfile = () => <OfficeProfileForm office={office} runAction={runAction} />;
  const content = tab === 'overview' ? renderOverview() : tab === 'services' ? renderServices() : tab === 'bookings' ? renderBookings() : tab === 'employees' ? renderEmployees() : tab === 'finance' ? renderFinance() : renderProfile();
  return <>{content}{serviceDraft ? <ServiceEditor draft={serviceDraft} onChange={setServiceDraft} onClose={() => setServiceDraft(null)} onSave={() => void saveService()} busy={busy} /> : null}</>;
}

function OfficeProfileForm({ office, runAction }: { office: Row; runAction: (action: () => Promise<unknown>, success: string) => Promise<void> }) {
  const [draft, setDraft] = useState<Row>({ ...office });
  useEffect(() => setDraft({ ...office }), [office]);
  return <><Toolbar title="ملف المكتب" description="المعلومات التي تظهر للمسافرين في صفحة المكتب." /><section className="role-card"><div className="role-form-grid"><label className="span-2"><span>اسم المكتب</span><input value={text(draft,'name')} onChange={(event)=>setDraft({...draft,name:event.target.value})} /></label><label><span>رقم الترخيص</span><input value={text(draft,'license_number')} onChange={(event)=>setDraft({...draft,license_number:event.target.value})} /></label><label className="span-3"><span>الموقع</span><input value={text(draft,'location')} onChange={(event)=>setDraft({...draft,location:event.target.value})} /></label><label className="span-3"><span>الوصف</span><textarea rows={5} value={text(draft,'description')} onChange={(event)=>setDraft({...draft,description:event.target.value})} /></label><label className="span-3"><span>رابط الشعار</span><input dir="ltr" value={text(draft,'logo_url')} onChange={(event)=>setDraft({...draft,logo_url:event.target.value})} /></label><label className="span-3"><span>رابط صورة الغلاف</span><input dir="ltr" value={text(draft,'cover_url')} onChange={(event)=>setDraft({...draft,cover_url:event.target.value})} /></label></div><footer><button className="gold-button compact" type="button" onClick={() => void runAction(() => rolePortalClient.office.updateProfile(draft),'تم تحديث ملف المكتب.')}><Save size={16} />حفظ التغييرات</button></footer></section></>;
}

function AdminPortal({ activeTab: tab, snapshot, reload, runAction }: { activeTab: AdminTab; snapshot: RolePortalSnapshot; reload: () => Promise<void>; runAction: (action: () => Promise<unknown>, success: string) => Promise<void> }) {
  const goTab = (next: AdminTab) => window.dispatchEvent(new CustomEvent('role-tab-change', { detail: next }));
  const [search, setSearch] = useState('');
  const [officeDraft, setOfficeDraft] = useState<Row | null>(null);
  const [adDraft, setAdDraft] = useState<Row | null>(null);
  const [categoryDraft, setCategoryDraft] = useState<Row | null>(null);
  const [resolution, setResolution] = useState<Record<string,string>>({});
  const stats = snapshot.stats || {};
  const offices = rowArray(snapshot.offices), users = rowArray(snapshot.users), bookings = rowArray(snapshot.bookings), services = rowArray(snapshot.services), complaints = rowArray(snapshot.complaints), support = rowArray(snapshot.support_requests), ads = rowArray(snapshot.ads), categories = rowArray(snapshot.categories);
  const settings = snapshot.settings || {};
  const filtered = useCallback((rows: Row[], keys: string[]) => { const query=search.trim().toLocaleLowerCase('ar-JO'); return !query ? rows : rows.filter((row)=>keys.some((key)=>text(row,key).toLocaleLowerCase('ar-JO').includes(query))); },[search]);

  const overview = <><Toolbar title="إدارة منصة سفرتك" description="مؤشرات تشغيل المنصة والتحكم المركزي." action={<button className="secondary-button compact" type="button" onClick={() => void reload()}><RefreshCcw size={15} />تحديث</button>} /><div className="role-stats-grid"><StatCard label="المكاتب" value={numeric(stats,'offices')} icon={Building2} /><StatCard label="المكاتب المعتمدة" value={numeric(stats,'approved_offices')} icon={ShieldCheck} /><StatCard label="المستخدمون" value={numeric(stats,'users')} icon={Users} /><StatCard label="الخدمات المنشورة" value={numeric(stats,'published_services')} icon={PackagePlus} /><StatCard label="الحجوزات" value={numeric(stats,'bookings')} icon={TicketCheck} /><StatCard label="الإيرادات" value={formatMoney(stats.revenue)} icon={BadgeDollarSign} /><StatCard label="الشكاوى المفتوحة" value={numeric(stats,'open_complaints')} icon={CircleAlert} /><StatCard label="طلبات الدعم" value={numeric(stats,'open_support')} icon={MessageSquareText} /></div><div className="role-dashboard-columns"><section className="role-card"><h2>مكاتب بانتظار الاعتماد</h2>{offices.filter((row)=>!bool(row,'is_approved')).slice(0,5).map((row)=><button className="role-list-row" key={idOf(row)} type="button" onClick={()=>{goTab('offices');setSearch(text(row,'name'));}}><div><strong>{text(row,'name')}</strong><small>{text(row,'location','بدون موقع')}</small></div><ChevronLeft size={17} /></button>)}</section><section className="role-card"><h2>أحدث الحجوزات</h2>{bookings.slice(0,5).map((row)=><button className="role-list-row" key={idOf(row)} type="button" onClick={()=>{goTab('bookings');setSearch(text(row,'reference_code'));}}><div><strong>{text(row,'service_name')}</strong><small>{text(row,'office_name')} · {text(row,'reference_code')}</small></div><span>{formatMoney(row.total_price)}</span></button>)}</section></div></>;

  const officesPage = <><Toolbar title="إدارة المكاتب" description="إنشاء واعتماد وإيقاف المكاتب وخطط الاشتراك." search={search} onSearch={setSearch} action={<button className="gold-button compact" type="button" onClick={()=>setOfficeDraft({subscription_plan:'Free',is_approved:false})}><Plus size={16} />مكتب جديد</button>} />{officeDraft ? <section className="role-card inline-editor"><h2>إضافة مكتب سياحي</h2><div className="role-form-grid"><label><span>اسم المكتب</span><input value={text(officeDraft,'name')} onChange={(e)=>setOfficeDraft({...officeDraft,name:e.target.value})} /></label><label><span>رقم هاتف الدخول</span><input dir="ltr" value={text(officeDraft,'phone')} onChange={(e)=>setOfficeDraft({...officeDraft,phone:e.target.value})} /></label><label><span>الموقع</span><input value={text(officeDraft,'location')} onChange={(e)=>setOfficeDraft({...officeDraft,location:e.target.value})} /></label><label><span>رقم الترخيص</span><input value={text(officeDraft,'license_number')} onChange={(e)=>setOfficeDraft({...officeDraft,license_number:e.target.value})} /></label><label><span>الخطة</span><select value={text(officeDraft,'subscription_plan','Free')} onChange={(e)=>setOfficeDraft({...officeDraft,subscription_plan:e.target.value})}><option>Free</option><option>Basic</option><option>Premium</option></select></label><label className="role-check"><input type="checkbox" checked={bool(officeDraft,'is_approved')} onChange={(e)=>setOfficeDraft({...officeDraft,is_approved:e.target.checked})} /><span>اعتماد مباشرة</span></label></div><footer><button className="secondary-button compact" type="button" onClick={()=>setOfficeDraft(null)}>إلغاء</button><button className="gold-button compact" type="button" onClick={()=>void runAction(async()=>{await rolePortalClient.admin.createOffice(officeDraft);setOfficeDraft(null);},'تم إنشاء المكتب وحساب الدخول.')}><Save size={15}/>إنشاء</button></footer></section>:null}<div className="role-card role-table-card"><div className="role-table"><div className="role-tr role-th"><span>المكتب</span><span>الترخيص</span><span>الخطة</span><span>الاعتماد</span><span>التفعيل</span><span>حفظ</span></div>{filtered(offices,['name','location','license_number','subscription_plan']).map((row)=><AdminOfficeRow key={idOf(row)} row={row} runAction={runAction}/>)}</div></div></>;
  const usersPage = <><Toolbar title="المستخدمون" description="الحسابات المسجلة وأدوارها وحالة التفعيل." search={search} onSearch={setSearch}/><div className="role-card role-table-card"><div className="role-table"><div className="role-tr role-th"><span>الاسم</span><span>الهاتف</span><span>الدور</span><span>التاريخ</span><span>الحالة</span><span>إجراء</span></div>{filtered(users,['full_name','phone','email','role']).map((row)=><div className="role-tr" key={idOf(row)}><span><strong>{text(row,'full_name','بدون اسم')}</strong><small>{text(row,'email')}</small></span><span dir="ltr">{text(row,'phone')}</span><span>{text(row,'role')}</span><span>{formatDate(row.created_at)}</span><span>{bool(row,'is_active')?'فعّال':'موقوف'}</span><span><button className="toggle-action" type="button" onClick={()=>void runAction(()=>rolePortalClient.admin.updateUser(idOf(row),!bool(row,'is_active')),bool(row,'is_active')?'تم إيقاف الحساب.':'تم تفعيل الحساب.')}>{bool(row,'is_active')?<ToggleRight size={22}/>:<ToggleLeft size={22}/>}</button></span></div>)}</div></div></>;
  const bookingsPage = <><Toolbar title="كل الحجوزات" description="متابعة حالة الطلب والدفع على مستوى المنصة." search={search} onSearch={setSearch}/><div className="role-card role-table-card"><div className="role-table"><div className="role-tr role-th"><span>المرجع</span><span>الخدمة والمكتب</span><span>المسافر</span><span>الإجمالي</span><span>الحالة</span><span>الدفع والحفظ</span></div>{filtered(bookings,['reference_code','service_name','office_name','traveler_name','traveler_phone']).map((row)=><AdminBookingRow key={idOf(row)} row={row} runAction={runAction}/>)}</div></div></>;
  const servicesPage = <><Toolbar title="كل الخدمات" description="الإشراف على نشر وتفعيل عروض جميع المكاتب." search={search} onSearch={setSearch}/><div className="role-card role-table-card"><div className="role-table"><div className="role-tr role-th"><span>الخدمة</span><span>المكتب</span><span>النوع</span><span>السعر</span><span>الحالة</span><span>تحكم</span></div>{filtered(services,['title','description','type']).map((row)=><div className="role-tr" key={idOf(row)}><span><strong>{text(row,'title')}</strong><small>{text(row,'location')}</small></span><span>{text(offices.find((office)=>idOf(office)===text(row,'office_id')),'name','—')}</span><span>{serviceLabels[text(row,'type')]||text(row,'type')}</span><span>{formatMoney(row.price)}</span><span>{bool(row,'is_active')&&row.published_at?'منشورة':bool(row,'is_active')?'مسودة':'متوقفة'}</span><span className="inline-actions"><button className="toggle-action" type="button" title="تفعيل/إيقاف" onClick={()=>void runAction(()=>rolePortalClient.admin.updateService(idOf(row),!bool(row,'is_active'),Boolean(row.published_at)),'تم تحديث تفعيل الخدمة.')}>{bool(row,'is_active')?<ToggleRight size={22}/>:<ToggleLeft size={22}/>}</button><button className="icon-action" type="button" title="نشر/إخفاء" onClick={()=>void runAction(()=>rolePortalClient.admin.updateService(idOf(row),bool(row,'is_active'),!Boolean(row.published_at)),'تم تحديث حالة النشر.')}><BookOpenCheck size={17}/></button></span></div>)}</div></div></>;
  const complaintsPage = <><Toolbar title="الشكاوى" description="مراجعة الشكاوى وتوثيق الحل." search={search} onSearch={setSearch}/><div className="role-cards-list">{filtered(complaints,['traveler_name','office_name','subject','details','status']).map((row)=><article className="role-card complaint-card" key={idOf(row)}><header><div><h3>{text(row,'subject')}</h3><p>{text(row,'traveler_name')} · {text(row,'office_name','بدون مكتب')}</p></div><span className={text(row,'status')==='Resolved'?'status-pill completed':'status-pill pending'}>{text(row,'status')}</span></header><p>{text(row,'details')}</p><textarea value={resolution[idOf(row)] ?? text(row,'resolution')} onChange={(e)=>setResolution({...resolution,[idOf(row)]:e.target.value})} placeholder="اكتب نتيجة المعالجة"/><footer><button className="gold-button compact" type="button" onClick={()=>void runAction(()=>rolePortalClient.admin.resolveComplaint(idOf(row),'Resolved',resolution[idOf(row)]??text(row,'resolution')),'تم إغلاق الشكوى.')}>حل وإغلاق</button>{text(row,'status')==='Resolved'?<button className="secondary-button compact" type="button" onClick={()=>void runAction(()=>rolePortalClient.admin.resolveComplaint(idOf(row),'Open',resolution[idOf(row)]??text(row,'resolution')),'تم إعادة فتح الشكوى.')}>إعادة فتح</button>:null}</footer></article>)}{!complaints.length?<Empty textValue="لا توجد شكاوى."/>:null}</div></>;
  const supportPage = <><Toolbar title="طلبات الدعم" description="متابعة طلبات المسافرين والإلغاءات." search={search} onSearch={setSearch}/><div className="role-card role-table-card"><div className="role-table"><div className="role-tr role-th"><span>العنوان</span><span>المستخدم</span><span>النوع</span><span>التاريخ</span><span>الحالة</span><span>حفظ</span></div>{filtered(support,['subject','full_name','phone','message','status','request_type']).map((row)=><AdminSupportRow key={idOf(row)} row={row} runAction={runAction}/>)}</div></div></>;
  const adsPage = <><Toolbar title="الإعلانات" description="إدارة بانرات وإعلانات الصفحة الرئيسية." search={search} onSearch={setSearch} action={<button className="gold-button compact" type="button" onClick={()=>setAdDraft({is_active:true,sort_order:0})}><Plus size={16}/>إعلان جديد</button>}/>{adDraft?<AdminAdEditor draft={adDraft} setDraft={setAdDraft} runAction={runAction}/>:null}<div className="role-cards-list">{filtered(ads,['title_ar','title_en','link']).map((row)=><article className="role-card ad-card" key={idOf(row)}><img src={text(row,'image_url')} alt=""/><div><h3>{text(row,'title_ar')}</h3><p>{text(row,'title_en')}</p><small>{bool(row,'is_active')?'فعّال':'موقوف'} · ترتيب {numeric(row,'sort_order')}</small></div><button className="icon-action" type="button" onClick={()=>setAdDraft(row)}><Pencil size={16}/></button></article>)}</div></>;
  const categoriesPage = <><Toolbar title="تصنيفات الخدمات" description="إدارة الأقسام التي تنظّم كتالوج المنصة." search={search} onSearch={setSearch} action={<button className="gold-button compact" type="button" onClick={()=>setCategoryDraft({is_active:true,sort_order:0})}><Plus size={16}/>تصنيف جديد</button>}/>{categoryDraft?<AdminCategoryEditor draft={categoryDraft} setDraft={setCategoryDraft} runAction={runAction}/>:null}<div className="role-card role-table-card"><div className="role-table"><div className="role-tr role-th"><span>العربي</span><span>الإنجليزي</span><span>Slug</span><span>الترتيب</span><span>الحالة</span><span>تعديل</span></div>{filtered(categories,['name_ar','name_en','slug']).map((row)=><div className="role-tr" key={idOf(row)}><span>{text(row,'name_ar')}</span><span>{text(row,'name_en')}</span><span dir="ltr">{text(row,'slug')}</span><span>{numeric(row,'sort_order')}</span><span>{bool(row,'is_active')?'فعّال':'موقوف'}</span><span><button className="icon-action" type="button" onClick={()=>setCategoryDraft(row)}><Pencil size={16}/></button></span></div>)}</div></div></>;
  const settingsPage = <AdminSettings settings={settings} runAction={runAction}/>;
  const pages: Record<AdminTab,React.ReactNode>={overview,offices:officesPage,users:usersPage,bookings:bookingsPage,services:servicesPage,complaints:complaintsPage,support:supportPage,ads:adsPage,categories:categoriesPage,settings:settingsPage};
  return <>{pages[tab]}</>;
}

function AdminOfficeRow({row,runAction}:{row:Row;runAction:(action:()=>Promise<unknown>,success:string)=>Promise<void>}){const[approved,setApproved]=useState(bool(row,'is_approved'));const[active,setActive]=useState(bool(row,'is_active'));const[plan,setPlan]=useState(text(row,'subscription_plan','Free'));return <div className="role-tr"><span><strong>{text(row,'name')}</strong><small>{text(row,'location')}</small></span><span>{text(row,'license_number','—')}</span><span><select value={plan} onChange={(e)=>setPlan(e.target.value)}><option>Free</option><option>Basic</option><option>Premium</option></select></span><span><input type="checkbox" checked={approved} onChange={(e)=>setApproved(e.target.checked)}/></span><span><input type="checkbox" checked={active} onChange={(e)=>setActive(e.target.checked)}/></span><span><button className="icon-action" type="button" onClick={()=>void runAction(()=>rolePortalClient.admin.updateOffice(idOf(row),approved,active,plan),'تم تحديث المكتب.')}><Save size={16}/></button></span></div>}
function AdminBookingRow({row,runAction}:{row:Row;runAction:(action:()=>Promise<unknown>,success:string)=>Promise<void>}){const[status,setStatus]=useState(text(row,'status','Pending'));const[payment,setPayment]=useState(text(row,'payment_status','unpaid'));return <div className="role-tr"><span><strong>{text(row,'reference_code')}</strong><small>{formatDate(row.created_at)}</small></span><span><strong>{text(row,'service_name')}</strong><small>{text(row,'office_name')}</small></span><span>{text(row,'traveler_name')}</span><span>{formatMoney(row.total_price)}</span><span><select value={status} onChange={(e)=>setStatus(e.target.value)}>{Object.keys(bookingLabels).map((v)=><option key={v}>{v}</option>)}</select></span><span className="inline-actions"><select value={payment} onChange={(e)=>setPayment(e.target.value)}><option value="unpaid">غير مدفوع</option><option value="paid">مدفوع</option></select><button className="icon-action" type="button" onClick={()=>void runAction(()=>rolePortalClient.admin.updateBooking(idOf(row),status,payment),'تم تحديث الحجز.')}><Save size={16}/></button></span></div>}
function AdminSupportRow({row,runAction}:{row:Row;runAction:(action:()=>Promise<unknown>,success:string)=>Promise<void>}){const[status,setStatus]=useState(text(row,'status','open'));return <div className="role-tr"><span><strong>{text(row,'subject','طلب دعم')}</strong><small>{text(row,'message').slice(0,100)}</small></span><span>{text(row,'full_name','—')}<small dir="ltr">{text(row,'phone')}</small></span><span>{text(row,'request_type')}</span><span>{formatDate(row.created_at)}</span><span><select value={status} onChange={(e)=>setStatus(e.target.value)}><option value="open">مفتوح</option><option value="in_progress">قيد المعالجة</option><option value="closed">مغلق</option></select></span><span><button className="icon-action" type="button" onClick={()=>void runAction(()=>rolePortalClient.admin.updateSupport(idOf(row),status),'تم تحديث طلب الدعم.')}><Save size={16}/></button></span></div>}
function AdminAdEditor({draft,setDraft,runAction}:{draft:Row;setDraft:(row:Row|null)=>void;runAction:(action:()=>Promise<unknown>,success:string)=>Promise<void>}){return <section className="role-card inline-editor"><h2>{idOf(draft)?'تعديل إعلان':'إعلان جديد'}</h2><div className="role-form-grid"><label><span>العنوان العربي</span><input value={text(draft,'title_ar')} onChange={(e)=>setDraft({...draft,title_ar:e.target.value})}/></label><label><span>العنوان الإنجليزي</span><input value={text(draft,'title_en')} onChange={(e)=>setDraft({...draft,title_en:e.target.value})}/></label><label className="span-2"><span>رابط الصورة</span><input dir="ltr" value={text(draft,'image_url')} onChange={(e)=>setDraft({...draft,image_url:e.target.value})}/></label><label><span>الرابط</span><input dir="ltr" value={text(draft,'link')} onChange={(e)=>setDraft({...draft,link:e.target.value})}/></label><label><span>الترتيب</span><input type="number" value={String(numeric(draft,'sort_order'))} onChange={(e)=>setDraft({...draft,sort_order:Number(e.target.value)})}/></label><label className="role-check"><input type="checkbox" checked={bool(draft,'is_active',true)} onChange={(e)=>setDraft({...draft,is_active:e.target.checked})}/><span>فعّال</span></label></div><footer><button className="secondary-button compact" type="button" onClick={()=>setDraft(null)}>إلغاء</button><button className="gold-button compact" type="button" onClick={()=>void runAction(async()=>{await rolePortalClient.admin.saveAd(idOf(draft)||null,draft);setDraft(null);},'تم حفظ الإعلان.')}><Save size={15}/>حفظ</button></footer></section>}
function AdminCategoryEditor({draft,setDraft,runAction}:{draft:Row;setDraft:(row:Row|null)=>void;runAction:(action:()=>Promise<unknown>,success:string)=>Promise<void>}){return <section className="role-card inline-editor"><h2>{idOf(draft)?'تعديل تصنيف':'تصنيف جديد'}</h2><div className="role-form-grid"><label><span>الاسم العربي</span><input value={text(draft,'name_ar')} onChange={(e)=>setDraft({...draft,name_ar:e.target.value})}/></label><label><span>الاسم الإنجليزي</span><input value={text(draft,'name_en')} onChange={(e)=>setDraft({...draft,name_en:e.target.value})}/></label><label><span>Slug</span><input dir="ltr" value={text(draft,'slug')} onChange={(e)=>setDraft({...draft,slug:e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g,'')})}/></label><label><span>الترتيب</span><input type="number" value={String(numeric(draft,'sort_order'))} onChange={(e)=>setDraft({...draft,sort_order:Number(e.target.value)})}/></label><label className="role-check"><input type="checkbox" checked={bool(draft,'is_active',true)} onChange={(e)=>setDraft({...draft,is_active:e.target.checked})}/><span>فعّال</span></label></div><footer><button className="secondary-button compact" type="button" onClick={()=>setDraft(null)}>إلغاء</button><button className="gold-button compact" type="button" onClick={()=>void runAction(async()=>{await rolePortalClient.admin.saveCategory(idOf(draft)||null,draft);setDraft(null);},'تم حفظ التصنيف.')}><Save size={15}/>حفظ</button></footer></section>}
function AdminSettings({settings,runAction}:{settings:Row;runAction:(action:()=>Promise<unknown>,success:string)=>Promise<void>}){const[draft,setDraft]=useState<Row>({...settings});useEffect(()=>setDraft({...settings}),[settings]);return <><Toolbar title="إعدادات المنصة" description="العمولة ووضع الصيانة وبيانات الدعم."/><section className="role-card"><div className="role-form-grid"><label><span>نسبة العمولة %</span><input type="number" min="0" max="100" step="0.1" value={String(numeric(draft,'commission_percentage'))} onChange={(e)=>setDraft({...draft,commission_percentage:Number(e.target.value)})}/></label><label><span>هاتف الدعم</span><input dir="ltr" value={text(draft,'support_phone')} onChange={(e)=>setDraft({...draft,support_phone:e.target.value})}/></label><label><span>بريد الدعم</span><input dir="ltr" type="email" value={text(draft,'support_email')} onChange={(e)=>setDraft({...draft,support_email:e.target.value})}/></label><label className="role-check"><input type="checkbox" checked={bool(draft,'maintenance_mode')} onChange={(e)=>setDraft({...draft,maintenance_mode:e.target.checked})}/><span>تفعيل وضع الصيانة</span></label></div><footer><button className="gold-button compact" type="button" onClick={()=>void runAction(()=>rolePortalClient.admin.updateSettings(numeric(draft,'commission_percentage'),bool(draft,'maintenance_mode'),text(draft,'support_phone'),text(draft,'support_email')),'تم حفظ إعدادات المنصة.')}><Save size={16}/>حفظ الإعدادات</button></footer></section></>}

function RoleShell({ expectedRole, activeTab: active, profile, snapshot, onLogout, children }: { expectedRole: ExpectedRole; activeTab: PortalTab; profile: AppProfile; snapshot: RolePortalSnapshot; onLogout: () => void; children: React.ReactNode }) {
  const nav = expectedRole === 'office' ? officeNav : adminNav;
  const [menuOpen, setMenuOpen] = useState(false);
  const name = expectedRole === 'office' ? text(snapshot.office,'name',profile.fullName) : profile.fullName;
  return <div className="role-portal" dir="rtl"><div className="lattice" aria-hidden="true"/><header className="role-header"><button className="role-mobile-menu" type="button" onClick={()=>setMenuOpen(!menuOpen)}><Menu size={21}/></button><div className="portal-brand"><div className="portal-logo-frame"><img src="/safretak-logo.jpeg" alt="شعار سفرتك"/><span>{expectedRole==='office'?'OFFICE':'ADMIN'}</span></div><div><strong>سفرتك</strong><small>{expectedRole==='office'?'بوابة المكتب السياحي':'إدارة المنصة'}</small></div></div><div className="role-header-user"><span className="avatar-badge">{name.slice(0,2)}</span><div><strong>{name}</strong><small dir="ltr">{profile.phone}</small></div><button className="icon-button" type="button" onClick={onLogout} title="تسجيل الخروج"><LogOut size={18}/></button></div></header><div className="role-workspace"><aside className={`role-sidebar ${menuOpen?'open':''}`}><div className="sidebar-heading"><span>WORKSPACE</span><strong>{expectedRole==='office'?'إدارة المكتب':'السوبر أدمن'}</strong></div><nav>{nav.map(({id,label,icon:Icon})=><button key={id} className={active===id?'active':''} type="button" onClick={()=>{setMenuOpen(false);window.dispatchEvent(new CustomEvent('role-tab-change',{detail:id}));}}><Icon size={18}/><span>{label}</span></button>)}</nav><div className="sidebar-assurance"><ShieldCheck size={18}/><div><strong>صلاحيات محمية</strong><small>كل عملية تتحقق من الجلسة والدور داخل قاعدة البيانات.</small></div></div></aside><main className="role-content" id="role-content">{children}</main></div><nav className="role-bottom-nav">{nav.slice(0,5).map(({id,label,icon:Icon})=><button key={id} className={active===id?'active':''} type="button" onClick={()=>{window.dispatchEvent(new CustomEvent('role-tab-change',{detail:id}));}}><Icon size={19}/><span>{label}</span></button>)}</nav></div>;
}

export function RoleApp({ expectedRole }: { expectedRole: ExpectedRole }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [snapshot, setSnapshot] = useState<RolePortalSnapshot | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [activeTab, setActiveTab] = useState<PortalTab>('overview');

  const reload = useCallback(async () => { const next = await rolePortalClient.loadSnapshot(); setSnapshot(next); setError(''); }, []);
  const bootstrap = useCallback(async () => { setLoading(true); try { const current=await rolePortalClient.getCurrentProfile(expectedRole); setProfile(current); if(current) await reload(); } catch(err){setError(err instanceof Error?err.message:'تعذر تحميل البوابة.');} finally{setLoading(false);} },[expectedRole,reload]);
  useEffect(()=>{void bootstrap();},[bootstrap]);
  useEffect(()=>{const handler=(event:Event)=>setActiveTab((event as CustomEvent<PortalTab>).detail);window.addEventListener('role-tab-change',handler);return()=>window.removeEventListener('role-tab-change',handler);},[]);

  const runAction = useCallback(async (action:()=>Promise<unknown>,success:string)=>{setError('');setNotice('');try{await action();await reload();setNotice(success);}catch(err){setError(err instanceof Error?err.message:'تعذر تنفيذ العملية.');}},[reload]);
  const logout=async()=>{await rolePortalClient.logout();setProfile(null);setSnapshot(null);setNotice('');setError('');};
  if(loading)return <main className="loading-screen"><div className="loading-logo"><Loader2 className="spin" size={34}/><span className="loading-name">سفرتك</span></div></main>;
  if(!profile)return <RoleLogin expectedRole={expectedRole} onAuthenticated={async(next)=>{setProfile(next);setLoading(true);try{await reload();}finally{setLoading(false);}}}/>;
  if(!snapshot)return <main className="loading-screen connection-screen" dir="rtl"><CircleAlert size={38}/><h1>تعذر تحميل البوابة</h1><p>{error}</p><button className="gold-button compact" type="button" onClick={()=>void bootstrap()}><RefreshCcw size={17}/>إعادة المحاولة</button></main>;

  const page = expectedRole==='office'
    ? <OfficePortal activeTab={activeTab as OfficeTab} snapshot={snapshot} reload={reload} runAction={runAction}/>
    : <AdminPortal activeTab={activeTab as AdminTab} snapshot={snapshot} reload={reload} runAction={runAction}/>;
  return <RoleShell expectedRole={expectedRole} activeTab={activeTab} profile={profile} snapshot={snapshot} onLogout={()=>void logout()}>{error?<div className="global-alert" role="alert">{error}<button type="button" onClick={()=>setError('')}>×</button></div>:null}{notice?<div className="global-success" role="status">{notice}<button type="button" onClick={()=>setNotice('')}>×</button></div>:null}{page}</RoleShell>;
}
