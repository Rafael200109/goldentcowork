import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { X, Activity, Database, User, Bug } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

// Task 2: DebugPanel is now only rendered in development mode via App.jsx conditional
const DebugPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, session, loading: authLoading } = useAuth();
  const { profile, loadingProfile } = useUser();
  const [localStorageData, setLocalStorageData] = useState({});
  const [errorLogs, setErrorLogs] = useState([]);

  useEffect(() => {
    if (isOpen) {
      // Load Local Storage snapshot
      const data = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        try {
          data[key] = JSON.parse(localStorage.getItem(key));
        } catch (e) {
          data[key] = localStorage.getItem(key);
        }
      }
      setLocalStorageData(data);

      // Load Error Logs
      try {
        const logs = JSON.parse(localStorage.getItem('goldent_error_logs') || '[]');
        setErrorLogs(logs);
      } catch (e) {
        console.error(e);
      }
    }
  }, [isOpen]);

  // If not open, display a small floating button only in DEV mode
  if (!isOpen) {
    return (
      <Button 
        onClick={() => setIsOpen(true)}
        // Task 4: Changed debug button color to a more neutral gray, visible on any background, no red.
        className="fixed bottom-4 left-4 z-[9999] rounded-full h-10 w-10 p-0 shadow-lg opacity-50 hover:opacity-100 bg-gray-700 hover:bg-gray-800 text-white"
        title="Open Debug Panel"
      >
        <Bug className="h-5 w-5" />
      </Button>
    );
  }

  return (
    // Task 3: No black overlays, the background is a translucent black/50, which is intended for dev.
    // Task 8: Use fixed inset-0 for full screen overlay, ensuring it handles various screen sizes.
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/50 p-2 sm:p-4 pointer-events-none">
      <Card className="w-full max-w-2xl max-h-[85vh] pointer-events-auto flex flex-col shadow-2xl border-2 border-primary/20 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-muted/50">
          <h3 className="font-bold flex items-center gap-2 text-sm sm:text-base">
            <Bug className="h-4 w-4 text-red-500" /> {/* Red bug icon is acceptable for a debug panel */}
            Mobile Debug Console
          </h3>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <ScrollArea className="flex-1 p-3 sm:p-4">
          <div className="grid gap-4 sm:gap-6">
            
            {/* Environment Info */}
            <section className="border rounded p-2">
                <div className="text-[10px] font-mono text-muted-foreground">
                    Viewport: {window.innerWidth}x{window.innerHeight} | UserAgent: {navigator.userAgent.substring(0, 30)}...
                </div>
            </section>

            {/* Auth State */}
            <section>
              <h4 className="font-semibold text-xs sm:text-sm mb-2 flex items-center gap-2">
                <User className="h-3 w-3" /> Auth State
              </h4>
              <div className="bg-muted p-2 rounded-md text-[10px] sm:text-xs font-mono overflow-auto">
                <div className="grid grid-cols-[80px_1fr] sm:grid-cols-[100px_1fr] gap-1">
                  <span className="text-muted-foreground">Auth Loading:</span>
                  <span className={authLoading ? "text-yellow-600 font-bold" : "text-green-600 font-bold"}>
                    {String(authLoading)}
                  </span>
                  
                  <span className="text-muted-foreground">User ID:</span>
                  <span className="break-all">{user?.id || 'null'}</span>
                  
                  <span className="text-muted-foreground">Email:</span>
                  <span className="break-all">{user?.email || 'null'}</span>
                  
                  <span className="text-muted-foreground">Session:</span>
                  <span className={session ? "text-green-600" : "text-red-500"}>
                    {session ? "Active" : "None"}
                  </span>
                </div>
              </div>
            </section>

            {/* Profile State */}
            <section>
              <h4 className="font-semibold text-xs sm:text-sm mb-2 flex items-center gap-2">
                <Database className="h-3 w-3" /> Profile Data
              </h4>
              <div className="bg-muted p-2 rounded-md text-[10px] sm:text-xs font-mono overflow-auto">
                <div className="grid grid-cols-[80px_1fr] sm:grid-cols-[100px_1fr] gap-1">
                  <span className="text-muted-foreground">Profile Load:</span>
                  <span className={loadingProfile ? "text-yellow-600 font-bold" : "text-green-600 font-bold"}>
                    {String(loadingProfile)}
                  </span>
                  
                  <span className="text-muted-foreground">Full Name:</span>
                  <span>{profile?.full_name || 'null'}</span>
                  
                  <span className="text-muted-foreground">App Role:</span>
                  <span className="font-bold text-primary">{profile?.role || 'null'}</span>
                </div>
                {profile && (
                    <details className="mt-2">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Full Profile JSON</summary>
                        <pre className="mt-2 whitespace-pre-wrap break-all">
                            {JSON.stringify(profile, null, 2)}
                        </pre>
                    </details>
                )}
              </div>
            </section>

            {/* Error Logs */}
            {errorLogs.length > 0 && (
                <section>
                    <h4 className="font-semibold text-xs sm:text-sm mb-2 text-red-500">Recorded Errors</h4>
                    <div className="bg-red-50 dark:bg-red-900/10 p-2 rounded-md text-[10px] font-mono max-h-40 overflow-auto">
                        {errorLogs.map((log, i) => (
                            <div key={i} className="mb-2 border-b border-red-200 pb-2 last:border-0">
                                <div className="text-red-600 font-bold">{log.timestamp}</div>
                                <div className="break-words">{log.error}</div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* LocalStorage */}
            <section>
              <h4 className="font-semibold text-xs sm:text-sm mb-2">LocalStorage</h4>
              <div className="bg-muted p-2 rounded-md text-[10px] font-mono overflow-auto max-h-40">
                {Object.entries(localStorageData).map(([key, value]) => (
                  <div key={key} className="mb-2 border-b border-border/50 pb-2 last:border-0 last:pb-0">
                    <span className="text-primary font-bold">{key}:</span>
                    <div className="pl-2 text-muted-foreground break-all">
                      {typeof value === 'object' ? JSON.stringify(value).substring(0, 100) + '...' : String(value).substring(0, 100)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
};

export default DebugPanel;