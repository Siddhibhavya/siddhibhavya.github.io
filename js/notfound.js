/* 404 page (404.html): three stars orbit the ring, exactly like the landing page (js/landing.js) — each one is snapped onto the ring line and slides round it,
   one revolution every 46 seconds. The other two stars stay where they are and just twinkle (css/pages/notfound.css).
   Everything is in the page's own units (the box that css/pages/notfound.css lays out: 1 unit = 1em), so it scales with the window.
   The night sky behind it is the same little geometric stars as the koi background (js/koi.js, "GEOMETRIC STARS"), drawn once and left still.
   With "reduce motion" switched on the stars simply sit where the design puts them. */
(function () {
  'use strict';

  /* ---- the sky: one faint four-pointed sparkle per 60px cell, each with its own size, turn and brightness (same numbers as koi.js), drawn once ---- */
  const sky = document.createElement('canvas');
  sky.className = 'nf-sky'; sky.setAttribute('aria-hidden', 'true');
  document.body.prepend(sky);
  const CELL = 60, R = 150, rnd = (a, b) => a + Math.random() * (b - a);
  const paintSky = () => {
    const w = window.innerWidth, h = window.innerHeight, dpr = window.devicePixelRatio || 1;
    sky.width = Math.round(w * dpr); sky.height = Math.round(h * dpr);
    const g = sky.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.lineCap = 'butt';
    for (let ci = 0; ci < Math.ceil(w / CELL); ci++) {
      for (let ri = 0; ri < Math.ceil(h / CELL); ri++) {
        const size = rnd(0.014, 0.032), tw = Math.random(), op = (55 + (105 - 55) * tw) / 255;   // brightness is a random moment of the twinkle
        g.save();
        g.translate((ci + rnd(0.1, 0.9)) * CELL, (ri + rnd(0.1, 0.9)) * CELL); g.rotate(rnd(0, 2 * Math.PI)); { const k = size * (0.88 + 0.24 * tw); g.scale(k, k); }
        g.strokeStyle = `rgba(255,255,255,${op.toFixed(3)})`; g.lineWidth = 20;
        g.beginPath();
        g.moveTo(0, -R); g.lineTo(0, R); g.moveTo(-R, 0); g.lineTo(R, 0);
        for (let k = 0; k < R; k += 30) {
          g.moveTo(R - k, 0); g.lineTo(0, -k); g.moveTo(R - k, 0); g.lineTo(0, k);
          g.moveTo(-R + k, 0); g.lineTo(0, -k); g.moveTo(-R + k, 0); g.lineTo(0, k);
        }
        g.stroke(); g.restore();
      }
    }
  };
  paintSky();
  let sized = 0;
  window.addEventListener('resize', () => { clearTimeout(sized); sized = setTimeout(paintSky, 150); });   // repainted (still, not animated) when the window changes size
  const stage = document.querySelector('.nf-stage');
  if (!stage) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // the ring: the Figma ellipse (centre 698.65, 522.42, turned -20.59°), minus the top-left of the page's box (250, 200)
  const PIVOT = { x: 698.65 - 250, y: 522.42 - 200 };
  const ROT = (-20.59 * Math.PI) / 180, C = Math.cos(ROT), S = Math.sin(ROT);
  const EL = { cx: -0.798, cy: -0.187, a: 385.70, b: 133.80 };          // the ellipse in the ring's own (unturned) space, relative to PIVOT
  const PERIOD = 46;                                                    // seconds per revolution

  const toLocal = (g) => { const dx = g.x - PIVOT.x, dy = g.y - PIVOT.y; return { x: dx * C + dy * S, y: -dx * S + dy * C }; };
  const toGlobal = (l) => ({ x: PIVOT.x + l.x * C - l.y * S, y: PIVOT.y + l.x * S + l.y * C });
  const onRing = (t) => toGlobal({ x: EL.cx + EL.a * Math.cos(t), y: EL.cy + EL.b * Math.sin(t) });

  const stars = [...stage.querySelectorAll('.nf-star[data-orbit]')].map((el) => {
    const num = (n) => parseFloat(el.style.getPropertyValue(n));
    const design = { x: num('--cx'), y: num('--cy') }, l = toLocal(design);
    // where the Figma star sits decides where on the ring it starts
    return { el, design, rot: el.style.getPropertyValue('--r'), t0: Math.atan2((l.y - EL.cy) / EL.b, (l.x - EL.cx) / EL.a) };
  });

  const place = (time) => {
    for (const s of stars) {
      const p = onRing(s.t0 + ((2 * Math.PI) / PERIOD) * time);
      s.el.style.transform = `translate(${(p.x - s.design.x).toFixed(2)}em, ${(p.y - s.design.y).toFixed(2)}em) rotate(${s.rot})`;
    }
  };

  place(0);
  if (reduce) return;
  let start = null, raf = 0;
  const loop = (now) => { if (start === null) start = now; place((now - start) / 1000); raf = requestAnimationFrame(loop); };
  const run = () => { if (!raf) raf = requestAnimationFrame(loop); };
  document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else run(); });
  run();
})();
