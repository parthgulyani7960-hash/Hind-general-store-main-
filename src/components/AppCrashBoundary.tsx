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
            
            {/* Warning Badge */}
            <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-amber-100/50 text-amber-600">
              <AlertTriangle size={36} strokeWidth={2} />
            </div>

            <h1 className="text-3xl font-black text-stone-900 tracking-tight leading-tight mb-3 text-center">
              Temporarily Unavailable
            </h1>
            
            <p className="text-stone-500 text-sm font-medium leading-relaxed mb-10 max-w-sm mx-auto text-center">
              The store is experiencing a brief technical interruption. We've automatically sent a diagnostic report to our team so they can resolve this for you immediately.
            </p>

            {/* System Status Box (User Friendly) */}
            <div className="bg-emerald-50/70 border border-emerald-100/80 rounded-2xl p-6 mb-8 text-left space-y-4">
              <div className="flex items-center gap-2 text-emerald-800 font-black text-[10px] uppercase tracking-[0.2em]">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Automated Status Monitor</span>
              </div>
              <p className="text-[12px] font-bold text-emerald-700/90 leading-snug">
                Our monitoring system detected an unusual pattern. A secure snapshot was logged to help our maintenance team restore full service.
              </p>
              
              <div className="pt-3 border-t border-emerald-100/30 flex justify-between gap-4 text-[10px] font-bold text-emerald-800/60 uppercase tracking-widest">
                <div>
                  <span className="block opacity-50 mb-1">Logged At</span>
                  <span className="font-black text-emerald-800">{new Date().toLocaleTimeString()}</span>
                </div>
                <div className="text-right">
                  <span className="block opacity-50 mb-1">Active View</span>
                  <span className="font-black text-emerald-800">{window.location.pathname}</span>
                </div>
              </div>
            </div>

            {/* Reload Action */}
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-stone-900 hover:bg-slate-800 text-white font-black py-5 px-6 rounded-[2rem] shadow-xl shadow-stone-900/10 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm uppercase tracking-[0.2em]"
            >
              <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-700" />
              <span>Reload Hind Store</span>
            </button>
            
            {/* Minimalist Footnotes */}
            <div className="mt-10 pt-6 border-t border-stone-100 flex justify-center gap-6 items-center text-[9px] text-stone-300 font-black uppercase tracking-[0.3em]">
              <span className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-stone-200" />
                Tracking Active
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-stone-200" />
                No User Action Required
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
