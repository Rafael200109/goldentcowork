
/**
 * Centralized Supabase Configuration
 * Updated with comprehensive error handling and validation
 */

import { supabase as supabaseClient } from '@/lib/customSupabaseClient';
import { supabaseLogger } from '@/lib/supabaseDebugLogger';

// âœ… FIXED: Use environment variables instead of hardcoded credentials
// These are loaded from .env file in development and platform environment variables in production
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validation state
let configError = null;
let isConfigValid = false;
let validationAttempted = false;

/**
 * Validate configuration (runs once on first import)
 */
const validateConfig = () => {
  if (validationAttempted) {
    return { valid: isConfigValid, error: configError };
  }

  validationAttempted = true;
  const errors = [];

  try {
    supabaseLogger.logInitStart();

    // Validate URL
    if (!SUPABASE_URL) {
      errors.push('SUPABASE_URL is not defined');
    } else if (typeof SUPABASE_URL !== 'string') {
      errors.push('SUPABASE_URL must be a string');
    } else if (!SUPABASE_URL.includes('supabase.co')) {
      errors.push('SUPABASE_URL appears to be invalid (should contain "supabase.co")');
    } else if (SUPABASE_URL.trim() === '') {
      errors.push('SUPABASE_URL is empty');
    }

    // Validate Anon Key
    if (!SUPABASE_ANON_KEY) {
      errors.push('SUPABASE_ANON_KEY is not defined');
    } else if (typeof SUPABASE_ANON_KEY !== 'string') {
      errors.push('SUPABASE_ANON_KEY must be a string');
    } else if (SUPABASE_ANON_KEY.length < 20) {
      errors.push('SUPABASE_ANON_KEY appears to be invalid (too short)');
    } else if (SUPABASE_ANON_KEY.trim() === '') {
      errors.push('SUPABASE_ANON_KEY is empty');
    }

    if (errors.length > 0) {
      configError = {
        message: 'Supabase configuration is invalid',
        errors: errors,
        timestamp: new Date().toISOString()
      };
      isConfigValid = false;

      supabaseLogger.logConfigError(errors);
      supabaseLogger.critical('CONFIG', 'Configuration validation failed', { errors });

      return { valid: false, error: configError };
    }

    // Validation passed
    isConfigValid = true;
    configError = null;

    supabaseLogger.success('CONFIG', 'Configuration loaded successfully', {
      url: SUPABASE_URL,
      keyLength: SUPABASE_ANON_KEY.length
    });

    return { valid: true, error: null };

  } catch (err) {
    configError = {
      message: 'Unexpected error during configuration validation',
      errors: [err.message],
      timestamp: new Date().toISOString()
    };
    isConfigValid = false;

    supabaseLogger.critical('CONFIG', 'Unexpected validation error', { error: err.message });

    return { valid: false, error: configError };
  }
};

// Run validation immediately
const validationResult = validateConfig();

/**
 * Check if Supabase is properly configured
 */
export const isSupabaseConfigured = () => {
  return isConfigValid;
};

/**
 * Get configuration error details
 */
export const getSupabaseError = () => {
  return configError;
};

/**
 * Get configuration status for debugging
 */
export const getConfigStatus = () => {
  return {
    isValid: isConfigValid,
    url: SUPABASE_URL ? 'SET' : 'MISSING',
    anonKey: SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
    error: configError,
    timestamp: new Date().toISOString(),
    validationAttempted
  };
};

/**
 * Get credential preview (for debugging)
 */
export const getCredentialPreview = () => {
  if (!isConfigValid) {
    return { url: null, key: null };
  }

  return {
    url: SUPABASE_URL ? SUPABASE_URL.substring(0, 40) + '...' : null,
    key: SUPABASE_ANON_KEY ? SUPABASE_ANON_KEY.substring(0, 20) + '...' : null
  };
};

// Export the Supabase client (from customSupabaseClient.js)
export { supabaseClient };

// Default export
export default supabaseClient;

