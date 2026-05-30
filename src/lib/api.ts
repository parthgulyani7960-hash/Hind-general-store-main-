import toast from 'react-hot-toast';
import { errorService, ErrorType } from './errorReporting';

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
  ok: boolean;
}

export const fetchWithHandling = async <T>(
  url: string,
  options: RequestInit = {},
  retries = 2
): Promise<T | null> => {
  const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
  if (isOffline) {
    console.warn(`[API] Suppressed fetch to ${url} (Browser Offline)`);
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    // Global fetch is now wrapped in main.tsx, so it handles token injection and retries
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!res.ok) {
        let errorMessage = `Error: ${res.status}`;
        let detailedError = '';
        try {
            const data = await res.json();
            errorMessage = data.message || errorMessage;
            detailedError = data.error || '';
        } catch {}
        
        if (res.status === 404) {
          console.warn(`[API] Resource not found: ${url}`);
          // Only use generic message if server didn't provide one
          if (!errorMessage || errorMessage.includes('Error:')) {
            errorMessage = "Requested resource not found";
          }
        } else if (res.status === 401) {
          // Check if user has an auth token. If not, they are just a guest, don't spam.
          const currentToken = localStorage.getItem('hgs_token');
          if (!currentToken) {
            return null; // Silent for guests
          }
          
          // Token is likely invalid/expired, clear it
          localStorage.removeItem('hgs_token');

          // 401 is handled by main.tsx fetch wrapper (token refresh). 
          // If it still reaches here, it means refresh failed or was not possible.
          const silentEndpoints = [
            '/api/auth/me',
            '/api/products',
            '/api/categories',
            '/api/admin/stats',
            '/api/settings',
            '/api/promotions',
            '/api/bulk-discounts',
            '/api/config',
            '/api/analytics'
          ];
          
          const isSilent = silentEndpoints.some(endpoint => url.includes(endpoint));
          
          if (isSilent) return null;

          console.warn(`[API] 401 Unauthorized for ${url}`);
          errorMessage = "Session expired";
          
          // Signal global auth error only once every 30 seconds to prevent toast flooding
          const lastErr = window.sessionStorage.getItem('last_auth_error');
          if (!lastErr || Date.now() - Number(lastErr) > 30000) {
            window.sessionStorage.setItem('last_auth_error', String(Date.now()));
            window.dispatchEvent(new CustomEvent('auth_error', { detail: { url } }));
          }
          
          // Return null for read operations that failed with 401 to prevent UI crashes
          if (options.method === 'GET' || !options.method) return null;
        } else if (res.status === 403) {
          errorMessage = "You do not have permission to perform this action";
        } else if (res.status === 429 || res.status >= 500) {
          if (retries > 0) {
            const delay = res.status === 429 ? 3000 : 1000;
            console.log(`[API] Retrying ${url} due to ${res.status} error. Retries left: ${retries - 1}`);
            await new Promise(r => setTimeout(r, delay));
            return fetchWithHandling(url, options, retries - 1);
          }

          errorMessage = res.status === 429 ? "Too many requests. Please slow down." : "Server error. Please try again later.";
          
          // Centralized Error Boundary Categorization for Firebase backend unreachable
          const isFirebaseUnreachable = 
            (detailedError && /firebase|credential|firestore|database|connect/i.test(detailedError)) || 
            (errorMessage && /firebase|credential|firestore|database|connect/i.test(errorMessage));

          if (isFirebaseUnreachable) {
            console.error(`[API] Centralized Error Boundary categorized unreachable Firebase backend at ${url} (${res.status}): ${errorMessage}`);
            errorMessage = "Database connection unstable. Please try again.";
            
            // Dispatch event to warn but don't force lock UI
            window.dispatchEvent(new CustomEvent('database_error', { 
              detail: { url, status: res.status, message: errorMessage } 
            }));
          }

          // Return null for read operations to prevent blank white page crashes under rate limits or server errors
          if (options.method === 'GET' || !options.method) {
            console.warn(`[API] Returning null for failed GET ${url} on status ${res.status}`);
            return null;
          }
        }

        const finalError = new Error(errorMessage);
        (finalError as any).status = res.status;
        (finalError as any).details = detailedError;
        throw finalError;
    }
    
    return await res.json();
  } catch (err: any) {
    if (retries > 0 && (err.name === 'AbortError' || err.message?.includes('Failed to fetch') || err.message?.includes('network'))) {
      console.log(`[API] Retrying ${url} due to network error. Retries left: ${retries - 1}`);
      await new Promise(r => setTimeout(r, 1000));
      return fetchWithHandling(url, options, retries - 1);
    }
    console.error(`API Error [${url}]:`, err);
    
    // Check if it's a network offline/unreachable error
    const isNetworkError = err instanceof TypeError || 
                           err.name === 'AbortError' ||
                           err.message?.includes('Fetch') || 
                           err.message?.includes('network') || 
                           err.message?.includes('Failed to fetch') || 
                           err.message?.includes('aborted');

    if (isNetworkError) {
      console.warn(`[API] Network offline or unreachable endpoint at ${url}`);
      // Do not trigger global maintenance block for temporary fetch drops
    }

    // Silent for background/common checks
    const isPassiveGet = options.method === 'GET' || !options.method;
    const isBackground = isNetworkError || 
                       url.includes('/api/auth/me') || 
                       url.includes('/api/alerts') || 
                       url.includes('/api/notifications') ||
                       url.includes('/runner-location') ||
                       url.includes('/api/cart/sync') ||
                       url.includes('/api/admin/stats') ||
                       url.includes('/api/settings') ||
                       url.includes('/api/categories') ||
                       url.includes('/api/promotions') ||
                       url.includes('/api/promotions-rules') ||
                       url.includes('/api/bulk-discounts') ||
                       url.includes('/api/user/export-status') ||
                       url.includes('/api/user/deletion-request');

    const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
    if ((!isBackground || !isPassiveGet) && err.status !== 401 && !isOffline) {
        toast.error(err.message || 'Something went wrong');
        errorService.report({
          type: ErrorType.API_ERROR,
          message: err.message || 'API Request Failed',
          metadata: { url, status: err.status, details: err.details }
        });
    }
    
    // We throw to allow specific pages to handle errors if they want, 
    // but we return null for most common use cases.
    return null;
  }
};
