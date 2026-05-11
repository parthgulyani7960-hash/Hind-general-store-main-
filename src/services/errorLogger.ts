import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import html2canvas from 'html2canvas';

export const logErrorToFirestore = async (error: any, context: string) => {
    try {
        let screenshot = null;
        try {
            // Attempt to capture screenshot
            const canvas = await html2canvas(document.body, {
                logging: false,
                useCORS: true,
                scale: 0.5 // Scale down to reduce size
            });
            screenshot = canvas.toDataURL('image/jpeg', 0.5);
        } catch (screenshotError) {
            console.warn('Failed to capture screenshot for error report:', screenshotError);
        }

        await addDoc(collection(db, 'error_logs'), {
            error: typeof error === 'string' ? error : (error instanceof Error ? error.message : JSON.stringify(error)),
            context,
            timestamp: serverTimestamp(),
            userId: auth.currentUser?.uid || 'anonymous',
            url: window.location.href,
            userAgent: navigator.userAgent,
            screenshot: screenshot // Hidden from user, visible to admin in DB
        });
        console.error(`Error report created successfully: ${context}`);
    } catch (e) {
        console.error('Critical failure in error reporting system:', e);
    }
};
