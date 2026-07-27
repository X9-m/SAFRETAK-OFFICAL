import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { KeyRound, Loader2, LogIn, MessageSquareText, ShieldCheck } from 'lucide-react';
import { ExtendedRoleApp, PortalFeatureDock } from './ExtendedRoleApp';
import { RoleApp } from './RoleApp';
import { readRoleToken, rolePortalClient } from './services/rolePortalClient';

type PortalRole = 'office' | 'admin';
type RolePage = 'portal' | 'customers' | 'accounting' | 'billing';

const OFFICE_TABS = new Set(['overview', 'services', 'bookings', 'employees', 'finance', 'profile']);
const ADMIN_TABS = new Set(['overview', 'offices', 'users', 'bookings', 'services', 'complaints', 'support', 'ads', 'categories', 'settings']);

function PortalRouteBridge({ expectedRole }: { expectedRole: PortalRole }) {
  useEffect(() => {
    const allowed = expectedRole === 'office' ? OFFICE_TABS : ADMIN_TABS;
    const applyUrlTab = () => {
      const tab = new URLSearchParams(window.location.search).get('tab');
      if (tab && allowed.has(tab)) {
        window.dispatchEvent(new CustomEvent('role-tab-change', { detail: tab }));
      }
    };
    const timer = window.setTimeout(applyUrlTab, 0);
    const onTabChange = (event: Event) => {
      const tab = (event as CustomEvent<string>).detail;
      if (!allowed.has(tab)) return;
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState(null, '', url);
    };
    window.addEventListener('role-tab-change', onTabChange);
    window.addEventListener('popstate', applyUrlTab);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('role-tab-change', onTabChange);
      window.removeEventListener('popstate', applyUrlTab);
    };
  }, [expectedRole]);
  return null;
}

function PasswordLogin({ expectedRole, onAuthenticated, onUseOtp }: { expectedRole: PortalRole; onAuthenticated: () => void; onUseOtp: () => void }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await rolePortalClient.loginWithPassword(phone, password, expectedRole);
      setPassword('');
      onAuthenticated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تسجيل الدخول.');
    } finally {
      setBusy(false);
    }
  };

  return <main className="role-auth-page" dir="rtl">
    <div className="lattice" aria-hidden="true" />
    <section className="auth-card role-auth-card screen-enter">
      <header className="brand">
        <div className="logo-circle"><img src="/safretak-logo.jpeg" alt="شعار سفرتك" className="app-logo" /></div>
        <h1>سفرتك</h1>
        <p>{expectedRole === 'office' ? 'بوابة مكاتب السياحة' : 'لوحة إدارة المنصة'}</p>
      </header>
      <div className="login-heading"><ShieldCheck size={22} /><div><h2>دخول الحساب المحمي</h2><p>{expectedRole === 'office' ? 'استخدم رقم مدير المكتب وكلمة المرور المرتبطة به.' : 'هذه البوابة مخصصة لحسابات إدارة سفرتك فقط.'}</p></div></div>
      <form className="form-area" onSubmit={submit}>
        <label className="field-group"><span>رقم الهاتف</span><div className="input-box"><input type="tel" dir="ltr" value={phone} onChange={(event) => setPhone(event.target.value.replace(/[^+\d\s()-]/g, '').slice(0, 18))} placeholder="07XXXXXXXX" autoComplete="username" disabled={busy} autoFocus /><LogIn size={17} /></div></label>
        <label className="field-group"><span>كلمة المرور</span><div className="input-box"><input type="password" dir="ltr" value={password} onChange={(event) => setPassword(event.target.value.slice(0, 128))} minLength={10} maxLength={128} autoComplete="current-password" disabled={busy} /><KeyRound size={17} /></div></label>
        {error ? <div className="login-alert" role="alert">{error}</div> : null}
        <button className="gold-button" type="submit" disabled={busy || phone.length < 9 || password.length < 10}>{busy ? <Loader2 className="spin" size={17} /> : <LogIn size={17} />}تسجيل الدخول</button>
        <button className="plain-button" type="button" onClick={onUseOtp} disabled={busy}><MessageSquareText size={17} />الدخول برمز الهاتف بدلًا من ذلك</button>
      </form>
      <footer className="secure-note"><ShieldCheck size={15} /><span>كلمة المرور مشفّرة داخل قاعدة البيانات، والجلسة منفصلة حسب نوع الحساب.</span></footer>
    </section>
  </main>;
}

export function RoleEntry({ expectedRole, page = 'portal' }: { expectedRole: PortalRole; page?: RolePage }) {
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [useOtp, setUseOtp] = useState(false);

  useEffect(() => {
    let active = true;
    const check = async () => {
      if (!readRoleToken(expectedRole)) {
        if (active) { setHasSession(false); setChecking(false); }
        return;
      }
      const profile = await rolePortalClient.getCurrentProfile(expectedRole).catch(() => null);
      if (active) { setHasSession(Boolean(profile)); setChecking(false); }
    };
    void check();
    const onCleared = (event: Event) => {
      if ((event as CustomEvent<PortalRole>).detail !== expectedRole) return;
      setHasSession(false);
      setUseOtp(false);
      setChecking(false);
    };
    window.addEventListener('role-session-cleared', onCleared);
    return () => {
      active = false;
      window.removeEventListener('role-session-cleared', onCleared);
    };
  }, [expectedRole]);

  const content = useMemo(() => {
    if (page === 'customers') return <ExtendedRoleApp page="customers" role="office" />;
    if (page === 'accounting') return <ExtendedRoleApp page="accounting" role="office" />;
    if (page === 'billing') return <ExtendedRoleApp page="billing" role="admin" />;
    return <><RoleApp expectedRole={expectedRole} /><PortalRouteBridge expectedRole={expectedRole} /></>;
  }, [expectedRole, page]);

  if (checking) return <main className="loading-screen"><div className="loading-logo"><Loader2 className="spin" size={34} /><span className="loading-name">سفرتك</span></div></main>;
  if (!hasSession && !useOtp) return <PasswordLogin expectedRole={expectedRole} onAuthenticated={() => setHasSession(true)} onUseOtp={() => setUseOtp(true)} />;

  return <>{content}<PortalFeatureDock role={expectedRole} /></>;
}
