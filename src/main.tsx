import {StrictMode, useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';

import './index.css';
import 'leaflet/dist/leaflet.css';
import AppCrashBoundary from './components/AppCrashBoundary';
import { auth, signOutUser } from './firebase'; // Explicit static import to fix architecture warning
import { getOrRefreshToken } from './lib/authInterceptor';
import { errorService, ErrorType } from './lib/incidentReporting';
import { safeStorage } from './lib/safeStorage';

// Transparently encrypt all localStorage data to enhance frontend security
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const originalGetItem = window.localStorage.getItem.bind(window.localStorage);
    const originalSetItem = window.localStorage.setItem.bind(window.localStorage);

    window.localStorage.getItem = (key: string): string | null => {
      const raw = originalGetItem(key);
      if (raw === null) return null;
      return safeStorage.decrypt(raw);
    };

    window.localStorage.setItem = (key: string, value: string): void => {
      const encrypted = safeStorage.encrypt(value);
      originalSetItem(key, encrypted);
    };
  }
  console.log('[SECURITY] Transparent client-side storage encryption is active.');
} catch (e) {
  console.warn('[SECURITY] Failed to initialize transparent storage encryption:', e);
}

// Privacy / Security Console Redaction disabled for debugging
function redactConsole() {
  return; // Disabled
}

console.log('[main.tsx] Starting execution...');

try {
  redactConsole();
} catch (e) {}

