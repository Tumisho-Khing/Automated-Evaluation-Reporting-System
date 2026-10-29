import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-white rounded-2xl p-6 shadow-xl border border-slate-200 text-center">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Something went wrong</h2>
            <p className="text-sm text-slate-600 mb-4">
              {this.state.error?.message || 'An unexpected error occurred while rendering the application.'}
            </p>
            <div className="bg-slate-50 p-3 rounded-lg text-xs font-mono text-slate-500 text-left mb-4 overflow-auto max-h-28 border border-slate-200">
              <p className="font-semibold text-slate-700 mb-1">Vercel Deployment Checklist:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Check Vercel project environment variables.</li>
                <li>Ensure <code>VITE_SUPABASE_URL</code> is defined.</li>
                <li>Ensure <code>VITE_SUPABASE_ANON_KEY</code> is defined.</li>
              </ul>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white font-medium rounded-xl text-sm hover:bg-slate-800 transition-colors shadow-sm"
            >
              <RefreshCw className="w-4 h-4" /> Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
