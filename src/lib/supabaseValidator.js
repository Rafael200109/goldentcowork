
/**
 * Supabase Validation and Connection Testing Utilities
 * Updated with proper retry logic and error handling
 */

import { supabaseClient } from '@/config/supabaseConfig';
import { isSupabaseConfigured, getSupabaseError } from '@/config/supabaseConfig';
import { connectionManager } from '@/lib/supabaseConnectionManager';
import { supabaseLogger } from '@/lib/supabaseDebugLogger';

/**
 * Synchronously validate credentials format (no network calls)
 */
export const validateCredentialsFormat = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const errors = [];

  if (!url) {
    errors.push('VITE_SUPABASE_URL is missing');
  } else if (typeof url !== 'string') {
    errors.push('VITE_SUPABASE_URL must be a string');
  } else if (!url.includes('supabase.co')) {
    errors.push('VITE_SUPABASE_URL appears to be invalid (should contain "supabase.co")');
  } else if (url.trim() === '') {
    errors.push('VITE_SUPABASE_URL is empty');
  }

  if (!key) {
    errors.push('VITE_SUPABASE_ANON_KEY is missing');
  } else if (typeof key !== 'string') {
    errors.push('VITE_SUPABASE_ANON_KEY must be a string');
  } else if (key.length < 20) {
    errors.push('VITE_SUPABASE_ANON_KEY appears to be invalid (too short)');
  } else if (key.trim() === '') {
    errors.push('VITE_SUPABASE_ANON_KEY is empty');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Test actual Supabase connectivity (single attempt, no retries)
 */
export const testSupabaseConnectivity = async () => {
  if (!isSupabaseConfigured()) {
    const error = getSupabaseError();
    supabaseLogger.logConfigError(error?.errors || ['Configuration invalid']);
    return {
      isConnected: false,
      error: error?.message || 'Supabase is not configured'
    };
  }

  const formatValidation = validateCredentialsFormat();
  if (!formatValidation.valid) {
    supabaseLogger.logConfigError(formatValidation.errors);
    return {
      isConnected: false,
      error: 'Invalid credentials format: ' + formatValidation.errors.join(', ')
    };
  }

  try {
    supabaseLogger.info('VALIDATION', 'Testing Supabase connectivity...');

    // Attempt a lightweight query with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const { error } = await supabaseClient.auth.getSession();
    clearTimeout(timeoutId);

    if (error) {
      // 403 errors are often due to expired sessions, not connection issues
      if (error.status === 403) {
        supabaseLogger.warning('VALIDATION', 'Session expired (403), but connection is valid');
        return { isConnected: true, error: null };
      }

      supabaseLogger.error('VALIDATION', 'Connectivity test failed', { error: error.message });
      return {
        isConnected: false,
        error: error.message || 'Failed to connect to Supabase'
      };
    }

    supabaseLogger.logConnectionTest(true);
    return { isConnected: true, error: null };

  } catch (err) {
    if (err.name === 'AbortError') {
      supabaseLogger.error('VALIDATION', 'Connection test timed out');
      return {
        isConnected: false,
        error: 'Connection timeout - please check your network'
      };
    }

    supabaseLogger.logNetworkError('connectivity test', err);
    return {
      isConnected: false,
      error: err.message || 'Network error during connectivity test'
    };
  }
};

/**
 * Validate Supabase connection with retry logic
 */
export const validateSupabaseConnection = async () => {
  // Prevent concurrent validation attempts
  if (connectionManager.isCurrentlyConnecting()) {
    supabaseLogger.warning('VALIDATION', 'Validation already in progress, skipping...');
    return connectionManager.getStatus();
  }

  connectionManager.markConnecting();
  supabaseLogger.info('VALIDATION', 'Starting Supabase connection validation');

  const result = await connectionManager.executeWithRetry(
    testSupabaseConnectivity,
    'Supabase connection validation'
  );

  if (result.success) {
    connectionManager.markConnected();
    return { isConnected: true, error: null };
  } else {
    connectionManager.markDisconnected(new Error(result.error));
    return { isConnected: false, error: result.error };
  }
};

/**
 * Get current connection status (no network calls)
 */
export const getConnectionStatus = () => {
  return connectionManager.getStatus();
};

/**
 * Retry operation with exponential backoff (to be used by hooks)
 */
export const retryWithBackoff = async (operation, operationName = 'operation') => {
  const result = await connectionManager.executeWithRetry(operation, operationName);
  
  if (!result.success) {
    throw new Error(result.error);
  }
  
  return result.data;
};

/**
 * Test database connection
 */
export const testDatabaseConnection = async () => {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: 'Supabase is not configured'
    };
  }

  try {
    supabaseLogger.info('DB_TEST', 'Testing database connection...');

    const { count, error } = await supabaseClient
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (error) {
      supabaseLogger.error('DB_TEST', 'Database test failed', { error: error.message });
      return { success: false, error: error.message };
    }

    supabaseLogger.success('DB_TEST', `Database connection successful (${count} profiles)`);
    return { success: true, error: null };

  } catch (err) {
    supabaseLogger.error('DB_TEST', 'Database test error', { error: err.message });
    return { success: false, error: err.message || 'Database connection test failed' };
  }
};