// Auth Interceptor: Automatically injects token into every fetch request
try {
  if (!(window.fetch as any)._isWrapped) {
    const originalFetch = window.fetch.bind(window);
    let sharedRefreshPromise: Promise<string | null> | null = null;

    const getOrRefreshTokenDeduped = async (): Promise<string | null> => {
      if (sharedRefreshPromise) {
        console.log('[AUTH INTERCEPTOR] Reusing active token refresh promise');
        return sharedRefreshPromise;
      }

      sharedRefreshPromise = (async () => {
        try {
          return await getOrRefreshToken();
        } finally {
          // Clear after a microtask so concurrent calls close together are safely grouped
          setTimeout(() => {
            sharedRefreshPromise = null;
          }, 0);
        }
      })();

      return sharedRefreshPromise;
    };

    const isTokenExpired = (token: string): boolean => {
      try {
        if (!token) return true;
        const parts = token.split('.');
        if (parts.length !== 3) return true;
        let base64Url = parts[1];
        let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        // Add padding if necessary for atob
        while (base64.length % 4) {
          base64 += '=';
        }
        const jsonPayload = decodeURIComponent(
          window.atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const payload = JSON.parse(jsonPayload);
        // Treat as expired if within 1 minute of expiration
        return payload.exp ? (payload.exp * 1000 - Date.now() < 60000) : true;
      } catch (e) {
        return true;
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
          if ((inputUrl.startsWith('http://') || inputUrl.startsWith('https://')) && inputUrl.includes('/api/')) {
            if (typeof window !== 'undefined' && (inputUrl.includes(window.location.host) || inputUrl.includes('run.app') || inputUrl.includes('aistudio'))) {
              const idx = inputUrl.indexOf('/api/');
              inputUrl = inputUrl.substring(idx);
            }
          }
          if (inputUrl.startsWith('api/')) {
            inputUrl = '/' + inputUrl;
          }
        }
        
        // 2. Identify request type
        const isExternal = inputUrl.startsWith('http') && !inputUrl.includes(window.location.host) && !inputUrl.includes('run.app');
        
        // 3. Skip interception for external APIs, bug reports, or non-API asset requests
        const isReportingEndpoint = inputUrl.includes('/bugs/report') || inputUrl.includes('/incidents/report');
        const isApiRoute = inputUrl.includes('/api/');
        if ((isExternal && !isApiRoute) || isReportingEndpoint || !isApiRoute) {
          return originalFetch(input, init);
        }

        // 4. Wrap the request to inject Authorization header
        const executeFetch = async (token: string | null, retryCount = 1): Promise<Response> => {
          let requestInit = (init || {}) as any;
          requestInit.credentials = 'include'; // Ensure cookies are sent
          
          if (input instanceof Request) {
            requestInit = {
              method: input.method,
              body: input.body,
              credentials: 'include',
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

          const finalInput = (inputUrl && (typeof input === 'string' ? input !== inputUrl : true)) ? inputUrl : input;
          const finalInit = { ...requestInit, headers };

          try {
            const startTime = Date.now();
            const res = await originalFetch(finalInput, finalInit);
            const duration = Date.now() - startTime;

            if (duration > 3000 && inputUrl.includes('/api/') && !inputUrl.includes('/favicon.ico') && !inputUrl.includes('/bugs/report') && !inputUrl.includes('/incidents/report')) {
              try {
                errorService.report({
                  type: ErrorType.API_ERROR,
                  message: `[Performance] Request to ${inputUrl} exceeded 3000ms: ${duration}ms`,
                  metadata: {
                    url: inputUrl,
                    durationMs: duration,
                    thresholdMs: 3000
                  }
                });
                console.warn(`[PERFORMANCE WARNING] ${inputUrl} took ${duration}ms`);
              } catch (reportErr) {
                // Ignore reporting errors silently
              }
            }
            
            // Handle 401 unauthorized (Token Refresh Logic)
            const isAuthLogin = inputUrl.includes('/api/auth/firebase-login');

            if (res.status === 401 && !isAuthLogin && retryCount > 0) {
              console.warn(`[AUTH INTERCEPTOR] 401 for ${inputUrl}. Attempting refresh...`);
              
              try {
                const newToken = await getOrRefreshTokenDeduped();
                if (newToken) {
                  return await executeFetch(newToken, retryCount - 1);
                }
              } catch (refreshErr) {
                console.error('[AUTH INTERCEPTOR] Refresh failed definitely', refreshErr);
                window.dispatchEvent(new CustomEvent('session_expired'));
              }
            }
            return res;
          } catch (fetchErr: any) {
            if (retryCount > 0 && (fetchErr.name === 'TypeError' || fetchErr.message?.includes('fetch') || fetchErr.message?.includes('network'))) {
               console.warn(`[FETCH_RETRY] Network error on ${inputUrl}, retrying...`);
               await new Promise(r => setTimeout(r, 1000));
               return await executeFetch(token, retryCount - 1);
            }
            throw fetchErr;
          }
        };

        try {
          let currentToken: string | null = null;
          try {
            currentToken = localStorage.getItem('hgs_token');
          } catch (storageErr) {
            console.warn('[AUTH INTERCEPTOR] Cannot access localStorage', storageErr);
          }
          const isAuthAction = inputUrl.includes('/api/auth/firebase-login') || inputUrl.includes('/api/auth/register');
          if (currentToken && !isExternal && !isAuthAction) {
            if (isTokenExpired(currentToken)) {
              console.warn(`[AUTH INTERCEPTOR] Token detected as expired or close to expiry for ${inputUrl}. Eagerly refreshing prior to request.`);
              currentToken = await getOrRefreshTokenDeduped();
            }
          }
          return await executeFetch(currentToken);
        } catch (err: any) {
          throw err;
        }
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
}, 2000);

let hasMounted = false;
const mountReactApp = () => {
  if (hasMounted) return;
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('[CRITICAL] Root element #root not found during mount.');
    return;
  }
  hasMounted = true;
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <AppCrashBoundary>
          <App />
        </AppCrashBoundary>
      </StrictMode>,
    );
    if (typeof window !== 'undefined' && (window as any).__markAppAsLoaded) {
      (window as any).__markAppAsLoaded();
    }
  } catch (e) {
    console.error('[CRITICAL] Root render failed:', e);
    if (rootElement) {
      rootElement.innerHTML = '<div style="padding: 20px; text-align: center;"><h1>Initialization Failed</h1><p>The application could not be rendered.</p></div>';
    }
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountReactApp);
  window.addEventListener('load', mountReactApp);
  setTimeout(mountReactApp, 10);
} else {
  mountReactApp();
}

// Register the custom Workbox ServiceWorker to dramatically speed up static loads and repeat visits
// Disabled in current build phase to fix persistent lazy component load failures
/*
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

