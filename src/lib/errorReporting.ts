import { getAuthHeaders } from './utils';

export enum ErrorType {
  API_ERROR = 'API_ERROR',
  RENDER_ERROR = 'RENDER_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INTERACTION_ERROR = 'INTERACTION_ERROR',
  SYSTEM_ERROR = 'SYSTEM_ERROR'
}

export interface ErrorReport {
  type: ErrorType;
  message: string;
  stack?: string;
  path: string;
  component?: string;
  userId?: string;
  metadata?: Record<string, any>;
  timestamp: string;
  browser: string;
}

class ErrorReportingService {
  private static instance: ErrorReportingService;
  private queue: ErrorReport[] = [];
  private isProcessing = false;

  private constructor() {}

  public static getInstance(): ErrorReportingService {
    if (!ErrorReportingService.instance) {
      ErrorReportingService.instance = new ErrorReportingService();
    }
    return ErrorReportingService.instance;
  }

  public report(reportData: Omit<ErrorReport, 'timestamp' | 'browser' | 'path'>): void {
    const report: ErrorReport = {
      ...reportData,
      path: window.location.pathname,
      timestamp: new Date().toISOString(),
      browser: navigator.userAgent
    };

    console.error(`[ErrorService] [${report.type}] ${report.message}`, report);
    
    this.queue.push(report);
    this.processQueue();
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const report = this.queue[0];

    try {
      const deviceInfo = `${navigator.platform} | ${navigator.vendor}`;
      const screenRes = `${window.screen.width}x${window.screen.height} (${window.innerWidth}x${window.innerHeight})`;
      const networkStatus = (navigator as any).connection ? 
        `${(navigator as any).connection.effectiveType} | ${(navigator as any).connection.downlink}Mbps` : 
        'Unknown';

      // Use standard fetch to avoid recursive error reporting if fetchWithHandling fails
      await fetch('/api/bugs/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          user_id: report.userId || null,
          reporter_name: 'Automated Reporter',
          message: report.message,
          why: report.stack || report.type,
          path: report.path,
          type: report.type,
          component: report.component || '',
          device_info: deviceInfo,
          screen_resolution: screenRes,
          network_status: networkStatus,
          action_log: `Captured by ${report.type} Service`,
          metadata: report.metadata
        })
      });
      
      this.queue.shift();
    } catch (err) {
      console.warn('[ErrorService] Failed to send report to server', err);
      // Keep in queue for next retry or just discard if too many failures
      if (this.queue.length > 50) this.queue.shift();
    } finally {
      this.isProcessing = false;
      if (this.queue.length > 0) {
        setTimeout(() => this.processQueue(), 5000);
      }
    }
  }
}

export const errorService = ErrorReportingService.getInstance();
