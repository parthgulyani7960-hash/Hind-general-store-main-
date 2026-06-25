import { auth, authReadyPromise } from '@/firebase';
import { logger } from './logger';

let refreshPromise: Promise<string | null> | null = null;
let refreshAttemptCount = 0;
const MAX_REFRESH_RETRIES = 1;

const performRefresh = async (): Promise<string | null> => {
    if (refreshAttemptCount >= MAX_REFRESH_RETRIES) {
        logger.error('[AUTH] Max refresh retries reached');
        refreshAttemptCount = 0;
        return null;
    }
    refreshAttemptCount++;

    logger.info('[AUTH] Token refresh started, checking readiness...');
    let readinessTimeoutId: any = null;
    let tokenTimeoutId: any = null;
    try {
        const timeoutPromise = new Promise<void>((resolve) => {
            readinessTimeoutId = setTimeout(() => {
                logger.warn('Firebase authReadyPromise timed out during refresh check');
                resolve();
            }, 5000);
        });

        await Promise.race([authReadyPromise, timeoutPromise]);
        if (readinessTimeoutId) clearTimeout(readinessTimeoutId);

        const user = auth.currentUser;
        if (user) {
            logger.info(`[AUTH] Refreshing user: ${user.uid}`);
            const tokenPromise = user.getIdToken(true);
            
            const tPromise = new Promise<null>((resolve) => {
                tokenTimeoutId = setTimeout(() => {
                    logger.warn('getIdToken timed out in performRefresh');
                    resolve(null);
                }, 5000);
            });

            const newToken = await Promise.race([tokenPromise, tPromise]);
            if (tokenTimeoutId) clearTimeout(tokenTimeoutId);

            if (newToken) {
                localStorage.setItem('hgs_token', newToken);
                logger.info('[AUTH] Token refreshed successfully for user:', user.uid);
                refreshAttemptCount = 0; // Reset on success
                return newToken;
            }
            logger.warn('[AUTH] No token returned for user:', user.uid);
            return null;
        } else {
            logger.warn('[AUTH] No user found for refresh');
            localStorage.removeItem('hgs_token');
            localStorage.removeItem('hgs_user');
            return null;
        }
    } catch (err) {
        logger.error('[AUTH] Token refresh failed with error:', err);
        throw err;
    } finally {
        if (readinessTimeoutId) clearTimeout(readinessTimeoutId);
        if (tokenTimeoutId) clearTimeout(tokenTimeoutId);
    }
};

export const getOrRefreshToken = async (): Promise<string | null> => {
    if (refreshPromise) {
        logger.info('[AUTH] Return existing refresh promise');
        return refreshPromise;
    }
    
    refreshPromise = performRefresh();
    
    try {
        const token = await refreshPromise;
        return token;
    } finally {
        refreshPromise = null;
    }
};
