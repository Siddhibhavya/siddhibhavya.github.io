/* Guest pages: the Guest Gallery (guest-gallery.html) and the Welcome Aboard drawing page (guest-book.html).
   The "Create" choreography (strings, sliding cards, Thank You) lives in js/guest-anim.js and plugs in as SiddhiGuest.play.

   PERSISTENCE: when js/firebase-config.js is filled in, cards are SHARED — Create saves a compressed copy to Firebase Firestore
   (js/guest-remote.js) and the gallery shows the newest 16 that are not hidden. Every card is also kept in this browser's localStorage, which is
   what the gallery falls back to if Firebase isn't set up or can't be reached (so each visitor then sees their own cards plus four blank seeds).
   Signatures go through the word filter (js/wordfilter.js) before saving and again before showing.

   Contents: 1 Constants + Store · 2 Card component · 3 Gallery page · 4 Drawing page · 5 Boot */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ROOT = document.body.dataset.root || '';
  const KEY = 'siddhi.guestbook.v1';
  const MAX_STORED = 24;
  const SWATCH = { red: '#bb3739', orange: '#ff9a00', green: '#249343', blue: '#2c2696' };
  const INK = '#1b0b2e';

  // the four cards drawn in the Figma gallery frame (blank, exact colours)
  const SEEDS = [
    { id: 'seed-red', color: '#bb3739', name: '', img: '' },
    { id: 'seed-green', color: '#249343', name: '', img: '' },
    { id: 'seed-orange', color: '#f5a01e', name: '', img: '' },
    { id: 'seed-blue', color: '#2c2696', name: '', img: '' }
  ];

  /* ------------------------------------------------------------------ 1 · Store */
  const Store = {
    load() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } },
    save(list) { try { localStorage.setItem(KEY, JSON.stringify(list)); return true; } catch (e) { return false; } },
    add(card) {
      let list = [card].concat(this.load()).slice(0, MAX_STORED);
      while (!this.save(list) && list.length > 1) list.pop();          // quota: drop the oldest
    },
    everyone() { return this.load().concat(SEEDS); },                  // newest first, seeds last
    display() { const u = this.load(); return this.everyone().slice(0, Math.max(4, Math.min(u.length, 16))); }
  };

  /* ------------------------------------------------------------------ 2 · Card component */
  function cardEl(c, variant) {
    const el = document.createElement('div');
    el.className = 'gc gc-' + variant;
    el.style.background = c.color;
    const paper = document.createElement('span');
    paper.className = 'gc-paper';
    if (c.img) { const im = document.createElement('img'); im.src = c.img; im.alt = 'A guest drawing' + (c.name ? ' signed ' + c.name : ''); paper.appendChild(im); }
    const sig = document.createElement('span');
    sig.className = 'gc-sig';
    sig.textContent = c.name || 'Signature';
    if (c.name) sig.classList.add('typed');                           // a typed signature is set in Blank Script
    el.append(paper, sig);
    if (variant === 'gallery') {
      const line = document.createElement('img');
      line.className = 'gc-line'; line.alt = ''; line.src = ROOT + 'assets/guest/card-line.svg';
      el.appendChild(line);
    }
    return el;
  }

  /* The main website, loaded invisibly just below the screen while Thank You is showing, so that when the time comes the two slide up TOGETHER: Thank You
     leaves through the top while the main page rises into view underneath it, like one long page being scrolled. When the slide ends the real page
     opens and is identical to what is on screen, so there is no jump. */
  let peek = null;
  function preloadHome() {
    if (peek) return peek.ready;
    const f = document.createElement('iframe');
    f.className = 'gb-peek'; f.src = ROOT + 'home'; f.title = ''; f.tabIndex = -1; f.inert = true; f.setAttribute('aria-hidden', 'true');
    const ready = new Promise((ok) => { f.addEventListener('load', () => ok(true), { once: true }); setTimeout(() => ok(false), 5000); });
    document.body.appendChild(f);
    peek = { f, ready };
    return ready;
  }

  /* Thank You slides up and away while the preloaded main page slides up into place. If the visitor is on a very slow connection
     and the main page isn't ready after a moment, it falls back to sliding away alone (and the main page then rises into place when it opens).
     If the card is still being shared it waits for that (at most 4 s) so it is never lost. */
  async function goHome() {
    document.documentElement.style.overflow = 'hidden';                                                // no scrollbar flashing while it moves
    window.scrollTo(0, 0);
    const saved = Guest.finishSharing ? Guest.finishSharing() : Promise.resolve();                    // normally already done
    const layout = $('.layout'), footer = $('.footer');
    const loaded = await Promise.race([preloadHome(), new Promise((no) => setTimeout(() => no(false), reduce ? 0 : 1200))]);
    const playing = document.body.classList.contains('gb-playing');
    const D = playing ? window.innerHeight : Math.round(layout.offsetHeight + (footer ? footer.offsetHeight : 0));
    const ms = reduce ? 1 : 1100, ease = 'cubic-bezier(0.65, 0, 0.35, 1)';
    const slide = (el, from, to) => el.animate([{ transform: 'translateY(' + from + 'px)' }, { transform: 'translateY(' + to + 'px)' }], { duration: ms, easing: ease, fill: 'forwards' }).finished.catch(() => {});
    const moves = (playing ? [layout] : [layout, footer]).filter(Boolean).map((el) => slide(el, 0, -D));
    if (loaded) moves.push(slide(peek.f, D - 1, 0));                                                    // the main page comes up from just below, meeting Thank You's bottom edge
    else try { sessionStorage.setItem('siddhi.enter', '1'); } catch (e) { /* ignore */ }               // no main page ready: it rises into place after it opens instead
    // a tab in the background doesn't run animations, so don't wait for them forever: leave a moment after the slide should have ended
    const slid = Promise.race([Promise.all(moves), new Promise((done) => setTimeout(done, ms + 300))]);
    await Promise.all([slid, saved]);
    location.href = ROOT + 'home';
  }

  /* what js/guest-anim.js needs from this file (and it adds .play) */
  const Guest = window.SiddhiGuest = window.SiddhiGuest || {};
  Object.assign(Guest, { $, reduce, cardEl, goHome });
  const Remote = Guest.remote && Guest.remote.enabled ? Guest.remote : null;   // null = the shared gallery isn't set up: everything stays per-browser
  const Words = window.SiddhiWords || null;
  const tidyName = (c) => (Words && c.name && !Words.isClean(c.name) ? Object.assign({}, c, { name: '' }) : c);   // a rude name that slipped through is shown as a blank signature
  const withSeeds = (list) => list.concat(SEEDS).slice(0, Math.max(4, list.length));                             // always at least four cards on the wall

  /* ------------------------------------------------------------------ 3 · Gallery page */
  function initGallery() {
    const stage = $('#gallery');
    if (!Remote) { renderGallery(stage, Store.display()); return; }
    const hit = Remote.cached(16);                                       // fetched a moment ago: no need to ask again
    if (hit) { renderGallery(stage, withSeeds(hit.map(tidyName))); return; }
    renderGallery(stage, SEEDS.slice());                                 // four blank cards while the shared ones arrive
    Remote.latest(16).then(
      (shared) => { if (stage.isConnected) renderGallery(stage, withSeeds(shared.map(tidyName)), true); },
      (err) => { console.warn('[gallery] could not load the shared cards, showing this browser\'s own:', err && err.message); if (stage.isConnected) renderGallery(stage, Store.display(), true); }
    );
  }

  /* The gallery is a room: one long wall you walk along sideways. Design units are 800 tall (css/pages/gallery.css scales them with --u).
     The newest drawing is the big hero frame under its own lamp; the rest follow in wall groups ("bays") with a picture ledge now and then.
     Slot = [x, y, outer width] inside the bay. A frame's height follows from its width: 0.7074 x width. */
  const FH = (w) => w * 0.7074;
  const BAYS = [
    { w: 1320, lamps: [[360, 440], [900, 440]], fr: [[20, 150, 300], [20, 420, 220], [520, 170, 250], [500, 400, 310], [1010, 190, 260], [1030, 430, 200]] },
    { w: 1250, lamps: [[300, 440], [820, 440]], ledge: [20, 540, 1180], fr: [[60, 130, 280], [600, 150, 230]], lean: [[110, 200, 0], [640, 170, -3], [900, 200, 2]], props: ['plant', 480], more: ['books', 860] },
    { w: 1300, lamps: [[200, 440], [700, 440], [1110, 400]], fr: [[30, 200, 340], [570, 130, 220], [570, 360, 260], [1010, 170, 250], [1030, 400, 200]] }
  ];
  const STYLES = ['oak', 'black', 'gold', 'white'], TILT = [0, -1, 0, 1.2, 0, -0.8, 0.6];
  const PROPS = {
    plant: '<svg viewBox="0 0 120 190"><path d="M60 100C50 70 28 62 10 66c10 24 30 36 50 36zM60 100C70 62 92 48 112 50c-8 28-30 46-52 50zM60 100C58 70 60 40 64 14c10 24 6 56-4 86z" fill="#4c6b3c"/><path d="M28 108h64l-8 78H36z" fill="#b5654a"/><rect x="24" y="100" width="72" height="14" rx="3" fill="#c97a5c"/></svg>',
    books: '<svg viewBox="0 0 180 120"><rect x="6" y="84" width="168" height="30" rx="2" fill="#7b2b3d"/><rect x="16" y="54" width="150" height="30" rx="2" fill="#2c2696"/><rect x="10" y="26" width="156" height="28" rx="2" fill="#d89b2a"/><rect x="20" y="88" width="100" height="4" fill="#f7e9dc" opacity=".7"/><rect x="30" y="58" width="80" height="4" fill="#f7e9dc" opacity=".7"/></svg>'
  };
  const r1 = (n) => Math.round(n * 10) / 10;
  const clean = (t) => String(t).replace(/[<>&"]/g, (s) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[s]));

  /* a real frame: wood/black/gold/white moulding, mat, glass. A signed drawing gets a small signature card on the wall beside it (never on the frame). */
  function frameHTML(c, o) {
    const alt = 'A guest drawing' + (c.name ? ' signed ' + clean(c.name) : '');
    const wire = o.wire && !o.lean ? '<svg class="fr-wire" viewBox="0 0 100 36" preserveAspectRatio="none" aria-hidden="true"><line x1="50" y1="2" x2="9" y2="36" vector-effect="non-scaling-stroke"/><line x1="50" y1="2" x2="91" y2="36" vector-effect="non-scaling-stroke"/></svg><i class="fr-nail" aria-hidden="true"></i>' : '';
    const tape = !o.wire && !o.lean ? '<i class="fr-tape" aria-hidden="true" style="--tr:' + (o.i % 2 ? 4 : -5) + 'deg"></i>' : '';
    const img = c.img && /^data:image\/(png|webp|jpeg);base64,/.test(c.img) ? '<img src="' + clean(c.img) + '" alt="' + alt + '" loading="' + (o.hero ? 'eager' : 'lazy') + '" decoding="async" draggable="false">' : '';
    const date = Number(c.t) > 0 ? new Date(Number(c.t)) : null;
    const dated = date && !isNaN(date) ? '<time datetime="' + date.toISOString() + '">' + date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + '</time>' : '';
    const sig = c.name || dated ? '<figcaption class="fr-label">' + (c.name ? '<b>' + clean(c.name) + '</b>' : '') + dated + '</figcaption>' : '';
    return '<figure tabindex="0" aria-label="' + (c.img ? alt : 'Empty frame') + '" class="fr fr-' + STYLES[o.i % 4] + (o.hero ? ' fr-hero' : '') + (o.lean ? ' ledge-fr' : '') + (o.fresh ? ' fresh' : '') + '" style="--x:' + r1(o.x) + ';--y:' + r1(o.y) + ';--w:' + o.w + ';--r:' + (o.r || 0) + 'deg;--tc:' + (Object.values(SWATCH).includes(c.color) ? c.color : SWATCH.red) + '">' +
      wire + tape + '<div class="fr-body"><div class="fr-mat"><div class="fr-art">' + img + '</div></div></div>' + sig + '</figure>';
  }
  const lampHTML = (x, w, h) => '<div class="lamp" style="--lx:' + x + ';--lw:' + w + ';--lh:' + h + '"><div class="lamp-cone"></div><div class="lamp-pool"></div><svg class="lamp-body" viewBox="0 0 34 54" aria-hidden="true"><rect x="14" y="0" width="6" height="10" fill="#2a2623"/><rect x="5" y="8" width="24" height="40" rx="5" fill="#1b1817"/><rect x="7" y="10" width="5" height="34" rx="2" fill="#4a4540"/><ellipse cx="17" cy="48" rx="12" ry="4" fill="#fff0c4"/></svg></div>';

  function renderGallery(room, list, fresh) {
    const scroller = $('.room-scroll', room), track = $('.room-track', room);
    let html = '<div class="room-wall"></div><div class="room-dado"></div><div class="room-rail"></div><div class="room-skirt"></div><div class="room-ceiling"></div><div class="room-trackbar"></div>';
    const queue = list.slice();
    let n = 0, ox = 1120;
    // intro wall: the title lettered on the wall, then the newest drawing as the big hero under its own lamp
    html += '<div class="wall-intro"><h1>Guest Gallery</h1><p>An art installation by my guests</p><a class="wall-more" href="guest-book">Create something!</a></div>';
    const first = queue.shift();
    if (first) html += lampHTML(780, 660, 600) + frameHTML(first, { i: n++, x: 500, y: 180, w: 560, hero: true, wire: true, fresh });
    for (let b = 0; queue.length; b++) {
      const bay = BAYS[b % BAYS.length];
      bay.lamps.forEach(([lx, lw]) => { html += lampHTML(ox + lx, lw, 520); });
      if (bay.ledge) html += '<div class="ledge" style="--x:' + (ox + bay.ledge[0]) + ';--y:' + bay.ledge[1] + ';--w:' + bay.ledge[2] + '"></div>';
      bay.fr.forEach(([x, y, w]) => { const c = queue.shift(); if (c) { html += frameHTML(c, { i: n, x: ox + x, y, w, r: TILT[n % TILT.length], wire: n % 2 === 0, fresh }); n++; } });
      if (bay.lean) bay.lean.forEach(([x, w, r]) => { const c = queue.shift(); if (c) { html += frameHTML(c, { i: n, x: ox + x, y: bay.ledge[1] - FH(w) + 2, w, r, lean: true, fresh }); n++; } });
      if (bay.props) html += '<div class="prop" style="--x:' + (ox + bay.props[1]) + ';--y:' + bay.ledge[1] + ';--w:110">' + PROPS[bay.props[0]] + '</div>';
      if (bay.more) html += '<div class="prop" style="--x:' + (ox + bay.more[1]) + ';--y:' + bay.ledge[1] + ';--w:150">' + PROPS[bay.more[0]] + '</div>';
      ox += bay.w;
    }
    if (list.length <= 7) html += '<div class="ledge" style="--x:' + (ox - 580) + ';--y:570;--w:460"></div><div class="prop" style="--x:' + (ox - 480) + ';--y:570;--w:110">' + PROPS.plant + '</div><div class="prop" style="--x:' + (ox - 310) + ';--y:570;--w:150">' + PROPS.books + '</div>';
    html += '<div class="wall-end" style="--x:' + (ox + 60) + '"><p>Add yours to the wall.</p><a class="wall-more" href="guest-book">Create something!</a></div>';
    ox += 700;
    track.style.width = 'calc(' + ox + 'px * var(--u))';
    track.innerHTML = html;
    wireRoom(room, scroller);
    if (window.SiddhiShell) window.SiddhiShell.fit();
  }

  /* scale (--u), progress, sideways wheel (until the ends, then the page scrolls on to the footer), mouse drag, arrow keys */
  function wireRoom(room, scroller) {
    const bar = $('.room-progress', room);
    const size = () => room.style.setProperty('--u', (room.clientHeight / 800).toFixed(4));
    const prog = () => { const m = scroller.scrollWidth - scroller.clientWidth; bar.style.setProperty('--p', (m > 0 ? (scroller.scrollLeft / m) * 100 : 100).toFixed(1) + '%'); };
    size(); prog();
    if (room._wired) return;
    room._wired = true;
    if (window.ResizeObserver) new ResizeObserver(() => { size(); prog(); }).observe(room); else addEventListener('resize', () => { size(); prog(); });
    scroller.addEventListener('scroll', prog, { passive: true });
    scroller.addEventListener('wheel', (e) => {
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;                          // pinch zoom / a real sideways swipe: leave it alone
      const m = scroller.scrollWidth - scroller.clientWidth, x = scroller.scrollLeft;
      if ((e.deltaY > 0 && x >= m - 1) || (e.deltaY < 0 && x <= 0)) return;                      // at either end the page itself carries on
      e.preventDefault();
      scroller.scrollLeft += e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? scroller.clientWidth : 1);
    }, { passive: false });
    let drag = null;
    scroller.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse' || e.button) return; drag = { x: e.clientX, l: scroller.scrollLeft, moved: false }; });
    scroller.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) < 5) return;
      if (!drag.moved) { drag.moved = true; scroller.setPointerCapture(e.pointerId); scroller.classList.add('dragging'); }
      scroller.scrollLeft = drag.l - dx;
    });
    const release = () => { if (drag && drag.moved) setTimeout(() => scroller.classList.remove('dragging'), 0); drag = null; };
    scroller.addEventListener('pointerup', release);
    scroller.addEventListener('pointercancel', release);
    scroller.addEventListener('click', (e) => { if (scroller.classList.contains('dragging')) { e.preventDefault(); e.stopPropagation(); } }, true);
    const warm = (e) => {
      const fr = e.target.closest('.fr'), lamps = [...room.querySelectorAll('.lamp')];
      lamps.forEach((lamp) => lamp.classList.remove('is-warm'));
      if (!fr) return;
      const x = Number(fr.style.getPropertyValue('--x')) + Number(fr.style.getPropertyValue('--w')) / 2;
      lamps.sort((a, b) => Math.abs(Number(a.style.getPropertyValue('--lx')) - x) - Math.abs(Number(b.style.getPropertyValue('--lx')) - x));
      if (lamps[0]) lamps[0].classList.add('is-warm');
    };
    scroller.addEventListener('pointerover', warm);
    scroller.addEventListener('focusin', warm);
    scroller.addEventListener('pointerleave', () => room.querySelectorAll('.lamp').forEach((lamp) => lamp.classList.remove('is-warm')));
    scroller.addEventListener('keydown', (e) => {
      const step = scroller.clientWidth * 0.8, go = (left) => scroller.scrollBy({ left, behavior: reduce ? 'auto' : 'smooth' });
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); go(step); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(-step); }
      else if (e.key === 'Home') { e.preventDefault(); scroller.scrollTo({ left: 0 }); }
      else if (e.key === 'End') { e.preventDefault(); scroller.scrollTo({ left: scroller.scrollWidth }); }
    });
  }

  /* Welcome Aboard: the stars and fish-bone patches are placed at random on every visit, in the margins around the card. Each one is put where it is
     furthest from the ones already placed, and stars are kept well apart from each other (fish may sit closer). If the space is ever too tight the
     gaps shrink a little until everything fits; if that still fails the Figma positions are simply left alone. */
  function scatterDecor() {
    const phone = document.body.classList.contains('book-phone');
    const PS = phone ? 0.55 : 1;                                                                       // on a phone the decorations are drawn smaller (css: body.book-phone .dc)
    const items = [...document.querySelectorAll('.gb-decor .dc')].map((el) => {
      const num = (n) => parseFloat(el.style.getPropertyValue(n));
      const fish = el.classList.contains('fish'), w = num('--w'), h = num('--h');
      return { el, fish, w, h, r: (fish ? 0.35 : 0.42) * Math.max(w, h) * PS };                            // r = how much room it really takes up
    }).sort((a, b) => a.fish - b.fish);                                                                // stars first: they are the pickiest
    if (!items.length) return;
    // the area they may be placed in, and the part of it to keep clear (the card, title and controls). Desktop: the whole 1448x1024 screen. Phone: the whole
    // visible screen — which is taller than the narrow stage, so there is room above the title and below the button — in the page's own design coordinates.
    let X0 = 0, X1 = 1448, Y0 = 0, Y1 = 1024, BOX = { x0: 330, y0: 20, x1: 1118, y1: 985 };
    if (phone) {
      const stageEl = document.querySelector('.stage'), mainEl = document.querySelector('.main'), sr = stageEl.getBoundingClientRect(), mr = mainEl.getBoundingClientRect();
      const k = sr.width / stageEl.offsetWidth || 1, off = 364;                                        // the content is shifted 364px left of the stage in phone mode
      X0 = off + (mr.left - sr.left) / k; X1 = off + (mr.right - sr.left) / k; Y0 = (mr.top - sr.top) / k; Y1 = (mr.bottom - sr.top) / k;
      BOX = { x0: off + 6, y0: 20, x1: off + 714, y1: 1240 };
    }
    const W = X1 - X0, H = Y1 - Y0, CX = (X0 + X1) / 2, CY = (Y0 + Y1) / 2;
    const outsideBox = (x, y) => Math.hypot(Math.max(BOX.x0 - x, 0, x - BOX.x1), Math.max(BOX.y0 - y, 0, y - BOX.y1));
    const gap = (a, b) => (a.fish || b.fish ? 40 : 110);
    const rand = (a, b) => a + Math.random() * (b - a);
    for (let squeeze = 1, round = 0; round < 8; round++, squeeze *= 0.9) {
      const placed = []; let ok = true;
      for (const it of items) {
        let best = null;
        for (let k = 0; k < 400 && (!best || k < 120); k++) {                                          // sample until it has a good few valid spots, keep the roomiest
          const x = rand(X0 - it.w * 0.12 * PS, X1 + it.w * 0.12 * PS), y = rand(Y0 - it.h * 0.12 * PS, Y1 + it.h * 0.12 * PS);
          if (outsideBox(x, y) < it.r - 20) continue;
          let room = Infinity;
          for (const p of placed) room = Math.min(room, Math.hypot(p.x - x, p.y - y) - (p.it.r + it.r + gap(p.it, it)) * squeeze);
          if (room < 0) continue;
          if (!best || room > best.room) best = { x, y, room };
        }
        if (!best) { ok = false; break; }
        placed.push({ it, x: best.x, y: best.y });
      }
      if (!ok) continue;
      for (const { it, x, y } of placed) {
        const s = it.el.style;
        s.setProperty('--cx', x.toFixed(1)); s.setProperty('--cy', y.toFixed(1));
        s.setProperty('--r', (it.fish ? rand(0, 360) : rand(-35, 35)).toFixed(1) + 'deg');
        s.setProperty('--ex', Math.max(0.6, Math.min(1.2, Math.abs(x - CX) / 500)) * (x < CX ? -1 : 1));   // when Create is pressed each one slides off the nearest way
        s.setProperty('--ey', ((y - CY) / (H / 2)).toFixed(2));
      }
      return;
    }
  }

  /* ------------------------------------------------------------------ 4 · Drawing page */
  function initBook() {
    try { scatterDecor(); } catch (err) { console.warn('[guest] could not scatter the decorations:', err); }
    if (window.SiddhiHighlight) window.SiddhiHighlight.scan(document);                                 // the marker on "drawing" and "guest gallery"
    const pad = $('#pad'), ctx = pad.getContext('2d');
    const card = $('#gbCard'), sig = $('#sig'), create = $('#create'), hint = $('#hint'), skip = $('#skip');
    const W = 641.927, H = 421.067;
    let color = SWATCH.red, dirty = false, busy = false;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    pad.width = Math.round(W * dpr); pad.height = Math.round(H * dpr);
    pad.style.width = W + 'px'; pad.style.height = H + 'px';
    ctx.scale(dpr, dpr);
    Object.assign(ctx, { lineCap: 'round', lineJoin: 'round' });

    // the word "Signature" steps back once you are signing on the line
    const sigLabel = $('.gb-siglabel');
    sig.addEventListener('input', () => { if (sigLabel) sigLabel.classList.toggle('dim', !!sig.value); });

    // the colour box in the card's right border sets pen colour, size and the eraser
    let ink = INK, pen = 4, erasing = false;
    const setPen = () => { ctx.globalCompositeOperation = erasing ? 'destination-out' : 'source-over'; ctx.lineWidth = erasing ? pen * 3 : pen; ctx.strokeStyle = ctx.fillStyle = erasing ? '#000' : ink; };
    const pick = (selector, onPick) => document.querySelectorAll(selector).forEach((b) => b.addEventListener('click', () => {
      onPick(b);
      document.querySelectorAll(selector).forEach((x) => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
      setPen();
    }));
    setPen();
    pick('.gb-pen', (b) => { erasing = b.dataset.c === 'erase'; if (!erasing) ink = b.dataset.c; });
    pick('.gb-size', (b) => { pen = +b.dataset.w; });

    // drawing: smooth curves through the pointer positions
    let drawing = false, last = null, mid = null;
    const at = (e) => { const r = pad.getBoundingClientRect(); return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H) / r.height }; };
    pad.addEventListener('pointerdown', (e) => {
      if (busy) return;
      try { pad.setPointerCapture(e.pointerId); } catch (_) { /* some pointer sources can't be captured */ }
      drawing = true; dirty = true; hint.textContent = '';
      last = mid = at(e);
      ctx.beginPath(); ctx.arc(last.x, last.y, ctx.lineWidth / 2, 0, Math.PI * 2); ctx.fill();
    });
    pad.addEventListener('pointermove', (e) => {
      if (!drawing) return;
      const batch = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
      for (const ev of (batch.length ? batch : [e])) {
        const p = at(ev), m = { x: (last.x + p.x) / 2, y: (last.y + p.y) / 2 };
        ctx.beginPath(); ctx.moveTo(mid.x, mid.y); ctx.quadraticCurveTo(last.x, last.y, m.x, m.y); ctx.stroke();
        last = p; mid = m;
      }
    });
    const stop = () => { drawing = false; };
    pad.addEventListener('pointerup', stop); pad.addEventListener('pointercancel', stop);

    // card colour
    document.querySelectorAll('.gb-swatch').forEach((b) => b.addEventListener('click', () => {
      color = SWATCH[b.dataset.color];
      card.style.background = color;
      document.querySelectorAll('.gb-swatch').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
    }));

    // the newest shared cards, fetched now so they are ready to slide past when Create is pressed (3 reads on the free plan)
    if (Remote) Remote.latest(3).then((l) => { Guest.recent = l.map(tidyName); }, () => { /* the strip then uses this browser's own cards */ });

    // "Go to main site": leaves the same way the Thank You screen does (slides up, the main page rises in) — unless Create is already under way
    if (skip) skip.addEventListener('click', (e) => {
      if (e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;                       // let a new-tab click do its own thing
      e.preventDefault();
      if (!busy) { busy = true; goHome(); }
    });

    const shake = () => { if (!reduce) card.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(7px)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(0)' }], { duration: 380, easing: 'ease-out' }); };

    // Create: save the card, then play the choreography (or, if that file is missing, just go home)
    create.addEventListener('click', () => {
      if (busy) return;
      if (!dirty) { hint.textContent = 'Draw something first — anything!'; shake(); return; }
      const name = sig.value.trim().slice(0, 28);
      if (Words && !Words.isClean(name)) { hint.textContent = 'Let’s keep the signature friendly — try another name!'; shake(); return; }
      busy = true;
      const out = document.createElement('canvas'); out.width = pad.width; out.height = pad.height;
      const o = out.getContext('2d'); o.fillStyle = '#fff'; o.fillRect(0, 0, out.width, out.height); o.drawImage(pad, 0, 0);
      const mine = { id: 'g' + Date.now(), color, name, img: out.toDataURL('image/png'), t: Date.now() };
      const past = (Guest.recent && Guest.recent.length ? Guest.recent.concat(SEEDS) : Store.everyone()).slice(0, 3);   // the previous three, read before adding ours
      Store.add(mine);
      // Share it — but not while the animation is running (shrinking the drawing takes ~80 ms of work, which could nudge a frame). It starts once
      // the cards and strings have left (4.85 s in), or earlier if the visitor leaves / the page is about to go home.
      // A failure is not shown to the visitor: their own copy is already saved on this browser.
      if (Remote) {
        let sharing = null;
        const startShare = () => sharing || (sharing = Remote.add(mine).catch((err) => console.warn('[gallery] the card was not shared:', err && err.message)));
        Guest.finishSharing = () => Promise.race([startShare(), new Promise((done) => setTimeout(done, 4000))]);   // goHome() waits for this, at most 4 s
        setTimeout(startShare, 4850);
        document.addEventListener('visibilitychange', () => { if (document.hidden) startShare(); });
      }
      setTimeout(preloadHome, 4850);                                                                    // once the strings have left: get the main page ready underneath, for the slide up
      if (typeof Guest.play === 'function') Guest.play(mine, past, card); else goHome();
    });
  }

  /* ------------------------------------------------------------------ 5 · Boot */
  Object.assign(Guest, { frameHTML, lampHTML, roomProps: PROPS });
  if ($('#gallery')) initGallery();
  if ($('#pad')) initBook();
  /* Get the main page ready while the visitor is still drawing (idle time, a couple of seconds after this page has loaded), not only after they press
     Share: by the time Thank You is on screen it is already there, so the slide up starts at once instead of waiting for the main page to download. */
  if ($('#pad') && !reduce && !(navigator.connection && navigator.connection.saveData)) {
    const warmHome = () => (window.requestIdleCallback ? requestIdleCallback(preloadHome, { timeout: 4000 }) : setTimeout(preloadHome, 0));
    if (document.readyState === 'complete') setTimeout(warmHome, 2000); else addEventListener('load', () => setTimeout(warmHome, 2000), { once: true });
  }
  // after an in-place page swap the shell calls this to build the gallery on the new content
  (window.SiddhiPages = window.SiddhiPages || {}).gallery = () => { const g = $('#gallery'); if (g && !g.querySelector('.fr')) initGallery(); };
})();
