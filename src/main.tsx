import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './role-portal.css';
import './smart-features.css';
import './business-portals.css';
import './app-blue.css';

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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<main className="loading-screen" dir="rtl" aria-live="polite"><p>جاري تحميل سفرتك...</p></main>}>
      {application}
    </Suspense>
  </StrictMode>,
);
