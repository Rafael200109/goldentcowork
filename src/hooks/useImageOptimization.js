import { useState, useCallback, useEffect } from 'react';
import { getOptimizedUrl, generateSrcSet as generateOptimizedSrcSet } from '@/lib/imageOptimizer';
import { imageCache } from '@/lib/imageCache';

export function useImageOptimization() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Helper to get a single optimized URL
   */
  const getOptimized = useCallback((url, width, height, format = 'webp') => {
    return getOptimizedUrl(url, { width, height, format });
  }, []);

  /**
   * Helper to generate srcSet string
   */
  const generateSrcSet = useCallback((url) => {
    return generateOptimizedSrcSet(url);
  }, []);

  /**
   * Preload an image to browser cache
   */
  const preloadImage = useCallback((url) => {
    if (!url) return;
    const img = new Image();
    img.src = url;
  }, []);

  /**
   * Cache image explicitly in IDB/Memory
   */
  const cacheImage = useCallback(async (url) => {
    if (!url) return null;
    if (imageCache.isCached(url)) {
      return imageCache.get(url)?.url;
    }

    setLoading(true);
    try {
      // Basic fetch to put in browser cache, and record in our memory cache
      await fetch(url, { mode: 'no-cors' });
      imageCache.set(url, { loaded: true });
      return url;
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    getOptimizedUrl: getOptimized,
    generateSrcSet,
    preloadImage,
    cacheImage,
    loading,
    error
  };
}