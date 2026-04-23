
/**
 * Comprehensive Supabase Debug Logger
 * Provides detailed logging for Supabase initialization and connection issues
 */

class SupabaseDebugLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 100;
    this.enabled = import.meta.env.DEV;
  }

  log(level, category, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      category,
      message,
      data,
      userAgent: navigator.userAgent,
      online: navigator.onLine
    };

    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    if (this.enabled) {
      const prefix = `[${level.toUpperCase()}] [${category}] ${timestamp}`;
      const style = this.getLogStyle(level);
      
      if (data) {
        console.log(`%c${prefix} - ${message}`, style, data);
      } else {
        console.log(`%c${prefix} - ${message}`, style);
      }
    }

    // Store critical errors in localStorage for debugging
    if (level === 'error' || level === 'critical') {
      this.persistError(logEntry);
    }
  }

  getLogStyle(level) {
    const styles = {
      info: 'color: #0ea5e9',
      success: 'color: #10b981',
      warning: 'color: #f59e0b',
      error: 'color: #ef4444; font-weight: bold',
      critical: 'color: #dc2626; font-weight: bold; background: #fee2e2'
    };
    return styles[level] || '';
  }

  persistError(logEntry) {
    try {
      const errors = JSON.parse(localStorage.getItem('supabase_errors') || '[]');
      errors.push(logEntry);
      
      // Keep only last 20 errors
      if (errors.length > 20) {
        errors.shift();
      }
      
      localStorage.setItem('supabase_errors', JSON.stringify(errors));
    } catch (err) {
      console.warn('Failed to persist error to localStorage:', err);
    }
  }

  info(category, message, data) {
    this.log('info', category, message, data);
  }

  success(category, message, data) {
    this.log('success', category, message, data);
  }

  warning(category, message, data) {
    this.log('warning', category, message, data);
  }

  error(category, message, data) {
    this.log('error', category, message, data);
  }

  critical(category, message, data) {
    this.log('critical', category, message, data);
  }

  getLogs() {
    return this.logs;
  }

  getErrors() {
    return this.logs.filter(log => log.level === 'error' || log.level === 'critical');
  }

  clearLogs() {
    this.logs = [];
    try {
      localStorage.removeItem('supabase_errors');
    } catch (err) {
      console.warn('Failed to clear localStorage errors:', err);
    }
  }

  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }

  logInitStart() {
    this.info('INIT', 'Supabase initialization started');
  }

  logInitSuccess(duration) {
    this.success('INIT', `Supabase initialized successfully in ${duration}ms`);
  }

  logInitFailure(error, duration) {
    this.error('INIT', `Supabase initialization failed after ${duration}ms`, {
      error: error.message,
      stack: error.stack
    });
  }

  logRetryAttempt(attempt, maxAttempts, delay) {
    this.warning('RETRY', `Retry attempt ${attempt}/${maxAttempts} after ${delay}ms delay`);
  }

  logConnectionTest(success, error = null) {
    if (success) {
      this.success('CONNECTION', 'Connection test passed');
    } else {
      this.error('CONNECTION', 'Connection test failed', { error });
    }
  }

  logAuthEvent(event, details) {
    this.info('AUTH', `Auth event: ${event}`, details);
  }

  logConfigError(errors) {
    this.critical('CONFIG', 'Supabase configuration is invalid', { errors });
  }

  logNetworkError(operation, error) {
    this.error('NETWORK', `Network error during ${operation}`, {
      error: error.message,
      status: error.status,
      online: navigator.onLine
    });
  }
}

export const supabaseLogger = new SupabaseDebugLogger();
