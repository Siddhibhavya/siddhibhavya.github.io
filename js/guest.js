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
  const MAX_STORED = 34;
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
    display() { const u = this.load(); return this.everyone().slice(0, Math.max(4, Math.min(u.length, 34))); }
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
    const hit = Remote.cached(34);                                       // fetched a moment ago: no need to ask again
    if (hit) { renderGallery(stage, withSeeds(hit.map(tidyName))); return; }
    renderGallery(stage, SEEDS.slice());                                 // four blank cards while the shared ones arrive
    Remote.latest(34).then(
      (shared) => { if (stage.isConnected) renderGallery(stage, withSeeds(shared.map(tidyName)), true); },
      (err) => { console.warn('[gallery] could not load the shared cards, showing this browser\'s own:', err && err.message); if (stage.isConnected) renderGallery(stage, Store.display(), true); }
    );
  }

  /* The gallery wall (Figma "Guests gallery- Cards 2"). The first screen follows the Figma composition (six frames and the picture shelf; the newest drawing takes the
     big frame), older ones continue to the right in tight wall groups. Everything is in stage px (Figma x − 356); the wall window starts 58px left of the stage
     (the arch's edge), so track x = stage x + WOFF. A frame HUGS its drawing: only the width is chosen, the height follows the drawing's 642:421 shape. */
  const MAXW = 150, MINW = 80, BOTTOM = 500;   // frames never reach below this: the PC, books and plant start just under it
  const WOFF = 0, GAP = 12, TOP = 112, ART = 421 / 642, END_PAD = 30;
  // groups beyond the first screen: columns of frames (widths) stacked tight; x is from the group's start
  const BAYS = [
    { shelf: 0, cols: [[347, [215, 215]], [574, [150, 150, 150]], [736, [210, 210]]] },
    { cols: [[0, [240, 240]], [252, [150, 150, 150]], [414, [300, 220]], [726, [130, 130, 130]]] }
  ];
  const clean = (t) => String(t).replace(/[<>&"]/g, '');
  const dims = (w, h) => { const b = 4, m = Math.max(4, Math.round((h ? Math.min(w, h) : w) * 0.105) - 2), t = b + m; return { b, m, h: h || Math.round((w - 2 * t) * ART + 2 * t) }; };   // thin moulding, a mat; with no height given the frame hugs the drawing's 642:421 shape
  const FRAMES = ['black', 'oak', 'white', 'black', 'white', 'oak'];
  /* The wall hang fills the box mapped on the wall (548 x 325 at 41, 93). It is a salon of 17 frames of different sizes and shapes (tall, wide, small, square), no two neighbours alike,
     the biggest in the middle for the newest drawing. [x, y, w, h] inside the box. Drawings are used nearest the big one first; every second set is mirrored so the sets differ. */
  const WALL_W = 662, BOX_X = 41, BOX_Y = 93, BOX_W = 548, BOX_H = 325, CLUSTER_W = BOX_W;
  const TEMPLATE = [
    [0, 0, 110, 150], [0, 158, 110, 83], [0, 249, 110, 76],
    [118, 0, 110, 88], [118, 96, 110, 120], [118, 224, 110, 101],
    [236, 0, 160, 92], [236, 100, 160, 133, 1], [236, 241, 160, 84],
    [404, 0, 80, 80], [404, 88, 80, 66], [404, 162, 80, 91], [404, 261, 80, 64],
    [492, 0, 56, 100], [492, 108, 56, 60], [492, 176, 56, 55], [492, 239, 56, 86]];
  function cluster() { return TEMPLATE.map((t) => ({ x: BOX_X + t[0], y: BOX_Y + t[1], w: t[2], h: t[3], hero: !!t[4] })); }
  const SHELF_GAP = 96, PER = TEMPLATE.length, PITCH = CLUSTER_W + 2 * SHELF_GAP + 194;   // the shelf (the Figma asset, 194 wide) is the space between two sets
  function posterSlots(n) {
    const base = cluster(), hero = base.find((p) => p.hero), cx = (p) => p.x + p.w / 2, cy = (p) => p.y + p.h / 2;
    const order = base.slice().sort((a, b) => Math.hypot(cx(a) - cx(hero), cy(a) - cy(hero)) - Math.hypot(cx(b) - cx(hero), cy(b) - cy(hero))), out = [];
    for (let i = 0; i < n; i++) {
      const p = order[i % order.length], rep = Math.floor(i / order.length), mirror = rep % 2 === 1, off = rep * PITCH;
      out.push({ x: (mirror ? BOX_X + BOX_W - (p.x - BOX_X) - p.w : p.x) + off, y: mirror ? BOX_Y + BOX_H - (p.y - BOX_Y) - p.h : p.y, w: p.w, h: p.h });
    }
    return out;
  }
  let frameN = 0;
  function frameHTML(c, x, y, w, fresh, snap, h) {
    const d = dims(w, h), who = c.name ? ' signed ' + clean(c.name) : '';
    const img = c.img ? '<img src="' + clean(c.img) + '" alt="A guest drawing' + who + '" loading="lazy" decoding="async">' : '';
    const card = c.name ? '<span class="gf-card"><b>' + clean(c.name) + '</b></span>' : '';
    return '<button type="button" class="gf gf-' + FRAMES[frameN++ % 6] + (fresh ? ' fresh' : '') + (snap ? ' snap' : '') + '" aria-expanded="false" aria-label="Guest drawing' + who + (c.name ? ', press to show the signature' : '') + '" style="--x:' + (x + WOFF) + ';--y:' + y + ';--w:' + w + ';--h:' + d.h + ';--r:' + ((frameN % 3) - 1) * 0.6 + 'deg;--c:' + c.color + ';--b:' + d.b + ';--m:' + d.m + '">' +
      '<span class="gf-mat"><span class="gf-in">' + img + '</span></span>' + card + '</button>';
  }

  /* the line animation: two strings (green, orange) hung across the wall from nails; they draw themselves in, paper scraps are taped to them */
  const TILES = [['#7b2b3d', '#fff1df'], ['#fff1df', '#7b2b3d'], ['#ff9a00', '#000'], ['#075e54', '#fff1df'], ['#2c2696', '#fff']];   // tile fill, letter: dark fills get light letters, light fills dark ones
  function lettersHTML() {                                                                            // GUEST [Create something!] GALLERY, hung on the cord; the cord sags 62px at the middle
    const y = (x) => 4 + 4 * 62 * (x / 768) * (1 - x / 768) + 2, mid = 384, out = [];
    const put = (ch, x, k) => out.push('<span class="gal-tile" aria-hidden="true" style="left:' + x + 'px;top:' + y(x).toFixed(1) + 'px;--sr:' + ((k % 3) - 1) * 2.2 + 'deg;--tb:' + TILES[k % 5][0] + ';--tc:' + TILES[k % 5][1] + '">' + ch + '<i class="peg"></i></span>');
    'GUEST'.split('').forEach((ch, k) => put(ch, mid - 144 - (4 - k) * 38, k));
    'GALLERY'.split('').forEach((ch, k) => put(ch, mid + 144 + k * 38, k + 1));
    return out.join('');
  }

  function renderGallery(stage, list, fresh) {
    const scroller = $('.gal-scroll', stage), track = $('.gal-track', stage);
    if (!track) return;
    frameN = 0;
    const queue = list.slice();
    while (queue.length < PER || queue.length % PER) queue.push(SEEDS[queue.length % SEEDS.length]);   // every set holds the same number of frames: blank frames wait for the next drawings
    let html = '', right = 0;
    const put = (x, y, w, snap, h) => { const c = queue.shift(); if (c) { html += frameHTML(c, x, y, w, fresh, snap, h); right = Math.max(right, x + w); } };
    const slots = posterSlots(queue.length), reps = Math.ceil(queue.length / PER);
    let shelves = '';
    const maxX = Math.max(...slots.map((p) => p.x + p.w)), shift = 0, M = BOX_X;
    for (let r = 1; r < reps; r++) shelves += '<img class="gal-shelf" src="' + ROOT + 'assets/gallery/shelf.webp" alt="" style="--x:' + Math.round((r - 1) * PITCH + M + CLUSTER_W + SHELF_GAP) + '" width="194" height="232">';
    slots.forEach((p, i) => put(p.x + shift, p.y, p.w, i % PER === 0, p.h));
    html += shelves;
    scroller._snaps = [];                                                                              // places the wall may rest: each set back at its starting place in the window, and each shelf centred
    for (let r = 0; r * PER < slots.length; r++) scroller._snaps.push(r * PITCH + WALL_W / 2);
    for (let r = 1; r < reps; r++) scroller._snaps.push((r - 1) * PITCH + M + CLUSTER_W + SHELF_GAP + 97);
    scroller._snaps.sort((a, b) => a - b);
    right = maxX + (WALL_W - BOX_X - CLUSTER_W) - END_PAD;
    track.innerHTML = html;
    track.style.width = Math.max(WALL_W, right + END_PAD, scroller._snaps[scroller._snaps.length - 1] + WALL_W / 2) + 'px';   // the last set can always be centred                                                // the wall ends just after the last frame: no empty stretch
    wireWall(stage, scroller);
    scroller.dispatchEvent(new Event('scroll'));                                                       // refresh the arrows for this set of frames
    if (window.SiddhiShell) window.SiddhiShell.fit();
    scrollHint(stage);
  }

  /* "Scroll to explore": the site's notification pill (top centre of the content area), shown for 3 seconds once the wall is up */
  function scrollHint(stage) {
    if (stage._hinted || document.querySelector('.move-hint')) return;
    stage._hinted = true;
    setTimeout(() => {
      if (!stage.isConnected) return;
      const pill = document.createElement('div');
      pill.className = 'move-hint'; pill.setAttribute('role', 'status');
      pill.innerHTML = 'Scroll to explore <i class="arr" aria-hidden="true"></i>';
      document.body.appendChild(pill);
      setTimeout(() => pill.classList.add('out'), 2500);
      setTimeout(() => pill.remove(), 3000);
    }, 700);
  }

  /* wall controls: sideways wheel (until the ends, then the page carries on to the footer), mouse drag, arrow keys, click a frame for its signature */
  function wireWall(stage, scroller) {
    if (scroller._wired) return;
    scroller._wired = true;
    const hint = $('.gal-hint', stage);
    const scale = () => scroller.getBoundingClientRect().width / scroller.offsetWidth || 1;
    const win = $('.gal-win', stage);
    // scrolling stops only where a set's centre frame is centred on the wall: after you pause, it eases to the nearest one
    let settleT = 0, settling = false;
    const settle = () => {
      const snaps = (scroller._snaps || []).map((c) => Math.max(0, Math.min(scroller.scrollWidth - scroller.clientWidth, c - scroller.clientWidth / 2)));
      if (snaps.length < 2) return;   // (sets and shelves)
      const here = scroller.scrollLeft, best = snaps.reduce((a, b) => (Math.abs(b - here) < Math.abs(a - here) ? b : a));
      if (Math.abs(best - here) < 1.5) { settling = false; return; }
      settling = true;
      scroller.scrollTo({ left: best, behavior: reduce ? 'auto' : 'smooth' });
    };
    const prev = $('.gal-prev', stage), next = $('.gal-next', stage);
    const stops = () => (scroller._snaps || []).map((c) => Math.max(0, Math.min(scroller.scrollWidth - scroller.clientWidth, c - scroller.clientWidth / 2)));
    const step = (dir) => { const s = stops(), x = scroller.scrollLeft, to = dir > 0 ? s.find((v) => v > x + 4) : s.slice().reverse().find((v) => v < x - 4); if (to != null) scroller.scrollTo({ left: to, behavior: reduce ? 'auto' : 'smooth' }); };
    const arrows = () => { const s = stops(), x = scroller.scrollLeft; if (prev) prev.disabled = !s.some((v) => v < x - 4); if (next) next.disabled = !s.some((v) => v > x + 4); };
    if (prev) prev.addEventListener('click', () => step(-1));
    if (next) next.addEventListener('click', () => step(1));
    scroller.addEventListener('scroll', arrows, { passive: true }); arrows();
    scroller.addEventListener('scroll', () => { clearTimeout(settleT); if (!drag) settleT = setTimeout(settle, settling ? 90 : 180); });
    scroller.addEventListener('scroll', () => { if (hint && scroller.scrollLeft > 20) hint.classList.add('gone'); if (win) win.style.setProperty('--sx', scroller.scrollLeft.toFixed(0)); }, { passive: true });
    scroller.addEventListener('wheel', (e) => {
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;                          // pinch zoom / a real sideways swipe: leave it alone
      const m = scroller.scrollWidth - scroller.clientWidth, x = scroller.scrollLeft;
      if ((e.deltaY > 0 && x >= m - 1) || (e.deltaY < 0 && x <= 0)) return;                      // at either end the page itself carries on
      e.preventDefault();
      scroller.scrollLeft += e.deltaY / scale();
    }, { passive: false });
    let drag = null;
    scroller.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse' || e.button) return; drag = { x: e.clientX, l: scroller.scrollLeft, moved: false }; });
    addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) < 5) return;
      if (!drag.moved) { drag.moved = true; scroller.classList.add('dragging'); }
      scroller.scrollLeft = drag.l - dx / scale();
    });
    addEventListener('pointerup', () => { if (drag && drag.moved) { setTimeout(() => scroller.classList.remove('dragging'), 0); clearTimeout(settleT); settleT = setTimeout(settle, 120); } drag = null; });
    scroller.addEventListener('keydown', (e) => {
      if (e.target !== scroller) return;
      const step = scroller.clientWidth * 0.8, go = (left) => scroller.scrollBy({ left, behavior: reduce ? 'auto' : 'smooth' });
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); go(step); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(-step); }
      else if (e.key === 'Home') { e.preventDefault(); scroller.scrollTo({ left: 0 }); }
      else if (e.key === 'End') { e.preventDefault(); scroller.scrollTo({ left: scroller.scrollWidth }); }
    });
    // a frame: click (or Enter) shows that guest's signature card beside it; click again, another frame, or Esc closes it
    scroller.addEventListener('click', (e) => {
      const f = e.target.closest('.gf');
      scroller.querySelectorAll('.gf.open').forEach((o) => { if (o !== f) { o.classList.remove('open'); o.setAttribute('aria-expanded', 'false'); } });
      if (!f || !f.querySelector('.gf-card')) return;
      const on = f.classList.toggle('open');
      f.setAttribute('aria-expanded', String(on));
    });
    addEventListener('keydown', (e) => { if (e.key === 'Escape') scroller.querySelectorAll('.gf.open').forEach((o) => { o.classList.remove('open'); o.setAttribute('aria-expanded', 'false'); }); });
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
      if (!dirty) { hint.textContent = 'Draw something first. Anything!'; shake(); return; }
      const name = sig.value.trim().slice(0, 28);
      if (Words && !Words.isClean(name)) { hint.textContent = 'Let’s keep the signature friendly. Try another name!'; shake(); return; }
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
  Object.assign(Guest, { frameHTML, posterSlots });                                                            // the gallery frame markup, for the Create animation to reuse
  if ($('#gallery')) initGallery();
  if ($('#pad')) initBook();
  /* Get the main page ready while the visitor is still drawing (idle time, a couple of seconds after this page has loaded), not only after they press
     Share: by the time Thank You is on screen it is already there, so the slide up starts at once instead of waiting for the main page to download. */
  if ($('#pad') && !reduce && !(navigator.connection && navigator.connection.saveData)) {
    const warmHome = () => (window.requestIdleCallback ? requestIdleCallback(preloadHome, { timeout: 4000 }) : setTimeout(preloadHome, 0));
    if (document.readyState === 'complete') setTimeout(warmHome, 2000); else addEventListener('load', () => setTimeout(warmHome, 2000), { once: true });
  }
  // after an in-place page swap the shell calls this to build the gallery on the new content
  (window.SiddhiPages = window.SiddhiPages || {}).gallery = () => { const g = $('#gallery'); if (g && !g.querySelector('.gf')) initGallery(); };
})();
