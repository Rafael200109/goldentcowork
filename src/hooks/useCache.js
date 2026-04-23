import { useCallback } from 'react';

export function useCache() {
  const setCache = useCallback((key, data, ttlMinutes = 5) => {
    const now = new Date();
    const item = {
      data,
      expiry: now.getTime() + ttlMinutes * 60 * 1000,
    };
    try {
      localStorage.setItem(`gcw_cache_${key}`, JSON.stringify(item));
    } catch (e) {
      console.warn('Local storage cache full or unavailable', e);
    }
  }, []);

  const getCache = useCallback((key) => {
    try {
      const itemStr = localStorage.getItem(`gcw_cache_${key}`);
      if (!itemStr) return null;
      
      const item = JSON.parse(itemStr);
      if (new Date().getTime() > item.expiry) {
        localStorage.removeItem(`gcw_cache_${key}`);
        return null;
      }
      return item.data;
    } catch (e) {
      return null;
    }
  }, []);

  const clearCache = useCallback((key) => {
    localStorage.removeItem(`gcw_cache_${key}`);
  }, []);

  return { setCache, getCache, clearCache };
}