// HTML 走網路優先：有網路就拿最新版，不必重整兩次；離線才用快取
const CACHE = 'gq-game-v1';
const CORE = ['./', './index.html', './manifest.json', './icon.svg'];
const LIBS = ['https://unpkg.com/leaflet@1.9.4/'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const same = url.origin === self.location.origin;
  const isLib = LIBS.some(p => req.url.startsWith(p));
  if (!same && !isLib) return;                       // 圖磚、Overpass 不攔

  if (req.mode === 'navigate' || (same && url.pathname.endsWith('.html'))) {
    e.respondWith(fetch(req).then(r => {
      const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r;
    }).catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(r => {
      if (r.ok || r.type === 'opaque') { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
      return r;
    }).catch(() => hit);
    return hit || net;
  }));
});
