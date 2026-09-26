// 오프라인 캐시. 온라인이면 항상 서버의 최신 파일을 먼저 받고(브라우저 HTTP 캐시도 건너뜀),
// 오프라인일 때만 저장해 둔 사본을 쓴다. → 과목 파일을 고치면 바로 반영된다.
const CACHE = 'meditaire-v6';
// 과목 파일 목록은 data/tracks.js에서 읽어 함께 캐시한다
self.window = self;
try { importScripts('data/tracks.js'); } catch (e) {}
const ASSETS = ['./', 'index.html', 'data/tracks.js', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-180.png', 'icons/icon-512.png']
  .concat((self.MEDITAIRE_TRACK_FILES || []).map(f => 'data/' + f));

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => Promise.all(ASSETS.map(a => fetch(a, { cache: 'no-cache' }).then(r => r.ok && c.put(a, r)).catch(() => {}))))
    .then(() => self.skipWaiting()));
});

// 예전 버전 캐시가 있었다면(=업데이트) 열려 있는 화면을 새로고침해 새 버전을 바로 보여준다
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const old = (await caches.keys()).filter(k => k !== CACHE);
    await Promise.all(old.map(k => caches.delete(k)));
    await self.clients.claim();
    if (old.length) {
      const wins = await self.clients.matchAll({ type: 'window' });
      wins.forEach(w => w.navigate(w.url).catch(() => {}));
    }
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(cache =>
    fetch(req, { cache: 'no-cache' })
      .then(res => { if (res.ok) cache.put(req, res.clone()); return res; })
      .catch(() => cache.match(req, { ignoreSearch: true }))
  ));
});
