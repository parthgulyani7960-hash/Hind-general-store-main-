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
  options: RequestInit = {}
): Promise<T | null> => {
  try {
    // Global fetch is now wrapped in main.tsx, so it handles token injection and retries
    const res = await fetch(url, options);
    
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
          if (url.includes('/api/auth/me')) {
            return null;
          }
          console.warn(`[API] 401 Unauthorized for ${url}`);
          errorMessage = "Session expired or unauthorized access";
        } else if (res.status === 403) {
          errorMessage = "You do not have permission to perform this action";
        } else if (res.status >= 500) {
          errorMessage = "Server error. Please try again later.";
        }

        const finalError = new Error(errorMessage);
        (finalError as any).status = res.status;
        (finalError as any).details = detailedError;
        throw finalError;
    }
    
    return await res.json();
  } catch (err: any) {
    console.error(`API Error [${url}]:`, err);
    
    // Silent for background/common checks
    const isBackground = url.includes('/api/auth/me') || 
                       url.includes('/api/alerts') || 
                       url.includes('/api/notifications') ||
                       url.includes('/runner-location') ||
                       url.includes('/api/cart/sync');

    if (!isBackground) {
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
