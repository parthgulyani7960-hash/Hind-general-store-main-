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

    const performRefresh = async (): Promise<string | null> => {
        try {
            // Set a timeout to prevent infinite hang
            const readyPromise = auth.authStateReady();
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Refresh auth timeout')), 3000)
            );
            try {
                await Promise.race([readyPromise, timeoutPromise]);
            } catch (e) {
                console.warn('Firebase authStateReady timed out during refresh');
            }

            const user = auth.currentUser;
            if (user) {
              const tokenPromise = user.getIdToken(true);
              const tPromise = new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000));
              try {
                const newToken = await Promise.race([tokenPromise, tPromise]) as string;
                localStorage.setItem('hgs_token', newToken);
                return newToken;
              } catch(e) {
                console.warn('getIdToken timed out in performRefresh');
                return null;
              }
            } else {
              localStorage.removeItem('hgs_token');
              localStorage.removeItem('hgs_user');
              return null;
            }
        } catch (err) {
            console.error('[AUTH] Token refresh failed:', err);
            throw err;
        } finally {
            refreshPromise = null;
        }
    };

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
          if (inputUrl === '') inputUrl = '/';
        }
        
        const isFirebaseAuth = inputUrl && (inputUrl.includes('identitytoolkit.googleapis.com') || inputUrl.includes('securetoken.googleapis.com'));
        const isLocalAuthMe = inputUrl && inputUrl.includes('/api/auth/me');
        const isLocalAuthLogin = inputUrl && inputUrl.includes('/api/auth/firebase-login');

        if (isFirebaseAuth) {
            return originalFetch(inputUrl || input, init);
        }

        const executeFetch = async (token: string | null, isRetry = false) => {
          let requestInit = (init || {}) as any;
          if (input instanceof Request) {
            requestInit = {
              method: input.method,
              body: input.body,
              credentials: input.credentials,
              cache: input.cache,
              redirect: input.redirect,
              referrer: input.referrer,
              ...init
            };
          }
          
          if (isRetry) {
             requestInit._retry = true;
          }

          const headers = new Headers(requestInit.headers || (input instanceof Request ? input.headers : {}));
          if (token && !headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${token}`);
          }
          const options = { ...requestInit, headers };
          try {
             return await originalFetch(inputUrl || input, options);
          } catch (err) {
             console.error('[Fetch Network Error]:', err, inputUrl);
             throw err;
          }
        };

        const initialToken = localStorage.getItem('hgs_token');
        let response = await executeFetch(initialToken);

        // Handle 401 unauthorized
        if (response.status === 401 && !isFirebaseAuth && !isLocalAuthMe && !isLocalAuthLogin) {
          if ((init as any)?._retry) {
             console.warn(`[AUTH INTERCEPTOR] Persistence 401 for ${inputUrl}. Giving up.`);
             return response;
          }

          console.warn(`[AUTH INTERCEPTOR] 401 for ${inputUrl}. Attempting refresh...`);
          
          if (!refreshPromise) {
            refreshPromise = performRefresh();
          }

          try {
            const newToken = await refreshPromise;
            if (newToken) {
              console.log(`[AUTH INTERCEPTOR] Refresh success, retrying ${inputUrl}`);
              response = await executeFetch(newToken, true);
            }
          } catch (refreshErr) {
            console.error('[AUTH INTERCEPTOR] Refresh failed definitely');
            if (!isLocalAuthMe && window.location.pathname !== '/login') {
                const lastErr = window.sessionStorage.getItem('last_auth_error');
                if (!lastErr || Date.now() - Number(lastErr) > 30000) {
                    window.sessionStorage.setItem('last_auth_error', String(Date.now()));
                    window.dispatchEvent(new CustomEvent('auth_error', { detail: { url: inputUrl } }));
                }
            }
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

// Add safety timeout to detect hangs in auth state synchronization
setTimeout(() => {
  const root = document.getElementById('root');
  if (root && root.innerText.includes('Synchronizing')) {
    console.warn('[BOOT] Initialization is stalling. Re-triggering readiness.');
    // We can't easily re-trigger the state inside StoreContext from here,
    // but at least we log it and can suggest a page reload or similar.
  }
}, 10000);

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
