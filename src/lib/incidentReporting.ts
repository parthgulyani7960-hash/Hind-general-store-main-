import { getAuthHeaders } from './utils';

export enum ErrorType {
  API_ERROR = 'API_ERROR',
  RENDER_ERROR = 'RENDER_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INTERACTION_ERROR = 'INTERACTION_ERROR',
  SYSTEM_ERROR = 'SYSTEM_ERROR'
}

export enum Severity {
  LOW = 'Low',
  MEDIUM = 'Medium',
  CRITICAL = 'Critical'
}

export interface ErrorReport {
  type: ErrorType;
  severity: Severity;
  message: string;
  stack?: string;
  path: string;
  component?: string;
  userId?: string;
  metadata?: Record<string, any>;
  timestamp: string;
  browser: string;
}

export class ErrorReportingService {
  private static instance: ErrorReportingService;
  private breadcrumbs: Array<{ action: string; timestamp: string }> = [];
  private navigationHistory: Array<{ url: string; timestamp: string }> = [];
  private apiHistory: Array<{ url: string; method: string; timestamp: string }> = [];
  private recentErrors = new Map<string, number>();

  public setLastApiRequest(req: { url: string; method: string; timestamp: string }) {
    this.addBreadcrumb(`API Request: ${req.method} ${req.url}`);
    this.apiHistory.push(req);
    if (this.apiHistory.length > 5) this.apiHistory.shift();
  }

  private constructor() {
    this.setupListeners();
  }

  public static getInstance(): ErrorReportingService {
    if (!ErrorReportingService.instance) {
      ErrorReportingService.instance = new ErrorReportingService();
    }
    return ErrorReportingService.instance;
  }

  private generateHash(reportData: any): string {
    const content = `${reportData.message}|${reportData.stack || ''}|${reportData.component || ''}`;
    // Simple base64 encoding of content as a key for deduplication
    try {
      return btoa(unescape(encodeURIComponent(content))).substring(0, 64);
    } catch (e) {
      return content.substring(0, 64);
    }
  }

  public addBreadcrumb(action: string): void {
    const timestamp = new Date().toISOString();
    this.breadcrumbs.push({ action, timestamp });
    if (this.breadcrumbs.length > 10) {
      this.breadcrumbs.shift();
    }
    console.log(`[Breadcrumb] ${action}`);
  }

  public addNavigationAction(url: string): void {
    const timestamp = new Date().toISOString();
    this.navigationHistory.push({ url, timestamp });
    if (this.navigationHistory.length > 5) this.navigationHistory.shift();
    this.addBreadcrumb(`Navigate: ${url}`);
  }

