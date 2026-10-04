/* Syncletter's independent case-study canvas: scaling + section-hash scroll, matching js/nearu.js's technique.
   The sidebar (tabs, drawer, Contents scrollspy, chat, Resume pill) is the real shared one — js/shell.js owns it
   via body[data-shell="sidebar"] + body[data-toc]. This file only owns the canvas/paper scaling.
   No dedicated small-screen reflow yet (unlike NearU's js/nearu-mobile.js) — the canvas simply scales down to fit
   width on any screen, which reads small on phones; a mobile companion can follow later if that's worth building. */
(function () {
  'use strict';
  if (!document.body.classList.contains('syncletter-page')) return;
  const viewport = document.querySelector('.syncletter-viewport');
  const canvas = document.querySelector('.syn-canvas');
  if (!viewport || !canvas) return;
  // Whole paper rows moved in the canvas, thresholds in the ORIGINAL Figma y and added up per element:
  //  700: room for the "how it works" recording (the project facts chip, then the frame) above the first Try prototype pill (22 rows)
  //  6300: the wireframe slider is 15% bigger, so the user flow below moves down 2 rows
  //  1000: the facts chip moved above the frame, so Context onward closes up 4 rows
  //  1240: one more row between the Context title and its paragraph
  //  8300: the two decision cards sit above Reflection, so Reflection onward moves down 17 rows (net 14 with the earlier gap close-up)
  //  1850, 2900, 8000, 8300, 8650: shorter copy left big gaps before Solution, Research, the library note, Reflection and the last pill: each moves up 1, 1, 1, 3 and 3 rows
  //  1500: the Context copy got shorter, so the Problem Statement and everything below move back up 3 rows
  const SYN_SHIFTS = [[700, 22], [1000, -4], [1240, 1], [1500, -3], [1850, -1], [2900, -1], [8000, -1], [8300, 14], [6300, 2], [8650, -3]];
  const SYN_SHIFT = SYN_SHIFTS.reduce((n, [, rows]) => n + rows * 41, 0);
  const synMoves = [];
  canvas.querySelectorAll(':scope > *:not(.syn-rec), :scope > .syn-flow > *').forEach(el => {
    if (/(^| )syn-13[a-j]?( |$)/.test(el.className)) return;   // the facts chip is placed above the frame in css, not shifted
    const cs = getComputedStyle(el), top = parseFloat(cs.top);
    if (cs.position !== 'absolute' || isNaN(top)) return;
    const rows = SYN_SHIFTS.reduce((n, [from, r]) => n + (top >= from ? r : 0), 0);
    if (rows) synMoves.push([el, top + rows * 41]);
  });
  synMoves.forEach(([el, top]) => { el.style.top = top + 'px'; });
  canvas.style.setProperty('--flow-extra', SYN_SHIFT + 'px');
  window.synFlowExtra = SYN_SHIFT;
  const CANVAS_H = 8804; // trimmed from the Figma frame's 8244 — see css/pages/syncletter.css's .syn-canvas comment
  const CONTENT_W = 1092; // 1448 canvas width - 356 shared sidebar width
  const sectionFor = hash => document.getElementById((innerWidth < 900 ? 'mobile-' : '') + hash.slice(1));
  function fit() {
    const mobile = innerWidth < 900;
    const width = document.documentElement.clientWidth;
    const sidebarEl = document.querySelector('.sidebar');
    const sidebarWidth = mobile || !sidebarEl ? 0 : sidebarEl.getBoundingClientRect().width;
    const paperWidth = width - sidebarWidth;
    const scale = Math.min(1, paperWidth / CONTENT_W);
    const inset = (paperWidth - CONTENT_W * scale) / 2;
    canvas.style.transform = `translateX(${inset}px) scale(${scale}) translateX(-356px)`;
    viewport.style.height = `${(CANVAS_H + (window.synFlowExtra || 0)) * scale}px`;
    viewport.style.width = `${paperWidth}px`;
    viewport.style.marginLeft = '0px';
    viewport.style.setProperty('--paper-step', `${41 * scale}px`);
    viewport.style.setProperty('--paper-x', `${inset + 450 * scale}px`);
    viewport.style.setProperty('--paper-y', `${14 * scale}px`);
  }
  fit();
  window.synFit = fit;
  addEventListener('resize', fit);

  // Snap on-paper text to the grid's horizontal rules, same technique as js/nearu.js: measure each element's real
  // glyph baseline (not an estimate from font-size) and nudge its own top so that baseline lands on a rule.
  // Filled pills/cards/buttons keep their own centred typography and are excluded on purpose.
  const RULED = ['.syn-2', '.syn-3', '.syn-4', '.syn-5', '.syn-6', '.syn-7', '.syn-8', '.syn-46',
    '.syn-9', '.syn-10', '.syn-11', '.syn-18', '.syn-19', '.syn-20', '.syn-21', '.syn-22', '.syn-23', '.syn-24',
    '.syn-26', '.syn-27', '.syn-28', '.syn-29', '.syn-33', '.syn-34', '.syn-35', '.syn-36',
    '.syn-39', '.sp-intro', '.syn-40', '.syn-41', '.syn-dec-sub', '.syn-wf-text', '.syn-42', '.syn-43', '.syn-44', '.syn-45', '.syn-47', '.syn-flow-label',
    '.syn-el-1', '.syn-el-2', '.syn-el-3', '.syn-el-4', '.syn-el-5', '.syn-el-6', '.fc-b1', '.fc-b2']
    .map(sel => canvas.querySelector(sel)).filter(Boolean);
  const GRID_PHASE = 14; // matches the 14px vertical offset in css/pages/syncletter.css's background-position
  RULED.forEach(el => {
    el.classList.add('syncletter-ruled');
    el.style.setProperty('--ruled-line', parseFloat(getComputedStyle(el).fontSize) > 41 ? '82px' : '41px');
  });
  function baseline(el) {
    const line = el.matches('p,h1,h2') ? el : el.querySelector('li,p') || el;
    const probe = document.createElement('span');
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText = 'display:inline-block!important;width:0!important;height:0!important;padding:0!important;margin:0!important;vertical-align:baseline!important;line-height:0!important;font-size:0!important;';
    line.prepend(probe);
    const y = probe.getBoundingClientRect().top;
    probe.remove();
    return y;
  }
  function alignGrid() {
    const origin = canvas.getBoundingClientRect().top;
    const scale = canvas.getBoundingClientRect().width / 1448;
    RULED.forEach(el => {
      const y = (baseline(el) - origin) / scale;
      const delta = GRID_PHASE + Math.round((y - GRID_PHASE) / 41) * 41 - y;
      el.style.top = (parseFloat(getComputedStyle(el).top) + delta) + 'px';
    });
  }
  window.synAlign = alignGrid;
  document.fonts.ready.then(() => requestAnimationFrame(alignGrid));
  // fonts that start loading after the first pass (the serif headings on a cold cache) and late images shift the baselines: measure again when they land
  if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', () => requestAnimationFrame(alignGrid));
  addEventListener('load', () => { requestAnimationFrame(alignGrid); setTimeout(alignGrid, 800); });
  addEventListener('resize', () => requestAnimationFrame(() => requestAnimationFrame(alignGrid)));

  // data-start="N": the clip begins (and loops back to) N seconds in — skips the "create a room" intro without re-encoding the footage.
  // Media events don't bubble, so listen in the capture phase; this also covers the phone layout's cloned <video>.
  document.addEventListener('loadedmetadata', e => { const v = e.target; if (v.dataset && v.dataset.start) v.currentTime = +v.dataset.start; }, true);
  document.addEventListener('ended', e => { const v = e.target; if (v.dataset && v.dataset.start) { v.currentTime = +v.dataset.start; v.play().catch(() => {}); } }, true);

  // Play/pause the case-study videos as they enter/leave view, same pattern as js/nearu.js.
  // Native loading="lazy" misjudges distances on this scaled canvas, so images popped in late. Start loading everything
  // within ~3 screens of the viewport (and warm the rest in order, once idle) — same files, same quality, just earlier.
  // On a slow or data-saving connection keep the browser's own lazy loading (a narrow margin, no idle warm-up, no video pre-buffering).
  const lean = (() => { const c = navigator.connection; return !!c && (c.saveData || /(^|-)(2g|3g)$/.test(c.effectiveType || '')); })();
  const warm = img => { if (img.loading === 'lazy') img.loading = 'eager'; };
  const near = new IntersectionObserver(entries => entries.forEach(({ target, isIntersecting }) => {
    if (!isIntersecting) return;
    near.unobserve(target);
    if (target.tagName === 'VIDEO') { if (!lean) target.preload = 'auto'; } else warm(target);
  }), { rootMargin: lean ? '600px 0px' : '3000px 0px' });
  document.querySelectorAll('img[loading="lazy"], video').forEach(el => near.observe(el));
  const idleWarm = () => {
    const rest = [...document.querySelectorAll('img[loading="lazy"]')].sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
    (function next() { const img = rest.shift(); if (!img) return; warm(img); setTimeout(next, 150); })();
  };
  if (!lean) { if (document.readyState === 'complete') idleWarm(); else addEventListener('load', idleWarm); }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const videos = [...document.querySelectorAll('.syncletter-video')];
  const observer = new IntersectionObserver(entries => entries.forEach(({ target, isIntersecting }) => {
    if (isIntersecting && !reduce.matches) target.play().catch(() => {});
    else target.pause();
  }), { rootMargin: '150px' });
  videos.forEach(video => { video.muted = true; observer.observe(video); });
  reduce.addEventListener('change', () => videos.forEach(video => {
    if (reduce.matches) video.pause();
    else if (video.getBoundingClientRect().top < innerHeight && video.getBoundingClientRect().bottom > 0) video.play().catch(() => {});
  }));


  // Feature call-outs on the green recording frame: each tag shows while the video's own time is inside its [data-in, data-out] window,
  // and a leader line (SVG, drawn from the tag to the point data-fx/data-fy of the phone, as fractions of its width/height) draws in and retracts with it.
  const NS = 'http://www.w3.org/2000/svg';
  function layoutCalls(rec) {
    const video = rec.querySelector('.syn-demo'), svg = rec.querySelector('.syn-rec-lines');
    if (!video || !svg) return;
    const fr = rec.getBoundingClientRect(), s = fr.width / rec.offsetWidth || 1, vr = video.getBoundingClientRect();
    const local = (x, y) => [(x - fr.left) / s - rec.clientLeft, (y - fr.top) / s - rec.clientTop];
    rec._geo = { vx: local(vr.left, vr.top)[0], vy: local(vr.left, vr.top)[1], vw: vr.width / s, vh: vr.height / s };
    [...rec.querySelectorAll('.syn-rec-tag')].forEach((tag, i) => {
      const g = svg.children[i];
      if (!g) return;
      // layout box (offset*) ignores the slide-in translate, so there is no need to show the tag to measure it; the tag's top is its vertical centre
      const [tx, ty] = local(vr.left + (+tag.dataset.fx) * vr.width, vr.top + (+tag.dataset.fy) * vr.height);
      const ax = tag.classList.contains('syn-rec-l') ? tag.offsetLeft + tag.offsetWidth + 10 : tag.offsetLeft - 10, ay = tag.offsetTop;
      const line = g.querySelector('line');
      g._anchor = [ax, ay];
      line.setAttribute('x1', ax); line.setAttribute('y1', ay); line.setAttribute('x2', tx); line.setAttribute('y2', ty);
      g.querySelectorAll('circle').forEach(c => { c.setAttribute('cx', tx); c.setAttribute('cy', ty); });
    });
  }
  function setupCalls(rec) {
    if (rec.querySelector('.syn-rec-lines')) return;
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'syn-rec-lines'); svg.setAttribute('aria-hidden', 'true');
    rec.querySelectorAll('.syn-rec-tag').forEach(() => {
      const g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'rc');
      g.innerHTML = '<line pathLength="1" x1="0" y1="0" x2="0" y2="0"/><circle class="rc-ring" r="12"/><circle class="rc-dot" r="5"/>';
      svg.append(g);
    });
    rec.prepend(svg);
    layoutCalls(rec);
    new ResizeObserver(() => layoutCalls(rec)).observe(rec);
  }
  // Where on the phone a feature's leader points can move while the feature plays (the card slides up when the keyboard opens), so a tag may carry
  // data-kf="time:fx:fy|time:fx:fy…" keyframes (measured from the footage); the point is interpolated from the video's own clock.
  const kfCache = new WeakMap();
  function targetAt(tag, t) {
    let kf = kfCache.get(tag);
    if (!kf) { kf = tag.dataset.kf ? tag.dataset.kf.split('|').map(p => p.split(':').map(Number)) : null; kfCache.set(tag, kf || []); }
    if (!kf || !kf.length) return [+tag.dataset.fx, +tag.dataset.fy];
    if (t <= kf[0][0]) return [kf[0][1], kf[0][2]];
    for (let i = 1; i < kf.length; i++) if (t <= kf[i][0]) { const [t0, x0, y0] = kf[i - 1], [t1, x1, y1] = kf[i], k = (t - t0) / (t1 - t0 || 1); return [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k]; }
    const last = kf[kf.length - 1]; return [last[1], last[2]];
  }
  let tagLoop = 0;
  function tagTick() {
    let playing = false;
    document.querySelectorAll('.syn-rec').forEach(rec => {
      const v = rec.querySelector('.syn-demo'), svg = rec.querySelector('.syn-rec-lines');
      if (!v) return;
      if (!v.paused) playing = true;
      rec.querySelectorAll('.syn-rec-tag').forEach((tag, i) => {
        const on = !v.paused && v.currentTime >= +tag.dataset.in && v.currentTime < +tag.dataset.out;
        tag.classList.toggle('on', on);
        const g = svg && svg.children[i];
        if (!g) return;
        g.classList.toggle('on', on);
        if (on && rec._geo && g._anchor) {
          const [fx, fy] = targetAt(tag, v.currentTime), x = rec._geo.vx + fx * rec._geo.vw, y = rec._geo.vy + fy * rec._geo.vh;
          const line = g.querySelector('line'); line.setAttribute('x2', x); line.setAttribute('y2', y);
          g.querySelectorAll('circle').forEach(c => { c.setAttribute('cx', x); c.setAttribute('cy', y); });
        }
      });
    });
    tagLoop = playing ? requestAnimationFrame(tagTick) : 0;
  }
  const clearCalls = rec => { rec.querySelectorAll('.syn-rec-tag, .rc').forEach(el => el.classList.remove('on')); };
  document.addEventListener('play', e => {
    const rec = e.target.closest && e.target.closest('.syn-rec');
    if (!rec) return;
    setupCalls(rec); layoutCalls(rec);
    if (!tagLoop) tagLoop = requestAnimationFrame(tagTick);
  }, true);
  document.addEventListener('pause', e => { const rec = e.target.closest && e.target.closest('.syn-rec'); if (rec) clearCalls(rec); }, true);


  // The green frame plays the intro film first; when it ends the film fades out and the phone demo (with its call-outs) fades in and starts.
  document.addEventListener('play', e => {
    const t = e.target, rec = t.closest && t.closest('.syn-rec');
    if (!rec) return;
    if (t.classList.contains('syn-demo') && rec.classList.contains('is-intro')) { t.pause(); const film = rec.querySelector('.syn-intro-video'); if (film && film.paused && !film.ended) film.play().catch(() => {}); }
    else if (t.classList.contains('syn-intro-video') && !rec.classList.contains('is-intro')) t.pause();
  }, true);
  document.addEventListener('ended', e => {
    const t = e.target, rec = t.closest && t.closest('.syn-rec');
    if (!rec || !t.classList.contains('syn-intro-video')) return;
    rec.classList.remove('is-intro');
    const demo = rec.querySelector('.syn-demo');
    if (!demo || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = rec.getBoundingClientRect();
    if (r.bottom > 0 && r.top < innerHeight) demo.play().catch(() => {});
  }, true);

  window.KOI_CONFIG = { mount: '#footer-koi', bg: [25, 5, 35], hoverOnly: true };
  if (location.hash) requestAnimationFrame(() => {
    const target = sectionFor(location.hash);
    if (target) window.scrollTo(0, target.getBoundingClientRect().top + scrollY - (innerWidth < 900 ? 70 : 25));
  });
})();
