/* The shared Guest Gallery's connection to Firebase Firestore (free Spark plan): SiddhiGuest.remote = { enabled, latest(n), cached(n), add(card) }.
   Loaded before js/guest.js. If js/firebase-config.js is empty, `enabled` is false and the gallery works per-browser exactly as before.

   • Each card is ONE document in the "cards" collection:  { color, name, img, t, hidden }
       color  one of the four card colours     name  the typed signature (28 characters at most)
       img    the drawing, compressed to a small WebP/JPEG data URL (≈10–40 KB, never more than 55,000 characters)
       t      the server's time when it was saved     hidden  false — YOU flip it to true in the Firebase console to take a card down
   • The gallery reads the newest 16 cards that are not hidden. Reads are cached for a minute so a visitor costs at most a few reads.
   • The Firebase code is only downloaded when a page actually needs it (the gallery and Welcome Aboard), straight from Google's CDN.
   • The rules that make this safe live in firebase/firestore.rules — they, not this file, decide what a visitor may do. */
(function () {
  'use strict';
  const cfg = window.FIREBASE_CONFIG || {};
  const enabled = !!(cfg.apiKey && cfg.projectId && cfg.appId);
  const SDK = cfg.sdkBase || 'https://www.gstatic.com/firebasejs/10.14.1/';   // sdkBase / emulatorHost are only for local testing
  const COLLECTION = 'cards';
  const COLORS = ['#bb3739', '#ff9a00', '#249343', '#2c2696'];                  // the four swatches in js/guest.js
  const MAX_IMG_CHARS = 55000;                                                  // the rules allow up to 70,000
  const COOLDOWN_MS = 30000;                                                    // one card per browser per 30 s
  const CACHE_KEY = 'siddhi.cards.cache', CACHE_MS = 60000;
  const Guest = window.SiddhiGuest = window.SiddhiGuest || {};

  const withTimeout = (p, ms, what) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(what + ' timed out')), ms))]);

  /* ------------------------------------------------------------------ Firebase, loaded on demand */
  let sdkPromise = null;
  function sdk() {
    if (!sdkPromise) {
      sdkPromise = Promise.all([import(SDK + 'firebase-app.js'), import(SDK + 'firebase-firestore.js')]).then(([appMod, fs]) => {
        const app = appMod.initializeApp({ apiKey: cfg.apiKey, authDomain: cfg.authDomain, projectId: cfg.projectId, storageBucket: cfg.storageBucket, messagingSenderId: cfg.messagingSenderId, appId: cfg.appId });
        const db = fs.getFirestore(app);
        if (cfg.emulatorHost) { const [host, port] = cfg.emulatorHost.split(':'); fs.connectFirestoreEmulator(db, host, Number(port)); }
        return { db, fs };
      });
      sdkPromise.catch(() => { sdkPromise = null; });                            // try again next time
    }
    return sdkPromise;
  }

  /* ------------------------------------------------------------------ reading */
  function tidy(id, x) {                                                        // never trust what comes back: keep only a well-formed card
    if (!x || typeof x.img !== 'string' || !/^data:image\/(webp|jpeg);base64,/.test(x.img)) return null;
    return { id, color: COLORS.includes(x.color) ? x.color : COLORS[0], name: typeof x.name === 'string' ? x.name.slice(0, 28) : '', img: x.img, t: x.t && x.t.toMillis ? x.t.toMillis() : 0 };
  }
  const cache = {
    read(n) { try { const c = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null'); return c && c.n >= n && Date.now() - c.at < CACHE_MS ? c.list.slice(0, n) : null; } catch (e) { return null; } },
    write(n, list) { try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ n, at: Date.now(), list })); } catch (e) { /* too big or private mode: just don't cache */ } },
    clear() { try { sessionStorage.removeItem(CACHE_KEY); } catch (e) { /* ignore */ } }
  };

  async function latest(n) {
    if (!enabled) throw new Error('the shared gallery is not set up (js/firebase-config.js is empty)');
    const hit = cache.read(n);
    if (hit) return hit;
    const { db, fs } = await withTimeout(sdk(), 10000, 'loading Firebase');
    const q = fs.query(fs.collection(db, COLLECTION), fs.where('hidden', '==', false), fs.orderBy('t', 'desc'), fs.limit(n));
    let snap;
    try { snap = await withTimeout(fs.getDocs(q), 10000, 'reading the gallery'); } catch (err) {
      if (err && err.code === 'failed-precondition') console.error('[gallery] Firestore needs its index — open the link in the message below, or follow firebase/SETUP.md step 6.\n', err.message);
      throw err;
    }
    const list = [];
    snap.forEach((d) => { const c = tidy(d.id, d.data()); if (c) list.push(c); });
    cache.write(n, list);
    return list;
  }

  /* ------------------------------------------------------------------ writing */
  /* Shrinks the full-size PNG of the drawing to something that fits comfortably on the free plan: 480px wide, WebP (or JPEG where the browser
     can't make WebP), stepping the quality/size down until it is under MAX_IMG_CHARS. The card in the Welcome Aboard animation keeps using the full-size drawing. */
  async function compress(src) {
    const img = new Image();
    await withTimeout(new Promise((ok, no) => { img.onload = ok; img.onerror = () => no(new Error('the drawing could not be read')); img.src = src; }), 10000, 'reading the drawing');
    let mime = 'image/webp';
    for (const [w, q] of [[480, 0.72], [480, 0.6], [480, 0.5], [400, 0.5], [320, 0.45]]) {
      const h = Math.round((w * img.naturalHeight) / img.naturalWidth);
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const g = c.getContext('2d');
      g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
      g.imageSmoothingQuality = 'high';
      g.drawImage(img, 0, 0, w, h);
      let out = c.toDataURL(mime, q);
      if (!out.startsWith('data:' + mime)) { mime = 'image/jpeg'; out = c.toDataURL(mime, q); }   // e.g. Safari can't encode WebP
      if (out.length <= MAX_IMG_CHARS) return out;
    }
    throw new Error('the drawing is too detailed to store');
  }

  async function add(card) {
    if (!enabled) return false;
    let last = 0;
    try { last = Number(localStorage.getItem('siddhi.lastShared')) || 0; } catch (e) { /* ignore */ }
    if (Date.now() - last < COOLDOWN_MS) throw new Error('one card every 30 seconds');
    const color = COLORS.includes(card.color) ? card.color : COLORS[0];
    let name = String(card.name || '').trim().slice(0, 28);
    if (window.SiddhiWords && !window.SiddhiWords.isClean(name)) name = '';
    const img = await compress(card.img);
    const { db, fs } = await withTimeout(sdk(), 15000, 'loading Firebase');
    await withTimeout(fs.addDoc(fs.collection(db, COLLECTION), { color, name, img, t: fs.serverTimestamp(), hidden: false }), 20000, 'saving the card');
    try { localStorage.setItem('siddhi.lastShared', String(Date.now())); } catch (e) { /* ignore */ }
    cache.clear();
    return true;
  }

  Guest.remote = { enabled, latest, add, cached: (n) => (enabled ? cache.read(n) : null), compress };
})();
