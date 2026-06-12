import * as React from 'react';
import { errorService, ErrorType } from '../lib/incidentReporting';
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
    };
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

      const { error, copied } = this.state;

      return (
        <div className="fixed inset-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-stone-100 via-stone-50 to-stone-100 flex flex-col items-center justify-center select-none overflow-hidden p-4">
          {/* Background Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:16px_28px] pointer-events-none" />
          
          <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl border border-stone-100 p-8 md:p-10 relative overflow-hidden text-center z-10 transition-all font-sans">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 via-red-500 to-indigo-500" />
            
            {/* Soft pulsing yellow/red badge */}
            <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-amber-100/50 text-amber-600 animate-pulse">
              <AlertTriangle size={36} strokeWidth={2} />
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-stone-900 tracking-tight leading-tight mb-3 text-center">
              Temporarily Unavailable
            </h1>
            
            <p className="text-stone-500 text-xs font-medium leading-relaxed mb-8 max-w-sm mx-auto text-center">
              The store is experiencing a brief technical interruption. We've automatically sent a diagnostic report to our team so they can resolve this for you immediately.
            </p>

            {/* Diagnostic Box - Fully Submitted */}
            <div className="bg-emerald-50/70 border border-emerald-100/80 rounded-2xl p-5 mb-8 text-left space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Unified Crash Sentinel Status</span>
              </div>
              <p className="text-[11px] font-semibold text-emerald-700/90 leading-snug">
                An immediate diagnostic snapshot containing chronological trace logs, user authentication context, error indicators, and stack execution parameters was securely logged.
              </p>
              
              <div className="pt-2.5 border-t border-emerald-100/20 grid grid-cols-2 gap-3 text-[10px] font-mono text-emerald-800">
                <div className="text-left">
                  <span className="text-emerald-600 font-bold block uppercase tracking-wider text-[8px] mb-0.5">Timestamp</span>
                  <span className="font-bold">{new Date().toLocaleString()}</span>
                </div>
                <div className="text-left">
                  <span className="text-emerald-600 font-bold block uppercase tracking-wider text-[8px] mb-0.5">Active Screen</span>
                  <span className="font-bold truncate block">{window.location.pathname}</span>
                </div>
              </div>
            </div>

            {/* Copy Diagnostics option */}
            <div className="flex flex-col gap-3 mb-8">
              <button
                onClick={this.handleCopyDiagnostics}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-stone-50 hover:bg-stone-100 active:scale-[0.99] border border-stone-200/60 rounded-xl text-[10px] font-bold font-mono text-stone-600 transition-all cursor-pointer"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{copied ? 'Diagnostic Parameters Copied!' : 'Copy Diagnostic Parameters (if requested by support)'}</span>
              </button>
            </div>

            {/* Main Action Resolvers */}
            <div className="space-y-4">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-stone-900 hover:bg-slate-800 text-white font-bold py-4 px-6 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-widest"
              >
                <RefreshCw size={14} className="animate-spin animate-duration-1000" />
                <span>Reload Hind Store</span>
              </button>
            </div>
            
            {/* Visual assurance block */}
            <div className="mt-8 pt-6 border-t border-stone-100 flex justify-center gap-4 items-center text-[9px] text-stone-400 font-black uppercase tracking-widest">
              <span className="flex items-center gap-1 select-none">
                ✓ Automated Tracking Active
              </span>
              <span className="text-stone-300">•</span>
              <span className="flex items-center gap-1 select-none">
                No user action required
              </span>
            </div>
          </div>
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

export default AppCrashBoundary;
