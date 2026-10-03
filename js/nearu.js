/* NearU's independent case-study canvas, section navigation, and local media. */
(function () {
  'use strict';
  if (!document.body.classList.contains('nearu-page')) return;
  const viewport = document.querySelector('.nearu-viewport');
  const canvas = document.querySelector('.nearu-canvas');
  const sectionFor = hash => document.getElementById((innerWidth < 900 ? 'mobile-' : '') + hash.slice(1));
  // Rows pushed into the canvas for content that grew (whole 41px paper rows): [fromY, rows, class that must not move].
  // Ideation videos are 15% bigger: everything from y=3460 down moves 4 rows (the enlarged art itself is placed in nearu.css).
  const SHIFTS = [[3460, 4, 'nu-94']];
  const SHIFT_TOTAL = SHIFTS.reduce((n, [, rows]) => n + rows * 41, 0);
  canvas.style.setProperty('height', (14409 + SHIFT_TOTAL) + 'px', 'important');
  const inCanvasSpace = el => { const p = el.parentElement; return p === canvas || (p && (p.classList.contains('nu-4') || (getComputedStyle(p).display === 'contents' && inCanvasSpace(p)))); };
  SHIFTS.forEach(([from, rows, except]) => canvas.querySelectorAll('*').forEach(el => {
    if (el.classList.contains(except) || !inCanvasSpace(el)) return;
    const cs = getComputedStyle(el), top = parseFloat(cs.top);
    if (cs.position === 'absolute' && top >= from) el.style.top = (top + rows * 41) + 'px';
  }));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let scale = 1;
  function fit() {
    const mobile = innerWidth < 900;
    const width = document.documentElement.clientWidth;
    const sidebarWidth = mobile ? 0 : document.querySelector('.sidebar').getBoundingClientRect().width;
    const paperWidth = width - sidebarWidth;
    scale = Math.min(1, paperWidth / 1084);
    const inset = (paperWidth - 1084 * scale) / 2;
    canvas.style.transform = `translateX(${inset}px) scale(${scale}) translateX(-356px)`;
    viewport.style.height = mobile ? 'auto' : `${(14409 + SHIFT_TOTAL) * scale}px`;
    viewport.style.width = mobile ? '100%' : `${paperWidth}px`;
    // The sidebar now occupies its own column, like the shared Index/M.I.K.U shell.
    viewport.style.marginLeft = '0px';
    viewport.style.setProperty('--paper-step', `${41 * scale}px`);
    viewport.style.setProperty('--paper-x', `${inset + 65 * scale}px`);
    viewport.style.setProperty('--paper-y', `${14 * scale}px`);
  }
  fit();
  addEventListener('resize', fit);
  // The sidebar (tabs, gooey switch, drawer, Contents scrollspy, chat, Resume pill) is now the real shared one —
  // js/shell.js mounts and runs all of that (body[data-shell="sidebar"], body[data-toc]). This file only owns the
  // canvas/paper scaling and the page's own media.
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
  const videos = [...document.querySelectorAll('video')];
  const observer = new IntersectionObserver(entries => entries.forEach(({ target, isIntersecting }) => {
    if (isIntersecting && !reduce.matches) target.play().catch(() => {});
    else target.pause();
  }), { rootMargin: '150px' });
  videos.forEach(video => { video.muted = true; observer.observe(video); });
  // Reuse the site's M.I.K.U speech-bubble asset; reveal with the portrait, then away on its own after 30s.
  let kabirTimer = 0;
  const greetings = new IntersectionObserver(entries => {
    entries.forEach(({ target, isIntersecting }) => {
      const bubble = target.querySelector('.kabir-greeting');
      clearTimeout(kabirTimer);
      if (isIntersecting) {
        bubble.classList.add('is-visible');
        kabirTimer = setTimeout(() => bubble.classList.remove('is-visible'), 30000);
      } else {
        bubble.classList.remove('is-visible');
      }
    });
  }, { threshold: .25 });
  document.querySelectorAll('.nu-129:has(.kabir-greeting)').forEach(portrait => greetings.observe(portrait));
  reduce.addEventListener('change', () => videos.forEach(video => {
    if (reduce.matches) video.pause();
    else if (video.getBoundingClientRect().top < innerHeight && video.getBoundingClientRect().bottom > 0) video.play().catch(() => {});
  }));
  // Measure the real font baseline, rather than estimating it from font size.
  // Filled cards/pills have their own centred typography; all writing on paper
  // follows the same continuous rows, including titles and image captions.
  const ruledIds = [1535,1536,1537,1538,1539,1540,1541,1542,1543,1544,1545,
    1546,1547,1549,1550,1564,1583,1584,1586,1601,1602,1603,1604,1605,
    1614,9004,9006,9010,9012,9013,9014,9015,9016,1617,1639,1640,1656,1657,1658,1659,1660,1661,1662,1663,
    1674,1675,1676,1677,1710,1711,1712,1713,9002,9003];
  const ruled = ruledIds.map(id => canvas.querySelector('[data-node-id="351:' + id + '"]'));
  ruled.forEach(el => {
    el.classList.add('nearu-ruled');
    el.style.setProperty('--ruled-line', parseFloat(getComputedStyle(el).fontSize) > 41 ? '82px' : '41px');
    if (el.classList.contains('nu-244')) el.style.top = (9822 + SHIFT_TOTAL) + 'px';
  });
  function baseline(el) {
    const line = el.matches('p,h1,h2') ? el : el.querySelector('li,p,.rs-title') || el;
    const probe = document.createElement('span');
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText = 'display:inline-block!important;width:0!important;height:0!important;padding:0!important;margin:0!important;vertical-align:baseline!important;line-height:0!important;font-size:0!important;';
    line.prepend(probe);
    const y = probe.getBoundingClientRect().top;
    probe.remove();
    return y;
  }
  function alignGrid() {
    if (innerWidth >= 900) {
      const origin = canvas.getBoundingClientRect().top;
      ruled.forEach(el => {
        const y = (baseline(el) - origin) / scale;
        const delta = 14 + Math.round((y - 14) / 41) * 41 - y;
        el.style.top = (parseFloat(getComputedStyle(el).top) + delta) + 'px';
      });
    } else {
      const paper = document.querySelector('.nearu-mobile');
      // One top-to-bottom pass over every line of text on the paper (labels, headings, captions, insight rows, before/after lists,
      // the Reflection list…): each block's first baseline is pushed onto the next 28px rule, and later blocks are measured after
      // earlier ones have moved. Filled cards, pills, buttons and SVG keep their own typography.
      paper.querySelectorAll('[data-gp]').forEach(el => { el.style.paddingTop = el.dataset.gp; if (el.dataset.gt) { el.style.removeProperty('top'); el.style.removeProperty('position'); delete el.dataset.gt; } });
      paper.querySelectorAll('.nearu-mobile-copy').forEach(el => { if (!el.closest('.nearu-mobile-card')) el.style.paddingTop = '0px'; });
      const refl = paper.querySelector('.nearu-mobile-refl');
      if (refl) refl.style.paddingTop = '0px';
      const exempt = el => {
        for (let n = el; n && n !== paper; n = n.parentElement) {
          if (n.matches('svg,button,a.pill,.nearu-mobile-card,.nearu-mobile-facts,.nearu-mobile-refl,figure,video,.nu-39,.nu-40,.nu-41,.nu-42,.nu-43,.nu-44,.nu-45,.nu-46,.nu-47,.nu-48,.nu-49,.nu-50,.nu-51,.nu-52,.nu-53,.nu-54')) return true; // last group = the details box, which has its own typography
          if (n.classList.contains('nearu-mobile-copy')) continue;
          const bg = getComputedStyle(n).backgroundColor;
          if (bg && bg !== 'transparent' && !/rgba\(\d+, \d+, \d+, 0\)/.test(bg)) return true;
        }
        return false;
      };
      const walker = document.createTreeWalker(paper, NodeFilter.SHOW_TEXT);
      const runs = [];
      while (walker.nextNode()) if (walker.currentNode.textContent.trim().length > 1) runs.push(walker.currentNode);
      const measure = node => {
        const probe = document.createElement('span');
        probe.style.cssText = 'display:inline-block;width:0;height:0;padding:0;margin:0;line-height:0;font-size:0;vertical-align:baseline;';
        node.parentNode.insertBefore(probe, node);
        const y = probe.getBoundingClientRect().top - paper.getBoundingClientRect().top; // live paper top: scroll anchoring moves the page while we edit
        probe.remove();
        return y;
      };
      const need = y => ((20 - y) % 28 + 28) % 28;
      const push = (block, node) => {
        const y = measure(node);
        const delta = need(y);
        if (delta > 27.6 || delta < 0.4) return false;
        if (block.dataset.gp === undefined) block.dataset.gp = block.style.paddingTop;
        const stage = block.closest('.nearu-mobile-art-stage');
        const sc = stage ? (new DOMMatrix(getComputedStyle(stage).transform).a || 1) : 1; // blocks inside a scaled plate move by delta/scale canvas px
        const before = parseFloat(getComputedStyle(block).paddingTop);
        block.style.paddingTop = (before + delta / sc) + 'px';
        const left = need(measure(node));
        if (left > 0.6 && left < 27.4) {
          // Padding did not move this text (fixed-height / centred box): undo it and nudge the block itself instead.
          block.style.paddingTop = block.dataset.gp;
          if (getComputedStyle(block).position === 'static') block.style.setProperty('position', 'relative', 'important');
          block.style.setProperty('top', (parseFloat(getComputedStyle(block).top) || 0) + need(measure(node)) / sc + 'px', 'important');
          block.dataset.gt = '1';
        }
        return true;
      };
      // Repeat until nothing moves: a later shift can push an earlier line off its rule.
      for (let pass = 0; pass < 6; pass++) {
        let moved = 0;
        const seenBlocks = new Set();
        runs.forEach(node => {
        const inRefl = refl && refl.contains(node);
        let block = inRefl ? refl : node.parentElement;
        if (!inRefl) while (block && block !== paper && getComputedStyle(block).display === 'inline') block = block.parentElement;
        if (!block || block === paper || seenBlocks.has(block)) return;
        if (!inRefl && exempt(block)) return;
        if (inRefl && node.parentElement !== refl.querySelector('.rs-title')) return;
        seenBlocks.add(block);
        if (push(block, node)) moved++;
        });
        if (!moved) break;
      }
    }
  }
  document.fonts.ready.then(() => requestAnimationFrame(alignGrid));
  // Images/SVG art settle after the first pass and shift the text below them: measure again once the page has loaded.
  addEventListener('load', () => { requestAnimationFrame(alignGrid); setTimeout(alignGrid, 800); });
  addEventListener('resize', () => requestAnimationFrame(() => requestAnimationFrame(alignGrid)));
  // The phone art re-scales (js/nearu-mobile.js) after our pass and moves everything below it: re-align whenever the paper's height changes.
  (function watchPaper() {
    const paper = document.querySelector('.nearu-mobile');
    if (!paper) return setTimeout(watchPaper, 300);
    let busy = false;
    new ResizeObserver(() => {
      if (busy || innerWidth >= 900) return;
      busy = true;
      requestAnimationFrame(() => { alignGrid(); requestAnimationFrame(() => { busy = false; }); });
    }).observe(paper);
  })();
  window.KOI_CONFIG = { mount: '#footer-koi', bg: [25, 5, 35], hoverOnly: true };
  if (location.hash) requestAnimationFrame(() => {
    const target = sectionFor(location.hash);
    if (target) window.scrollTo(0, target.getBoundingClientRect().top + scrollY - (innerWidth < 900 ? 70 : 25));
  });
})();
