import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { PrivacyPage, SupportPage } from './pages/PublicInfoPage';
import './styles/index.css';

const AuthenticatedApp = lazy(() => import('./AuthenticatedApp'));
const publicPages = {
  '/privacy': PrivacyPage,
  '/support': SupportPage,
};
const PublicPage = publicPages[window.location.pathname];

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {PublicPage ? (
        <PublicPage />
      ) : (
        <Suspense fallback={null}>
          <AuthenticatedApp />
        </Suspense>
      )}
    </BrowserRouter>
  </React.StrictMode>
);
