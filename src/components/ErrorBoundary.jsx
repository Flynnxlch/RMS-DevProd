import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error (logger will handle dev/prod logic)
    // In production, this should be sent to error tracking service
    console.error('Error caught by boundary:', error, errorInfo);
    
    // In production, you can log to error tracking service here
    // Example: logErrorToService(error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Optionally reload the page
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                <i className="bi bi-exclamation-triangle text-red-600 dark:text-red-400 text-3xl"></i>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Terjadi Kesalahan
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Maaf, terjadi kesalahan yang tidak terduga. Silakan coba muat ulang halaman.
              </p>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Detail Kesalahan (Development Only)
                </summary>
                <div className="bg-gray-100 dark:bg-gray-900 rounded p-3 text-xs font-mono text-red-600 dark:text-red-400 overflow-auto max-h-48">
                  <div className="mb-2">
                    <strong>Error:</strong> {this.state.error.toString()}
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap mt-1">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-2.5 bg-[#0d6efd] text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
              >
                <i className="bi bi-arrow-clockwise mr-2"></i>
                Muat Ulang Halaman
              </button>
              <button
                onClick={() => window.history.back()}
                className="px-6 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                <i className="bi bi-arrow-left mr-2"></i>
                Kembali
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
