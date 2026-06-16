import useSWR, { SWRConfiguration } from 'swr';
import { adminService } from '@/services/adminService';
import { getAuthHeaders } from '@/lib/utils';
import { logger } from '@/lib/logger';

// Standard fetcher for SWR that uses adminService
const adminFetcher = async (key: string) => {
  logger.debug(`[SWR FETCH] ${key}`);
  const headers = getAuthHeaders();
  
  switch (key) {
    case 'stats':
      return await adminService.getStats(headers);
    case 'orders':
      return await adminService.getOrders(headers);
    case 'products':
      return await adminService.getProducts(headers);
    case 'users':
      return await adminService.getUsers(headers);
    case 'notifications':
      return await adminService.getNotifications(headers);
    case 'logs':
      return await adminService.getSystemLogs(headers);
    case 'suspicious':
      return await adminService.getSuspiciousActivities(headers);
    case 'wallet_requests':
      return await adminService.getWalletRequests(headers);
    case 'returns':
      return await adminService.getReturns(headers);
    case 'suppliers':
      return await adminService.getSuppliers(headers);
    default:
      throw new Error(`Unknown admin fetcher key: ${key}`);
  }
};

const DEFAULT_CONFIG: SWRConfiguration = {
  refreshInterval: 10000, // 10 seconds for more immediate updates
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 3000,
};

export const useAdminStats = (config?: SWRConfiguration) => {
  return useSWR('stats', adminFetcher, { ...DEFAULT_CONFIG, ...config });
};

export const useAdminOrders = (config?: SWRConfiguration) => {
  return useSWR('orders', adminFetcher, { ...DEFAULT_CONFIG, ...config });
};

export const useAdminProducts = (config?: SWRConfiguration) => {
  return useSWR('products', adminFetcher, { ...DEFAULT_CONFIG, ...config });
};

export const useAdminUsers = (config?: SWRConfiguration) => {
  return useSWR('users', adminFetcher, { ...DEFAULT_CONFIG, ...config });
};

export const useAdminLogs = (config?: SWRConfiguration) => {
  return useSWR('logs', adminFetcher, { ...DEFAULT_CONFIG, ...config });
};

export const useAdminSuspicious = (config?: SWRConfiguration) => {
  return useSWR('suspicious', adminFetcher, { ...DEFAULT_CONFIG, ...config });
};

export const useAdminWalletRequests = (config?: SWRConfiguration) => {
  return useSWR('wallet_requests', adminFetcher, { ...DEFAULT_CONFIG, ...config });
};

export const useAdminReturns = (config?: SWRConfiguration) => {
  return useSWR('returns', adminFetcher, { ...DEFAULT_CONFIG, ...config });
};

export const useAdminSuppliers = (config?: SWRConfiguration) => {
  return useSWR('suppliers', adminFetcher, { ...DEFAULT_CONFIG, ...config });
};
