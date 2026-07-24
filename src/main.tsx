import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ExtendedRoleApp, PortalFeatureDock } from './ExtendedRoleApp.tsx';
import { RoleApp } from './RoleApp.tsx';
import './index.css';
import './role-portal.css';
import './smart-features.css';
import './business-portals.css';

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
  <StrictMode>{application}</StrictMode>,
);
