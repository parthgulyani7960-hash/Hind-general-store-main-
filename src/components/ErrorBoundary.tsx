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
        <div className="flex flex-col items-center justify-center h-screen p-4 text-center">
            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
            <p className="mb-4">We're working on fixing it.</p>
            <button onClick={() => window.location.href = '/'} className="btn-primary">Return to Home</button>
        </div>
      );
    }

    // @ts-ignore
    return this.props.children;
  }
}
