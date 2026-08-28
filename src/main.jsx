import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './hooks/useAuth';
import './styles/index.css';

// The service worker precaches the app shell, so a page opened before a deploy
// keeps rendering the old bundle even after the new worker installs. The worker
// ships with skipWaiting/clientsClaim (registerType: 'autoUpdate'), so it claims
// this page as soon as it activates — reload once at that point to pick up the
// fresh shell. The guard stops the reload from firing more than once.
if ('serviceWorker' in navigator) {
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
