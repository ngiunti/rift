// Rift — service worker : l'appli s'ouvre même sans réseau.
const CACHE = 'rift-v14';
const SHELL = ['./', './index.html', './config.js', './logo.png', './icon-192.png', './icon-512.png', './apple-touch-icon.png', './manifest.webmanifest'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // Réseau d'abord (pour recevoir les mises à jour), cache si hors ligne.
    e.respondWith(fetch(req).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return res; })
      .catch(() => caches.match(req).then(m => m || caches.match('./index.html'))));
    return;
  }
  // Bibliothèques et polices : cache d'abord. Jamais les appels de données Firebase.
  if (/(^|\.)gstatic\.com$|^fonts\.googleapis\.com$/.test(url.hostname)) {
    e.respondWith(caches.match(req).then(m => m || fetch(req).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return res; })));
  }
});
