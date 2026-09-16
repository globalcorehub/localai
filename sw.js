// LocalAI Service Worker - 100% Offline & Air-Gapped Cache
const CACHE_NAME = 'localai-offline-v2';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/og-image.svg',
  '/whisper-speech-to-text',
  '/ai-background-remover',
  '/in-browser-ocr-scanner',
  '/private-pdf-summarizer',
  '/offline-code-regex-explainer',
  '/local-document-vector-search'
];

// 1. Install & Pre-cache critical routes
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(err => console.warn('SW pre-cache notice:', err));
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate & Purge outdated caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

// 3. Hybrid Strategy:
// - Navigation/HTML: Network First (with immediate cache fallback)
// - Assets/Scripts: Cache First (with network fallback)
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const isHtml = event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html');

  if (isHtml) {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        return caches.match(event.request).then(cached => cached || caches.match('/'));
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200 && (response.type === 'basic' || response.type === 'cors')) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
