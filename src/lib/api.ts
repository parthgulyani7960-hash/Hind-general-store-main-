import toast from 'react-hot-toast';
import { errorService, ErrorType } from './incidentReporting';
import { logger } from './logger';

export class ApiError extends Error {
  constructor(public message: string, public status: number, public details?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

export class RateLimitError extends ApiError {
  constructor(public message: string, public retryAfter: number = 600) {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
  ok: boolean;
}

const fetchWithHandlingInternal = async <T>(
  url: string,
  options: RequestInit = {},
  retries = 2
): Promise<T | null> => {
  logger.debug(`fetchWithHandlingInternal call to: ${url}`);
  let cleanUrl = url;
  if (cleanUrl) {
    if (cleanUrl.includes(' ') || cleanUrl.includes('%20')) {
      logger.warn('Auto-correcting malformed concatenated URL:', cleanUrl);
      const decoded = decodeURIComponent(cleanUrl);
      const parts = decoded.split(/\s+/).map(p => p.trim()).filter(Boolean);
      if (parts.length > 0) {
        const apiPart = parts.find(p => p.startsWith('/api/') || p.startsWith('api/'));
        cleanUrl = apiPart || parts[0];
      }
    }
    if (cleanUrl.startsWith('api/')) {
      cleanUrl = '/' + cleanUrl;
    }
    if (cleanUrl.startsWith('/api/') && typeof window !== 'undefined' && window.location) {
      cleanUrl = `${window.location.origin}${cleanUrl}`;
    }
  }

  const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
  if (isOffline) {
    logger.warn(`Suppressed fetch to ${cleanUrl} (Browser Offline)`);
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  window.dispatchEvent(new CustomEvent('api_loading_start'));

  try {
    // Register the last API request details with error tracking service
    errorService.setLastApiRequest({
      url: cleanUrl,
      method: options.method || 'GET',
      timestamp: new Date().toISOString()
    });

    // Global fetch is now wrapped in main.tsx, so it handles token injection and retries
    const res = await fetch(cleanUrl, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    window.dispatchEvent(new CustomEvent('api_loading_stop'));
    
    // Diagnostic logging for profile endpoint
    if (url.includes('/api/user/profile')) {
      window.dispatchEvent(new CustomEvent('diagnostic_api_log', {
        detail: {
          url,
          method: options.method || 'GET',
          status: res.status,
          statusText: res.statusText,
          ok: res.ok,
          timestamp: new Date().toISOString()
        }
      }));
    }
    
    if (!res.ok) {
        let errorMessage = `Error: ${res.status}`;
        let detailedError = '';
        let isJson = false;
        let data: any = null;
        
        const rawText = await res.text().catch(() => '');
        if (rawText) {
          try {
            data = JSON.parse(rawText);
            isJson = true;
          } catch (parseErr: any) {
            if (res.status === 429) {
                logger.warn(`Rate limit hit: ${rawText.slice(0, 50)}`);
            } else {
                logger.error(`Non-JSON error payload received from ${url}. Raw content preview: ${rawText.slice(0, 200)}`);
                errorService.report({
                type: ErrorType.API_ERROR,
                message: `Non-JSON error payload from ${url}`,
                metadata: { url, status: res.status, rawContent: rawText.slice(0, 1000), parseError: parseErr.message }
                });
            }
          }
        }

        if (isJson && data) {
            errorMessage = data.message || errorMessage;
            detailedError = data.error || '';
        }
        
        if (res.status === 404) {
          logger.warn(`Resource not found: ${url}`);
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
          
          // Token is likely invalid/expired, don't clear it here, let the StoreContext or Interceptor handle it
          // localStorage.removeItem('hgs_token');
 
          // 401 is handled by main.tsx fetch wrapper (token refresh). 
          // If it still reaches here, it means refresh failed or was not possible.
          const silentEndpoints = [
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
 
          logger.warn(`401 Unauthorized for ${url}`);
          errorMessage = "Session expired";
          
          // Signal global auth error only once every 30 seconds to prevent toast flooding
          const lastErr = window.sessionStorage.getItem('last_auth_error');
          if (!lastErr || Date.now() - Number(lastErr) > 30000) {
            window.sessionStorage.setItem('last_auth_error', String(Date.now()));
            window.dispatchEvent(new CustomEvent('auth_error', { detail: { url } }));
          }
          
          // Return null for read operations that failed with 401 to prevent UI crashes
          // EXCEPT for auth checking, which we want to throw to handle logout.
          if ((options.method === 'GET' || !options.method) && !url.includes('/api/auth/me')) return null;
        } else if (res.status === 403) {
          errorMessage = "You do not have permission to perform this action";
        } else if (res.status === 429 || res.status >= 500) {
          if (retries > 0) {
            const attemptNumber = 3 - retries;
            const delay = res.status === 429 ? 3000 : (1000 * Math.pow(2, attemptNumber - 1));
            logger.info(`Retrying ${url} due to ${res.status} error. Delay: ${delay}ms, Retries left: ${retries - 1}`);
            await new Promise(r => setTimeout(r, delay));
            return fetchWithHandling(url, options, retries - 1);
          }
 
          errorMessage = res.status === 429 ? "Access required due to rate limiting. Please try again after 10 minutes." : "Server error. Please try again later.";
          
          // Centralized Error Boundary Categorization for Firebase backend unreachable
          const isFirebaseUnreachable = 
            res.status === 503 ||
            (detailedError && /firebase|credential|firestore|database|connect/i.test(detailedError)) || 
            (errorMessage && /firebase|credential|firestore|database|connect/i.test(errorMessage));
 
          if (isFirebaseUnreachable) {
            logger.error(`Centralized Error Boundary categorized unreachable Firebase backend at ${url} (${res.status}): ${errorMessage}`);
            errorMessage = "Database connection unstable. Please try again.";
            
            // Dispatch event for DB connection error component to react
            window.dispatchEvent(new CustomEvent('database_error', { 
              detail: { url, status: res.status, message: errorMessage } 
            }));
          }
        }

        // Return null for read operations to prevent blank white page crashes under rate limits or server errors
        if ((options.method === 'GET' || !options.method) && !url.includes('/api/auth/me')) {
          logger.warn(`Returning null for failed GET ${url} on status ${res.status}`);
          return null;
        }

        if (res.status === 429) {
          throw new RateLimitError(errorMessage, 600);
        }

        throw new ApiError(errorMessage, res.status, detailedError);
    }
    
    const successText = await res.text().catch(() => '');
    if (successText) {
      try {
        return JSON.parse(successText);
      } catch (parseErr: any) {
        logger.error(`Non-JSON success payload received from ${url}. Raw content preview: ${successText.slice(0, 200)}`);
        errorService.report({
          type: ErrorType.API_ERROR,
          message: `Non-JSON success payload from ${url}`,
          metadata: { url, status: res.status, rawContent: successText.slice(0, 1000), parseError: parseErr.message }
        });
        const jsonErr = new Error(`Expected JSON response from ${url} but received non-JSON text.`);
        (jsonErr as any).status = res.status;
        (jsonErr as any).details = successText.slice(0, 200);
        throw jsonErr;
      }
    }
    return null;
  } catch (err: any) {
    window.dispatchEvent(new CustomEvent('api_loading_stop'));
    if (retries > 0 && (err.name === 'AbortError' || err.message?.includes('Failed to fetch') || err.message?.includes('network'))) {
      const attemptNumber = 3 - retries;
      const delay = 1000 * Math.pow(2, attemptNumber - 1);
      logger.info(`Retrying ${url} due to network error. Delay: ${delay}ms, Retries left: ${retries - 1}`);
      await new Promise(r => setTimeout(r, delay));
      return fetchWithHandling(url, options, retries - 1);
    }
    logger.error(`API Error [${url}]`, err);
    
    // Diagnostic logging for profile endpoint network error
    if (url.includes('/api/user/profile')) {
      window.dispatchEvent(new CustomEvent('diagnostic_api_log', {
        detail: {
          url,
          method: options.method || 'GET',
          status: err.status || 0,
          statusText: 'Network Error',
          ok: false,
          error: err.message,
          timestamp: new Date().toISOString()
        }
      }));
    }
    
    // Check if it's a network offline/unreachable error
    const isNetworkError = err instanceof TypeError || 
                           err.name === 'AbortError' ||
                           err.message?.includes('Fetch') || 
                           err.message?.includes('network') || 
                           err.message?.includes('Failed to fetch') || 
                           err.message?.includes('aborted');

    if (isNetworkError) {
      logger.warn(`Network offline or unreachable endpoint at ${url}`);
      // Do not trigger global maintenance block for temporary fetch drops
    }

    // Silent for background/common checks
    const isPassiveGet = options.method === 'GET' || !options.method;
    const isBackground = isNetworkError || 
                       url.includes('/api/auth/me') || 
                       url.includes('/api/products') ||
                       url.includes('/api/cart') ||
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
    if (url.includes('/api/auth/me')) {
      throw err;
    }
    return null;
  }
};

const apiCache: Record<string, { data: any; timestamp: number }> = {};
const apiPendingPromises: Record<string, Promise<any>> = {};
const API_CACHE_TIME = 30000; // 30 seconds

export const fetchWithHandling = async <T>(
  url: string,
  options: RequestInit = {},
  retries = 2
): Promise<T | null> => {
  const method = (options.method || 'GET').toUpperCase();
  
  // Clean url key for caching
  let cleanCacheUrl = url;
  if (cleanCacheUrl.startsWith('api/')) {
    cleanCacheUrl = '/' + cleanCacheUrl;
  }
  
  if (method !== 'GET') {
    // Mutation: Clear related cache domains
    if (cleanCacheUrl.includes('/api/addresses')) {
      Object.keys(apiCache).forEach(k => { if (k.includes('/api/addresses')) delete apiCache[k]; });
    }
    if (cleanCacheUrl.includes('/api/settings')) {
      Object.keys(apiCache).forEach(k => { if (k.includes('/api/settings')) delete apiCache[k]; });
    }
    if (cleanCacheUrl.includes('/api/promotions')) {
      Object.keys(apiCache).forEach(k => { if (k.includes('/api/promotions')) delete apiCache[k]; });
    }
    if (cleanCacheUrl.includes('/api/announcements')) {
      Object.keys(apiCache).forEach(k => { if (k.includes('/api/announcements')) delete apiCache[k]; });
    }
    if (cleanCacheUrl.includes('/api/notifications')) {
      Object.keys(apiCache).forEach(k => { if (k.includes('/api/notifications')) delete apiCache[k]; });
    }
    return fetchWithHandlingInternal<T>(url, options, retries);
  }

  // Phase 3: Global Request Deduplication for all GET requests
  if (apiPendingPromises[cleanCacheUrl]) {
    logger.debug(`API DEDUP HIT: Joining in-flight: ${cleanCacheUrl}`);
    return apiPendingPromises[cleanCacheUrl];
  }

  const promise = (async () => {
    // Check if this path is target cached path
    const targetPaths = [
      '/api/settings',
      '/api/promotions',
      '/api/promotions-rules',
      '/api/announcements',
      '/api/addresses',
      '/api/notifications',
      '/api/config',
      '/api/categories',
      '/api/bulk-discounts'
    ];
    
    const isCachable = targetPaths.some(p => cleanCacheUrl.includes(p));

    if (isCachable) {
      const cached = apiCache[cleanCacheUrl];
      if (cached && Date.now() - cached.timestamp < API_CACHE_TIME) {
        logger.debug(`API CACHE HIT: ${cleanCacheUrl}`);
        return cached.data;
      }
    }

    const data = await fetchWithHandlingInternal<T>(url, options, retries);
    
    if (data !== null && isCachable) {
      apiCache[cleanCacheUrl] = { data, timestamp: Date.now() };
    }
    return data;
  })().finally(() => {
    delete apiPendingPromises[cleanCacheUrl];
  });

  apiPendingPromises[cleanCacheUrl] = promise;
  return promise;
};
