import { db, auth, collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from '@/firebase';

export interface SecurityLog {
  type: 'login' | 'logout' | 'failed_login' | 'failed_transaction' | 'integrity_check' | 'encryption_event';
  details: string;
  userId?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  timestamp: any;
  metadata?: Record<string, any>;
}

export const securityService = {
  /**
   * Records a security event in Firestore
   */
  trackEvent: async (log: Omit<SecurityLog, 'timestamp' | 'userAgent'>) => {
    try {
      const securityCollection = collection(db, 'security_logs');
      await addDoc(securityCollection, {
        ...log,
        timestamp: serverTimestamp(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
        url: typeof window !== 'undefined' ? window.location.href : 'N/A'
      });
      console.log(`[SECURITY] Event Logged: ${log.type} - ${log.details}`);
    } catch (err) {
      console.error('[SECURITY] Failed to log security event:', err);
      
      // Fallback to localStorage if offline
      const localLogs = JSON.parse(localStorage.getItem('pending_security_logs') || '[]');
      localLogs.push({ ...log, timestamp: new Date().toISOString() });
      localStorage.setItem('pending_security_logs', JSON.stringify(localLogs.slice(-20)));
    }
  },

  /**
   * Tracks user authentication events
   */
  trackAuth: (type: 'login' | 'logout' | 'failed_login', user?: any) => {
    securityService.trackEvent({
      type,
      details: `${type.toUpperCase()} performed for user: ${user?.email || 'Unknown'}`,
      userId: user?.id || user?.uid || auth.currentUser?.uid,
      email: user?.email || 'N/A'
    });

    if (type === 'login') {
      localStorage.setItem('session_start_time', Date.now().toString());
    }
  },

  /**
   * Tracks a failed payment/transaction
   */
  logFailedPayment: (transactionId: string | number, method: string, error: string, metadata?: any) => {
    securityService.trackEvent({
      type: 'failed_transaction',
      details: `Payment Fail [${method}]: ID ${transactionId} - ${error}`,
      metadata: { transactionId, method, error, ...metadata }
    });
  },

  /**
   * Gets session duration in minutes
   */
  getSessionDuration: (): number => {
    const startTime = localStorage.getItem('session_start_time');
    if (!startTime) return 0;
    const durationMs = Date.now() - parseInt(startTime);
    return Math.round(durationMs / 60000); // return minutes
  },

  /**
   * Fetch recent security logs for administrative view
   */
  getRecentLogs: async (logLimit: number = 20): Promise<SecurityLog[]> => {
    try {
      const q = query(collection(db, 'security_logs'), orderBy('timestamp', 'desc'), limit(logLimit));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as unknown as SecurityLog[];
    } catch (err) {
      console.error('[SECURITY] Failed to fetch recent logs:', err);
      return [];
    }
  }
};
