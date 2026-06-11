import * as React from 'react';
import { errorService, ErrorType } from '@/lib/errorReporting';

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    errorService.report({
      type: ErrorType.RENDER_ERROR,
      message: error.message || 'Rendering error',
      stack: errorInfo.componentStack,
      component: 'ErrorBoundary'
    });
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="text-center py-20 px-4">
          <h2 className="text-2xl font-black text-stone-900 mb-4">Something went wrong</h2>
          <p className="text-stone-500 mb-8">We encountered an issue loading this section.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-orange-600 transition-all"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export const ProductErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary 
      fallback={
        <div className="p-8 bg-red-50 border-2 border-red-100 rounded-[2rem] text-center">
          <p className="text-red-900 font-black uppercase tracking-tight mb-2">Product Load Error</p>
          <p className="text-red-600 text-xs mb-4">Isolated rendering failure for this asset.</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg">Retry Sync</button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
};

export default ErrorBoundary;
