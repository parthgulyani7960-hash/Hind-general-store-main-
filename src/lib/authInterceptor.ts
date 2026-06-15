import { auth } from '@/firebase';
import { logger } from './logger';

let refreshPromise: Promise<string | null> | null = null;

const performRefresh = async (): Promise<string | null> => {
    logger.info('[AUTH] Token refresh started');
    try {
        const readyPromise = typeof auth.authStateReady === 'function' ? auth.authStateReady() : Promise.resolve();
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Refresh auth timeout')), 3000)
        );
        try {
            await Promise.race([readyPromise, timeoutPromise]);
        } catch (e) {
            logger.warn('Firebase authStateReady timed out during refresh');
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
