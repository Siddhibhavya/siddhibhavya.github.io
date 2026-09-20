/* About page behaviours: the skateboard clip, the movable stars / fish-bone patch / dino, and the "you can move some elements" hint.
   Each feature has its own init and its own guard, so one failing can't stop the others.
   Registered as SiddhiPages.about so the shell can re-run it after it swaps the page content in place. */
(function () {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const guard = (name, fn) => { try { fn(); } catch (err) { console.error('[about] ' + name + ' failed:', err); } };

  /* ------------------------------------------------------------------ the skateboarding clip
     Plays only while it is on screen. It has no audio track (stripped from the source file) and is muted, so autoplay is allowed everywhere. */
  function initVideo() {
    const v = document.querySelector('.about-video');
    if (!v || v.dataset.watching) return;
    v.dataset.watching = '1';
    v.muted = true;
    if (reduce) return;                                                // poster only
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { const p = v.play(); if (p && p.catch) p.catch(() => {}); } else v.pause();
    }, { threshold: 0.25 }).observe(v);
  }

  /* ------------------------------------------------------------------ movable decorations
     Pick up a star, the fish-bone patch or the dino and drop it anywhere; let go while moving and it slides on and bounces off the edges.
     Just tapping one makes it spin (stars) or wobble. Positions reset when the page is reloaded. */
  let zTop = 30;
  function initDrag() {
    document.querySelectorAll('.dc.drag').forEach((el) => {
      if (el.dataset.drag) return;
      el.dataset.drag = '1';
      const stage = el.closest('.stage');
      const cx0 = parseFloat(el.style.getPropertyValue('--cx')), cy0 = parseFloat(el.style.getPropertyValue('--cy')), base = parseFloat(el.style.getPropertyValue('--r')) || 0;
      let tx = 0, ty = 0, vx = 0, vy = 0, raf = 0, drag = null;
      const scale = () => (stage.getBoundingClientRect().width / stage.offsetWidth) || 1;
      const bounds = () => ({ x0: 24 - cx0, x1: stage.offsetWidth - 24 - cx0, y0: 24 - cy0, y1: stage.offsetHeight - 24 - cy0 });
      const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
      const put = () => { el.style.setProperty('--tx', tx.toFixed(1) + 'px'); el.style.setProperty('--ty', ty.toFixed(1) + 'px'); };
      const tilt = (deg) => el.style.setProperty('--tilt', deg.toFixed(1) + 'deg');

      const glide = () => {
        let last = performance.now();
        const step = (now) => {
          const dt = Math.min(32, now - last); last = now;
          const b = bounds();
          tx += vx * dt; ty += vy * dt;
          if (tx < b.x0) { tx = b.x0; vx = -vx * 0.55; } else if (tx > b.x1) { tx = b.x1; vx = -vx * 0.55; }
          if (ty < b.y0) { ty = b.y0; vy = -vy * 0.55; } else if (ty > b.y1) { ty = b.y1; vy = -vy * 0.55; }
          const f = Math.exp(-dt / 260); vx *= f; vy *= f; put();
          raf = Math.hypot(vx, vy) > 0.015 ? requestAnimationFrame(step) : 0;
        };
        raf = requestAnimationFrame(step);
      };

      const play = () => {                                            // a tap: stars twirl, the patches wobble
        if (reduce || !el.animate) return;
        const star = el.classList.contains('star');
        const r = (d) => ({ rotate: (base + d) + 'deg' });
        el.animate(star ? [r(0), r(360)] : [r(0), r(-14), r(12), r(-7), r(3), r(0)],
          { duration: star ? 850 : 650, easing: star ? 'cubic-bezier(0.3, 1.35, 0.5, 1)' : 'ease-in-out' });
      };

      el.addEventListener('pointerdown', (e) => {
        if (e.button > 0) return;
        cancelAnimationFrame(raf); raf = 0; vx = vy = 0;
        try { el.setPointerCapture(e.pointerId); } catch (_) { /* fine */ }
        drag = { sx: e.clientX, sy: e.clientY, tx0: tx, ty0: ty, lx: tx, ly: ty, lt: performance.now(), moved: false };
        el.style.zIndex = String(++zTop);
        el.classList.add('grabbing');
        e.preventDefault();
      });
      el.addEventListener('pointermove', (e) => {
        if (!drag) return;
        const k = scale(), b = bounds();
        if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 4) drag.moved = true;
        if (!drag.moved) return;
        tx = clamp(drag.tx0 + (e.clientX - drag.sx) / k, b.x0, b.x1);
        ty = clamp(drag.ty0 + (e.clientY - drag.sy) / k, b.y0, b.y1);
        const now = performance.now(), dt = Math.max(1, now - drag.lt);
        vx = vx * 0.5 + ((tx - drag.lx) / dt) * 0.5; vy = vy * 0.5 + ((ty - drag.ly) / dt) * 0.5;   // smoothed release velocity, px per ms
        drag.lx = tx; drag.ly = ty; drag.lt = now;
        tilt(clamp(vx * 14, -16, 16));                                   // it leans into the direction you are pulling it
        put();
      });
      const end = () => {
        if (!drag) return;
        const d = drag; drag = null;
        el.classList.remove('grabbing'); tilt(0);
        if (!d.moved) { play(); return; }
        if (performance.now() - d.lt > 90) { vx = vy = 0; return; }        // held still before letting go: no throw
        const sp = Math.hypot(vx, vy);
        if (sp > 2.6) { vx *= 2.6 / sp; vy *= 2.6 / sp; }
        if (!reduce && sp > 0.03) glide();
      };
      el.addEventListener('pointerup', end);
      el.addEventListener('pointercancel', end);
      el.addEventListener('dragstart', (e) => e.preventDefault());
    });
  }

  /* ------------------------------------------------------------------ the "you can move some elements" hint
     The first time a visitor scrolls down the page, a small pill says so (3 seconds). */
  let onScroll = null;
  function initHint() {
    if (!document.querySelector('.dc.drag')) return;
    if (onScroll) window.removeEventListener('scroll', onScroll);
    onScroll = () => {
      if (window.scrollY < 150) return;
      window.removeEventListener('scroll', onScroll); onScroll = null;
      if (!document.querySelector('.dc.drag')) return;                 // already navigated away
      const pill = document.createElement('div');
      pill.className = 'move-hint'; pill.setAttribute('role', 'status');
      pill.innerHTML = '<svg viewBox="0 0 26.43 24.6" width="18" height="17" aria-hidden="true"><path fill="currentColor" d="M13.2138 0L13.7383 2.4682C14.7637 7.29346 18.6375 10.9996 23.5034 11.8106L26.4276 12.298L22.4183 13.348C18.1231 14.473 14.8 17.8777 13.7797 22.199L13.2138 24.596L12.5773 22.0499C11.5172 17.8095 8.2352 14.4808 4.01012 13.3609L0 12.298L2.91569 11.8062C7.72009 10.9958 11.5576 7.3609 12.6271 2.60748L13.2138 0Z"/></svg><span>You can move some elements</span>';
      document.body.appendChild(pill);
      setTimeout(() => pill.classList.add('out'), 2700);               // 0.35s in, held, 0.3s out: gone after 3 seconds
      setTimeout(() => pill.remove(), 3000);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function init() {
    guard('video', initVideo);
    guard('drag', initDrag);
    guard('hint', initHint);
    guard('highlight', () => window.SiddhiHighlight && window.SiddhiHighlight.scan(document));      // the marker on "Siddhi" in the title
  }
  init();
  (window.SiddhiPages = window.SiddhiPages || {}).about = init;        // re-run after an in-place page swap
})();
