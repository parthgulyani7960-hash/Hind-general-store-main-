
export interface ErrorLog {
  message: string;
  componentStack?: string;
  path: string;
  interactedElement?: string;
  timestamp: number;
  logs: any[];
}

export const reportError = async (log: Omit<ErrorLog, 'timestamp'>) => {
  // Telemetry removed for user privacy compliance
};

export const flushQueue = async () => {
  // Telemetry removed for user privacy compliance
};

