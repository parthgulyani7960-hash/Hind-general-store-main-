import {StrictMode, useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { StoreProvider } from './StoreContext';
import './index.css';
import 'leaflet/dist/leaflet.css';
import ErrorBoundary from './components/ErrorBoundary';
import { auth, signOutUser } from './firebase'; // Explicit static import to fix architecture warning

// Privacy / Security Console Redaction
function redactConsole() {
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;
  const originalInfo = console.info;

  const emailRegex = /[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/g;

  function redact(arg: any): any {
    if (typeof arg === 'string') {
      let redacted = arg.replace(emailRegex, '[REDACTED_EMAIL]');
      
      // If we are in production, hide sensitive keywords
      if (import.meta.env.PROD) {
        if (/Firebase|Firestore|Auth|Token|UID|userId|user_id|role|admin|balance|device|ip|timestamp|project|database|credentials|permission/i.test(redacted)) {
          redacted = redacted.replace(/(Firebase|Firestore|Auth|Token|Bearer|getIdToken|authStateReady)/ig, '[PRIVACY_SEC_INTERNAL_SHIELD]');
          redacted = redacted.replace(/(userId|user_id|uid|UID)\s*(?::|=)?\s*([a-zA-Z0-9_-]+)/ig, 'id: [REDACTED_ID]');
          redacted = redacted.replace(/(role\s*(?::|=)?\s*)(["']?admin["']?)/ig, '$1 [REDACTED_ROLE]');
          redacted = redacted.replace(/(balance|wallet|khata)\s*(?::|=)?\s*([\d.]+)/ig, '$1: [REDACTED_BALANCE]');
          redacted = redacted.replace(/(ip|ip_address)\s*(?::|=)?\s*([\d.]+)/ig, '$1: [REDACTED_IP]');
          redacted = redacted.replace(/(timestamp|login_time)\s*(?::|=)?\s*([^,\n}]+)/ig, '$1: [REDACTED_TIMESTAMP]');
          redacted = redacted.replace(/(projectid|projectId|project_id|databaseId|database_id|firestoreDatabaseId)\s*(?::|=)?\s*([a-zA-Z0-9_-]+)/ig, '$1: [REDACTED_METADATA]');
          redacted = redacted.replace(/(permission|role|admin|isUserAdmin|verification|authDecision)\s*(?::|=)?\s*([^,\n}]+)/ig, '$1: [REDACTED_ACCESS_CONTROL]');
        }
      }
      return redacted;
    } else if (arg && typeof arg === 'object') {
      try {
        const str = JSON.stringify(arg);
        if (str) {
          let redactedStr = str.replace(emailRegex, '[REDACTED_EMAIL]');
          if (import.meta.env.PROD) {
            redactedStr = redactedStr.replace(/"(email|userId|user_id|uid|role|wallet_balance|khata_balance|ip|timestamp|firebase|firestore|project_id|projectId|databaseId|database_id|permission|isUserAdmin|admin)"\s*:\s*([^,}]+)/ig, (match, key, val) => {
              const lowerKey = key.toLowerCase();
              if (lowerKey === 'role' || lowerKey.includes('permission') || lowerKey.includes('admin') || lowerKey.includes('useradmin')) {
                return `"${key}":"[REDACTED_ACCESS_CONTROL]"`;
              }
              if (lowerKey.includes('balance')) return `"${key}":"[REDACTED_BALANCE]"`;
              if (lowerKey.includes('id') || lowerKey === 'uid') return `"${key}":"[REDACTED_ID]"`;
              if (lowerKey.includes('ip')) return `"${key}":"[REDACTED_IP]"`;
              if (lowerKey.includes('timestamp')) return `"${key}":"[REDACTED_TIMESTAMP]"`;
              if (lowerKey.includes('firebase') || lowerKey.includes('firestore') || lowerKey.includes('project') || lowerKey.includes('database')) {
                return `"${key}":"[REDACTED_METADATA]"`;
              }
              return `"${key}":"[REDACTED]"`;
            });
          }
          return JSON.parse(redactedStr);
        }
      } catch (e) {
        return '[REDACTED_OBJECT]';
      }
    }
    return arg;
  }

  const wrapLog = (orig: (...args: any[]) => void) => {
    return (...args: any[]) => {
      if (import.meta.env.PROD) {
        return;
      }
      const redactedArgs = args.map(arg => redact(arg));
      orig(...redactedArgs);
    };
  };

  const wrapErrorLog = (orig: (...args: any[]) => void) => {
    return (...args: any[]) => {
      const redactedArgs = args.map(arg => redact(arg));
      orig(...redactedArgs);
    };
  };

  console.log = wrapLog(originalLog);
  console.warn = wrapLog(originalWarn);
  console.info = wrapLog(originalInfo);
  console.error = wrapErrorLog(originalError);
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

