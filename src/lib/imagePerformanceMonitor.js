import { onFCP, onLCP, onCLS, onINP, onTTFB } from 'web-vitals';

/**
 * Monitors Core Web Vitals and Image Load performance
 */

// Helper to determine if we are in a development or debug environment
// safely in the browser without relying on Node.js 'process'
const isDevelopment = () => {
  if (typeof window === 'undefined') return false;
  return (
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' ||
    localStorage.getItem('DEBUG_MODE') === 'true'
  );
};

export const initVitalsMonitoring = () => {
  if (isDevelopment()) {
    const logMetric = (metric) => {
      console.log(`[Web Vitals] ${metric.name}:`, Math.round(metric.value), 'Rating:', metric.rating);
    };

    onFCP(logMetric);
    onLCP(logMetric);
    onCLS(logMetric);
    onINP(logMetric);
    onTTFB(logMetric);
  }
};

export const measureImageLoadTime = (url, startTime) => {
  const loadTime = Date.now() - startTime;
  
  if (loadTime > 2000) {
    console.warn(`[Performance Alert] Image loaded slowly (${loadTime}ms):`, url);
  } else if (isDevelopment()) {
    console.log(`[Image Load] ${loadTime}ms :`, url ? url.substring(0, 50) + '...' : 'unknown');
  }
  
  return loadTime;
};