import { fetchWithHandling } from '@/lib/api';
import { getAuthHeaders } from '@/lib/utils';
import { adminService as oldAdminService } from '@/services/adminService';

// Unified Admin Management Service
export const adminService = {
  ...oldAdminService,
  
  grantAdminAccess: async (email: string, duration: string) => {
    return fetchWithHandling<{ success: boolean; message?: string }>('/api/admin/make-admin', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ email, duration })
    });
  },

  revokeAdminAccess: async (email: string) => {
    return fetchWithHandling<{ success: boolean; message?: string }>('/api/admin/revoke-admin', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ email })
    });
  },

  getAdmins: () => {
    // Re-use the existing getAdmins
    return oldAdminService.getAdmins(getAuthHeaders());
  }
};
