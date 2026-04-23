/**
 * Smart image preloading strategy
 */

export const isSlowConnection = () => {
  if (navigator.connection) {
    const { effectiveType, saveData } = navigator.connection;
    if (saveData) return true;
    if (['slow-2g', '2g', '3g'].includes(effectiveType)) return true;
  }
  return false;
};

export const preloadImage = (url) => {
  if (!url || isSlowConnection()) return;
  
  const img = new Image();
  img.src = url;
};

export const preloadNearbyImages = (urls) => {
  if (!urls || !Array.isArray(urls) || isSlowConnection()) return;

  const preloadLogic = () => {
    urls.forEach(url => {
      const img = new Image();
      img.src = url;
    });
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => preloadLogic(), { timeout: 2000 });
  } else {
    setTimeout(preloadLogic, 1000); // Fallback
  }
};