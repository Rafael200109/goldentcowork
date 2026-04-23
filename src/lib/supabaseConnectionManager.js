
/**
 * Centralized Supabase Connection Manager
 * Handles connection status, retry logic, and error management
 */

import { supabaseLogger } from '@/lib/supabaseDebugLogger';

class SupabaseConnectionManager {
  constructor() {
    this.connectionStatus = {
      isConnected: false,
      isConnecting: false,
      lastAttempt: null,
      lastSuccess: null,
      attemptCount: 0,
      error: null
    };

    this.retryConfig = {
      maxAttempts: 3,
      baseDelay: 1000, // 1 second
      maxDelay: 8000, // 8 seconds
      backoffMultiplier: 2
    };

    this.retryQueue = [];
    this.isRetrying = false;
    this.listeners = new Set();
  }

  /**
   * Calculate exponential backoff delay
   */
  calculateBackoffDelay(attemptNumber) {
    const delay = this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attemptNumber - 1);
    return Math.min(delay, this.retryConfig.maxDelay);
  }

  /**
   * Execute operation with retry logic
   */
  async executeWithRetry(operation, operationName = 'operation') {
    const startTime = Date.now();
    let lastError = null;

    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        supabaseLogger.info('RETRY', `Executing ${operationName} (attempt ${attempt}/${this.retryConfig.maxAttempts})`);
        
        const result = await this.executeWithTimeout(operation, 10000); // 10s timeout
        
        const duration = Date.now() - startTime;
        supabaseLogger.success('RETRY', `${operationName} succeeded on attempt ${attempt} (${duration}ms)`);
        
        return { success: true, data: result, error: null };
      } catch (error) {
        lastError = error;
        const duration = Date.now() - startTime;
        
        supabaseLogger.error('RETRY', `${operationName} failed on attempt ${attempt}`, {
          error: error.message,
          duration
        });

        // Don't retry on certain errors
        if (this.isNonRetryableError(error)) {
          supabaseLogger.warning('RETRY', `Non-retryable error detected, stopping retries`);
          break;
        }

        // Wait before next retry (except on last attempt)
        if (attempt < this.retryConfig.maxAttempts) {
          const delay = this.calculateBackoffDelay(attempt);
          supabaseLogger.logRetryAttempt(attempt + 1, this.retryConfig.maxAttempts, delay);
          await this.sleep(delay);
        }
      }
    }

    return { 
      success: false, 
      data: null, 
      error: lastError?.message || 'Operation failed after retries' 
    };
  }

  /**
   * Execute operation with timeout
   */
  async executeWithTimeout(operation, timeout) {
    return Promise.race([
      operation(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Operation timed out after ${timeout}ms`)), timeout)
      )
    ]);
  }

  /**
   * Check if error should not be retried
   */
  isNonRetryableError(error) {
    const nonRetryablePatterns = [
      'Invalid API key',
      'Invalid JWT',
      'Missing credentials',
      'Authentication required',
      '401',
      '403',
      'CORS',
      'Invalid configuration'
    ];

    const errorMessage = error.message || error.toString();
    return nonRetryablePatterns.some(pattern => 
      errorMessage.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update connection status
   */
  updateStatus(updates) {
    this.connectionStatus = {
      ...this.connectionStatus,
      ...updates,
      lastAttempt: new Date()
    };

    if (updates.isConnected) {
      this.connectionStatus.lastSuccess = new Date();
      this.connectionStatus.attemptCount = 0;
      this.connectionStatus.error = null;
    }

    this.notifyListeners();
  }

  /**
   * Add status listener
   */
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of status change
   */
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.connectionStatus);
      } catch (err) {
        supabaseLogger.error('MANAGER', 'Error in status listener', err);
      }
    });
  }

  /**
   * Get current status
   */
  getStatus() {
    return { ...this.connectionStatus };
  }

  /**
   * Reset connection state
   */
  reset() {
    this.connectionStatus = {
      isConnected: false,
      isConnecting: false,
      lastAttempt: null,
      lastSuccess: null,
      attemptCount: 0,
      error: null
    };
    this.retryQueue = [];
    this.isRetrying = false;
    this.notifyListeners();
  }

  /**
   * Check if currently connecting
   */
  isCurrentlyConnecting() {
    return this.connectionStatus.isConnecting;
  }

  /**
   * Mark as connecting
   */
  markConnecting() {
    this.updateStatus({ isConnecting: true });
  }

  /**
   * Mark connection success
   */
  markConnected() {
    this.updateStatus({ 
      isConnected: true, 
      isConnecting: false,
      error: null 
    });
  }

  /**
   * Mark connection failure
   */
  markDisconnected(error) {
    this.updateStatus({ 
      isConnected: false, 
      isConnecting: false,
      error: error?.message || 'Connection failed',
      attemptCount: this.connectionStatus.attemptCount + 1
    });
  }
}

export const connectionManager = new SupabaseConnectionManager();
