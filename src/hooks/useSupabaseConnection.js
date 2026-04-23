
import { useState, useEffect, useCallback } from 'react';
import { isSupabaseConfigured, getSupabaseError } from '@/config/supabaseConfig';
import { validateSupabaseConnection } from '@/lib/supabaseValidator';

/**
 * Custom hook to check and monitor Supabase connection status
 */
export const useSupabaseConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [error, setError] = useState(null);
  const [isValidating, setIsValidating] = useState(true);

  const validateConnection = useCallback(async () => {
    setIsValidating(true);
    
    // First check if configured
    const configured = isSupabaseConfigured();
    setIsConfigured(configured);
    
    if (!configured) {
      const configError = getSupabaseError();
      setError(configError?.message || 'Supabase is not configured');
      setIsConnected(false);
      setIsValidating(false);
      return false;
    }
    
    // Then validate connection
    try {
      const { isConnected: connected, error: connectionError } = await validateSupabaseConnection();
      
      setIsConnected(connected);
      setError(connectionError);
      setIsValidating(false);
      
      return connected;
    } catch (err) {
      console.error('❌ [useSupabaseConnection] Validation error:', err);
      setError(err.message || 'Failed to validate connection');
      setIsConnected(false);
      setIsValidating(false);
      return false;
    }
  }, []);

  useEffect(() => {
    validateConnection();
  }, [validateConnection]);

  const retry = useCallback(async () => {
    if (import.meta.env.DEV) {
      console.log('🔄 [useSupabaseConnection] Retrying connection...');
    }
    return await validateConnection();
  }, [validateConnection]);

  return {
    isConnected,
    isConfigured,
    error,
    isValidating,
    retry,
    validateConnection
  };
};
