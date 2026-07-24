import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './role-portal.css';
import './smart-features.css';
import './business-portals.css';

const App = lazy(() => import('./App.tsx'));
const RoleApp = lazy(() => import('./RoleApp.tsx').then((module) => ({ default: module.RoleApp })));
const ExtendedRoleApp = lazy(() => import('./ExtendedRoleApp.tsx').then((module) => ({ default: module.ExtendedRoleApp })));
const PortalFeatureDock = lazy(() => import('./ExtendedRoleApp.tsx').then((module) => ({ default: module.PortalFeatureDock })));

const path = window.location.pathname.replace(/\/+$/, '') || '/';
const application = path === '/office/customers'
  ? <ExtendedRoleApp page="customers" role="office" />
  : path === '/office/accounting'
    ? <ExtendedRoleApp page="accounting" role="office" />
    : path === '/admin/billing'
      ? <ExtendedRoleApp page="billing" role="admin" />
      : path.startsWith('/office')
        ? <><RoleApp expectedRole="office" /><PortalFeatureDock role="office" /></>
        : path.startsWith('/admin')
          ? <><RoleApp expectedRole="admin" /><PortalFeatureDock role="admin" /></>
          : <App />;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<main className="loading-screen" dir="rtl" aria-live="polite"><p>جاري تحميل سفرتك...</p></main>}>
      {application}
    </Suspense>
  </StrictMode>,
);
