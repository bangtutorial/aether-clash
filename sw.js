/* AETHER CLASH service worker. preload.js fills the 'aether-assets' cache (with content hashes) on each visit, so this
   worker only has to answer from it:
   - pictures and fonts: cache first (instant screens, works offline);
   - pages, CSS and JS: network first, so a new deploy shows up at once; the cache is the offline fallback;
   - audio/video and range requests: left to the network and HTTP cache (Safari needs real 206 range answers). */
const CACHE = 'aether-assets';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || req.headers.has('range') || /\.(mp3|mp4)$/i.test(url.pathname)) return;
  const fromCache = () => caches.open(CACHE).then(cache => cache.match(url.href, { ignoreSearch: true })
    .then(hit => hit || (url.pathname.endsWith('/') ? cache.match(new URL('index.html', url).href) : undefined)));
  if (/\.(webp|png|svg|ttf|woff2)$/i.test(url.pathname)) {
    event.respondWith(fromCache().then(hit => hit || fetch(req)));
    return;
  }
  event.respondWith(fetch(req).catch(() => fromCache().then(hit => hit || Response.error())));
});
