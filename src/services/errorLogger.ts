import { db, auth, collection, addDoc, serverTimestamp } from '@/firebase';

const ERROR_QUEUE_KEY = 'admin_error_queue';

export const logErrorToFirestore = async (error: any, context: string) => {
    const errorData = {
        error: typeof error === 'string' ? error : (error instanceof Error ? error.message : JSON.stringify(error)),
        context,
        timestamp: new Date().toISOString(),
        userId: auth.currentUser?.uid || 'anonymous',
        url: window.location.href,
        userAgent: navigator.userAgent,
    };

    // 1. Queue immediately
    const queue = JSON.parse(localStorage.getItem(ERROR_QUEUE_KEY) || '[]');
    queue.push(errorData);
    localStorage.setItem(ERROR_QUEUE_KEY, JSON.stringify(queue));

    // 2. Attempt sync
    syncErrors();
    
    // 3. Optional: Direct post to backend bug reports for critical visibility
    try {
        fetch('/api/bugs/report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: errorData.error,
                why: `Auto-reported from context: ${context}`,
                path: errorData.url,
                action_log: `UserAgent: ${errorData.userAgent}`
            })
        }).catch(() => {});
    } catch (err) {}
};

const syncErrors = async () => {
    const queue = JSON.parse(localStorage.getItem(ERROR_QUEUE_KEY) || '[]');
    if (queue.length === 0) return;

    for (const errorData of queue) {
        try {
            await addDoc(collection(db, 'error_logs'), {
                ...errorData,
                timestamp: serverTimestamp(),
            });
            // Successfully logged, remove from queue
            const currentQueue = JSON.parse(localStorage.getItem(ERROR_QUEUE_KEY) || '[]');
            const index = currentQueue.findIndex((e: any) => e.timestamp === errorData.timestamp);
            if (index > -1) {
                currentQueue.splice(index, 1);
                localStorage.setItem(ERROR_QUEUE_KEY, JSON.stringify(currentQueue));
            }
        } catch (e) {
            console.error('Failed to sync error, will retry later:', e);
            break; // Stop syncing on network failure
        }
    }
};

// Sync on online
window.addEventListener('online', syncErrors);
