// 오프라인 캐시: 캐시에서 먼저 응답하고, 온라인이면 백그라운드로 최신 파일을 받아 둔다.
const CACHE = 'meditaire-v3';
// 과목 파일 목록은 data/tracks.js에서 읽어 함께 캐시한다
self.window = self;
try { importScripts('data/tracks.js'); } catch (e) {}
const ASSETS = ['./', 'index.html', 'data/tracks.js', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-180.png', 'icons/icon-512.png']
  .concat((self.MEDITAIRE_TRACK_FILES || []).map(f => 'data/' + f));

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(e.request, { ignoreSearch: true });
    const network = fetch(e.request).then(res => {
      if (res.ok) cache.put(e.request, res.clone());
      return res;
    }).catch(() => cached);
    return cached || network;
  }));
});
