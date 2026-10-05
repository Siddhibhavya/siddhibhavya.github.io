/* Service worker — repeat-visit speed only; never changes what is delivered (same files, same quality).
   • HTML pages: network first with a 3 s limit (a new deploy shows at once; if the network is slow or offline the cached copy is used)
   • CSS / JS / JSON: stale-while-revalidate — served from the cache instantly, refreshed in the background (a deploy reaches visitors on their next load;
     the build stamps CACHE with the deploy id, so each deploy drops the old cache). Forcing a server round trip for each of the ~30 scripts and
     stylesheets on every load (cache: 'no-cache') made pages wait seconds before they could start.
   • images, fonts, svg under /assets: served from cache instantly, refreshed in the background (stale-while-revalidate)
   • Google Fonts + the p5 library: cache first
   • video / audio: left to the browser (range requests)
   Bump CACHE to drop everything (scripts/build-public.js does it per deploy). Not active on localhost, so local edits are always live. */
const CACHE = 'siddhi-v3';
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
  if (third || /\/assets\/vendor\//.test(u.pathname)) { e.respondWith(cacheFirst(req)); return; }
  if (/\/assets\//.test(u.pathname) && /\.(png|jpe?g|webp|avif|gif|svg|otf|ttf|woff2?)$/i.test(u.pathname)) { e.respondWith(staleWhileRevalidate(req)); return; }
  if (req.mode === 'navigate' || req.destination === 'document' || /\.html?$|\/$/.test(u.pathname) || !/\.[a-z0-9]+$/i.test(u.pathname)) { e.respondWith(networkFirst(req)); return; }
  e.respondWith(staleWhileRevalidate(req));   // css, js, json
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
  const net = fetch(req, { cache: 'no-cache' }).then((res) => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => hit);
  return hit || net;
}
async function networkFirst(req) {
  const c = await caches.open(CACHE);
  const net = fetch(req, { cache: 'no-cache' }).then((res) => { if (res.ok) c.put(req, res.clone()); return res; });   // revalidate: a fresh deploy is never masked by the browser's HTTP cache
  const hit = await c.match(req);
  if (!hit) return net;
  try { return await Promise.race([net, new Promise((_, no) => setTimeout(no, 3000))]); }
  catch (err) { net.catch(() => {}); return hit; }
}
