import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
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

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-3xl flex items-center justify-center mb-6">
            <AlertCircle size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-3">
            দুঃখিত, কিছু ভুল হয়েছে!
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8 leading-relaxed">
            একটি অপ্রত্যাশিত সমস্যা দেখা দিয়েছে। আমরা সমস্যার সমাধান করার চেষ্টা করছি। দয়া করে আবার চেষ্টা করুন।
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-500/30 transition-all active:scale-[0.98]"
          >
            <RefreshCw size={18} />
            আবার চেষ্টা করুন
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
