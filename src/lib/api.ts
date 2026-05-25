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
          errorMessage = "Requested resource not found";
        } else if (res.status === 401) {
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
        } else if (res.status >= 500) {
          if (retries > 0) {
            console.log(`[API] Retrying ${url} due to ${res.status} error. Retries left: ${retries - 1}`);
            await new Promise(r => setTimeout(r, 1000));
            return fetchWithHandling(url, options, retries - 1);
          }

          errorMessage = "Server error. Please try again later.";
          
          // Centralized Error Boundary Categorization for Firebase backend unreachable
          const isFirebaseUnreachable = 
            (detailedError && /firebase|credential|firestore|database|connect/i.test(detailedError)) || 
            (errorMessage && /firebase|credential|firestore|database|connect/i.test(errorMessage)) ||
            url.includes('/api/settings') || 
            url.includes('/api/auth/me');

          if (isFirebaseUnreachable) {
            console.error(`[API] Centralized Error Boundary categorized unreachable Firebase backend at ${url} (${res.status}): ${errorMessage}`);
            errorMessage = "Database unreachable. Redirecting to System Maintenance...";
            
            // Dispatch custom event to trigger safe UI redirection to Maintenance Mode
            window.dispatchEvent(new CustomEvent('firebase_unreachable', { 
              detail: { url, status: res.status, message: errorMessage } 
            }));
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
      console.error(`[API] Critical network error or unreachable backend server detected at ${url}`);
      window.dispatchEvent(new CustomEvent('firebase_unreachable', { 
        detail: { url, status: 0, message: err.message } 
      }));
    }

    // Silent for background/common checks
    const isBackground = url.includes('/api/auth/me') || 
                       url.includes('/api/alerts') || 
                       url.includes('/api/notifications') ||
                       url.includes('/runner-location') ||
                       url.includes('/api/cart/sync') ||
                       url.includes('/api/admin/stats') ||
                       url.includes('/api/settings') ||
                       url.includes('/api/user/export-status') ||
                       url.includes('/api/user/deletion-request');

    if (!isBackground && err.status !== 401) {
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
