import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, RefreshCcw, WifiOff } from 'lucide-react';
import { AuthScreen } from './components/AuthScreen';
import { NotificationsPanel } from './components/NotificationsPanel';
import { ProfileSetupScreen } from './components/ProfileSetupScreen';
import { PortalShell, type PortalTab } from './components/PortalShell';
import { SupportDialog } from './components/SupportDialog';
import { bookingHash, favoritesHash, officeHash, parsePortalHash, portalHash, serviceHash, type PortalRoute } from './navigation';
import { ApiError, apiClient } from './services/apiClient';
import { catalogClient } from './services/catalogClient';
import type { AppProfile, CatalogService, NotificationPreferences, PlatformAd, PortalSnapshot, ServiceCategory, ServiceKind, TravelOffice, TravelerBooking, TravelerStats } from './types';

const HomePage = lazy(() => import('./pages/HomePage').then((module) => ({ default: module.HomePage })));
const ServicesPage = lazy(() => import('./pages/ServicesPage').then((module) => ({ default: module.ServicesPage })));
const OfficeProfilePage = lazy(() => import('./pages/OfficeProfilePage').then((module) => ({ default: module.OfficeProfilePage })));
const ServiceDetailsPage = lazy(() => import('./pages/ServiceDetailsPage').then((module) => ({ default: module.ServiceDetailsPage })));
const BookingDialog = lazy(() => import('./pages/BookingDialog').then((module) => ({ default: module.BookingDialog })));
const BookingsPage = lazy(() => import('./pages/BookingsPage').then((module) => ({ default: module.BookingsPage })));
const BookingDetailsPage = lazy(() => import('./pages/BookingDetailsPage').then((module) => ({ default: module.BookingDetailsPage })));
const AccountPage = lazy(() => import('./pages/AccountPage').then((module) => ({ default: module.AccountPage })));

interface CatalogState { services: CatalogService[]; offices: TravelOffice[]; categories: ServiceCategory[]; ads: PlatformAd[]; }
const emptyCatalog: CatalogState = { services: [], offices: [], categories: [], ads: [] };
const emptyStats: TravelerStats = { totalBookings: 0, confirmedBookings: 0, completedBookings: 0, cancelledBookings: 0, totalSpent: 0 };
const emptyPreferences: NotificationPreferences = { bookingUpdates: true, promotions: false, serviceAlerts: true };
const profileIsComplete = (profile: AppProfile): boolean => profile.fullName.trim().length >= 2;
const currentRoute = (): PortalRoute => typeof window === 'undefined' ? { page: 'tab', tab: 'home' } : parsePortalHash(window.location.hash);

function PageLoader() { return <div className="page-loader" role="status"><Loader2 className="spin" size={26} /><span>جاري التحميل...</span></div>; }
function DataUnavailable({ loading, message, onRetry }: { loading: boolean; message: string; onRetry: () => void }) { return <section className="content-card data-unavailable" role="status">{loading ? <Loader2 className="spin" size={30} /> : <WifiOff size={30} />}<h2>{loading ? 'جاري تحميل بيانات حسابك' : 'تعذر تحميل بيانات الحساب'}</h2><p>{loading ? 'يتم التحقق من الحجوزات والإشعارات.' : message}</p>{!loading ? <button type="button" className="gold-button" onClick={onRetry}><RefreshCcw size={16} />إعادة المحاولة</button> : null}</section>; }

