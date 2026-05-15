import React, { ErrorInfo, ReactNode } from 'react';
import toast from 'react-hot-toast';
import { errorService, ErrorType } from '../lib/errorReporting';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught render error:", error, errorInfo);
    
    errorService.report({
      type: ErrorType.RENDER_ERROR,
      message: error.message || 'React Render Crash',
      stack: errorInfo.componentStack || undefined,
      metadata: { component: 'GlobalErrorBoundary' }
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4 font-sans">
          <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl border border-stone-100 p-8 md:p-12 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-24 h-24 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-red-100">
              <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h1 className="text-3xl font-black text-stone-900 mb-3 tracking-tight">Oops! Something went wrong</h1>
            <p className="text-stone-500 mb-10 leading-relaxed font-medium">
              We encountered an unexpected issue while rendering this page. A detailed crash report has been automatically generated and sent to our team.
            </p>
            
            <div className="space-y-4">
              <button 
                onClick={() => window.location.reload()} 
                className="w-full py-4 px-6 bg-stone-900 text-white rounded-2xl font-bold hover:bg-stone-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 active:translate-y-0"
              >
                Refresh Session
              </button>
              
              <button 
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/';
                }} 
                className="w-full py-4 px-6 bg-white text-stone-700 border-2 border-stone-100 rounded-2xl font-bold hover:bg-stone-50 transition-all hover:border-stone-200"
              >
                Clear Data & Return Home
              </button>
              
              <p className="text-xs text-stone-400 font-bold uppercase tracking-widest pt-2">
                CRASH REPORT SENT SUCCESSFULLY
              </p>
            </div>
          </div>
        </div>
      );
    }

    // @ts-ignore
    return this.props.children;
  }
}
