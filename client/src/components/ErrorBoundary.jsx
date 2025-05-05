import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error('ErrorBoundary caught an error', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-800 font-medium mb-2">Something went wrong</h3>
          {this.props.fallback || (
            <div>
              <p className="text-red-700 mb-2">{this.state.error?.toString()}</p>
              {this.props.showDetails && (
                <details className="text-xs text-gray-600 mt-2">
                  <summary>Error details</summary>
                  <pre className="mt-2 whitespace-pre-wrap">
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
              {this.props.resetLabel && (
                <button 
                  onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                  className="mt-3 px-3 py-1 bg-red-100 text-red-900 rounded-md hover:bg-red-200 text-sm"
                >
                  {this.props.resetLabel}
                </button>
              )}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
