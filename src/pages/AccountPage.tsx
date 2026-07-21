import { Accessibility, Bell, ChevronLeft, CircleHelp, Globe2, Heart, Loader2, LogOut, Mail, Save, ShieldCheck, Trash2, UserRound, Volume2, VolumeX, WalletCards } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { buildSpendingBreakdown } from '../analytics';
import { formatMoney } from '../domain';
import type { AppProfile, NotificationPreferences, TravelerBooking, TravelerStats } from '../types';
import { cleanMultilineText, cleanSingleLineText, isValidEmail, isValidFullName } from '../validation';

interface AccountPageProps {
  profile: AppProfile;
  stats: TravelerStats;
  bookings: TravelerBooking[];
  unreadCount: number;
  favoriteCount: number;
  notificationPreferences: NotificationPreferences;
  onSaveProfile: (fullName: string, email: string | null, language: 'ar' | 'en') => Promise<void>;
  onSaveNotificationPreferences: (preferences: NotificationPreferences) => Promise<NotificationPreferences>;
  onSupport: (subject: string, message: string) => Promise<void>;
  onRequestAccountClosure: () => Promise<void>;
  onNotifications: () => void;
  onFavorites: () => void;
  onLogout: () => void;
}

type Section = 'menu' | 'profile' | 'notifications' | 'security' | 'accessibility' | 'support' | 'delete';
type FontScale = 'normal' | 'large' | 'xlarge';
const readPreference = (key: string): string | null => { try { return localStorage.getItem(key); } catch { return null; } };
const savePreference = (key: string, value: string): void => { try { localStorage.setItem(key, value); } catch { /* visual preference only */ } };
const initialFontScale = (): FontScale => { const stored = readPreference('safretak_font_scale'); return stored === 'large' || stored === 'xlarge' ? stored : 'normal'; };
const faqs = [
  { q: 'كيف أعدل أو ألغي حجزًا؟', a: 'افتح حجوزاتي، اختر الحجز، ثم استخدم طلب الإلغاء أو محادثة المكتب. الحالة لا تتغير إلا بعد مراجعة المكتب.' },
  { q: 'متى يصبح الحجز مؤكدًا؟', a: 'يصبح مؤكدًا عندما يعتمد المكتب التوفر والتفاصيل. إنشاء الطلب وحده لا يعني التأكيد.' },
  { q: 'كيف يتم تأكيد الدفع؟', a: 'أدخل مرجع الدفع الصحيح عند الحجز. يبقى الطلب غير مدفوع إلى أن يؤكد المكتب أو مزود الدفع العملية.' },
  { q: 'أين أجد التذكرة؟', a: 'تظهر التذكرة الرقمية داخل تفاصيل الحجز بعد انتقال حالته إلى مؤكد أو مكتمل.' },
];

