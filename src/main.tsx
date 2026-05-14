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
    
    // We'll import auth dynamically to avoid any initialization order issues if possible,
    // but main.tsx is the entry point, so we can just use the exported auth from our firebase.ts
    // However, to keep it clean, let's use a dynamic import for the refresh logic only when needed.

    Object.defineProperty(window, 'fetch', {
      value: async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const inputUrl = typeof input === 'string' ? input : (input as Request).url || input.toString();
        
        const getHeaders = (token: string | null) => {
          const headers = new Headers(init?.headers || {});
          if (token) {
            headers.set('Authorization', `Bearer ${token}`);
          }
          return headers;
        };

        const executeFetch = async (token: string | null) => {
          return originalFetch(input, { ...init, headers: getHeaders(token) });
        };

        const isReporting = inputUrl.includes('/api/bugs/report');
        const initialToken = localStorage.getItem('hgs_token');
        let response = await executeFetch(initialToken);

        // Handle 401: Unexpected session loss or expired token
        if (response.status === 401 && !inputUrl.includes('/api/auth/firebase-login') && !isReporting) {
          console.warn(`[AUTH INTERCEPTOR] 401 for ${inputUrl}. Attempting token refresh...`);
          
          try {
            // Dynamically import auth to ensure it's ready
            const { auth } = await import('./firebase');
            
            // Wait for auth to initialize if it's currently null but auth is exported
            // Usually auth.currentUser is available after onAuthStateChanged, 
            // but for immediate direct fetch, we might need to wait or rely on token changed.
            const user = auth.currentUser;
            
            if (user) {
              const newToken = await user.getIdToken(true);
              localStorage.setItem('hgs_token', newToken);
              
              console.log(`[AUTH INTERCEPTOR] Token refreshed. Retrying ${inputUrl}...`);
              // Retry once with new token
              response = await executeFetch(newToken);
            } else {
              console.warn('[AUTH INTERCEPTOR] No user found for refresh. Clearing local session.');
              // Note: Only clear if it was actually trying to access a protected route
              // and we had a token.
              if (initialToken) {
                localStorage.removeItem('hgs_token');
                localStorage.removeItem('hgs_user');
              }
            }
          } catch (refreshErr) {
            console.error('[AUTH INTERCEPTOR] Refresh failed:', refreshErr);
          }
        }

        if (!response.ok && !isReporting) {
          // Only report 500s or unexpected errors to reduce noise
          if (response.status >= 500) {
            reportError({
              message: `HTTP error! status: ${response.status}`,
              path: window.location.pathname,
              interactedElement: String(inputUrl),
              logs: [`Status: ${response.status}`]
            });
          }
        }
        
        return response;
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
