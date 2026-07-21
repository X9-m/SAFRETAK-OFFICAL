import { Bell, CalendarCheck2, Compass, Home, LogOut, Map, ShieldCheck, UserRound } from 'lucide-react';
import type { AppProfile } from '../types';
import { APP_VERSION } from '../version';

export type PortalTab = 'home' | 'services' | 'bookings' | 'account';

interface PortalShellProps {
  profile: AppProfile;
  activeTab: PortalTab;
  unreadCount: number;
  children: React.ReactNode;
  onTabChange: (tab: PortalTab) => void;
  onNotifications: () => void;
  onLogout: () => void;
}

const tabs = [
  { id: 'home' as const, label: 'الرئيسية', icon: Home },
  { id: 'services' as const, label: 'الخدمات', icon: Compass },
  { id: 'bookings' as const, label: 'حجوزاتي', icon: CalendarCheck2 },
  { id: 'account' as const, label: 'حسابي', icon: UserRound },
];

export function PortalShell({ profile, activeTab, unreadCount, children, onTabChange, onNotifications, onLogout }: PortalShellProps) {
  const initials = profile.fullName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('') || 'س';
  return (
    <div className="portal-page" dir="rtl">
      <div className="lattice" aria-hidden="true" />
      <header className="portal-header">
        <div className="portal-brand">
          <div className="portal-logo-frame"><img src="/safretak-logo.svg" alt="شعار سفرتك" /><span>JO</span></div>
          <div><strong>سفرتك</strong><small>منصة السفر والسياحة الأردنية</small></div>
        </div>
        <div className="portal-user-cluster">
          <button type="button" className="portal-user-summary" onClick={() => onTabChange('account')} aria-label="فتح الحساب">
            <span className="portal-avatar">{initials}</span>
            <span><strong>{profile.fullName || 'مسافر سفرتك'}</strong><small>{profile.phone}</small></span>
          </button>
          <button type="button" className="icon-button notification-button" onClick={onNotifications} aria-label={unreadCount ? `الإشعارات، ${unreadCount} غير مقروء` : 'الإشعارات'}>
            <Bell size={19} />{unreadCount > 0 ? <span aria-hidden="true">{unreadCount > 9 ? '9+' : unreadCount}</span> : null}
          </button>
          <button type="button" className="icon-button desktop-logout" onClick={onLogout} aria-label="تسجيل الخروج"><LogOut size={18} /></button>
        </div>
      </header>

      <div className="portal-workspace">
        <aside className="portal-sidebar" aria-label="مساحة عمل المسافر">
          <div className="sidebar-heading"><span>WORKSPACE</span><strong>بوابة المسافر</strong></div>
          <nav className="sidebar-nav" aria-label="التنقل الرئيسي">
            {tabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" className={activeTab === id ? 'active' : ''} onClick={() => onTabChange(id)} aria-current={activeTab === id ? 'page' : undefined}><Icon size={18} /><span>{label}</span></button>)}
          </nav>
          <div className="sidebar-assurance"><ShieldCheck size={18} /><div><strong>حجوزات موثقة</strong><small>كل طلب مرتبط بحسابك ومكتب السياحة.</small></div></div>
          <div className="sidebar-currency"><Map size={17} /><div><strong>الأردن</strong><small>العملة الأساسية: الدينار الأردني</small></div></div><small className="sidebar-version">SAFRETAK v{APP_VERSION}</small>
          <button type="button" className="sidebar-logout" onClick={onLogout}><LogOut size={17} />تسجيل الخروج</button>
        </aside>

        <main id="portal-content" className="portal-content" tabIndex={-1}>{children}</main>
      </div>

      <nav className="bottom-nav" aria-label="التنقل الرئيسي للموبايل">
        {tabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" className={activeTab === id ? 'active' : ''} onClick={() => onTabChange(id)} aria-current={activeTab === id ? 'page' : undefined}><Icon size={20} /><span>{label}</span></button>)}
      </nav>
    </div>
  );
}
