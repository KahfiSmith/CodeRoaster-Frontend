import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI with CodeRoaster design system
      return (
        <div className="min-h-screen flex items-center justify-center bg-cream p-4">
          <div className="max-w-md w-full bg-cream border-4 border-charcoal rounded-lg shadow-[0px_8px_0px_0px_#27292b] text-center">
            {/* Header */}
            <div className="bg-charcoal p-6 border-b-4 border-charcoal">
              <div className="bg-coral/20 p-4 rounded-lg border-3 border-charcoal inline-block mb-4">
                <AlertTriangle className="w-12 h-12 text-coral" />
              </div>
              <h2 className="text-2xl font-bold text-cream">
                Oops! Something went wrong
              </h2>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <p className="text-charcoal/80 mb-6 font-medium leading-relaxed">
                The CodeRoaster encountered an unexpected error. Don't worry, even the best code gets roasted sometimes! 🔥
              </p>

              <button
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 bg-amber hover:bg-amber/80 text-charcoal font-bold py-3 px-6 rounded-lg border-3 border-charcoal transition-all duration-200 shadow-[2px_2px_0px_0px_#27292b] hover:shadow-[1px_1px_0px_0px_#27292b] hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>

              {import.meta.env.DEV && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-charcoal/60 hover:text-charcoal font-bold">
                    🔧 Show Error Details (Dev Mode)
                  </summary>
                  <div className="mt-3 p-4 bg-charcoal/10 border-3 border-charcoal rounded-lg text-xs font-mono text-coral overflow-auto max-h-48">
                    <div className="font-bold mb-2 text-charcoal">{this.state.error.toString()}</div>
                    {this.state.errorInfo && (
                      <pre className="whitespace-pre-wrap text-charcoal/70">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;