export function AccountPage({ profile, stats, bookings, unreadCount, favoriteCount, notificationPreferences, onSaveProfile, onSaveNotificationPreferences, onSupport, onRequestAccountClosure, onNotifications, onFavorites, onLogout }: AccountPageProps) {
  const [section, setSection] = useState<Section>('menu');
  const [name, setName] = useState(profile.fullName);
  const [email, setEmail] = useState(profile.email || '');
  const [language, setLanguage] = useState<'ar' | 'en'>(profile.language);
  const [preferences, setPreferences] = useState(notificationPreferences);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [noticeType, setNoticeType] = useState<'success' | 'error'>('success');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [fontScale, setFontScale] = useState<FontScale>(initialFontScale);
  const [highContrast, setHighContrast] = useState(() => readPreference('safretak_high_contrast') === 'true');
  const [reduceMotion, setReduceMotion] = useState(() => readPreference('safretak_reduce_motion') === 'true');
  const [readingSpacing, setReadingSpacing] = useState(() => readPreference('safretak_reading_spacing') === 'true');
  const [speaking, setSpeaking] = useState(false);
  const cleanName = useMemo(() => cleanSingleLineText(name, 100), [name]);
  const cleanEmail = useMemo(() => cleanSingleLineText(email, 160), [email]);
  const cleanSubject = useMemo(() => cleanSingleLineText(subject, 120), [subject]);
  const cleanMessage = useMemo(() => cleanMultilineText(message, 1500), [message]);
  const spendingBreakdown = useMemo(() => buildSpendingBreakdown(bookings), [bookings]);

  useEffect(() => { setName(profile.fullName); setEmail(profile.email || ''); setLanguage(profile.language); }, [profile]);
  useEffect(() => setPreferences(notificationPreferences), [notificationPreferences]);
  useEffect(() => {
    document.documentElement.dataset.fontScale = fontScale;
    document.documentElement.dataset.contrast = highContrast ? 'high' : 'normal';
    document.documentElement.dataset.reduceMotion = reduceMotion ? 'true' : 'false';
    document.documentElement.dataset.readingSpacing = readingSpacing ? 'wide' : 'normal';
    savePreference('safretak_font_scale', fontScale); savePreference('safretak_high_contrast', String(highContrast)); savePreference('safretak_reduce_motion', String(reduceMotion)); savePreference('safretak_reading_spacing', String(readingSpacing));
  }, [fontScale, highContrast, reduceMotion, readingSpacing]);
  useEffect(() => () => { if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel(); }, []);

  const showNotice = (text: string, type: 'success' | 'error') => { setNotice(text); setNoticeType(type); };
  const run = async (task: () => Promise<void>, success: string) => { setBusy(true); setNotice(''); try { await task(); showNotice(success, 'success'); } catch (error) { showNotice(error instanceof Error ? error.message : 'تعذر تنفيذ الطلب.', 'error'); } finally { setBusy(false); } };
  const back = () => { if (!busy) { setSection('menu'); setNotice(''); setDeleteConfirmation(''); } };

  const saveProfile = (event: React.FormEvent) => { event.preventDefault(); if (!isValidFullName(cleanName)) return showNotice('أدخل اسمًا صحيحًا من حرفين على الأقل.', 'error'); if (!isValidEmail(cleanEmail)) return showNotice('أدخل بريدًا صحيحًا أو اتركه فارغًا.', 'error'); void run(() => onSaveProfile(cleanName, cleanEmail || null, language), 'تم حفظ بيانات الحساب.'); };
  const savePreferences = () => void run(async () => { const saved = await onSaveNotificationPreferences(preferences); setPreferences(saved); }, 'تم حفظ إعدادات الإشعارات.');
  const sendSupport = (event: React.FormEvent) => { event.preventDefault(); if (cleanSubject.length < 3 || cleanMessage.length < 10) return showNotice('اكتب عنوانًا وتفاصيل أوضح للطلب.', 'error'); void run(async () => { await onSupport(cleanSubject, cleanMessage); setSubject(''); setMessage(''); }, 'تم إرسال الطلب لفريق الدعم.'); };
  const requestDeletion = () => { if (deleteConfirmation !== 'حذف حسابي') return showNotice('اكتب العبارة المطلوبة للتأكيد.', 'error'); void run(async () => { await onRequestAccountClosure(); setDeleteConfirmation(''); }, 'تم تسجيل طلب إغلاق الحساب وسيتم التواصل معك للتأكيد.'); };
  const togglePageReading = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
      return showNotice('القراءة الصوتية غير مدعومة في هذا المتصفح.', 'error');
    }
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
    const text = (document.getElementById('portal-content')?.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 6000);
    if (text.length < 3) return showNotice('لا يوجد نص متاح للقراءة في هذه الصفحة.', 'error');
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = profile.language === 'en' ? 'en-US' : 'ar-JO';
    utterance.rate = 0.9;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel(); window.speechSynthesis.speak(utterance); setSpeaking(true);
  };

  if (section !== 'menu') return <div className="page-stack page-enter"><button type="button" className="back-button" onClick={back}><ChevronLeft size={18} />العودة للحساب</button>
    {section === 'profile' ? <section className="content-card account-form"><h1>الملف الشخصي</h1><p>تُستخدم هذه البيانات عند إرسال طلبات الحجز للمكاتب.</p><form onSubmit={saveProfile} noValidate><label className="field-group"><span>الاسم الكامل</span><input value={name} onChange={(event) => setName(event.target.value.normalize('NFKC').slice(0, 100))} maxLength={100} disabled={busy} /></label><label className="field-group"><span>رقم الهاتف الموثق</span><input value={profile.phone} disabled dir="ltr" /></label><label className="field-group"><span>البريد الإلكتروني (اختياري)</span><div className="input-box"><input type="email" value={email} onChange={(event) => setEmail(event.target.value.slice(0, 160))} maxLength={160} dir="ltr" disabled={busy} /><Mail size={17} /></div></label><label className="field-group"><span>لغة التواصل</span><select value={language} onChange={(event) => setLanguage(event.target.value as 'ar' | 'en')} disabled={busy}><option value="ar">العربية</option><option value="en">English</option></select></label>{notice ? <div className={`form-notice ${noticeType}`}>{notice}</div> : null}<button type="submit" className="gold-button" disabled={busy}>{busy ? <Loader2 className="spin" size={17} /> : <Save size={17} />}حفظ التعديلات</button></form></section> : null}
    {section === 'notifications' ? <section className="content-card"><h1>إعدادات الإشعارات</h1><p>حدد أنواع التنبيهات التي تريد ظهورها داخل حسابك.</p><label className="setting-row toggle-row"><div><strong>تحديثات الحجوزات</strong><small>التأكيد، تغيير الحالة، وطلبات المكتب.</small></div><input type="checkbox" checked={preferences.bookingUpdates} onChange={(event) => setPreferences((current) => ({ ...current, bookingUpdates: event.target.checked }))} /></label><label className="setting-row toggle-row"><div><strong>تنبيهات الخدمات</strong><small>توفر خدمة أو موعد تابع لمفضلاتك.</small></div><input type="checkbox" checked={preferences.serviceAlerts} onChange={(event) => setPreferences((current) => ({ ...current, serviceAlerts: event.target.checked }))} /></label><label className="setting-row toggle-row"><div><strong>العروض</strong><small>عروض وكوبونات المنصة عند توفرها.</small></div><input type="checkbox" checked={preferences.promotions} onChange={(event) => setPreferences((current) => ({ ...current, promotions: event.target.checked }))} /></label>{notice ? <div className={`form-notice ${noticeType}`}>{notice}</div> : null}<button type="button" className="gold-button" onClick={savePreferences} disabled={busy}>{busy ? <Loader2 className="spin" size={17} /> : <Save size={17} />}حفظ الإعدادات</button></section> : null}
    {section === 'security' ? <section className="content-card"><h1>الأمان والجلسات</h1><div className="security-banner"><ShieldCheck size={28} /><div><strong>الدخول برقم الهاتف ورمز التحقق</strong><p>لا توجد كلمة مرور للحساب. لا تشارك رمز التحقق أو رقم الجلسة مع أي شخص.</p></div></div><div className="facts-grid single"><div><span>رقم الحساب</span><strong dir="ltr">{profile.phone}</strong></div><div><span>نوع الحساب</span><strong>مسافر</strong></div><div><span>الجلسة الحالية</span><strong>هذا الجهاز</strong></div></div><button type="button" className="danger-button" onClick={onLogout}><LogOut size={17} />إنهاء الجلسة وتسجيل الخروج</button></section> : null}
    {section === 'accessibility' ? <section className="content-card"><h1>إمكانية الوصول</h1><div className="setting-row"><div><strong>حجم الخط</strong><small>يحفظ على هذا الجهاز فقط.</small></div><select value={fontScale} onChange={(event) => setFontScale(event.target.value as FontScale)}><option value="normal">عادي</option><option value="large">كبير</option><option value="xlarge">كبير جدًا</option></select></div><label className="setting-row toggle-row"><div><strong>تباين مرتفع</strong><small>حدود ونصوص أكثر وضوحًا.</small></div><input type="checkbox" checked={highContrast} onChange={(event) => setHighContrast(event.target.checked)} /></label><label className="setting-row toggle-row"><div><strong>تقليل الحركة</strong><small>يوقف معظم الانتقالات والحركات.</small></div><input type="checkbox" checked={reduceMotion} onChange={(event) => setReduceMotion(event.target.checked)} /></label><label className="setting-row toggle-row"><div><strong>تباعد القراءة</strong><small>يزيد المسافة بين الكلمات والأسطر للنصوص الطويلة.</small></div><input type="checkbox" checked={readingSpacing} onChange={(event) => setReadingSpacing(event.target.checked)} /></label><div className="accessibility-action"><div><strong>قراءة الصفحة بصوت</strong><small>تستخدم ميزة القراءة الموجودة في متصفحك ولا ترسل النص إلى الخادم.</small></div><button type="button" className="secondary-button" onClick={togglePageReading}>{speaking ? <VolumeX size={17} /> : <Volume2 size={17} />}{speaking ? 'إيقاف القراءة' : 'بدء القراءة'}</button></div>{notice ? <div className={`form-notice ${noticeType}`}>{notice}</div> : null}</section> : null}
    {section === 'support' ? <div className="support-layout"><section className="content-card"><h1>الأسئلة الشائعة</h1><div className="faq-list">{faqs.map((faq, index) => <button key={faq.q} type="button" className={openFaq === index ? 'open' : ''} onClick={() => setOpenFaq(openFaq === index ? null : index)}><strong>{faq.q}</strong>{openFaq === index ? <p>{faq.a}</p> : null}</button>)}</div></section><section className="content-card account-form"><h2>فتح طلب مساعدة</h2><form onSubmit={sendSupport}><label className="field-group"><span>عنوان الموضوع</span><input value={subject} onChange={(event) => setSubject(event.target.value.slice(0, 120))} maxLength={120} placeholder="مثال: استفسار عن حجز" /></label><label className="field-group"><span>تفاصيل الطلب</span><textarea value={message} onChange={(event) => setMessage(event.target.value.slice(0, 1500))} maxLength={1500} placeholder="اشرح الطلب بالتفصيل" /><small className="field-hint">{message.length}/1500</small></label>{notice ? <div className={`form-notice ${noticeType}`}>{notice}</div> : null}<button type="submit" className="gold-button" disabled={busy}>{busy ? <Loader2 className="spin" size={17} /> : <CircleHelp size={17} />}إرسال الطلب</button></form></section></div> : null}
    {section === 'delete' ? <section className="content-card delete-account-card"><Trash2 size={32} /><h1>طلب حذف الحساب</h1><p>لحماية حجوزاتك وحقوقك المالية، يُراجع فريق الدعم الطلب ويتواصل معك لتأكيد الهوية وتسوية أي حجز نشط قبل الحذف.</p><label className="field-group"><span>اكتب «حذف حسابي» للتأكيد</span><input value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value.slice(0, 20))} /></label>{notice ? <div className={`form-notice ${noticeType}`}>{notice}</div> : null}<button type="button" className="danger-button" onClick={requestDeletion} disabled={busy || deleteConfirmation !== 'حذف حسابي'}>{busy ? <Loader2 className="spin" size={17} /> : <Trash2 size={17} />}إرسال طلب الحذف</button></section> : null}
  </div>;

  return <div className="page-stack page-enter"><section className="account-hero"><div className="account-avatar"><UserRound size={30} /></div><div><span>مرحبًا</span><h1>{profile.fullName}</h1><p dir="ltr">{profile.phone}</p></div></section>
    <section className="stats-row expanded-stats"><div><strong>{stats.totalBookings}</strong><span>كل الحجوزات</span></div><div><strong>{stats.confirmedBookings}</strong><span>مؤكدة</span></div><div><strong>{stats.completedBookings}</strong><span>مكتملة</span></div><div><strong>{formatMoney(stats.totalSpent)}</strong><span>إجمالي المدفوع</span></div></section>
    {spendingBreakdown.length ? <section className="content-card spending-breakdown"><div className="card-heading-row"><div><h2>توزيع الإنفاق</h2><p>مبني على الحجوزات التي تم تأكيد دفعها فقط.</p></div><WalletCards size={23} /></div><div className="spending-breakdown-list">{spendingBreakdown.map((item) => <article key={item.kind}><div className="spending-breakdown-meta"><strong>{item.label}</strong><span>{formatMoney(item.amount)} · {item.bookingCount} {item.bookingCount === 1 ? 'حجز' : 'حجوزات'}</span></div><div className="spending-track" aria-label={`${item.label} ${Math.round(item.percentage)} بالمئة`}><span style={{ width: `${Math.max(3, item.percentage)}%` }} /></div></article>)}</div></section> : null}
    <section className="account-menu"><button type="button" onClick={() => setSection('profile')}><span><UserRound size={19} /></span><div><strong>الملف الشخصي</strong><small>الاسم والبريد ولغة التواصل</small></div><ChevronLeft size={18} /></button><button type="button" onClick={onFavorites}><span><Heart size={19} /></span><div><strong>المفضلة</strong><small>{favoriteCount ? `${favoriteCount} خدمات محفوظة` : 'احفظ الخدمات للرجوع إليها'}</small></div><ChevronLeft size={18} /></button><button type="button" onClick={onNotifications}><span><Bell size={19} /></span><div><strong>مركز الإشعارات</strong><small>{unreadCount ? `${unreadCount} غير مقروءة` : 'لا توجد إشعارات جديدة'}</small></div><ChevronLeft size={18} /></button><button type="button" onClick={() => setSection('notifications')}><span><Globe2 size={19} /></span><div><strong>تفضيلات التنبيهات</strong><small>الحجوزات والخدمات والعروض</small></div><ChevronLeft size={18} /></button><button type="button" onClick={() => setSection('security')}><span><ShieldCheck size={19} /></span><div><strong>الأمان والجلسات</strong><small>رمز التحقق وتسجيل الخروج</small></div><ChevronLeft size={18} /></button><button type="button" onClick={() => setSection('accessibility')}><span><Accessibility size={19} /></span><div><strong>إمكانية الوصول</strong><small>الخط والتباين وتقليل الحركة</small></div><ChevronLeft size={18} /></button><button type="button" onClick={() => setSection('support')}><span><CircleHelp size={19} /></span><div><strong>الدعم والأسئلة الشائعة</strong><small>طلب مساعدة موثق</small></div><ChevronLeft size={18} /></button><button type="button" onClick={() => setSection('delete')}><span><Trash2 size={19} /></span><div><strong>حذف الحساب</strong><small>طلب مراجعة وحذف البيانات</small></div><ChevronLeft size={18} /></button></section>
    <button type="button" className="danger-button" onClick={onLogout}><LogOut size={17} />تسجيل الخروج</button>
  </div>;
}
