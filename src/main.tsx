import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { RoleApp } from './RoleApp.tsx';
import './index.css';
import './role-portal.css';
import './smart-features.css';

const path = window.location.pathname.replace(/\/+$/, '') || '/';
const application = path.startsWith('/office')
  ? <RoleApp expectedRole="office" />
  : path.startsWith('/admin')
    ? <RoleApp expectedRole="admin" />
    : <App />;

createRoot(document.getElementById('root')!).render(
  <StrictMode>{application}</StrictMode>,
);
