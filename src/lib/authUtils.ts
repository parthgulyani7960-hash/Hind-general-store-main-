import { getAuth } from 'firebase/auth';

export const logAuthSession = () => {
    const auth = getAuth();
    const token = localStorage.getItem('hgs_token');
    const user = localStorage.getItem('hgs_user');

    console.log('[AUTH SESSION LOG]', {
        timestamp: new Date().toISOString(),
        firebaseUser: auth.currentUser ? {
            uid: auth.currentUser.uid,
            email: auth.currentUser.email,
        } : null,
        localStorage: {
            hgs_token: token ? 'Token exists' : 'Token missing',
            hgs_user: user ? 'User exists' : 'User missing',
        }
    });
};