export default function App() {
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [snapshot, setSnapshot] = useState<PortalSnapshot | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState('');
  const [catalog, setCatalog] = useState<CatalogState>(emptyCatalog);
  const [catalogError, setCatalogError] = useState('');
  const [route, setRoute] = useState<PortalRoute>(currentRoute);
  const [selectedKind, setSelectedKind] = useState<ServiceKind | null>(null);
  const [bookingService, setBookingService] = useState<CatalogService | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [supportBooking, setSupportBooking] = useState<TravelerBooking | null | undefined>(undefined);
  const [actionNotice, setActionNotice] = useState('');
  const [actionError, setActionError] = useState('');

  const navigate = useCallback((hash: string, replace = false) => {
    if (replace) window.history.replaceState(null, '', hash); else window.history.pushState(null, '', hash);
    setRoute(parsePortalHash(hash));
    setShowNotifications(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.requestAnimationFrame(() => document.getElementById('portal-content')?.focus({ preventScroll: true }));
  }, []);

  useEffect(() => {
    if (!window.location.hash) navigate(portalHash('home'), true);
    const apply = () => { setRoute(parsePortalHash(window.location.hash)); setShowNotifications(false); };
    window.addEventListener('popstate', apply); window.addEventListener('hashchange', apply);
    return () => { window.removeEventListener('popstate', apply); window.removeEventListener('hashchange', apply); };
  }, [navigate]);

  const loadSnapshot = useCallback(async (): Promise<PortalSnapshot> => {
    const next = await apiClient.loadPortalSnapshot(); setSnapshot(next); setProfile(next.profile); setPortalError(''); return next;
  }, []);

  const loadPortal = useCallback(async (currentProfile: AppProfile, reloadCatalog = true) => {
    setPortalLoading(true); setPortalError(''); if (reloadCatalog) setCatalogError('');
    const [catalogResult, snapshotResult] = await Promise.allSettled([reloadCatalog ? catalogClient.loadCatalog() : Promise.resolve(null), apiClient.loadPortalSnapshot()]);
    if (catalogResult.status === 'fulfilled' && catalogResult.value) setCatalog(catalogResult.value);
    else if (catalogResult.status === 'rejected') setCatalogError(catalogResult.reason instanceof Error ? catalogResult.reason.message : 'تعذر تحميل الخدمات.');
    if (snapshotResult.status === 'fulfilled') { setSnapshot(snapshotResult.value); setProfile(snapshotResult.value.profile); }
    else if (snapshotResult.reason instanceof ApiError && snapshotResult.reason.code === 'SESSION_EXPIRED') { setProfile(null); setSnapshot(null); }
    else { setProfile(currentProfile); setPortalError(snapshotResult.reason instanceof Error ? snapshotResult.reason.message : 'تعذر تحميل بيانات الحساب.'); }
    setPortalLoading(false);
  }, []);

  const bootstrap = useCallback(async () => {
    setAuthLoading(true); setAuthError('');
    try { const current = await apiClient.getCurrentProfile(); setProfile(current); if (current && profileIsComplete(current)) await loadPortal(current); }
    catch (error) { setAuthError(error instanceof Error ? error.message : 'تعذر الاتصال بالخادم.'); }
    finally { setAuthLoading(false); }
  }, [loadPortal]);
  useEffect(() => { void bootstrap(); }, [bootstrap]);

  const authenticated = async (nextProfile: AppProfile) => { setProfile(nextProfile); setAuthError(''); setAuthLoading(false); if (profileIsComplete(nextProfile)) await loadPortal(nextProfile); };
  const completeProfile = async (fullName: string) => { const updated = await apiClient.updateProfile(fullName, profile?.email || null, profile?.language || 'ar'); setProfile(updated); await loadPortal(updated); };
  const changeTab = (tab: PortalTab) => { setSelectedKind(null); setBookingService(null); navigate(portalHash(tab)); };
  const browseServices = (kind?: ServiceKind) => { setSelectedKind(kind || null); navigate(portalHash('services')); };
  const selectService = (service: CatalogService) => navigate(serviceHash(service.id));
  const selectOffice = (office: TravelOffice) => navigate(officeHash(office.id));
  const selectBooking = (booking: TravelerBooking) => navigate(bookingHash(booking.id));

  const logout = async () => {
    try { await apiClient.logout(); } catch { /* local logout still completes */ }
    finally { setProfile(null); setSnapshot(null); setCatalog(emptyCatalog); setBookingService(null); setShowNotifications(false); setSupportBooking(undefined); navigate(portalHash('home'), true); }
  };

  const favoriteIds = useMemo(() => new Set((snapshot?.favorites || []).map((item) => item.serviceId)), [snapshot?.favorites]);
  const toggleFavorite = async (service: CatalogService, favorite: boolean) => {
    if (!snapshot) return;
    setActionError(''); setActionNotice('');
    const previous = snapshot.favorites;
    const next = favorite ? [{ serviceId: service.id, createdAt: new Date().toISOString() }, ...previous.filter((item) => item.serviceId !== service.id)] : previous.filter((item) => item.serviceId !== service.id);
    setSnapshot({ ...snapshot, favorites: next });
    try { await apiClient.toggleFavorite(service.id, favorite); setActionNotice(favorite ? 'تمت إضافة الخدمة إلى المفضلة.' : 'تمت إزالة الخدمة من المفضلة.'); }
    catch (error) { setSnapshot((current) => current ? { ...current, favorites: previous } : current); setActionError(error instanceof Error ? error.message : 'تعذر تحديث المفضلة.'); }
  };

  if (authLoading) return <main className="loading-screen"><div className="loading-logo"><Loader2 className="spin" size={34} /><span className="loading-name">سفرتك</span></div></main>;
  if (authError && !profile) return <main className="loading-screen connection-screen" dir="rtl"><WifiOff size={38} /><h1>تعذر الاتصال</h1><p>{authError}</p><button type="button" className="gold-button" onClick={() => void bootstrap()}><RefreshCcw size={17} />إعادة المحاولة</button></main>;
  if (!profile) return <AuthScreen onAuthenticated={authenticated} />;
  if (!profileIsComplete(profile)) return <ProfileSetupScreen profile={profile} onComplete={completeProfile} onLogout={logout} />;

  const bookings = snapshot?.bookings || [];
  const notifications = snapshot?.notifications || [];
  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const selectedService = route.page === 'service' ? catalog.services.find((item) => item.id === route.serviceId) || null : null;
  const selectedOffice = route.page === 'office' ? catalog.offices.find((item) => item.id === route.officeId) || null : null;
  const selectedBooking = route.page === 'booking' ? bookings.find((item) => item.id === route.bookingId) || null : null;

  const createBooking = async (input: Parameters<typeof apiClient.createBooking>[0]) => {
    const booking = await apiClient.createBooking(input);
    setSnapshot((current) => current ? { ...current, bookings: [booking, ...current.bookings.filter((item) => item.id !== booking.id)], stats: { ...current.stats, totalBookings: current.stats.totalBookings + 1 } } : current);
    void loadSnapshot().catch(() => undefined);
    return booking;
  };
  const requestCancellation = async (booking: TravelerBooking) => { await apiClient.requestBookingCancellation(booking); setActionNotice(`تم إرسال طلب إلغاء الحجز ${booking.referenceCode}.`); };
  const saveProfile = async (fullName: string, email: string | null, language: 'ar' | 'en') => { const updated = await apiClient.updateProfile(fullName, email, language); setProfile(updated); setSnapshot((current) => current ? { ...current, profile: updated } : current); };
  const savePreferences = async (preferences: NotificationPreferences) => { const saved = await apiClient.updateNotificationPreferences(preferences); setSnapshot((current) => current ? { ...current, notificationPreferences: saved } : current); return saved; };
  const markRead = async (notificationId?: string) => { await apiClient.markNotificationsRead(notificationId); setSnapshot((current) => current ? { ...current, notifications: current.notifications.map((item) => !notificationId || item.id === notificationId ? { ...item, isRead: true } : item) } : current); };
  const openNotificationBooking = (bookingId: string) => { const booking = bookings.find((item) => item.id === bookingId); if (booking) selectBooking(booking); else setActionError('الحجز المرتبط بهذا الإشعار غير موجود في السجل الحالي.'); };

  let page: React.ReactNode;
  if (route.page === 'service') {
    page = selectedService ? <ServiceDetailsPage service={selectedService} favorite={favoriteIds.has(selectedService.id)} canReview={bookings.some((item) => item.serviceId === selectedService.id && item.status === 'Completed')} onBack={() => navigate(portalHash('services'))} onBook={setBookingService} onFavorite={toggleFavorite} onOffice={() => selectOffice(selectedService.office)} /> : <DataUnavailable loading={portalLoading} message="الخدمة غير موجودة أو لم تعد منشورة." onRetry={() => void loadPortal(profile)} />;
  } else if (route.page === 'office') {
    page = selectedOffice ? <OfficeProfilePage office={selectedOffice} services={catalog.services} favoriteIds={favoriteIds} onBack={() => navigate(portalHash('services'))} onSelectService={selectService} onFavorite={toggleFavorite} /> : <DataUnavailable loading={portalLoading} message="المكتب غير موجود أو غير معتمد حاليًا." onRetry={() => void loadPortal(profile)} />;
  } else if (route.page === 'booking') {
    page = selectedBooking ? <BookingDetailsPage booking={selectedBooking} onBack={() => navigate(portalHash('bookings'))} onRequestCancellation={requestCancellation} onSupport={(booking) => setSupportBooking(booking)} onOpenService={selectedBooking.serviceId && catalog.services.some((item) => item.id === selectedBooking.serviceId) ? () => navigate(serviceHash(selectedBooking.serviceId!)) : undefined} /> : <DataUnavailable loading={portalLoading} message="الحجز غير موجود في حسابك." onRetry={() => void loadSnapshot()} />;
  } else if (route.page === 'favorites') {
    page = <ServicesPage services={catalog.services} offices={catalog.offices} initialKind={null} favoritesOnly favoriteIds={favoriteIds} onSelectService={selectService} onFavorite={toggleFavorite} onSelectOffice={selectOffice} />;
  } else if (route.tab === 'home') {
    page = <HomePage services={catalog.services} offices={catalog.offices} ads={catalog.ads} favoriteIds={favoriteIds} onSelectService={selectService} onFavorite={toggleFavorite} onSelectOffice={selectOffice} onBrowseServices={browseServices} onOpenFavorites={() => navigate(favoritesHash())} />;
  } else if (route.tab === 'services') {
    page = <ServicesPage services={catalog.services} offices={catalog.offices} initialKind={selectedKind} favoriteIds={favoriteIds} onSelectService={selectService} onFavorite={toggleFavorite} onSelectOffice={selectOffice} />;
  } else if (!snapshot) {
    page = <DataUnavailable loading={portalLoading} message={portalError || 'لم تكتمل قراءة بيانات الحساب.'} onRetry={() => void loadPortal(profile, false)} />;
  } else if (route.tab === 'bookings') {
    page = <BookingsPage bookings={bookings} onOpenBooking={selectBooking} onBrowseServices={() => browseServices()} />;
  } else {
    page = <AccountPage profile={profile} stats={snapshot.stats || emptyStats} bookings={bookings} unreadCount={unreadCount} favoriteCount={snapshot.favorites.length} notificationPreferences={snapshot.notificationPreferences || emptyPreferences} onSaveProfile={saveProfile} onSaveNotificationPreferences={savePreferences} onSupport={(subject, message) => apiClient.submitSupport(subject, message)} onRequestAccountClosure={() => apiClient.requestAccountClosure()} onNotifications={() => setShowNotifications(true)} onFavorites={() => navigate(favoritesHash())} onLogout={logout} />;
  }

  return <PortalShell profile={profile} activeTab={route.tab} unreadCount={unreadCount} onTabChange={changeTab} onNotifications={() => setShowNotifications(true)} onLogout={logout}>
    {catalogError ? <div className="global-alert" role="alert">{catalogError}</div> : null}{actionError ? <div className="global-alert" role="alert">{actionError}<button type="button" onClick={() => setActionError('')}>×</button></div> : null}{actionNotice ? <div className="global-success" role="status">{actionNotice}<button type="button" onClick={() => setActionNotice('')}>×</button></div> : null}
    <Suspense fallback={<PageLoader />}><div key={window.location.hash || route.tab} className="route-stage">{page}</div></Suspense>
    {bookingService ? <Suspense fallback={null}><BookingDialog service={bookingService} travelerName={profile.fullName} onClose={() => setBookingService(null)} onSubmit={createBooking} onViewBookings={(booking) => { setBookingService(null); selectBooking(booking); }} /></Suspense> : null}
    {showNotifications ? <NotificationsPanel notifications={notifications} onClose={() => setShowNotifications(false)} onMarkRead={markRead} onOpenBooking={openNotificationBooking} /> : null}
    {supportBooking !== undefined ? <SupportDialog booking={supportBooking} onClose={() => setSupportBooking(undefined)} onSubmit={apiClient.submitSupport} /> : null}
  </PortalShell>;
}
