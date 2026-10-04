/* Service worker — repeat-visit speed only; never changes what is delivered (same files, same quality).
   • HTML / CSS / JS / JSON: network first (a new deploy shows immediately), cached copy only if offline
   • images, fonts, svg under /assets: served from cache instantly, refreshed in the background (stale-while-revalidate)
   • Google Fonts + the p5 library: cache first
   • video / audio: left to the browser (range requests)
   Bump CACHE to drop everything. Not active on localhost, so local edits are always live. */
const CACHE = 'siddhi-v2';
const isMedia = (u, req) => /\.(mp4|webm|mp3|m4a|ogg)(\?|$)/i.test(u.pathname) || req.destination === 'video' || req.destination === 'audio' || req.headers.has('range');
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(
  caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (isMedia(u, req)) return;
  const same = u.origin === self.location.origin;
  const third = /(^|\.)(fonts\.gstatic\.com|fonts\.googleapis\.com|cdn\.jsdelivr\.net)$/.test(u.hostname);
  if (!same && !third) return;
  if (third) { e.respondWith(cacheFirst(req)); return; }
  if (/\/assets\//.test(u.pathname) && /\.(png|jpe?g|webp|avif|gif|svg|otf|ttf|woff2?)$/i.test(u.pathname)) { e.respondWith(staleWhileRevalidate(req)); return; }
  e.respondWith(networkFirst(req));
});
async function cacheFirst(req) {
  const c = await caches.open(CACHE), hit = await c.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === 'opaque') c.put(req, res.clone());
  return res;
}
async function staleWhileRevalidate(req) {
  const c = await caches.open(CACHE), hit = await c.match(req);
  const net = fetch(req).then((res) => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => hit);
  return hit || net;
}
async function networkFirst(req) {
  const c = await caches.open(CACHE);
  try { const res = await fetch(req, { cache: 'no-cache' }); if (res.ok) c.put(req, res.clone()); return res; }   // revalidate with the server so a fresh deploy is never masked by the browser's HTTP cache
  catch (err) { const hit = await c.match(req); if (hit) return hit; throw err; }
}
