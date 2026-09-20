/* Landing: fit the 1440×1024 design to the window, and let three stars orbit SIDDHI along the drawn ring.
   Ring geometry (Figma "Ellipse 1"): element box centred at PIVOT, rotated ROT.
   The ellipse below was measured from the exported outline (centre-line fit, max error 1.1px). */
(function () {
  'use strict';
  const stage = document.querySelector('.intro-stage');
  if (!stage) return;

  /* ---- fit to window (contain) ------------------------------------------------ */
  const root = document.documentElement;
  function fit() {
    const s = Math.min(window.innerWidth / 1440, window.innerHeight / 1024);
    root.style.setProperty('--intro-s', Math.min(1.5, Math.max(0.35, s)).toFixed(4));
  }
  fit();
  window.addEventListener('resize', fit);

  /* ---- leaving: pressing a button sends the whole landing straight up off the screen (css: stage-out), then the next page opens.
     "Be my Guest" also plays the welcome tune, and the two go hand in hand: they start together on the press, the tune fades out over its last
     moments, and the next page opens as both end (GUEST_MS). Skip Intro has no tune and leaves quicker (QUICK_MS).
     Browsers only allow sound after a click, which is why it starts on the press and not when the page opens. ---- */
  const GUEST_MS = 2200;                                              // rise + tune together (the tune's loud part is its first ~2s, then a long tail)
  const QUICK_MS = 950;                                               // the exit without the tune (also the fallback if the browser blocks sound)
  const TUNE_VOLUME = 0.7, TUNE_FADE_MS = 550;
  const koiEl = document.getElementById('koi');
  const tune = new Audio('assets/audio/welcome-tune.mp3');            // loaded now so it starts the instant the button is pressed
  tune.preload = 'auto'; tune.volume = TUNE_VOLUME;
  let leaving = false;

  function fadeTune() {                                               // ease the sound out over the last moments so it ends with the rise
    const t0 = performance.now();
    const step = (now) => { const k = Math.min(1, (now - t0) / TUNE_FADE_MS); tune.volume = TUNE_VOLUME * (1 - k); if (k < 1) requestAnimationFrame(step); else tune.pause(); };
    requestAnimationFrame(step);
  }
  function leave(href, ms, withTune) {
    stage.style.setProperty('--leave-ms', ms + 'ms');
    stage.classList.add('leaving');
    if (koiEl) koiEl.classList.add('fade');
    if (withTune) setTimeout(fadeTune, ms - TUNE_FADE_MS);
    setTimeout(() => { location.href = href; }, ms);
  }

  stage.querySelectorAll('a.btn').forEach((a) => a.addEventListener('click', (e) => {
    if (e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (leaving) return;
    leaving = true;
    const href = a.getAttribute('href');
    try { if (/home\.html$/.test(href)) sessionStorage.setItem('siddhi.enter', '1'); } catch (err) { /* ignore */ }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { location.href = href; return; }
    if (!/guest-book\.html$/.test(href)) { leave(href, QUICK_MS, false); return; }
    const started = tune.play();                                      // the rise starts the moment the sound does, so they stay together
    if (started && started.then) started.then(() => leave(href, GUEST_MS, true), () => leave(href, QUICK_MS, false)); else leave(href, GUEST_MS, true);
  }));
  window.addEventListener('pageshow', (e) => {                        // back button from the next page: the landing is whole again
    if (!e.persisted) return;
    leaving = false; stage.classList.remove('leaving'); if (koiEl) koiEl.classList.remove('fade');
    tune.pause(); tune.currentTime = 0; tune.volume = TUNE_VOLUME;
  });

  /* ---- orbit ------------------------------------------------------------------ */
  const PIVOT = { x: 698.65, y: 522.42 };
  const ROT = (-20.59 * Math.PI) / 180;
  const C = Math.cos(ROT), S = Math.sin(ROT);
  // ring-local (unrotated) ellipse, relative to PIVOT
  const EL = { cx: -0.798, cy: -0.187, a: 385.70, b: 133.80 };
  const PERIOD = 46; // seconds per revolution
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const toLocal = (g) => {
    const dx = g.x - PIVOT.x, dy = g.y - PIVOT.y;
    return { x: dx * C + dy * S, y: -dx * S + dy * C };
  };
  const toGlobal = (l) => ({ x: PIVOT.x + l.x * C - l.y * S, y: PIVOT.y + l.x * S + l.y * C });
  const onRing = (t) => toGlobal({ x: EL.cx + EL.a * Math.cos(t), y: EL.cy + EL.b * Math.sin(t) });

  const stars = [...stage.querySelectorAll('.star[data-orbit]')].map((el) => {
    const num = (n) => parseFloat(el.style.getPropertyValue(n));
    const design = { x: num('--cx'), y: num('--cy') };
    const l = toLocal(design);
    // phase = where the Figma star sits; it is then snapped onto the ring line itself
    return { el, design, rot: el.style.getPropertyValue('--rot'), t0: Math.atan2((l.y - EL.cy) / EL.b, (l.x - EL.cx) / EL.a) };
  });

  function place(time) {
    for (const s of stars) {
      const p = onRing(s.t0 + ((2 * Math.PI) / PERIOD) * time);
      s.el.style.transform = `translate(${(p.x - s.design.x).toFixed(2)}px, ${(p.y - s.design.y).toFixed(2)}px) rotate(${s.rot})`;
    }
  }

  /* ---- the host line ("I am your host..."): move the pointer over it and the letters scatter away, then spring back ---- */
  (function scatter() {
    const line = stage.querySelector('.thisis');
    if (!line || reduce || !window.matchMedia('(hover: hover)').matches) return;
    const text = line.textContent;
    line.setAttribute('aria-label', text);
    line.textContent = '';
    const L = [...text].map((c) => {
      const el = document.createElement('span');
      el.className = 'ch'; el.setAttribute('aria-hidden', 'true'); el.textContent = c;
      line.appendChild(el);
      return { el, x: 0, y: 0, vx: 0, vy: 0, r: 0 };
    });
    const RADIUS = 120, PUSH = 2.3, SPRING = 0.07, DAMP = 0.84;          // radius in stage px
    let px = -1e4, py = -1e4, raf = 0;
    const tick = () => {
      const box = stage.getBoundingClientRect(), k = box.width / stage.offsetWidth || 1;
      let busy = false;
      for (const l of L) {
        const r = l.el.getBoundingClientRect();
        const cx = r.left + r.width / 2 - l.x * k, cy = r.top + r.height / 2 - l.y * k;      // where the letter rests, in screen px
        const dx = cx - px, dy = cy - py, d = Math.hypot(dx, dy) || 1, reach = RADIUS * k;
        if (d < reach) {
          const f = Math.pow(1 - d / reach, 2) * PUSH;
          l.vx += (dx / d) * f + (Math.random() - 0.5) * f * 0.6;
          l.vy += (dy / d) * f + (Math.random() - 0.5) * f * 0.6;
        }
        l.vx += -l.x * SPRING; l.vy += -l.y * SPRING;
        l.vx *= DAMP; l.vy *= DAMP;
        l.x += l.vx; l.y += l.vy;
        l.r = l.vx * 9;                                                  // leans the way it is flying
        l.el.style.transform = `translate(${l.x.toFixed(2)}px, ${l.y.toFixed(2)}px) rotate(${l.r.toFixed(1)}deg)`;
        if (Math.abs(l.x) + Math.abs(l.y) + Math.abs(l.vx) + Math.abs(l.vy) > 0.05) busy = true;
      }
      raf = busy ? requestAnimationFrame(tick) : 0;
      if (!busy) L.forEach((l) => { l.x = l.y = l.vx = l.vy = 0; l.el.style.transform = ''; });
    };
    const wake = () => { if (!raf) raf = requestAnimationFrame(tick); };
    document.addEventListener('pointermove', (e) => {
      px = e.clientX; py = e.clientY;
      const b = line.getBoundingClientRect(), k = stage.getBoundingClientRect().width / stage.offsetWidth || 1, m = RADIUS * k;
      if (px > b.left - m && px < b.right + m && py > b.top - m && py < b.bottom + m) wake();
    }, { passive: true });
    document.addEventListener('pointerleave', () => { px = py = -1e4; });
  })();

  place(0);
  if (reduce) return;

  let start = null, raf = 0;
  const loop = (now) => { if (start === null) start = now; place((now - start) / 1000); raf = requestAnimationFrame(loop); };
  const run = () => { if (!raf) raf = requestAnimationFrame(loop); };
  const halt = () => { cancelAnimationFrame(raf); raf = 0; };
  document.addEventListener('visibilitychange', () => (document.hidden ? halt() : run()));
  run();
  window.__orbit = { stars, place, onRing };   // handy for verifying in the console
})();