  private setupListeners() {
    if (typeof window === 'undefined') return;

    // Track navigation history
    window.addEventListener('popstate', () => {
      this.addNavigationAction(window.location.pathname);
    });

    try {
      const originalPushState = window.history.pushState;
      const originalReplaceState = window.history.replaceState;
      const self = this;

      window.history.pushState = function(state, ...args) {
        const result = originalPushState.apply(this, [state, ...args]);
        try {
          self.addNavigationAction(window.location.pathname);
        } catch (e) {}
        return result;
      };

      window.history.replaceState = function(state, ...args) {
        const result = originalReplaceState.apply(this, [state, ...args]);
        try {
          self.addNavigationAction(window.location.pathname);
        } catch (e) {}
        return result;
      };
    } catch (e) {}

    // Global uncaught JS exceptions
    window.addEventListener('error', (event) => {
      try {
        const msg = (event.message || '').toLowerCase();
        if (msg.includes('resizeobserver') || msg.includes('extension') || msg.includes('websocket') || msg.includes('vite') || msg.includes('hmr') || msg.includes('closed without opened')) {
          return;
        }
        
        // Extract diagnostic info from ErrorEvent
        const error = event.error || {};
        const name = error.name || 'Error';
        const message = event.message || error.message || 'Unknown Global Runtime Error';
        const stack = error.stack || 'No stack trace available';
        const filename = event.filename || 'unknown_file';
        const lineno = event.lineno || 0;
        const colno = event.colno || 0;
        const route = window.location.pathname;
        const componentStack = error.componentStack || '';

        this.report({
          type: ErrorType.SYSTEM_ERROR,
          message: `[GlobalCrash] ${name}: ${message}`,
          stack: stack,
          component: 'GlobalWindowOnError',
          metadata: {
            errorName: name,
            errorMessage: message,
            errorStack: stack,
            componentStack,
            filename,
            lineno,
            colno,
            route,
            lastApiRequest: this.apiHistory[this.apiHistory.length - 1],
            timestamp: new Date().toISOString()
          }
        });
      } catch (err) {}
    }, { capture: true });

    // Global unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      try {
        const reason = event.reason;
        const error: any = reason instanceof Error ? reason : {};
        const message = reason instanceof Error ? reason.message : String(reason);
        const msgLower = (message || '').toLowerCase();
        if (msgLower.includes('websocket') || msgLower.includes('vite') || msgLower.includes('hmr') || msgLower.includes('closed without opened')) {
          return;
        }
        const name = error.name || 'PromiseRejection';
        const stack = reason instanceof Error ? reason.stack : undefined;
        const route = window.location.pathname;

        this.report({
          type: ErrorType.SYSTEM_ERROR,
          message: `[GlobalCrash] ${name}: ${message}`,
          stack: stack || 'No stack trace available',
          component: 'GlobalUnhandledRejection',
          metadata: {
            errorName: name,
            errorMessage: message,
            errorStack: stack || 'No stack trace available',
            route,
            lastApiRequest: this.apiHistory[this.apiHistory.length - 1],
            timestamp: new Date().toISOString()
          }
        });
      } catch (err) {}
    });
  }

  private batchTimer: ReturnType<typeof setTimeout> | null = null;
  private queuedReports: ErrorReport[] = [];

  public report(reportData: Omit<ErrorReport, 'timestamp' | 'browser' | 'path' | 'severity'> & { severity?: Severity }): void {
    const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
    if (isOffline) {
      console.warn(`[ErrorService] Suppressed automated background report (Offline Status): ${reportData.message}`);
      return;
    }

    const hash = this.generateHash(reportData);
    const now = Date.now();
    if (this.recentErrors.has(hash) && (now - this.recentErrors.get(hash)! < 10000)) {
        console.warn(`[ErrorService] Deduplication: Suppressing duplicate error`, reportData.message);
        return;
    }
    this.recentErrors.set(hash, now);
    if (this.recentErrors.size > 100) this.recentErrors.clear();

    const report: ErrorReport = {
      ...reportData,
      severity: reportData.severity || Severity.MEDIUM,
      path: window.location.pathname,
      timestamp: new Date().toISOString(),
      browser: navigator.userAgent,
      metadata: {
        ...(reportData.metadata || {}),
        breadcrumbs: this.breadcrumbs,
        navigationHistory: this.navigationHistory,
        apiHistory: this.apiHistory
      }
    };

    console.error(`[ErrorService] [${report.type}] ${report.message}`, report);
    
    window.dispatchEvent(new CustomEvent('system_error', { detail: report }));
    
    this.queuedReports.push(report);
    if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => this.processBatch(), 5000);
    }
  }

  private async processBatch() {
    this.batchTimer = null;
    if (this.queuedReports.length === 0) return;

    const reports = [...this.queuedReports];
    this.queuedReports = [];

    try {
      const deviceInfo = `${navigator.platform} | ${navigator.vendor}`;
      const screenRes = `${window.screen.width}x${window.screen.height} (${window.innerWidth}x${window.innerHeight})`;
      const networkStatus = (navigator as any).connection ? 
        `${(navigator as any).connection.effectiveType} | ${(navigator as any).connection.downlink}Mbps` : 
        'Unknown';

      // Send the batch as an array
      await fetch('/api/bugs/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
            isBatch: true,
            reports: reports.map(report => ({
                user_id: report.userId || null,
                reporter_name: 'Automated Reporter',
                message: report.message,
                why: report.stack || report.type,
                path: report.path,
                type: report.type,
                severity: report.severity,
                component: report.component || '',
                device_info: deviceInfo,
                screen_resolution: screenRes,
                network_status: networkStatus,
                action_log: `Captured by ${report.type} Service`,
                metadata: report.metadata
            }))
        })
      });
    } catch (err) {
      console.warn('[ErrorService] Failed to send report batch to server', err);
      // Re-queue on failure? Maybe
      this.queuedReports = [...reports, ...this.queuedReports];
    }
  }

}

export const errorService = ErrorReportingService.getInstance();
