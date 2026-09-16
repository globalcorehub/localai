// LocalAI Service Worker - 100% Offline & Air-Gapped Cache
const CACHE_NAME = 'localai-offline-v1';
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

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(err => console.warn('SW cache notice:', err));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match('/'));
    })
  );
});
