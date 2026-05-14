import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { StoreProvider } from './StoreContext';
import './index.css';
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
    let isRefreshing = false;
    let failedRefreshAttempts = 0;
    const MAX_REFRESH_ATTEMPTS = 2;

    Object.defineProperty(window, 'fetch', {
      value: async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const inputUrl = typeof input === 'string' ? input : (input as Request).url || input.toString();
        
        const isReporting = inputUrl.includes('/api/bugs/report');
        const isFirebaseAuth = inputUrl.includes('identitytoolkit.googleapis.com') || inputUrl.includes('securetoken.googleapis.com');
        const isLocalAuth = inputUrl.includes('/api/auth/');

        const getHeaders = (token: string | null) => {
          const headers = new Headers(init?.headers || {});
          if (token && !isFirebaseAuth) {
            headers.set('Authorization', `Bearer ${token}`);
          }
          return headers;
        };

        const executeFetch = async (token: string | null) => {
          return originalFetch(input, { ...init, headers: getHeaders(token) });
        };

        const initialToken = localStorage.getItem('hgs_token');
        let response = await executeFetch(initialToken);

        // Handle 401: Unexpected session loss or expired token
        if (response.status === 401 && !isLocalAuth && !isReporting && !isFirebaseAuth) {
          console.warn(`[AUTH INTERCEPTOR] 401 for ${inputUrl}. Attempting token refresh...`);
          
          if (isRefreshing || failedRefreshAttempts >= MAX_REFRESH_ATTEMPTS) {
             if (failedRefreshAttempts >= MAX_REFRESH_ATTEMPTS) {
                 console.warn('[AUTH INTERCEPTOR] Max refresh attempts reached. Clearing invalid session.');
                 localStorage.removeItem('hgs_token');
                 localStorage.removeItem('hgs_user');
                 try { await signOutUser(); } catch(e) {}
             }
             return response; // Cannot refresh right now or limit reached
          }

          isRefreshing = true;
          try {
            const user = auth.currentUser;
            
            if (user) {
              const newToken = await user.getIdToken(true);
              localStorage.setItem('hgs_token', newToken);
              
              console.log(`[AUTH INTERCEPTOR] Token refreshed. Retrying ${inputUrl}...`);
              // Provide new token globally for pending requests here if needed
              
              isRefreshing = false;
              failedRefreshAttempts = 0; // Reset
              
              // Retry once with new token
              response = await executeFetch(newToken);
            } else {
              console.warn('[AUTH INTERCEPTOR] No user found for refresh. Clearing local session.');
              if (initialToken) {
                localStorage.removeItem('hgs_token');
                localStorage.removeItem('hgs_user');
              }
              isRefreshing = false;
            }
          } catch (refreshErr) {
            console.error('[AUTH INTERCEPTOR] Refresh failed:', refreshErr);
            failedRefreshAttempts++;
            isRefreshing = false;
            if (failedRefreshAttempts >= MAX_REFRESH_ATTEMPTS) {
                localStorage.removeItem('hgs_token');
                localStorage.removeItem('hgs_user');
            }
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
