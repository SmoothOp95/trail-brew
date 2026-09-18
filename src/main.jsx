import React, { Suspense, lazy, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { PrivacyPage, SupportPage } from './pages/PublicInfoPage';
import MarketingPage from './pages/MarketingPage';
import './styles/index.css';

const AuthenticatedApp = lazy(() => import('./AuthenticatedApp'));

function RoutePresentation() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
    else window.scrollTo(0, 0);
    document.title = ({
      '/': 'Trail Brew — Less admin. More singletrack.',
      '/support': 'Support — Trail Brew',
      '/privacy': 'Privacy policy — Trail Brew',
    })[pathname] || 'Trail Brew — Gauteng MTB';
  }, [pathname, hash]);
  return null;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <RoutePresentation />
      <Routes>
        <Route path="/" element={<MarketingPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="*" element={<Suspense fallback={<p role="status" className="p-8">Opening Trail Brew…</p>}><AuthenticatedApp /></Suspense>} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
