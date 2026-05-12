import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { StoreProvider } from './StoreContext';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary';
import { reportError, flushQueue } from './lib/errorReporter';

// Global interaction tracker
let lastInteractedElement = 'None';
window.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  lastInteractedElement = `${target.tagName}#${target.id}.${target.className}`;
}, true);

// Global Error Handlers
window.addEventListener('error', (event) => {
  reportError({
    message: event.message,
    path: window.location.pathname,
    interactedElement: lastInteractedElement,
    logs: [event.error?.stack || 'No stack']
  });
});

window.addEventListener('unhandledrejection', (event) => {
  reportError({
    message: event.reason?.message || 'Unhandled Rejection',
    path: window.location.pathname,
    interactedElement: lastInteractedElement,
    logs: [JSON.stringify(event.reason)]
  });
});

window.addEventListener('online', flushQueue);

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
        return originalFetch(input, { ...init, headers }).then(async (response) => {
          if (!response.ok) {
            reportError({
              message: `HTTP error! status: ${response.status}`,
              path: window.location.pathname,
              interactedElement: String(input),
              logs: [`Status: ${response.status}`]
            });
            const error = new Error(`HTTP error! status: ${response.status}`);
            (error as any).response = response;
            throw error;
          }
          return response;
        });
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
