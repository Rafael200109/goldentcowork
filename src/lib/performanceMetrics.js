/**
 * Advanced Performance Tracking Module
 */

class PerformanceMetrics {
  constructor() {
    this.metrics = {
      images: {},
      slowImages: [],
      totalBandwidth: 0,
      vitals: { lcp: null, fid: null, cls: null, ttfb: null },
      pageLoadTime: null
    };
    this.networkType = '4g'; // Default
    this.saveData = false;
    this.isDev = import.meta.env.DEV;
    
    this.initNetworkDetection();
    this.initWebVitals();
    this.initPageLoadTracking();
  }

  initNetworkDetection() {
    if (navigator.connection) {
      this.networkType = navigator.connection.effectiveType || '4g';
      this.saveData = navigator.connection.saveData || false;
      
      navigator.connection.addEventListener('change', () => {
        this.networkType = navigator.connection.effectiveType;
        this.saveData = navigator.connection.saveData;
        if (this.isDev) console.log(`[Performance] Network changed: ${this.networkType}, SaveData: ${this.saveData}`);
      });
    }
  }

  initWebVitals() {
    try {
      // LCP
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          this.metrics.vitals.lcp = entries[entries.length - 1].startTime;
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true });

      // CLS
      let clsValue = 0;
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.metrics.vitals.cls = clsValue;
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });

      // FID
      new PerformanceObserver((entryList) => {
        const firstInput = entryList.getEntries()[0];
        if (firstInput) {
          this.metrics.vitals.fid = firstInput.processingStart - firstInput.startTime;
        }
      }).observe({ type: 'first-input', buffered: true });

    } catch (e) {
      if (this.isDev) console.warn('PerformanceObserver not supported', e);
    }
  }

  initPageLoadTracking() {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navEntry = performance.getEntriesByType('navigation')[0];
        if (navEntry) {
          this.metrics.vitals.ttfb = navEntry.responseStart - navEntry.requestStart;
          this.metrics.pageLoadTime = navEntry.loadEventEnd - navEntry.startTime;
        }
      }, 0);
    });
  }

  trackImageLoad(url, sizeBytes, durationMs) {
    this.metrics.images[url] = { size: sizeBytes, duration: durationMs, timestamp: Date.now() };
    this.metrics.totalBandwidth += sizeBytes || 0;

    if (durationMs > 2000) {
      this.metrics.slowImages.push({ url, duration: durationMs });
      if (this.isDev) console.warn(`[Performance] Slow image detected (${Math.round(durationMs)}ms):`, url);
    }

    // Dispatch event for UI monitors
    window.dispatchEvent(new CustomEvent('img-metrics-update', { detail: this.metrics }));
  }

  getOptimalQuality() {
    if (this.saveData || this.networkType === 'slow-2g' || this.networkType === '2g') return 60;
    if (this.networkType === '3g') return 75;
    return 85; // 4g or better
  }

  getReport() {
    return { ...this.metrics, network: { type: this.networkType, saveData: this.saveData } };
  }
}

export const perfMetrics = new PerformanceMetrics();