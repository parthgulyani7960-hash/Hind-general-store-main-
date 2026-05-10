import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const logErrorToFirestore = async (error: any, context: string) => {
    try {
        await addDoc(collection(db, 'error_logs'), {
            error: typeof error === 'string' ? error : (error instanceof Error ? error.message : JSON.stringify(error)),
            context,
            timestamp: serverTimestamp(),
            userId: auth.currentUser?.uid || 'anonymous',
            url: window.location.href,
        });
        console.error(`Error logged to Firestore: ${context}`);
    } catch (e) {
        console.error('Failed to log error to Firestore:', e);
    }
};
