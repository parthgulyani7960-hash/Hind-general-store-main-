import { fetchWithHandling } from '@/lib/api';
import { getAuthHeaders } from '@/lib/utils';

const cache: Record<string, { data: any, timestamp: number }> = {};
const pendingPromises: Record<string, Promise<any>> = {};
const CACHE_TIME = 60000; // 60 seconds

async function fetchCached<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  
  // Check if we have a valid cached result
  if (cache[key] && now - cache[key].timestamp < CACHE_TIME) {
    return cache[key].data;
  }
  
  // If there's already a fetch in progress for this key, return that promise
  if (pendingPromises[key]) {
    return pendingPromises[key];
  }
  
  // Otherwise, start a new fetch
  const promise = fetchFn();
  pendingPromises[key] = promise;
  
  try {
    const data = await promise;
    cache[key] = { data, timestamp: Date.now() };
    return data;
  } finally {
    // Clean up the pending promise regardless of success or failure
    delete pendingPromises[key];
  }
}

export const adminService = {
  getStats: (headers: any) => fetchCached('stats', () => fetchWithHandling<any>('/api/admin/stats', { headers })),
  getOrders: (headers: any) => fetchCached('orders', () => fetchWithHandling<any[]>('/api/admin/orders', { headers })),
  getProducts: (headers: any) => fetchCached('products', () => fetchWithHandling<any[]>('/api/admin/products', { headers })),
  getSystemLogs: (headers: any) => fetchCached('logs', () => fetchWithHandling<any[]>('/api/admin/system-logs', { headers })),
  getAuditLogs: (headers: any, target_type: string, limit: number) => fetchWithHandling<any[]>(`/api/admin/audit-logs?target_type=${target_type}&limit=${limit}`, { headers }),
  getExpenses: (headers: any) => fetchCached('expenses', () => fetchWithHandling<any[]>('/api/admin/expenses', { headers })),
  getUsers: (headers: any) => fetchCached('users', () => fetchWithHandling<any[]>('/api/admin/users', { headers })),
  getCategories: (headers: any) => fetchCached('categories', () => fetchWithHandling<any[]>('/api/categories', { headers })),
  getNotifications: (headers: any) => fetchCached('notifications', () => fetchWithHandling<any[]>('/api/notifications', { headers })),
  getConfig: (headers: any) => fetchCached('config', () => fetchWithHandling<any[]>('/api/admin/config', { headers })),
  getExpiring: (headers: any) => fetchCached('expiring', () => fetchWithHandling<any[]>('/api/admin/inventory/expiring', { headers })),
  getNewsletterSubs: (headers: any) => fetchCached('newsletter_subs', () => fetchWithHandling<any[]>('/api/admin/newsletter', { headers })),
  getNewsletterCampaigns: (headers: any) => fetchCached('newsletter_campaigns', () => fetchWithHandling<any[]>('/api/admin/newsletter/campaigns', { headers })),
};
