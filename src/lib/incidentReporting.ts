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

export class ErrorReportingService {
  private static instance: ErrorReportingService;
  private queue: ErrorReport[] = [];
  private isProcessing = false;
  private breadcrumbs: Array<{ action: string; timestamp: string }> = [];
  private lastApiRequest: any = null;

  public setLastApiRequest(req: { url: string; method: string; timestamp: string }) {
    this.lastApiRequest = req;
    this.addBreadcrumb(`API Request: ${req.method} ${req.url}`);
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

  public addBreadcrumb(action: string): void {
    const timestamp = new Date().toISOString();
    this.breadcrumbs.push({ action, timestamp });
    if (this.breadcrumbs.length > 10) {
      this.breadcrumbs.shift();
    }
    console.log(`[Breadcrumb] ${action}`);
  }

  private setupListeners() {
    if (typeof window === 'undefined') return;

    // Record initial load/path
    this.addBreadcrumb(`Initial Pathname: ${window.location.pathname}`);

    // Global uncaught JS exceptions (Component-level / render exceptions that escape boundaries)
    window.addEventListener('error', (event) => {
      try {
        if (event.message?.includes('ResizeObserver') || event.message?.includes('Extension')) {
          return; // Ignore benign/extension warnings
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
            lastApiRequest: this.lastApiRequest,
            timestamp: new Date().toISOString()
          }
        });
      } catch (err) {}
    }, { capture: true });

    // Global unhandled promise rejections (automatic tracking of async/fetch/network failures)
    window.addEventListener('unhandledrejection', (event) => {
      try {
        const reason = event.reason;
        const error: any = reason instanceof Error ? reason : {};
        const name = error.name || 'PromiseRejection';
        const message = reason instanceof Error ? reason.message : String(reason);
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
            lastApiRequest: this.lastApiRequest,
            timestamp: new Date().toISOString()
          }
        });
      } catch (err) {}
    });

    // Track clicks on interactive elements
    window.addEventListener('click', (event) => {
      try {
        const target = event.target as HTMLElement;
        if (!target) return;
        const interactive = target.closest('button, a, input, select, textarea');
        if (interactive) {
          const tagName = interactive.tagName.toLowerCase();
          const text = interactive.textContent?.trim().slice(0, 50) || '';
          const idStr = interactive.id ? `#${interactive.id}` : '';
          const label = `Click: <${tagName}${idStr}> ${text ? `"${text}"` : ''}`;
          this.addBreadcrumb(label);
        }
      } catch (err) {
        // Silently ignore tracing failures
      }
    }, { capture: true, passive: true });

    // Track popstate
    window.addEventListener('popstate', () => {
      this.addBreadcrumb(`Navigate (popstate): ${window.location.pathname}`);
    });

    // Track state pushes/replacements in router (monkeypatch)
    try {
      const originalPushState = window.history.pushState;
      const originalReplaceState = window.history.replaceState;
      const self = this;

      window.history.pushState = function(state, ...args) {
        const result = originalPushState.apply(this, [state, ...args]);
        try {
          self.addBreadcrumb(`Navigate (pushState): ${window.location.pathname}`);
        } catch (e) {}
        return result;
      };

      window.history.replaceState = function(state, ...args) {
        const result = originalReplaceState.apply(this, [state, ...args]);
        try {
          self.addBreadcrumb(`Navigate (replaceState): ${window.location.pathname}`);
        } catch (e) {}
        return result;
      };
    } catch (e) {}
  }

  public report(reportData: Omit<ErrorReport, 'timestamp' | 'browser' | 'path'>): void {
    const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
    if (isOffline) {
      console.warn(`[ErrorService] Suppressed automated background report (Offline Status): ${reportData.message}`);
      return;
    }

    const report: ErrorReport = {
      ...reportData,
      path: window.location.pathname,
      timestamp: new Date().toISOString(),
      browser: navigator.userAgent,
      metadata: {
        ...(reportData.metadata || {}),
        breadcrumbs: this.breadcrumbs
      }
    };

    console.error(`[ErrorService] [${report.type}] ${report.message}`, report);
    
    window.dispatchEvent(new CustomEvent('system_error', { detail: report }));
    
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
