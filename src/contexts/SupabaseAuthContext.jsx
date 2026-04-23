
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { supabaseClient } from '@/config/supabaseConfig';
import { isSupabaseConfigured, getSupabaseError } from '@/config/supabaseConfig';
import { useToast } from '@/components/ui/use-toast';
import { storageManager } from '@/lib/storageManager';
import { connectionManager } from '@/lib/supabaseConnectionManager';
import { supabaseLogger } from '@/lib/supabaseDebugLogger';

const AuthContext = createContext(undefined);

const SESSION_KEY = 'goldent_supa_session_backup';

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();
  
  const [cachedUser, setCachedUser] = useState(() => storageManager.getAuthCache());
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [configError, setConfigError] = useState(null);
  
  // Prevent concurrent initialization
  const initializingRef = useRef(false);
  const initializedRef = useRef(false);

  const persistSessionBackup = useCallback((currentSession) => {
    if (!isSupabaseConfigured()) return;

    try {
      if (currentSession) {
        storageManager.setItem(SESSION_KEY, JSON.stringify(currentSession));
        storageManager.saveAuthCache(currentSession.user);
        setCachedUser(storageManager.getAuthCache());
        supabaseLogger.logAuthEvent('SESSION_BACKUP_SAVED', { userId: currentSession.user.id });
      } else {
        storageManager.removeItem(SESSION_KEY);
        supabaseLogger.logAuthEvent('SESSION_BACKUP_CLEARED', {});
      }
    } catch (e) {
      supabaseLogger.error('AUTH', 'Failed to backup session', e);
    }
  }, []);

  const handleSession = useCallback(async (currentSession) => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    try {
      supabaseLogger.logAuthEvent('HANDLE_SESSION', currentSession ? 'Session Active' : 'No Session');
      
      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        persistSessionBackup(currentSession);
      } else {
        storageManager.clearSessionData();
      }
      
      setError(null);
    } catch (err) {
      supabaseLogger.error('AUTH', 'Error handling session', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [persistSessionBackup]);

  useEffect(() => {
    // Check configuration first
    if (!isSupabaseConfigured()) {
      const error = getSupabaseError();
      setConfigError(error);
      supabaseLogger.logConfigError(error?.errors || ['Configuration invalid']);
      setLoading(false);
      return;
    }

    // Prevent concurrent/duplicate initialization
    if (initializingRef.current || initializedRef.current) {
      return;
    }

    initializingRef.current = true;
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        supabaseLogger.info('AUTH', 'Initialization started', { hasCache: !!cachedUser });

        // Use connection manager for retry logic
        const getSessionOperation = async () => {
          const { data, error: sessionError } = await supabaseClient.auth.getSession();
          
          if (sessionError) {
            // 403 errors might be due to expired sessions, not critical
            if (sessionError.status === 403 || sessionError.message?.includes('403')) {
              supabaseLogger.warning('AUTH', '403 error during getSession (likely expired)', sessionError);
              storageManager.clearSessionData();
              return { data: { session: null }, error: null };
            }
            throw sessionError;
          }
          
          return { data, error: null };
        };

        const result = await connectionManager.executeWithRetry(
          getSessionOperation,
          'Get auth session'
        );

        if (!mounted) return;

        if (result.success && result.data?.data?.session) {
          await handleSession(result.data.data.session);
          initializedRef.current = true;
          initializingRef.current = false;
          return;
        }

        // Try backup session if primary failed
        const backupSessionStr = storageManager.getItem(SESSION_KEY);
        if (backupSessionStr && mounted) {
          try {
            const backupSession = JSON.parse(backupSessionStr);
            if (backupSession.expires_at && backupSession.expires_at > (Date.now() / 1000)) {
              supabaseLogger.info('AUTH', 'Attempting to restore from backup session');
              
              const restoreOperation = async () => {
                return await supabaseClient.auth.setSession({
                  access_token: backupSession.access_token,
                  refresh_token: backupSession.refresh_token
                });
              };

              const restoreResult = await connectionManager.executeWithRetry(
                restoreOperation,
                'Restore backup session'
              );

              if (restoreResult.success && restoreResult.data?.session) {
                if (mounted) {
                  await handleSession(restoreResult.data.session);
                  initializedRef.current = true;
                  initializingRef.current = false;
                  return;
                }
              } else {
                supabaseLogger.warning('AUTH', 'Backup restore failed, clearing session');
                storageManager.clearSessionData();
              }
            } else {
              supabaseLogger.info('AUTH', 'Backup session expired, clearing');
              storageManager.clearSessionData();
            }
          } catch (parseError) {
            supabaseLogger.error('AUTH', 'Failed to parse backup session', parseError);
            storageManager.clearSessionData();
          }
        }

        if (mounted) {
          supabaseLogger.info('AUTH', 'Initialization complete - no active session');
          setLoading(false);
          initializedRef.current = true;
          initializingRef.current = false;
        }

      } catch (err) {
        supabaseLogger.error('AUTH', 'Initialization error', err);
        if (mounted) {
          setError(err);
          setLoading(false);
          initializingRef.current = false;
          // Don't mark as initialized on error to allow retry
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event, currentSession) => {
        supabaseLogger.logAuthEvent('AUTH_STATE_CHANGE', event);
        
        if (mounted) {
          if (event === 'SIGNED_OUT') {
            setUser(null);
            setSession(null);
            setCachedUser(null);
            storageManager.clearSessionData();
            setLoading(false);
          } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
            await handleSession(currentSession);
          }
        }
      }
    );

    const handleStorageEvent = (e) => {
      if (e.key === null || e.key === 'auth_session_cleared' || (e.key.startsWith('sb-') && !e.newValue)) {
        if (!storageManager.validateSessionExists() && mounted) {
          supabaseLogger.logAuthEvent('CROSS_TAB_LOGOUT_DETECTED', {});
          setUser(null);
          setSession(null);
          setCachedUser(null);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [handleSession, cachedUser]);

  const signUp = useCallback(async (email, password, options) => {
    if (!isSupabaseConfigured()) {
      toast({
        variant: "destructive",
        title: "Error de configuración",
        description: "Supabase no está configurado correctamente",
      });
      return { data: null, error: new Error('Supabase not configured') };
    }

    setLoading(true);
    try {
      const signUpOperation = async () => {
        return await supabaseClient.auth.signUp({ email, password, options });
      };

      const result = await connectionManager.executeWithRetry(signUpOperation, 'Sign up');

      if (!result.success) {
        throw new Error(result.error);
      }

      const { data, error } = result.data;
      if (error) throw error;
      
      if (data?.user) {
        storageManager.saveAuthCache(data.user);
        setCachedUser(storageManager.getAuthCache());
      }
      
      return { data, error: null };
    } catch (error) {
      supabaseLogger.error('AUTH', 'Sign up failed', error);
      toast({
        variant: "destructive",
        title: "Error en el registro",
        description: error.message || "Por favor intenta nuevamente",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const signIn = useCallback(async (email, password) => {
    if (!isSupabaseConfigured()) {
      return { 
        data: null, 
        error: new Error('Supabase no está configurado correctamente') 
      };
    }

    setLoading(true);
    try {
      const signInOperation = async () => {
        return await supabaseClient.auth.signInWithPassword({ email, password });
      };

      const result = await connectionManager.executeWithRetry(signInOperation, 'Sign in');

      if (!result.success) {
        throw new Error(result.error);
      }

      const { data, error } = result.data;
      if (error) throw error;

      // Actualizar estado inmediatamente después del signIn exitoso
      if (data?.user && data?.session) {
        supabaseLogger.logAuthEvent('SIGN_IN_SUCCESS', { userId: data.user.id });
        storageManager.saveAuthCache(data.user);
        setCachedUser(storageManager.getAuthCache());
        
        // Actualizar estado directamente para redirección inmediata
        setUser(data.user);
        setSession(data.session);
        setError(null);
        setLoading(false);
      }

      return { data, error: null };
    } catch (error) {
      supabaseLogger.error('AUTH', 'Sign in failed', error);
      return { data: null, error };
    } finally {
      // Solo setLoading(false) si no se actualizó arriba
      if (!user) {
        setLoading(false);
      }
    }
  }, [user]);

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setUser(null);
      setSession(null);
      setCachedUser(null);
      storageManager.clearSessionData();
      persistSessionBackup(null);
      setLoading(false);
      return { error: null };
    }

    supabaseLogger.logAuthEvent('SIGN_OUT_START', {});
    setLoading(true);
    
    try {
      // Don't retry sign out - just do it once
      const { error } = await supabaseClient.auth.signOut();
      
      if (error) {
        if (error.status === 403 || error.message?.includes('403')) {
          supabaseLogger.warning('AUTH', '403 during sign out (session expired), proceeding with local cleanup');
        } else {
          supabaseLogger.warning('AUTH', 'Sign out error, proceeding with local cleanup', error);
        }
      }
    } catch (error) {
      supabaseLogger.warning('AUTH', 'Unexpected sign out error, proceeding with local cleanup', error);
    } finally {
      setUser(null);
      setSession(null);
      setCachedUser(null);
      storageManager.clearSessionData();
      persistSessionBackup(null);
      setLoading(false);
      supabaseLogger.logAuthEvent('SIGN_OUT_COMPLETE', {});
    }
    
    return { error: null };
  }, [persistSessionBackup]);

  const value = useMemo(() => ({
    user,
    cachedUser,
    session,
    loading,
    error,
    configError,
    isConfigured: isSupabaseConfigured(),
    signUp,
    signIn,
    signOut,
  }), [user, cachedUser, session, loading, error, configError, signUp, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
