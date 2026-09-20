/* Guest pages: the Guest Gallery (guest-gallery.html) and the Welcome Aboard drawing page (guest-book.html).
   The "Create" choreography (strings, sliding cards, Thank You) lives in js/guest-anim.js and plugs in as SiddhiGuest.play.

   PERSISTENCE: cards are stored in this browser's localStorage. That means each visitor sees their own cards plus the four seed cards —
   it is NOT shared between visitors yet. To make it a real shared wall, swap Store.load()/Store.add() for calls to a small backend of your
   choice (same card shape: { id, color, name, img (PNG data URL), t }).

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

  /* the cream veil, then the main website (the sidebar glides back in: shell.js reads siddhi.enter) */
  function goHome() {
    const veil = document.createElement('div');
    veil.className = 'gb-veil'; document.body.appendChild(veil);
    const go = () => { try { sessionStorage.setItem('siddhi.enter', '1'); } catch (e) { /* ignore */ } location.href = ROOT + 'home.html'; };
    veil.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, easing: 'ease', fill: 'forwards' }).finished.then(go, go);
  }

  /* what js/guest-anim.js needs from this file (and it adds .play) */
  const Guest = window.SiddhiGuest = window.SiddhiGuest || {};
  Object.assign(Guest, { $, reduce, cardEl, goHome });

  /* ------------------------------------------------------------------ 3 · Gallery page */
  function initGallery() {
    const stage = $('#gallery');
    const list = Store.display();
    const GY = -221.167, PY = 46.755;                                    // the gallery page's grid: horizontal lines every 46.755px from y -221.17
    const X = [[83, 580], [77, 581]];                                   // Figma x (minus the 356px sidebar), tiny hand-placed offsets
    list.forEach((c, i) => {
      const row = Math.floor(i / 2), col = i % 2;
      const el = cardEl(c, 'gallery');
      el.style.left = X[row % 2][col] + 'px';
      const top = 234 + row * 350;
      el.style.top = top + 'px';
      const line = GY + Math.round((top + 285 - GY) / PY) * PY;         // the signature line lies on the nearest grid line; the name sits on it
      el.style.setProperty('--ly', (line - top - 0.5).toFixed(2) + 'px');
      stage.appendChild(el);
    });
    const rows = Math.ceil(list.length / 2), want = 234 + rows * 350 + 10;
    const btnTop = GY + Math.round((want - GY) / PY) * PY;               // the button sits on a grid line
    $('.gb-more').style.top = btnTop.toFixed(2) + 'px';
    stage.closest('.stage-wrap').style.setProperty('--sh', Math.ceil(btnTop + 46.76 + 32) + 'px');
    if (window.SiddhiShell) window.SiddhiShell.fit();
  }

  /* ------------------------------------------------------------------ 4 · Drawing page */
  function initBook() {
    const pad = $('#pad'), ctx = pad.getContext('2d');
    const card = $('#gbCard'), sig = $('#sig'), create = $('#create'), hint = $('#hint');
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

    // Create: save the card, then play the choreography (or, if that file is missing, just go home)
    create.addEventListener('click', () => {
      if (busy) return;
      if (!dirty) {
        hint.textContent = 'Draw something first — anything!';
        if (!reduce) card.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(7px)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(0)' }], { duration: 380, easing: 'ease-out' });
        return;
      }
      busy = true;
      const out = document.createElement('canvas'); out.width = 642; out.height = 421;
      const o = out.getContext('2d'); o.fillStyle = '#fff'; o.fillRect(0, 0, 642, 421); o.drawImage(pad, 0, 0, 642, 421);
      const mine = { id: 'g' + Date.now(), color, name: sig.value.trim().slice(0, 28), img: out.toDataURL('image/png'), t: Date.now() };
      const past = Store.everyone().slice(0, 3);                       // the previous three, read before adding ours
      Store.add(mine);
      if (typeof Guest.play === 'function') Guest.play(mine, past, card); else goHome();
    });
  }

  /* ------------------------------------------------------------------ 5 · Boot */
  if ($('#gallery')) initGallery();
  if ($('#pad')) initBook();
  // after an in-place page swap the shell calls this to build the gallery on the new content
  (window.SiddhiPages = window.SiddhiPages || {}).gallery = () => { const g = $('#gallery'); if (g && !g.querySelector('.gc')) initGallery(); };
})();
