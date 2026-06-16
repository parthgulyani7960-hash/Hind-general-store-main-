import { auth, authReadyPromise } from '@/firebase';
import { logger } from './logger';

let refreshPromise: Promise<string | null> | null = null;

const performRefresh = async (): Promise<string | null> => {
    logger.info('[AUTH] Token refresh started, checking readiness...');
    try {
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Refresh auth readiness check timed out')), 5000)
        );
        try {
            await Promise.race([authReadyPromise, timeoutPromise]);
            logger.info('[AUTH] Firebase Auth is ready.');
        } catch (e) {
            logger.warn('Firebase authReadyPromise timed out during refresh check');
        }

        const user = auth.currentUser;
        if (user) {
            logger.info(`[AUTH] Refreshing user: ${user.uid}`);
            const tokenPromise = user.getIdToken(true);
            const tPromise = new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000));
            try {
                const newToken = await Promise.race([tokenPromise, tPromise]) as string;
                localStorage.setItem('hgs_token', newToken);
                logger.info('[AUTH] Token refreshed successfully');
                return newToken;
            } catch(e) {
                logger.warn('getIdToken timed out in performRefresh');
                return null;
            }
        } else {
            logger.warn('[AUTH] No user found for refresh');
            localStorage.removeItem('hgs_token');
            localStorage.removeItem('hgs_user');
            return null;
        }
    } catch (err) {
        logger.error('[AUTH] Token refresh failed:', err);
        throw err;
    } finally {
        refreshPromise = null;
    }
};

export const getOrRefreshToken = async (): Promise<string | null> => {
    if (refreshPromise) {
        return refreshPromise;
    }
    refreshPromise = performRefresh();
    return refreshPromise;
};
