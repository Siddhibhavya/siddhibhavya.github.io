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
  // Room for the "how it works" recording above the first Try prototype pill: everything from y=700 down moves down by whole paper rows (13 x 41px).
  const SYN_SHIFT = 533;
  canvas.querySelectorAll(':scope > *:not(.syn-rec), :scope > .syn-flow > *').forEach(el => {
    const cs = getComputedStyle(el), top = parseFloat(cs.top);
    if (cs.position === 'absolute' && top >= 700) el.style.top = (top + SYN_SHIFT) + 'px';
  });
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
    '.syn-39', '.sp-intro', '.syn-40', '.syn-41', '.syn-wf-text', '.syn-42', '.syn-43', '.syn-44', '.syn-45', '.syn-47', '.syn-flow-label',
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
  addEventListener('resize', () => requestAnimationFrame(() => requestAnimationFrame(alignGrid)));

  // data-start="N": the clip begins (and loops back to) N seconds in — skips the "create a room" intro without re-encoding the footage.
  // Media events don't bubble, so listen in the capture phase; this also covers the phone layout's cloned <video>.
  document.addEventListener('loadedmetadata', e => { const v = e.target; if (v.dataset && v.dataset.start) v.currentTime = +v.dataset.start; }, true);
  document.addEventListener('ended', e => { const v = e.target; if (v.dataset && v.dataset.start) { v.currentTime = +v.dataset.start; v.play().catch(() => {}); } }, true);

  // Play/pause the case-study videos as they enter/leave view, same pattern as js/nearu.js.
  // Native loading="lazy" misjudges distances on this scaled canvas, so images popped in late. Start loading everything
  // within ~3 screens of the viewport (and warm the rest in order, once idle) — same files, same quality, just earlier.
  const warm = img => { if (img.loading === 'lazy') img.loading = 'eager'; };
  const near = new IntersectionObserver(entries => entries.forEach(({ target, isIntersecting }) => {
    if (!isIntersecting) return;
    near.unobserve(target);
    if (target.tagName === 'VIDEO') target.preload = 'auto'; else warm(target);
  }), { rootMargin: '3000px 0px' });
  document.querySelectorAll('img[loading="lazy"], video').forEach(el => near.observe(el));
  const idleWarm = () => {
    const rest = [...document.querySelectorAll('img[loading="lazy"]')].sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
    (function next() { const img = rest.shift(); if (!img) return; warm(img); setTimeout(next, 150); })();
  };
  if (document.readyState === 'complete') idleWarm(); else addEventListener('load', idleWarm);
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


  // Feature labels on the green recording frame: show each tag while the video's own time is inside its [data-in, data-out] window.
  let tagLoop = 0;
  function tagTick() {
    let playing = false;
    document.querySelectorAll('.syn-rec').forEach(rec => {
      const v = rec.querySelector('video');
      if (!v) return;
      if (!v.paused) playing = true;
      rec.querySelectorAll('.syn-rec-tag').forEach(tag => tag.classList.toggle('on', !v.paused && v.currentTime >= +tag.dataset.in && v.currentTime < +tag.dataset.out));
    });
    tagLoop = playing ? requestAnimationFrame(tagTick) : 0;
  }
  document.addEventListener('play', e => { if (e.target.closest && e.target.closest('.syn-rec') && !tagLoop) tagLoop = requestAnimationFrame(tagTick); }, true);
  document.addEventListener('pause', e => { if (e.target.closest && e.target.closest('.syn-rec')) e.target.closest('.syn-rec').querySelectorAll('.syn-rec-tag').forEach(tag => tag.classList.remove('on')); }, true);

  window.KOI_CONFIG = { mount: '#footer-koi', bg: [25, 5, 35], hoverOnly: true };
  if (location.hash) requestAnimationFrame(() => {
    const target = sectionFor(location.hash);
    if (target) window.scrollTo(0, target.getBoundingClientRect().top + scrollY - (innerWidth < 900 ? 70 : 25));
  });
})();
