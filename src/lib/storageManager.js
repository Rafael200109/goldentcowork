/**
 * Safe wrapper for localStorage operations
 * Handles error cases like private browsing mode or quota exceeded
 */
export const storageManager = {
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('LocalStorage unavailable or quota exceeded', e);
    }
  },

  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('LocalStorage unavailable', e);
      return null;
    }
  },

  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('LocalStorage unavailable', e);
    }
  },

  /**
   * Save minimal user data for immediate mobile rendering
   * @param {Object} userData - Supabase user object
   */
  saveAuthCache: (userData) => {
    if (!userData) return;
    try {
        const cache = {
            id: userData.id,
            email: userData.email,
            full_name: userData.user_metadata?.full_name || userData.full_name || 'Usuario',
            role: userData.user_metadata?.role || userData.role || 'dentist',
            avatar_url: userData.user_metadata?.avatar_url || null,
            timestamp: Date.now()
        };
        localStorage.setItem('auth_user_cache', JSON.stringify(cache));
        
        if (import.meta.env.DEV) {
            console.log('[StorageManager] Auth cache saved:', cache);
        }
    } catch (e) {
        console.warn('Failed to save auth cache', e);
    }
  },

  /**
   * Get cached user data
   * @returns {Object|null} Cached user data
   */
  getAuthCache: () => {
      try {
          const cached = localStorage.getItem('auth_user_cache');
          if (!cached) return null;
          
          const parsed = JSON.parse(cached);
          
          const sevenDays = 7 * 24 * 60 * 60 * 1000;
          if (Date.now() - parsed.timestamp > sevenDays) {
              localStorage.removeItem('auth_user_cache');
              return null;
          }
          
          return parsed;
      } catch (e) {
          return null;
      }
  },

  /**
   * Centralized utility to remove all auth-related localStorage/sessionStorage keys
   */
  clearAuthStorage: () => {
      try {
          // Clear specific app keys
          localStorage.removeItem('auth_user_cache');
          localStorage.removeItem('goldent_supa_session_backup');
          localStorage.removeItem('supabase.auth.token');
          localStorage.removeItem('supabase.auth.session');
          
          sessionStorage.removeItem('supabase.auth.token');
          sessionStorage.removeItem('supabase.auth.session');
          
          // Iteratively search and clean all Supabase persisted tokens
          // Supabase usually saves with prefix sb-[project_id]-auth-token
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && (key.startsWith('sb-') || key.includes('auth-token') || key.includes('supabase'))) {
                  keysToRemove.push(key);
              }
          }
          
          keysToRemove.forEach(key => localStorage.removeItem(key));
          
          // Also clear from sessionStorage just in case
          const sessionKeysToRemove = [];
          for (let i = 0; i < sessionStorage.length; i++) {
              const key = sessionStorage.key(i);
              if (key && (key.startsWith('sb-') || key.includes('auth-token') || key.includes('supabase'))) {
                  sessionKeysToRemove.push(key);
              }
          }
          sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
          
          if (import.meta.env.DEV) {
              console.log('[StorageManager] Auth storage completely cleared.');
          }
      } catch (e) {
          console.warn('[StorageManager] Failed to completely clear auth storage', e);
      }
  },

  /**
   * Resets auth state completely
   */
  clearSessionData: () => {
      storageManager.clearAuthStorage();
      // Dispatch a custom event to notify other tabs/components
      window.dispatchEvent(new Event('auth_session_cleared'));
  },

  /**
   * Legacy alias for backward compatibility
   */
  clearAuthCache: () => {
      storageManager.clearAuthStorage();
  },

  /**
   * Checks if a valid session is present in storage
   * @returns {boolean}
   */
  validateSessionExists: () => {
      try {
          if (localStorage.getItem('supabase.auth.token')) return true;
          for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith('sb-') && key.includes('auth-token')) {
                  const tokenStr = localStorage.getItem(key);
                  if (tokenStr) {
                      const token = JSON.parse(tokenStr);
                      // Check if it has a token and it hasn't expired
                      if (token && token.access_token && token.expires_at) {
                         // Add a small buffer (e.g., 60 seconds) to expiration check
                         return token.expires_at > (Date.now() / 1000) + 60;
                      }
                      return true;
                  }
              }
          }
          return false;
      } catch (e) {
          return false;
      }
  }
};