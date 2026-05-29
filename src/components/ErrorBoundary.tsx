import * as React from 'react';
import { ErrorInfo, ReactNode } from 'react';
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
    
    // Check for chunk load errors or failed dynamic imports
    const errorMessage = error?.message || '';
    const isChunkError = errorMessage && (
      errorMessage.includes('Failed to fetch dynamically imported module') ||
      errorMessage.includes('Loading chunk') ||
      errorMessage.includes('ChunkLoadError')
    );

    if (isChunkError) {
      try {
        const reloadCount = parseInt(localStorage.getItem('hgs_chunk_reload_count') || '0');
        const lastReload = parseInt(localStorage.getItem('hgs_last_chunk_reload') || '0');
        const now = Date.now();
        
        // Reset count if last reload was more than 30s ago
        const count = (now - lastReload > 30000) ? 0 : reloadCount;

        if (count < 1) {
          localStorage.setItem('hgs_chunk_reload_count', String(count + 1));
          localStorage.setItem('hgs_last_chunk_reload', String(now));
          console.warn('[ErrorBoundary] Chunk load error. Attempting ONE automatic reload...', count + 1);
          window.location.reload();
          return;
        } else {
          console.error('[ErrorBoundary] Max reload attempts reached (1). Manual intervention required.');
          localStorage.setItem('hgs_last_chunk_reload', String(now)); // Update last reload
          // Don't reset count immediately, allow user to click refresh
        }
      } catch (e) {
        console.error('Failed to auto-reload on chunk error:', e);
      }
    }

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
        <div className="min-h-screen flex items-center justify-center bg-stone-100 p-4 font-sans">
          <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl p-8 text-center animate-in fade-in zoom-in duration-300 border border-stone-200">
            <div className="w-20 h-20 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold text-stone-900 mb-3 tracking-tight">System Unavailable</h1>
            <p className="text-stone-600 mb-8 leading-relaxed">
              We've encountered a technical issue. Please try refreshing the page.
            </p>
            
            <button 
              onClick={() => window.location.reload()} 
              className="w-full py-3.5 bg-stone-900 text-white rounded-xl font-semibold hover:bg-stone-800 transition-all shadow-md"
            >
              Refresh
            </button>
          </div>
        </div>
      );
    }

    // @ts-ignore
    return this.props.children;
  }
}
