import * as React from 'react';
import { errorService, ErrorType, Severity } from '../lib/incidentReporting';
import { AlertTriangle, RefreshCw, Trash2, Copy, Check, Send, ChevronDown, ChevronUp, Terminal } from 'lucide-react';

interface CrashBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface CrashBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  isReporting: boolean;
  reportMessage: string;
  reportSuccess: boolean;
  copied: boolean;
  showStack: boolean;
  userComments: string;
  healthStatus: 'checking' | 'ok' | 'down';
}

export class AppCrashBoundary extends React.Component<CrashBoundaryProps, CrashBoundaryState> {
  constructor(props: CrashBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isReporting: false,
      reportMessage: '',
      reportSuccess: false,
      copied: false,
      showStack: false,
      userComments: '',
      healthStatus: 'checking',
    };
  }

  public componentDidUpdate(prevProps: CrashBoundaryProps, prevState: CrashBoundaryState) {
    if (!prevState.hasError && this.state.hasError) {
      this.checkHealth();
    }
  }

  private async checkHealth() {
    try {
      const response = await fetch('/api/health');
      if (response.ok) {
        this.setState({ healthStatus: 'ok' });
      } else {
        this.setState({ healthStatus: 'down' });
      }
    } catch (e) {
      this.setState({ healthStatus: 'down' });
    }
  }

  public static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[CRITICAL CRASH] Shell caught crash:', error, errorInfo);
    this.setState({ error, errorInfo, isReporting: true, reportMessage: 'Transmitting diagnostic data...' });
    
    // Notify general errorService background logger
    errorService.report({
      type: ErrorType.RENDER_ERROR,
      severity: Severity.CRITICAL,
      message: error?.message || 'Automatic Shell Crash Capture',
      stack: errorInfo?.componentStack || error?.stack || 'No stack information',
      component: 'UniversalErrorBoundary'
    });

    // Directly and atomically dispatch a comprehensive bug report to admin
    this.submitAutoReport(error, errorInfo);
  }

  private async submitAutoReport(error: Error, errorInfo: React.ErrorInfo | null) {
    try {
      let userId: string | null = null;
      let userName: string = 'Guest User';
      let userEmail: string = 'anonymous';
      let userRole: string = 'customer';
      try {
        const storedUser = localStorage.getItem('hgs_user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          userId = parsed.id || null;
          userName = parsed.name || 'User';
          userEmail = parsed.email || 'anonymous';
          userRole = parsed.role || 'customer';
        }
      } catch (err) {}

      const deviceInfo = `${navigator.platform} | ${navigator.vendor} | ${navigator.userAgent}`;
      const screenRes = `${window.screen.width}x${window.screen.height} (${window.innerWidth}x${window.innerHeight})`;
      const networkStatus = navigator.onLine ? 'Online' : 'Offline';
      const token = localStorage.getItem('hgs_token');
      const authHeader = token ? `Bearer ${token}` : '';

      const localTime = new Date().toLocaleString();
      const isoTime = new Date().toISOString();

      await fetch('/api/bugs/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { 'Authorization': authHeader } : {})
        },
        body: JSON.stringify({
          user_id: userId,
          reporter_name: `${userName} (${userEmail} / ${userRole})`,
          message: `[AUTO-CRASH] ${error?.name || 'Error'}: ${error?.message || 'Render crash'}`,
          why: `Uncaught exception in React render tree.\n\nComponent Stack:\n${errorInfo?.componentStack || 'No Component Stack'}\n\nJS Error Stack:\n${error?.stack || 'No JS Stack'}\n\nTime of Crash: ${localTime} (${isoTime})`,
          path: window.location.pathname + window.location.search,
          type: 'SYSTEM_ERROR',
          component: 'AppCrashBoundary',
          device_info: deviceInfo,
          screen_resolution: screenRes,
          network_status: networkStatus,
          action_log: `Captured by React ErrorBoundary. User was on page ${window.location.pathname} at ${localTime}`,
        })
      });

      this.setState({ isReporting: false, reportSuccess: true, reportMessage: '✓ Automatic diagnostic report successfully transmitted to the store administrator.' });
    } catch (err: any) {
      console.error('[ErrorBoundary] Failed to send auto report:', err);
      this.setState({ isReporting: false, reportSuccess: false, reportMessage: 'Failed to sync diagnostic report, queued details locally.' });
    }
  }

  public resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isReporting: false,
      reportMessage: '',
      reportSuccess: false,
      copied: false,
      showStack: false,
      userComments: '',
    });
  };

  private handleClearState = () => {
    if (window.confirm('This will sign you out, empty your cart/wishlist, and purge saved local storage to resolve configuration corruption. Continue?')) {
      localStorage.clear();
      // Clear cookies by setting them with immediate expiration
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      window.location.reload();
    }
  };

  private handleCopyDiagnostics = async () => {
    const { error, errorInfo } = this.state;
    let userId: string | null = null;
    let userName: string = 'Guest User';
    let userEmail: string = 'anonymous';
    let userRole: string = 'customer';
    try {
      const storedUser = localStorage.getItem('hgs_user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        userId = parsed.id || null;
        userName = parsed.name || 'User';
        userEmail = parsed.email || 'anonymous';
        userRole = parsed.role || 'customer';
      }
    } catch (err) {}

    const info = {
      errorMessage: error?.message || 'Unknown error',
      errorStack: error?.stack || 'No JS stack available',
      componentStack: errorInfo?.componentStack || 'No component structure available',
      location: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      user: { userId, userName, userEmail, userRole },
      resolution: `${window.screen.width}x${window.screen.height}`,
      online: navigator.onLine
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(info, null, 2));
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 3000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Instead of showing the full diagnostic page, just render a minimal
      // message or nothing at all, to avoid exposing diagnostic details.
      return (
        <div className="fixed inset-0 flex flex-col items-center justify-center p-4 bg-stone-50 z-[9999]">
          <div className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-stone-500">
             <span>System Status</span>
             {this.state.healthStatus === 'checking' && <span className="text-amber-500">Checking...</span>}
             {this.state.healthStatus === 'ok' && <span className="text-emerald-500">Online</span>}
             {this.state.healthStatus === 'down' && <span className="text-red-500">Maintenance</span>}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 bg-white text-stone-900 text-sm font-bold uppercase tracking-widest border border-stone-200 px-8 py-4 rounded-full shadow-sm hover:border-stone-300 transition-all active:scale-95"
          >
            <RefreshCw size={16} />
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export const ProductCrashBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const crashBoundaryRef = React.useRef<AppCrashBoundary>(null);
  return (
    <AppCrashBoundary 
      ref={crashBoundaryRef}
      fallback={
        <div className="p-8 bg-red-50 border-2 border-red-100 rounded-[2rem] text-center">
          <p className="text-red-900 font-black uppercase tracking-tight mb-2">Product Load Error</p>
          <p className="text-red-600 text-xs mb-4">Isolated rendering failure for this asset.</p>
          <button onClick={() => crashBoundaryRef.current?.resetError()} className="px-4 py-2 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg">Retry Sync</button>
        </div>
      }
    >
      {children}
    </AppCrashBoundary>
  );
};

export const ComponentCrashBoundary: React.FC<{ children: React.ReactNode; name?: string }> = ({ children, name = "Component" }) => {
  const crashBoundaryRef = React.useRef<AppCrashBoundary>(null);
  return (
    <AppCrashBoundary 
      ref={crashBoundaryRef}
      fallback={
        <div className="p-6 bg-stone-50 border border-stone-200/60 rounded-3xl text-left font-sans flex flex-col justify-center items-center min-h-[100px] text-center">
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-3 border border-amber-100/50">
            <AlertTriangle size={18} />
          </div>
          <p className="text-stone-800 text-xs font-black uppercase tracking-[0.1em]">{name} Connection Idle</p>
          <p className="text-stone-400 text-[10px] font-medium leading-relaxed max-w-xs mt-1 mb-3">
            An isolated exception occurred during presentation of this module. The error has been captured and dispatched automatically.
          </p>
          <button 
            onClick={() => crashBoundaryRef.current?.resetError()} 
            className="px-4 py-1.5 bg-stone-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-stone-800 transition-colors active:scale-95"
          >
            Retry Section
          </button>
        </div>
      }
    >
      {children}
    </AppCrashBoundary>
  );
};

export default AppCrashBoundary;
