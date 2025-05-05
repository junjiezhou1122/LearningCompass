import React, { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Refresh the page or reset the component
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI when an error occurs
      return (
        <div className="p-8 flex flex-col items-center justify-center min-h-[300px] text-center bg-orange-50 border border-orange-200 rounded-lg shadow-sm">
          <div className="bg-orange-100 p-4 rounded-full mb-4">
            <AlertTriangle className="h-8 w-8 text-orange-500" />
          </div>
          <h2 className="text-2xl font-semibold text-orange-800 mb-2">Something went wrong</h2>
          <p className="text-orange-700 mb-6 max-w-md">
            We're having trouble with this component. The error has been logged and we're working on fixing it.
          </p>
          <button 
            onClick={this.handleReset}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-md transition-colors duration-200"
          >
            Try Again
          </button>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div className="mt-6 p-4 bg-gray-100 rounded text-left w-full overflow-auto max-h-[200px] text-xs">
              <p className="font-semibold mb-2 text-gray-800">Error Details (Development Only):</p>
              <pre className="text-red-500">{this.state.error.toString()}</pre>
              {this.state.errorInfo && (
                <pre className="mt-2 text-gray-700">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>
          )}
        </div>
      );
    }

    // If no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;