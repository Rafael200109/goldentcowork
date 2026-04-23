
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, Wifi, WifiOff, Database, ChevronDown, ChevronUp } from 'lucide-react';
import { getConfigStatus, getCredentialPreview } from '@/config/supabaseConfig';
import { supabaseLogger } from '@/lib/supabaseDebugLogger';

export const SupabaseErrorFallback = ({ error, onRetry, showDiagnostics = true }) => {
  const [retrying, setRetrying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const isOnline = navigator.onLine;

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  const configStatus = getConfigStatus();
  const credPreview = getCredentialPreview();
  const recentErrors = supabaseLogger.getErrors().slice(-5);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <Database className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">No se puede conectar a Supabase</CardTitle>
              <CardDescription>
                {isOnline ? 'Verifica la configuración' : 'Sin conexión a internet'}
              </CardDescription>
            </div>
            {isOnline ? (
              <Wifi className="h-5 w-5 text-green-600" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-600" />
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              {error || 'Error de conexión con la base de datos'}
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Button
              onClick={handleRetry}
              disabled={retrying}
              className="w-full"
              size="lg"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${retrying ? 'animate-spin' : ''}`} />
              {retrying ? 'Reintentando...' : 'Reintentar conexión'}
            </Button>

            {!isOnline && (
              <Alert>
                <AlertDescription>
                  <strong>Sin conexión a internet.</strong> Verifica tu conexión y vuelve a intentar.
                </AlertDescription>
              </Alert>
            )}

            {showDiagnostics && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-full"
                >
                  {showDetails ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
                  {showDetails ? 'Ocultar' : 'Mostrar'} información de diagnóstico
                </Button>

                {showDetails && (
                  <Card className="bg-muted/50">
                    <CardContent className="pt-6 space-y-3">
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Estado de configuración</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Configuración válida:</span>
                            <span className={configStatus.isValid ? 'text-green-600' : 'text-red-600'}>
                              {configStatus.isValid ? '✓ Sí' : '✗ No'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">URL de Supabase:</span>
                            <span>{configStatus.url}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Clave de API:</span>
                            <span>{configStatus.anonKey}</span>
                          </div>
                          {credPreview.url && (
                            <div className="mt-2 p-2 bg-background rounded text-xs font-mono break-all">
                              <div className="text-muted-foreground mb-1">URL Preview:</div>
                              <div>{credPreview.url}</div>
                            </div>
                          )}
                        </div>
                      </div>

                      {configStatus.error && (
                        <div>
                          <h4 className="font-semibold text-sm mb-2 text-red-600">Errores detectados</h4>
                          <ul className="space-y-1 text-sm">
                            {configStatus.error.errors?.map((err, idx) => (
                              <li key={idx} className="text-red-600">• {err}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div>
                        <h4 className="font-semibold text-sm mb-2">Información del navegador</h4>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div>En línea: {isOnline ? 'Sí' : 'No'}</div>
                          <div>LocalStorage: {typeof localStorage !== 'undefined' ? 'Disponible' : 'No disponible'}</div>
                          <div className="text-xs break-all">UA: {navigator.userAgent.substring(0, 80)}...</div>
                        </div>
                      </div>

                      {recentErrors.length > 0 && (
                        <div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowLogs(!showLogs)}
                            className="w-full justify-start"
                          >
                            {showLogs ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
                            Errores recientes ({recentErrors.length})
                          </Button>

                          {showLogs && (
                            <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                              {recentErrors.map((log, idx) => (
                                <div key={idx} className="text-xs bg-background p-2 rounded border">
                                  <div className="font-semibold text-red-600">{log.category}: {log.message}</div>
                                  <div className="text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</div>
                                  {log.data && (
                                    <pre className="mt-1 text-xs overflow-x-auto">
                                      {JSON.stringify(log.data, null, 2)}
                                    </pre>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>

          <Alert>
            <AlertDescription className="text-sm">
              <strong>¿Necesitas ayuda?</strong>
              <ul className="mt-2 space-y-1 list-disc list-inside text-muted-foreground">
                <li>Verifica tu conexión a internet</li>
                <li>Intenta recargar la página</li>
                <li>Si el problema persiste, contacta a soporte</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};
