import React, { ErrorInfo, ReactNode } from 'react';
import toast from 'react-hot-toast';

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
    
    // Auto-report bug
    try {
      const userStr = localStorage.getItem('hgs_user');
      let userId = null;
      let reporterName = 'System Auto (Guest)';
      
      if (userStr) {
        const user = JSON.parse(userStr);
        userId = user.id;
        reporterName = user.name || user.phone || 'System Auto (User)';
      }
      
      fetch('/api/bugs/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          reporter_name: reporterName,
          message: error.message || 'Unknown render error',
          why: errorInfo.componentStack?.substring(0, 500) || 'No stack trace',
          path: window.location.pathname,
          action_log: 'Automatically captured by ErrorBoundary'
        })
      }).catch(err => console.error("Failed to auto-report bug", err));
    } catch(e) {}
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen p-4 text-center">
            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
            <p className="mb-4">We're working on fixing it.</p>
            <button onClick={() => window.location.reload()} className="btn-primary">Refresh Page</button>
        </div>
      );
    }

    // @ts-ignore
    return this.props.children;
  }
}
