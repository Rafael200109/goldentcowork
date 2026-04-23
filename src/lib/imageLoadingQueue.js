import { imageCache } from './imageCache';

/**
 * Priority-based Image Loading Queue con timeout y retries
 */
class ImageLoadingQueue {
  constructor() {
    this.queues = {
      high: [],
      medium: [],
      low: []
    };
    this.activeCount = 0;
    this.maxConcurrent = 3; // Límite estricto para evitar bottleneck de red
    this.cache = new Set(); // En proceso
  }

  enqueue(url, priority = 'medium', retries = 2) {
    if (!url) return Promise.reject(new Error("No URL"));
    
    // Si ya está en memoria caché, resolver de inmediato
    if (imageCache.isCached(url)) return Promise.resolve(url);

    // Si ya está procesándose
    if (this.cache.has(url)) return Promise.resolve(url);

    return new Promise((resolve, reject) => {
      const task = { url, resolve, reject, retries, priority, timestamp: Date.now() };
      
      if (this.queues[priority]) {
        this.queues[priority].push(task);
      } else {
        this.queues.medium.push(task);
      }
      
      this.processQueue();
    });
  }

  dequeue() {
    if (this.queues.high.length > 0) return this.queues.high.shift();
    if (this.queues.medium.length > 0) return this.queues.medium.shift();
    if (this.queues.low.length > 0) return this.queues.low.shift();
    return null;
  }

  processQueue() {
    if (this.activeCount >= this.maxConcurrent) return;

    const task = this.dequeue();
    if (!task) return;

    this.activeCount++;
    this.cache.add(task.url);

    const img = new Image();
    let timeoutId;

    const cleanup = () => {
      clearTimeout(timeoutId);
      this.activeCount--;
      this.cache.delete(task.url);
    };

    img.onload = () => {
      cleanup();
      imageCache.set(task.url);
      task.resolve(task.url);
      this.processQueue();
    };

    img.onerror = (err) => {
      cleanup();
      if (task.retries > 0) {
        // Reintentar con menor prioridad
        this.enqueue(task.url, 'low', task.retries - 1).then(task.resolve).catch(task.reject);
      } else {
        task.reject(err || new Error('Load failed'));
      }
      this.processQueue();
    };

    // Timeout de 15 segundos
    timeoutId = setTimeout(() => {
      img.src = ''; // Cancel load
      img.onerror(new Error('Timeout'));
    }, 15000);

    img.src = task.url;
  }

  cancelLoad(url) {
    for (const priority of ['high', 'medium', 'low']) {
      const index = this.queues[priority].findIndex(t => t.url === url);
      if (index !== -1) {
        this.queues[priority][index].reject(new Error('Cancelled'));
        this.queues[priority].splice(index, 1);
        return true;
      }
    }
    return false;
  }

  preload(urls, priority = 'low') {
    if (!urls || !Array.isArray(urls)) return;
    urls.forEach(url => {
        if (url) this.enqueue(url, priority).catch(() => {});
    });
  }
}

export const imageQueue = new ImageLoadingQueue();