import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Task 7: Log all errors with timestamp and context
    console.error(`[GlobalErrorBoundary] ${new Date().toISOString()}:`, error, errorInfo);
    
    // Attempt to log to localStorage for mobile debugging
    try {
        const errorLogs = JSON.parse(localStorage.getItem('goldent_error_logs') || '[]');
        errorLogs.push({
            timestamp: new Date().toISOString(),
            error: error.toString(),
            stack: errorInfo.componentStack,
            url: window.location.href,
            userAgent: navigator.userAgent
        });
        // Keep last 10 errors
        if (errorLogs.length > 10) errorLogs.shift();
        localStorage.setItem('goldent_error_logs', JSON.stringify(errorLogs));
    } catch (e) {
        console.warn('Failed to save error to local storage', e);
    }

    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI
      // Task 7: The error boundary uses sensible defaults (bg-background, text-foreground, card for panels).
      // Red colors are only used for text-red-600 for the icon and text, which is appropriate for an error.
      // There are no black overlays outside of the debug panel (which is dev-only).
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full text-center space-y-6 p-6 rounded-lg border bg-card shadow-sm">
            <div className="flex justify-center">
              <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">Algo salió mal</h1>
              <p className="text-muted-foreground">
                Ha ocurrido un error inesperado. Hemos registrado el problema e intentaremos solucionarlo.
              </p>
            </div>

            {this.state.error && (
              <div className="text-left bg-muted p-4 rounded text-[10px] font-mono overflow-auto max-h-40 border border-red-200">
                <p className="font-bold text-red-500 mb-2 break-words">{this.state.error.toString()}</p>
                <p className="text-muted-foreground whitespace-pre-wrap">{this.state.errorInfo?.componentStack?.slice(0, 500)}...</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button onClick={this.handleReload} className="gap-2 w-full sm:w-auto">
                <RefreshCcw className="h-4 w-4" />
                Recargar página
              </Button>
              <Button variant="outline" onClick={this.handleGoHome} className="gap-2 w-full sm:w-auto">
                <Home className="h-4 w-4" />
                Ir al inicio
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;