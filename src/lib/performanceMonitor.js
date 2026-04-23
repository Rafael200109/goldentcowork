export const initPerformanceMonitoring = () => {
  if (typeof window === 'undefined' || !window.performance) return;

  const metrics = {};

  try {
    // Basic Navigation Timing
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navEntry = performance.getEntriesByType('navigation')[0];
        if (navEntry) {
          metrics.ttfb = navEntry.responseStart - navEntry.requestStart;
          metrics.domLoad = navEntry.domContentLoadedEventEnd - navEntry.startTime;
          metrics.fullLoad = navEntry.loadEventEnd - navEntry.startTime;
          
          if (import.meta.env.DEV) {
            console.log('🚀 [Performance] Load Metrics:', metrics);
          }
        }
      }, 0);
    });

    // LCP (Largest Contentful Paint) observer
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      metrics.lcp = lastEntry.startTime;
      if (import.meta.env.DEV) console.log('🚀 [Performance] LCP:', metrics.lcp);
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

    // CLS (Cumulative Layout Shift) observer
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      metrics.cls = clsValue;
      if (import.meta.env.DEV) console.log('🚀 [Performance] CLS:', metrics.cls);
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });

    // FID (First Input Delay) observer
    const fidObserver = new PerformanceObserver((entryList) => {
      const firstInput = entryList.getEntries()[0];
      if (firstInput) {
        metrics.fid = firstInput.processingStart - firstInput.startTime;
        if (import.meta.env.DEV) console.log('🚀 [Performance] FID:', metrics.fid);
      }
    });
    fidObserver.observe({ type: 'first-input', buffered: true });

  } catch (e) {
    console.warn('Performance monitoring not fully supported in this browser.', e);
  }

  return metrics;
};