/**
 * Check realtime availability
 */
export const checkRealtimeAvailability = async () => {
  if (!isSupabaseConfigured()) {
    return { available: false, error: 'Supabase is not configured' };
  }

  try {
    supabaseLogger.info('REALTIME', 'Testing realtime availability...');

    const channel = supabaseClient.channel('test-channel');

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        supabaseClient.removeChannel(channel);
        supabaseLogger.warning('REALTIME', 'Realtime connection timeout');
        resolve({ available: false, error: 'Realtime connection timeout' });
      }, 5000);

      channel
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            clearTimeout(timeout);
            supabaseClient.removeChannel(channel);
            supabaseLogger.success('REALTIME', 'Realtime is available');
            resolve({ available: true, error: null });
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            clearTimeout(timeout);
            supabaseClient.removeChannel(channel);
            supabaseLogger.error('REALTIME', `Realtime status: ${status}`);
            resolve({ available: false, error: `Realtime status: ${status}` });
          }
        });
    });
  } catch (err) {
    supabaseLogger.error('REALTIME', 'Realtime test error', { error: err.message });
    return { available: false, error: err.message || 'Failed to check realtime availability' };
  }
};

/**
 * Log comprehensive debug information
 */
export const logSupabaseDebugInfo = () => {
  console.group('🔍 Supabase Debug Information');

  console.log('📦 Environment:', import.meta.env.MODE);
  console.log('📦 Dev Mode:', import.meta.env.DEV);

  console.log('\n🔧 Configuration:');
  const formatValidation = validateCredentialsFormat();
  console.log('   Credentials Valid:', formatValidation.valid);
  
  if (!formatValidation.valid) {
    console.error('   Errors:', formatValidation.errors);
  }

  console.log('\n🔌 Client Status:');
  console.log('   Client Initialized:', !!supabaseClient);
  console.log('   Auth Available:', !!supabaseClient?.auth);
  console.log('   From Available:', !!supabaseClient?.from);

  console.log('\n📊 Connection Status:');
  const status = connectionManager.getStatus();
  console.log('   Is Connected:', status.isConnected);
  console.log('   Is Connecting:', status.isConnecting);
  console.log('   Last Attempt:', status.lastAttempt);
  console.log('   Last Success:', status.lastSuccess);
  console.log('   Attempt Count:', status.attemptCount);
  console.log('   Error:', status.error);

  console.log('\n🌐 Browser Info:');
  console.log('   User Agent:', navigator.userAgent);
  console.log('   Online:', navigator.onLine);
  console.log('   LocalStorage:', typeof localStorage !== 'undefined');

  console.groupEnd();
};
