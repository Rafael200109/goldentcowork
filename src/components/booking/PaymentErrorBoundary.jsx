import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

class PaymentErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Payment Component Error:", {
      error,
      errorInfo,
      userAgent: navigator.userAgent,
      viewport: { width: window.innerWidth, height: window.innerHeight }
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full p-4 border rounded-lg bg-red-50 dark:bg-red-900/10 space-y-3">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="font-semibold">Error en el sistema de pagos</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Hubo un problema al cargar el formulario de pago. Por favor intenta recargar.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <pre className="text-xs bg-black/5 p-2 rounded overflow-auto max-h-20">
              {this.state.error.toString()}
            </pre>
          )}
          <Button 
            onClick={this.handleRetry} 
            variant="outline" 
            size="sm"
            className="w-full sm:w-auto"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar carga
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default PaymentErrorBoundary;