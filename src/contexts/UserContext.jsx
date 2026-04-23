import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from './SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { handleSupabaseError } from '@/lib/utils';

const UserContext = createContext(undefined);

export const UserProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState(null);
  
  // Track ongoing requests to prevent race conditions
  const loadingIdRef = useRef(null);

  const logUserEvent = (event, details) => {
    if (import.meta.env.DEV) {
        console.log(`[UserContext] ${new Date().toISOString()} - ${event}:`, details);
    }
  };

  const getProfile = useCallback(async (userId, retryCount = 0) => {
    if (!userId) {
        setProfile(null);
        setLoadingProfile(false);
        return;
    }

    loadingIdRef.current = userId;
    setLoadingProfile(true);
    setError(null);
    
    try {
      logUserEvent('FETCH_PROFILE_START', { userId, retryCount });

      // Use the client directly, no fetch
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select(`*`)
        .eq('id', userId)
        .maybeSingle();

      // Check race condition: if user changed while fetching, ignore result
      if (loadingIdRef.current !== userId) return;

      if (fetchError) throw fetchError;
      
      if (data) {
        // Cache bust avatar if needed to ensure fresh image
        if (data.avatar_url) {
          data.avatar_url = `${data.avatar_url.split('?')[0]}?t=${new Date().getTime()}`;
        }
        setProfile(data);
        logUserEvent('FETCH_PROFILE_SUCCESS', { userId });
      } else {
        // Profile doesn't exist yet - might be a sync delay after registration
        if (retryCount < 2) {
            logUserEvent('PROFILE_NOT_FOUND_RETRY', { retryCount });
            setTimeout(() => getProfile(userId, retryCount + 1), 1500);
            return;
        }
        console.warn('[User] Profile not found after retries');
        setProfile(null);
      }
    } catch (err) {
      logUserEvent('FETCH_PROFILE_ERROR', { error: err.message });
      
      // Retry logic for network errors
      if (retryCount < 3) {
          console.log(`[User] Network error, retrying... (${retryCount + 1}/3)`);
          setTimeout(() => getProfile(userId, retryCount + 1), 2000 * (retryCount + 1)); 
          return;
      }

      if (loadingIdRef.current === userId) {
          setError(err);
          // Use standardized error handler
          handleSupabaseError(err, "No pudimos cargar tu perfil");
      }
    } finally {
      if (loadingIdRef.current === userId) {
        setLoadingProfile(false);
      }
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setProfile(null);
      setLoadingProfile(false);
      loadingIdRef.current = null;
      return;
    }

    if (profile && profile.id === user.id) {
        setLoadingProfile(false); 
        return;
    }

    getProfile(user.id);
  }, [user, authLoading, getProfile, profile]);
  
  const refreshProfile = useCallback(async () => {
    if (user) {
      await getProfile(user.id);
    }
  }, [user, getProfile]);

  const clearUser = useCallback(() => {
    setProfile(null);
    setError(null);
    loadingIdRef.current = null;
  }, []);
  
  const value = useMemo(() => ({
    profile,
    loadingProfile,
    error,
    refreshProfile,
    clearUser
  }), [profile, loadingProfile, error, refreshProfile, clearUser]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};