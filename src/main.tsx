import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { StoreProvider } from './StoreContext';
import './index.css';
import 'leaflet/dist/leaflet.css';
import ErrorBoundary from './components/ErrorBoundary';
import { auth, signOutUser } from './firebase'; // Explicit static import to fix architecture warning

// Auth Interceptor: Automatically injects token into every fetch request
try {
  if (!(window.fetch as any)._isWrapped) {
    const originalFetch = window.fetch.bind(window);
    let refreshPromise: Promise<string | null> | null = null;

    const performRefresh = async (): Promise<string | null> => {
        try {
            const currentToken = localStorage.getItem('hgs_token');

            // Set a timeout to prevent infinite hang
            const readyPromise = typeof auth.authStateReady === 'function' ? auth.authStateReady() : Promise.resolve();
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
        if (typeof input === 'string') {
          inputUrl = input;
        } else if (input instanceof URL) {
          inputUrl = input.toString();
        } else if (input instanceof Request) {
          inputUrl = input.url;
        }

        // 1. Auto-correct hardcoded localhost URLs to relative
        if (inputUrl && inputUrl.includes('localhost:3000')) {
          console.warn('[Fetch Interceptor] Auto-correcting localhost:', inputUrl);
          inputUrl = inputUrl.replace(/https?:\/\/localhost:3000/, '');
          if (inputUrl === '') inputUrl = '/';
        }
        
        // 1b. Support spaces / URL-encoded spaces and absolute url transformations
        if (inputUrl) {
          if (inputUrl.includes(' ') || inputUrl.includes('%20')) {
            console.warn('[Fetch Interceptor] Auto-correcting malformed concatenated URL:', inputUrl);
            const decoded = decodeURIComponent(inputUrl);
            const parts = decoded.split(/\s+/).map(p => p.trim()).filter(Boolean);
            if (parts.length > 0) {
              const apiPart = parts.find(p => p.startsWith('/api/') || p.startsWith('api/'));
              inputUrl = apiPart || parts[0];
            }
          }
          if (inputUrl.startsWith('api/')) {
            inputUrl = '/' + inputUrl;
          }
          // Prepend absolute window location origin if it is a relative API route
          if (inputUrl.startsWith('/api/') && typeof window !== 'undefined' && window.location) {
            inputUrl = `${window.location.origin}${inputUrl}`;
          }
        }
        
        // 2. Identify request type
        const isExternal = inputUrl.startsWith('http') && !inputUrl.includes(window.location.host);
        
        // 3. Skip interception for external APIs (like Firebase Auth) or if it's already an absolute URL to another domain
        if (isExternal) {
          return originalFetch(input, init);
        }

        // 4. Wrap the request to inject Authorization header
        const executeFetch = async (token: string | null) => {
          let requestInit = (init || {}) as any;
          requestInit.credentials = 'include'; // Ensure cookies are sent
          
          if (input instanceof Request) {
            requestInit = {
              method: input.method,
              body: input.body,
              credentials: 'include', // Ensure cookies are sent
              cache: input.cache,
              redirect: input.redirect,
              referrer: input.referrer,
              mode: input.mode,
              ...init
            };
          }

          const headers = new Headers(requestInit.headers || (input instanceof Request ? input.headers : {}));
          
          if (token && !headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${token}`);
          }

          // Use the modified URL string if it was corrected, otherwise use original input
          const wasCorrected = inputUrl && (typeof input === 'string' ? input !== inputUrl : true);
          const finalInput = wasCorrected ? inputUrl : input;
          const finalInit = { ...requestInit, headers };

          return await originalFetch(finalInput, finalInit);
        };

        // 5. Initial attempt
        const initialToken = localStorage.getItem('hgs_token');
        let response = await executeFetch(initialToken);

        // 6. Handle 401 unauthorized (Token Refresh Logic)
        const isAuthMe = inputUrl.includes('/api/auth/me');
        const isAuthLogin = inputUrl.includes('/api/auth/firebase-login');

        if (response.status === 401 && !isAuthMe && !isAuthLogin) {
          console.warn(`[AUTH INTERCEPTOR] 401 for ${inputUrl}. Attempting refresh...`);
          
          if (!refreshPromise) {
            refreshPromise = performRefresh();
          }

          try {
            const newToken = await refreshPromise;
            if (newToken) {
              return await executeFetch(newToken);
            }
          } catch (refreshErr) {
            console.error('[AUTH INTERCEPTOR] Refresh failed definitely');
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

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister().then((success) => {
        if (success) {
          console.log('[SW] Cleanly unregistered persistent stale service worker.');
        }
      });
    }
  }).catch((err) => {
    console.warn('[SW] Failed to fetch registrations for automatic clean:', err);
  });
}

