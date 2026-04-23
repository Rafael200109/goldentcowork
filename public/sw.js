const CACHE_NAME = 'goldent-image-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Only cache GET requests for images (specifically from Supabase or Unsplash)
  if (event.request.method === 'GET' && 
      (url.pathname.match(/\.(png|jpg|jpeg|gif|webp)$/) || 
       url.hostname.includes('supabase.co') || 
       url.hostname.includes('unsplash.com'))) {
    
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request).then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic' && response.type !== 'cors') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Create custom headers for cache control (31536000 = 1 year)
          const headers = new Headers(responseToCache.headers);
          headers.set('Cache-Control', 'public, max-age=31536000, immutable');
          
          const cacheResponse = new Response(responseToCache.body, {
            status: responseToCache.status,
            statusText: responseToCache.statusText,
            headers: headers
          });

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, cacheResponse);
          });

          return response;
        });
      })
    );
  }
});