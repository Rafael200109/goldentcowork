/**
 * Global Configuration for Image Optimization
 */

export const IMAGE_OPTIMIZATION_CONFIG = {
  // Recommended image sizes for different contexts
  SIZES: {
    THUMBNAIL: { width: 200, height: 150 },
    CARD: { width: 400, height: 300 },
    DETAIL: { width: 800, height: 600 },
    FULL: { width: 1200, height: 900 },
    HERO: { width: 1920, height: 1080 }
  },

  // Viewport breakpoints for responsive images
  BREAKPOINTS: {
    MOBILE: 640,
    TABLET: 768,
    DESKTOP: 1024,
    LARGE: 1280
  },

  // Cache configuration
  CACHE: {
    EXPIRATION_DAYS: 30,
    MAX_ENTRIES: 200,
    TTL_MS: 30 * 24 * 60 * 60 * 1000 // 30 days
  },

  // Lazy loading settings
  LAZY_LOADING: {
    ROOT_MARGIN: '200px 0px', // Load 200px before entering viewport
    THRESHOLD: 0.01
  },

  // Performance targets (for monitoring)
  PERFORMANCE_TARGETS: {
    LCP: 2500, // Largest Contentful Paint < 2.5s
    FCP: 1800  // First Contentful Paint < 1.8s
  },

  // Feature detection
  SUPPORT: {
    WEBP: typeof window !== 'undefined' ? 
      (() => {
        const elem = document.createElement('canvas');
        if (!!(elem.getContext && elem.getContext('2d'))) {
          return elem.toDataURL('image/webp').indexOf('data:image/webp') == 0;
        }
        return false;
      })() : true
  }
};

/**
 * Helper function to select the appropriate image width based on context
 */
export const getRecommendedWidth = (context) => {
  const sizeMap = {
    'thumbnail': IMAGE_OPTIMIZATION_CONFIG.SIZES.THUMBNAIL.width,
    'card': IMAGE_OPTIMIZATION_CONFIG.SIZES.CARD.width,
    'detail': IMAGE_OPTIMIZATION_CONFIG.SIZES.DETAIL.width,
    'full': IMAGE_OPTIMIZATION_CONFIG.SIZES.FULL.width,
    'hero': IMAGE_OPTIMIZATION_CONFIG.SIZES.HERO.width,
  };
  return sizeMap[context] || IMAGE_OPTIMIZATION_CONFIG.SIZES.DETAIL.width;
};