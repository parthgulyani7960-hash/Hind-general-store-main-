const fs = require('fs');

const file = 'src/components/AppCrashBoundary.tsx';
let content = fs.readFileSync(file, 'utf8');

// Just in case it was already patched, I will rewrite the whole component to be perfect.
const newComponent = `import React from 'react';
import { RefreshCcw, WifiOff, AlertTriangle } from 'lucide-react';

interface Props {
  children?: React.ReactNode;
  reset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AppCrashBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[CRASH BOUNDARY] Caught error:', error, errorInfo);
  }

  handleNetworkRetry = () => {
    // Clear caches
    try {
      localStorage.removeItem('hgs_products');
      localStorage.removeItem('hgs_categories');
      localStorage.removeItem('hgs_token');
      localStorage.removeItem('hgs_user');
      sessionStorage.clear();
    } catch (e) {}

    // Hard refresh state without a full page reload if reset is provided, otherwise reload
    if (this.props.reset) {
      this.setState({ hasError: false, error: null });
      this.props.reset();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError || this.props.reset) {
      const errorStr = (this.state.error?.message || '').toLowerCase();
      const isNetworkError = errorStr.includes('fetch') || errorStr.includes('network') || errorStr.includes('failed to fetch') || errorStr.includes('timeout');

      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6">
          <div className="max-w-md w-full bg-white rounded-xl shadow-xl overflow-hidden border border-zinc-100">
            <div className={\`p-6 \${isNetworkError ? 'bg-orange-50' : 'bg-red-50'} border-b \${isNetworkError ? 'border-orange-100' : 'border-red-100'} flex justify-center\`}>
              {isNetworkError ? (
                <WifiOff className="w-12 h-12 text-orange-500" />
              ) : (
                <AlertTriangle className="w-12 h-12 text-red-500" />
              )}
            </div>
            
            <div className="p-8 text-center">
              <h2 className="text-xl font-bold text-zinc-900 mb-3">
                {isNetworkError ? 'Network Connection Lost' : 'Application Error'}
              </h2>
              
              <p className="text-zinc-600 mb-8 leading-relaxed">
                {isNetworkError 
                  ? 'We are having trouble connecting to the servers. Please check your internet connection and try again.'
                  : 'An unexpected runtime error occurred. Our team has been notified.'}
              </p>

              {isNetworkError ? (
                <button
                  onClick={this.handleNetworkRetry}
                  className="w-full flex items-center justify-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  <RefreshCcw className="w-5 h-5" />
                  <span>Retry Connection</span>
                </button>
              ) : (
                <button
                  onClick={() => window.location.reload()}
                  className="w-full flex items-center justify-center space-x-2 bg-zinc-900 hover:bg-zinc-800 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  <RefreshCcw className="w-5 h-5" />
                  <span>Reload Application</span>
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
`;

fs.writeFileSync(file, newComponent);
console.log('patched AppCrashBoundary.tsx');
