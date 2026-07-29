import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './role-portal.css';
import './smart-features.css';
import './business-portals.css';
import './app-theme.css';

const App = lazy(() => import('./App.tsx'));
const RoleEntry = lazy(() => import('./RoleEntry.tsx').then((module) => ({ default: module.RoleEntry })));

const path = window.location.pathname.replace(/\/+$/, '') || '/';
const application = path === '/office/customers'
  ? <RoleEntry expectedRole="office" page="customers" />
  : path === '/office/accounting'
    ? <RoleEntry expectedRole="office" page="accounting" />
    : path === '/admin/billing'
      ? <RoleEntry expectedRole="admin" page="billing" />
      : path.startsWith('/office')
        ? <RoleEntry expectedRole="office" />
        : path.startsWith('/admin')
          ? <RoleEntry expectedRole="admin" />
          : <App />;

const fallback = (
  <main className="loading-screen" dir="rtl" aria-live="polite" aria-busy="true">
    <div className="loading-card">
      <img className="loading-brand-image" src="/safretak-logo.svg" alt="شعار سفرتك" />
      <div className="loading-copy"><strong>سفرتك</strong><span>جاري تجهيز تجربتك...</span></div>
      <div className="loading-progress" aria-hidden="true"><span /></div>
    </div>
  </main>
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={fallback}>{application}</Suspense>
  </StrictMode>,
);
