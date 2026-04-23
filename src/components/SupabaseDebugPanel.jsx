
import React, { useState, useEffect } from 'react';
import { isSupabaseConfigured, getSupabaseError, getConfigStatus } from '@/config/supabaseConfig';
import { 
  validateSupabaseConnection, 
  testDatabaseConnection, 
  checkRealtimeAvailability,
  logSupabaseDebugInfo 
} from '@/lib/supabaseValidator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { X, RefreshCw, Database, Wifi, AlertCircle, CheckCircle2 } from 'lucide-react';

export const SupabaseDebugPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState({
    configured: false,
    connected: false,
    databaseOk: false,
    realtimeOk: false,
    testing: false
  });
  const [errors, setErrors] = useState([]);

  // Toggle panel with keyboard shortcut (Ctrl+Shift+D)
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Initial status check
  useEffect(() => {
    if (isOpen) {
      checkAllStatus();
    }
  }, [isOpen]);

  const checkAllStatus = async () => {
    setStatus(prev => ({ ...prev, testing: true }));
    
    // Check configuration
    const configured = isSupabaseConfigured();
    const configError = getSupabaseError();
    const newErrors = configError?.errors || [];

    // Check connection
    let connected = false;
    let databaseOk = false;
    let realtimeOk = false;

    if (configured) {
      const { isConnected, error: connError } = await validateSupabaseConnection();
      connected = isConnected;
      if (connError) newErrors.push(connError);

      if (connected) {
        const { success: dbSuccess, error: dbError } = await testDatabaseConnection();
        databaseOk = dbSuccess;
        if (dbError) newErrors.push(`Database: ${dbError}`);

        const { available: rtAvailable, error: rtError } = await checkRealtimeAvailability();
        realtimeOk = rtAvailable;
        if (rtError) newErrors.push(`Realtime: ${rtError}`);
      }
    }

    setStatus({
      configured,
      connected,
      databaseOk,
      realtimeOk,
      testing: false
    });
    setErrors(newErrors);
  };

  const handleClearCache = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    } catch (err) {
      console.error('Error clearing cache:', err);
    }
  };

  const handleLogDebugInfo = () => {
    logSupabaseDebugInfo();
  };

  // Only render in development
  if (!import.meta.env.DEV) return null;
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-96 max-h-[80vh] overflow-auto">
      <Card className="border-2 border-yellow-500 shadow-2xl">
        <CardHeader className="bg-yellow-50 dark:bg-yellow-950">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                Supabase Debug Panel
              </CardTitle>
              <CardDescription>Development Mode Only</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {/* Status Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Connection Status</h3>
            <div className="grid grid-cols-2 gap-2">
              <StatusBadge
                label="Configuration"
                status={status.configured}
                icon={CheckCircle2}
              />
              <StatusBadge
                label="Connection"
                status={status.connected}
                icon={Wifi}
              />
              <StatusBadge
                label="Database"
                status={status.databaseOk}
                icon={Database}
              />
              <StatusBadge
                label="Realtime"
                status={status.realtimeOk}
                icon={Wifi}
              />
            </div>
          </div>

          <Separator />

          {/* Environment Variables */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Environment Variables</h3>
            <div className="space-y-1 text-xs">
              <EnvVar
                name="VITE_SUPABASE_URL"
                value={import.meta.env.VITE_SUPABASE_URL}
              />
              <EnvVar
                name="VITE_SUPABASE_ANON_KEY"
                value={import.meta.env.VITE_SUPABASE_ANON_KEY}
              />
            </div>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-red-600">Errors</h3>
                <div className="space-y-1">
                  {errors.map((error, index) => (
                    <div key={index} className="text-xs text-red-600 bg-red-50 dark:bg-red-950 p-2 rounded">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Actions */}
          <div className="space-y-2">
            <Button
              onClick={checkAllStatus}
              disabled={status.testing}
              className="w-full"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${status.testing ? 'animate-spin' : ''}`} />
              Test Connection
            </Button>
            <Button
              onClick={handleLogDebugInfo}
              variant="outline"
              className="w-full"
              size="sm"
            >
              Log Debug Info to Console
            </Button>
            <Button
              onClick={handleClearCache}
              variant="destructive"
              className="w-full"
              size="sm"
            >
              Clear Cache & Reload
            </Button>
          </div>

          {/* Keyboard Shortcut */}
          <div className="text-xs text-muted-foreground text-center">
            Press <kbd className="px-2 py-1 bg-muted rounded">Ctrl+Shift+D</kbd> to toggle
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const StatusBadge = ({ label, status, icon: Icon }) => (
  <div className="flex items-center gap-2 p-2 rounded border">
    <Icon className={`w-4 h-4 ${status ? 'text-green-600' : 'text-red-600'}`} />
    <div className="flex-1 min-w-0">
      <div className="text-xs font-medium truncate">{label}</div>
      <Badge 
        variant={status ? 'default' : 'destructive'}
        className="text-xs h-5 mt-0.5"
      >
        {status ? 'OK' : 'FAIL'}
      </Badge>
    </div>
  </div>
);

const EnvVar = ({ name, value }) => (
  <div className="flex items-start gap-2">
    <div className="font-mono text-muted-foreground flex-shrink-0">{name}:</div>
    <div className="flex-1 min-w-0">
      {value ? (
        <span className="text-green-600 font-mono break-all">
          {value.substring(0, 30)}...
        </span>
      ) : (
        <span className="text-red-600 font-bold">MISSING</span>
      )}
    </div>
  </div>
);
