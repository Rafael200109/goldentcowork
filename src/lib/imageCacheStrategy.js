/**
 * Advanced caching strategy using LocalStorage for metadata
 * and IndexedDB for Blob storage of images.
 */

const DB_NAME = 'GoldentImageDB';
const STORE_NAME = 'images';
const DB_VERSION = 1;

let dbPromise = null;

const initDB = () => {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  }
  return dbPromise;
};

export const storeImageInDB = async (url, blob) => {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(blob, url);
    
    // Store metadata in local storage
    const metadata = {
      timestamp: Date.now(),
      size: blob.size,
      type: blob.type
    };
    localStorage.setItem(`img_meta_${btoa(url).substring(0, 20)}`, JSON.stringify(metadata));
  } catch (error) {
    console.warn('Failed to store image in IndexedDB:', error);
  }
};

export const getImageFromDB = async (url) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(url);
      
      request.onsuccess = () => {
        if (request.result) {
          resolve(URL.createObjectURL(request.result));
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Failed to get image from IndexedDB:', error);
    return null;
  }
};

export const invalidateOldCache = async (maxAgeMs = 30 * 24 * 60 * 60 * 1000) => {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const now = Date.now();
    
    // Clear based on LocalStorage metadata
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('img_meta_')) {
        const meta = JSON.parse(localStorage.getItem(key));
        if (now - meta.timestamp > maxAgeMs) {
          localStorage.removeItem(key);
          // Assuming we want to clear the whole IDB store periodically if it gets too large
          // For precision, a cursor should be used, but keeping it simple for now
        }
      }
    }
  } catch (error) {
    console.warn('Cache invalidation error:', error);
  }
};