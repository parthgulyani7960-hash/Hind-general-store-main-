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
    let refreshPromise: Promise<string | null> | null = null;
    let failedRefreshAttempts = 0;
    const MAX_REFRESH_ATTEMPTS = 2;

    const performRefresh = async (): Promise<string | null> => {
        try {
            await auth.authStateReady();
            const user = auth.currentUser;
            if (user) {
              const newToken = await user.getIdToken(true);
              localStorage.setItem('hgs_token', newToken);
              return newToken;
            } else {
              if (localStorage.getItem('hgs_token')) {
                localStorage.removeItem('hgs_token');
                localStorage.removeItem('hgs_user');
              }
              return null;
            }
        } catch (err) {
            failedRefreshAttempts++;
            if (failedRefreshAttempts >= MAX_REFRESH_ATTEMPTS) {
                localStorage.removeItem('hgs_token');
                localStorage.removeItem('hgs_user');
            }
            throw err;
        } finally {
            refreshPromise = null;
        }
    };

    Object.defineProperty(window, 'fetch', {
      value: async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const inputUrl = typeof input === 'string' ? input : (input as Request).url || input.toString();
        
        const isReporting = inputUrl.includes('/api/bugs/report');
        const isFirebaseAuth = inputUrl.includes('identitytoolkit.googleapis.com') || inputUrl.includes('securetoken.googleapis.com') || inputUrl.includes('googleapis.com');
        const isLocalAuth = inputUrl.includes('/api/auth/');

        // Bypass interceptor completely for Firebase / external Google APIs
        if (isFirebaseAuth) {
            return originalFetch(input, init);
        }

        const getHeaders = (token: string | null) => {
          let baseHeaders;
          if (init?.headers) {
            baseHeaders = init.headers;
          } else if (typeof input === 'object' && 'headers' in input) {
            baseHeaders = (input as Request).headers;
          }
          const headers = new Headers(baseHeaders || {});
          
          if (token) {
            headers.set('Authorization', `Bearer ${token}`);
          }
          return headers;
        };

        const executeFetch = async (token: string | null) => {
          let fetchOptions = { ...init, headers: getHeaders(token) };
          if (typeof input === 'object' && input instanceof Request) {
             return originalFetch(input, fetchOptions);
          } else {
             return originalFetch(input, fetchOptions);
          }
        };

        // If a refresh is already in progress, wait for it before even sending the request
        if (refreshPromise) {
            try {
                const refreshedToken = await refreshPromise;
                return executeFetch(refreshedToken);
            } catch (err) {
                // If refresh failed, proceed without token or just fail
            }
        }

        const initialToken = localStorage.getItem('hgs_token');
        let response = await executeFetch(initialToken);

        // Handle 401: Unexpected session loss or expired token
        if (response.status === 401 && !isLocalAuth && !isReporting && !isFirebaseAuth) {
          console.warn(`[AUTH INTERCEPTOR] 401 for ${inputUrl}. Attempting token refresh...`);
          
          if (failedRefreshAttempts >= MAX_REFRESH_ATTEMPTS) {
              console.warn('[AUTH INTERCEPTOR] Max backend 401s reached. Clearing invalid session.');
              localStorage.removeItem('hgs_token');
              localStorage.removeItem('hgs_user');
              try { await signOutUser(); } catch(e) {}
              // Force reload to clear all state if we are truly deadlocked
              if (!inputUrl.includes('/api/auth/me')) {
                  window.location.href = '/login';
              }
              return response; 
          }

          if (!refreshPromise) {
              refreshPromise = performRefresh();
          }

          try {
              const newToken = await refreshPromise;
              if (newToken) {
                  console.log(`[AUTH INTERCEPTOR] Token refreshed. Retrying ${inputUrl}...`);
                  response = await executeFetch(newToken);
                  
                  if (response.status === 401) {
                      // Backend STILL returned 401 after forced refresh
                      console.error(`[AUTH INTERCEPTOR] Backend rejected freshly minted token. Aborting.`);
                      failedRefreshAttempts++;
                      if (failedRefreshAttempts >= MAX_REFRESH_ATTEMPTS) {
                          localStorage.removeItem('hgs_token');
                          localStorage.removeItem('hgs_user');
                          try { await signOutUser(); } catch(e) {}
                          if (!inputUrl.includes('/api/auth/me')) {
                              window.location.href = '/login';
                          }
                      }
                  } else {
                      failedRefreshAttempts = 0; // Success, we can reset the backend 401 counter
                  }
              }
          } catch (refreshErr) {
              console.error('[AUTH INTERCEPTOR] Refresh failed:', refreshErr);
          }
        }

        if (!response.ok && !isReporting) {
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
