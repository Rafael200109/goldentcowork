/**
 * Caché LRU (Least Recently Used) para Imágenes
 * Límite de entradas y TTL de 24h
 */

const CACHE_KEY_PREFIX = 'goldent_img_';
const MAX_CACHE_ENTRIES = 100; // LRU límite
const TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

class ImageCache {
  constructor() {
    this.memoryCache = new Map(); // Mantiene orden de inserción natural para LRU
    this.cleanup();
  }

  _getStoreKey(url) {
    return `${CACHE_KEY_PREFIX}${btoa(url).substring(0, 20)}`;
  }

  set(url, metadata = {}) {
    if (!url) return;

    // LRU: si existe, borrar para insertarlo al final (más reciente)
    if (this.memoryCache.has(url)) {
      this.memoryCache.delete(url);
    }

    const entry = {
      url,
      timestamp: Date.now(),
      loaded: true,
      ...metadata
    };

    this.memoryCache.set(url, entry);

    // Eviction LRU
    if (this.memoryCache.size > MAX_CACHE_ENTRIES) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }

    try {
      localStorage.setItem(this._getStoreKey(url), JSON.stringify(entry));
    } catch (e) {
      // Ignore quota exceeded
    }
  }

  get(url) {
    if (!url) return null;

    // Check memory
    if (this.memoryCache.has(url)) {
      const entry = this.memoryCache.get(url);
      if (Date.now() - entry.timestamp < TTL_MS) {
        // Actualizar posición LRU
        this.memoryCache.delete(url);
        this.memoryCache.set(url, entry);
        return entry;
      }
      this.memoryCache.delete(url); // Expirado
    }

    // Check localStorage
    try {
      const stored = localStorage.getItem(this._getStoreKey(url));
      if (stored) {
        const entry = JSON.parse(stored);
        if (Date.now() - entry.timestamp < TTL_MS) {
          this.memoryCache.set(url, entry); // Restaurar a memoria
          return entry;
        }
        localStorage.removeItem(this._getStoreKey(url));
      }
    } catch (e) {
      return null;
    }

    return null;
  }

  isCached(url) {
    return this.get(url) !== null;
  }

  clear() {
    this.memoryCache.clear();
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(CACHE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.error("Cache clear failed", e);
    }
  }

  cleanup() {
    try {
      const now = Date.now();
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(CACHE_KEY_PREFIX)) {
          const itemStr = localStorage.getItem(key);
          if (itemStr) {
            const item = JSON.parse(itemStr);
            if (now - item.timestamp > TTL_MS) {
              localStorage.removeItem(key);
            }
          }
        }
      });
    } catch (e) {
      // Silent fail
    }
  }
}

export const imageCache = new ImageCache();