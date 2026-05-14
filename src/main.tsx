import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { StoreProvider } from './StoreContext';
import './index.css';
import 'leaflet/dist/leaflet.css';
import ErrorBoundary from './components/ErrorBoundary';
import { reportError, flushQueue } from './lib/errorReporter';
import { auth, signOutUser } from './firebase'; // Explicit static import to fix architecture warning

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
      value: async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        let inputUrl = '';
        try {
          if (typeof input === 'string') {
            inputUrl = input;
          } else if (input instanceof URL) {
            inputUrl = input.toString();
          } else if (input instanceof Request) {
            inputUrl = input.url;
          }
        } catch (e) {}

        // Auto-correct hardcoded localhost URLs to relative
        if (inputUrl && inputUrl.includes('localhost:3000')) {
          console.warn('[Fetch Interceptor] Auto-correcting localhost:', inputUrl);
          inputUrl = inputUrl.replace(/https?:\/\/localhost:3000/, '');
          if (input instanceof Request) {
            input = new Request(inputUrl, init || input);
          } else {
            input = inputUrl;
          }
        }
        
        const isFirebaseAuth = inputUrl && (inputUrl.includes('identitytoolkit.googleapis.com') || inputUrl.includes('securetoken.googleapis.com'));

        if (isFirebaseAuth) {
            return originalFetch(input, init);
        }

        const token = localStorage.getItem('hgs_token');
        if (token) {
           const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : {}));
           if (!headers.has('Authorization')) {
             headers.set('Authorization', `Bearer ${token}`);
             const options = { ...init, headers };
             return originalFetch(input, options);
           }
        }

        return originalFetch(input, init);
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
