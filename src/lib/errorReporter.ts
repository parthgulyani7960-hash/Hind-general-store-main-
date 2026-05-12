
export interface ErrorLog {
  message: string;
  componentStack?: string;
  path: string;
  interactedElement?: string;
  timestamp: number;
  logs: any[];
}

const STORAGE_KEY = 'app_error_queue';

export const reportError = async (log: Omit<ErrorLog, 'timestamp'>) => {
  const newLog: ErrorLog = { ...log, timestamp: Date.now() };
  
  const queue = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  queue.push(newLog);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  
  await flushQueue();
};

export const flushQueue = async () => {
  if (!navigator.onLine) return;
  
  const queue = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  if (queue.length === 0) return;
  
  const token = localStorage.getItem('hgs_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  const successfulLogs: ErrorLog[] = [];
  
  for (const log of queue) {
    try {
      const response = await fetch('/api/bugs/report', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...log,
          why: log.componentStack,
          action_log: `Interaction: ${log.interactedElement}`
        })
      });
      
      if (response.ok) {
        successfulLogs.push(log);
      }
    } catch (err) {
      console.error('Failed to flush log', log, err);
      // Skip this log and try the next one
    }
  }
  
  const remaining = queue.filter((log: ErrorLog) => !successfulLogs.includes(log));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
};
