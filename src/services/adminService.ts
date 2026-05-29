import { fetchWithHandling } from '../lib/api';
import { getAuthHeaders } from '../lib/utils';

const cache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_TIME = 60000; // 60 seconds

async function fetchCached<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
  if (cache[key] && Date.now() - cache[key].timestamp < CACHE_TIME) {
    return cache[key].data;
  }
  const data = await fetchFn();
  cache[key] = { data, timestamp: Date.now() };
  return data;
}

export const adminService = {
  getStats: () => fetchCached('stats', () => fetchWithHandling<any>('/api/admin/stats', { headers: getAuthHeaders() })),
  getOrders: () => fetchCached('orders', () => fetchWithHandling<any[]>('/api/admin/orders', { headers: getAuthHeaders() })),
  getProducts: () => fetchCached('products', () => fetchWithHandling<any[]>('/api/admin/products', { headers: getAuthHeaders() })),
  getSystemLogs: () => fetchCached('logs', () => fetchWithHandling<any[]>('/api/admin/system-logs', { headers: getAuthHeaders() })),
  getAuditLogs: (target_type: string, limit: number) => fetchWithHandling<any[]>(`/api/admin/audit-logs?target_type=${target_type}&limit=${limit}`, { headers: getAuthHeaders() }),
  getExpenses: () => fetchCached('expenses', () => fetchWithHandling<any[]>('/api/admin/expenses', { headers: getAuthHeaders() })),
  getUsers: () => fetchCached('users', () => fetchWithHandling<any[]>('/api/admin/users', { headers: getAuthHeaders() })),
};
