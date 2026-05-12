import React, { ErrorInfo, ReactNode } from 'react';
import toast from 'react-hot-toast';
import { reportError } from '../lib/errorReporter';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
  }
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    toast.error("An unexpected error occurred. Please refresh the page.");
    
    reportError({
      message: error.message || 'Unknown render error',
      componentStack: errorInfo.componentStack?.substring(0, 500) || 'No stack trace',
      path: window.location.pathname,
      logs: []
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
