import {StrictMode, useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { StoreProvider } from './StoreContext';
import './index.css';
import 'leaflet/dist/leaflet.css';
import AppCrashBoundary from './components/AppCrashBoundary';
import { auth, signOutUser } from './firebase'; // Explicit static import to fix architecture warning
import { getOrRefreshToken } from './lib/authInterceptor';
import { errorService } from './lib/incidentReporting';

// Privacy / Security Console Redaction disabled for debugging
function redactConsole() {
  return; // Disabled
}

try {
  redactConsole();
} catch (e) {}

// Auth Interceptor: Automatically injects token into every fetch request
try {
  if (!(window.fetch as any)._isWrapped) {
    const originalFetch = window.fetch.bind(window);
    let refreshPromise: Promise<string | null> | null = null;

    const performRefresh = async (): Promise<string | null> => {
        return await getOrRefreshToken();
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

        // Auto-correct hardcoded localhost URLs to relative
        if (inputUrl && inputUrl.includes('localhost:3000')) {
          inputUrl = inputUrl.replace(/https?:\/\/localhost:3000/, '');
          if (inputUrl === '') inputUrl = '/';
        }
        
        if (inputUrl) {
          if (inputUrl.includes(' ') || inputUrl.includes('%20')) {
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
          } else if (headers.has('Authorization')) {
          } else {
          }

          const isRelative = typeof input === 'string' && input.startsWith('/');
          const wasCorrected = inputUrl && (typeof input === 'string' ? input !== inputUrl : true);
          const finalInput = wasCorrected ? inputUrl : input;
          const finalInit = { ...requestInit, headers };

          return await originalFetch(finalInput, finalInit);
        };

        const logFailedRequest = (url: string, status: number | string, isException = false, errorDetail?: any) => {
          const lowerUrl = url.toLowerCase();
          const isRelated = lowerUrl.includes('/profile') || 
                            lowerUrl.includes('/user') || 
                            lowerUrl.includes('/auth') || 
                            lowerUrl.includes('me') ||
                            lowerUrl.includes('/khata') ||
                            lowerUrl.includes('/wallet');
          
          if (isRelated) {
            console.error(`[DIAGNOSTIC CRITICAL] Failed API request to user/profile related endpoint:`, {
              url,
              status,
              isException,
              errorDetail,
              timestamp: new Date().toISOString()
            });
          } else {
            console.warn(`[Fetch Interceptor] Failed API request: ${url} (Status: ${status})`, errorDetail);
          }
        };

        // 5. Initial attempt
        const initialToken = localStorage.getItem('hgs_token');
        let response: Response;
        try {
          response = await executeFetch(initialToken);
        } catch (fetchErr: any) {
          logFailedRequest(inputUrl, 'Network-Error', true, fetchErr.message || fetchErr);
          throw fetchErr;
        }

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
              try {
                response = await executeFetch(newToken);
              } catch (fetchErr: any) {
                logFailedRequest(inputUrl, 'Network-Error-Post-Refresh', true, fetchErr.message || fetchErr);
                throw fetchErr;
              }
            }
          } catch (refreshErr) {
            console.error('[AUTH INTERCEPTOR] Refresh failed definitely');
            window.dispatchEvent(new CustomEvent('session_expired'));
          }
        }

        // Check if response is not ok
        if (!response.ok) {
          const status = response.status;
          const statusText = response.statusText;
          try {
            const clone = response.clone();
            clone.text().then(text => {
              logFailedRequest(inputUrl, status, false, { statusText, responseBody: text });
            }).catch(err => {
              logFailedRequest(inputUrl, status, false, { statusText, parseError: err.message });
            });
          } catch (cloneErr: any) {
            logFailedRequest(inputUrl, status, false, { statusText, cloneError: cloneErr.message });
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
    <AppCrashBoundary>
      <StoreProvider>
        <App />
      </StoreProvider>
    </AppCrashBoundary>
  </StrictMode>,
);

if (typeof window !== 'undefined' && (window as any).__markAppAsLoaded) {
  (window as any).__markAppAsLoaded();
}

/* Disabling ServiceWorker for preview stability
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      console.log('[SW] ServiceWorker registration successful with scope: ', registration.scope);
    }).catch((err) => {
      console.error('[SW] ServiceWorker registration failed: ', err);
    });
  });
}
*/

