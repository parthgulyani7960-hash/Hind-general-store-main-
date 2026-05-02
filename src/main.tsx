import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { StoreProvider } from './StoreContext';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary';

// Auth Interceptor: Automatically injects token into every fetch request
try {
  if (!(window.fetch as any)._isWrapped) {
    const originalFetch = window.fetch.bind(window);
    Object.defineProperty(window, 'fetch', {
      value: (input: RequestInfo | URL, init?: RequestInit) => {
        const token = localStorage.getItem('hgs_token');
        const headers = new Headers(init?.headers || {});
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }
        return originalFetch(input, { ...init, headers });
      },
      configurable: true,
      writable: true
    });
    (window.fetch as any)._isWrapped = true;
  }
} catch (e) {
  console.warn('Could not override fetch:', e);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <StoreProvider>
        <App />
      </StoreProvider>
    </ErrorBoundary>
  </StrictMode>,
);

/*
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}
*/
