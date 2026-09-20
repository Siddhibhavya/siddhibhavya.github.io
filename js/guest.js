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
  const INK = '#0e0314';

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

  /* Thank You (and the footer under it) slides up and away while the preloaded main page slides up into place. If the visitor is on a very slow connection
     and the main page isn't ready after a moment, it falls back to sliding away alone (and the main page then rises into place when it opens).
     If the card is still being shared it waits for that (at most 4 s) so it is never lost. */
  async function goHome() {
    document.documentElement.style.overflow = 'hidden';                                                // no scrollbar flashing while it moves
    window.scrollTo(0, 0);
    const saved = Guest.finishSharing ? Guest.finishSharing() : Promise.resolve();                    // normally already done
    const layout = $('.layout'), footer = $('.footer');
    const loaded = await Promise.race([preloadHome(), new Promise((no) => setTimeout(() => no(false), reduce ? 0 : 1200))]);
    const D = Math.round(layout.offsetHeight + (footer ? footer.offsetHeight : 0));                    // the whole Thank You page: the screen plus the footer below it
    const ms = reduce ? 1 : 850, ease = 'cubic-bezier(0.55, 0, 0.35, 1)';
    const slide = (el, from, to) => el.animate([{ transform: 'translateY(' + from + 'px)' }, { transform: 'translateY(' + to + 'px)' }], { duration: ms, easing: ease, fill: 'forwards' }).finished.catch(() => {});
    const moves = [layout, footer].filter(Boolean).map((el) => slide(el, 0, -D));
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

  function renderGallery(stage, list, fresh) {
    stage.querySelectorAll('.gc').forEach((el) => el.remove());
    const GY = -221.167, PY = 46.755;                                    // the gallery page's grid: horizontal lines every 46.755px from y -221.17
    const Y0 = 234 + PY;                                                // the cards start one grid row lower, to make room for the "Create something!" button above them
    const X = [[83, 580], [77, 581]];                                   // Figma x (minus the 356px sidebar), tiny hand-placed offsets
    list.forEach((c, i) => {
      const row = Math.floor(i / 2), col = i % 2;
      const el = cardEl(c, 'gallery');
      if (fresh) el.classList.add('fresh');
      el.style.left = X[row % 2][col] + 'px';
      const top = Y0 + row * 350;
      el.style.top = top + 'px';
      const line = GY + Math.round((top + 285 - GY) / PY) * PY;         // the signature line lies on the nearest grid line; the name sits on it
      el.style.setProperty('--ly', (line - top - 0.5).toFixed(2) + 'px');
      stage.appendChild(el);
    });
    const rows = Math.ceil(list.length / 2);
    stage.closest('.stage-wrap').style.setProperty('--sh', Math.ceil(Y0 + (rows - 1) * 350 + 395) + 'px');
    if (window.SiddhiShell) window.SiddhiShell.fit();
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
      const out = document.createElement('canvas'); out.width = 642; out.height = 421;
      const o = out.getContext('2d'); o.fillStyle = '#fff'; o.fillRect(0, 0, 642, 421); o.drawImage(pad, 0, 0, 642, 421);
      const mine = { id: 'g' + Date.now(), color, name, img: out.toDataURL('image/png'), t: Date.now() };
      const past = (Guest.recent && Guest.recent.length ? Guest.recent.concat(SEEDS) : Store.everyone()).slice(0, 3);   // the previous three, read before adding ours
      Store.add(mine);
      // Share it — but not while the animation is running (shrinking the drawing takes ~80 ms of work, which could nudge a frame). It starts once
      // the strings have left and only "Thank You" is on screen (7 s in), or earlier if the visitor leaves / the page is about to go home.
      // A failure is not shown to the visitor: their own copy is already saved on this browser.
      if (Remote) {
        let sharing = null;
        const startShare = () => sharing || (sharing = Remote.add(mine).catch((err) => console.warn('[gallery] the card was not shared:', err && err.message)));
        Guest.finishSharing = () => Promise.race([startShare(), new Promise((done) => setTimeout(done, 4000))]);   // goHome() waits for this, at most 4 s
        setTimeout(startShare, 7000);
        document.addEventListener('visibilitychange', () => { if (document.hidden) startShare(); });
      }
      setTimeout(preloadHome, 7200);                                                                    // once the strings have left: get the main page ready underneath, for the slide up
      if (typeof Guest.play === 'function') Guest.play(mine, past, card); else goHome();
    });
  }

  /* ------------------------------------------------------------------ 5 · Boot */
  if ($('#gallery')) initGallery();
  if ($('#pad')) initBook();
  // after an in-place page swap the shell calls this to build the gallery on the new content
  (window.SiddhiPages = window.SiddhiPages || {}).gallery = () => { const g = $('#gallery'); if (g && !g.querySelector('.gc')) initGallery(); };
})();
