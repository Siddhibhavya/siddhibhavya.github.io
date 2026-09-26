/* NearU's independent case-study canvas, section navigation, and local media. */
(function () {
  'use strict';
  if (!document.body.classList.contains('nearu-page')) return;
  const viewport = document.querySelector('.nearu-viewport');
  const canvas = document.querySelector('.nearu-canvas');
  const sectionFor = hash => document.getElementById((innerWidth < 900 ? 'mobile-' : '') + hash.slice(1));
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
    viewport.style.height = mobile ? 'auto' : `${12687 * scale}px`;
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
    1546,1547,1548,1549,1550,1564,1583,1584,1586,1601,1602,1603,1604,1605,
    1606,1614,1617,1639,1640,1656,1657,1658,1659,1660,1661,1662,1663,
    1674,1675,1676,1677,1710,1711,1712,1713];
  const ruled = ruledIds.map(id => canvas.querySelector('[data-node-id="351:' + id + '"]'));
  ruled.forEach(el => {
    el.classList.add('nearu-ruled');
    el.style.setProperty('--ruled-line', parseFloat(getComputedStyle(el).fontSize) > 41 ? '82px' : '41px');
    if (el.classList.contains('nu-244')) el.style.top = '9084px';
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
    if (innerWidth >= 900) {
      const origin = canvas.getBoundingClientRect().top;
      ruled.forEach(el => {
        const y = (baseline(el) - origin) / scale;
        const delta = 14 + Math.round((y - 14) / 41) * 41 - y;
        el.style.top = (parseFloat(getComputedStyle(el).top) + delta) + 'px';
      });
    } else {
      const paper = document.querySelector('.nearu-mobile');
      const copies = [...paper.querySelectorAll('.nearu-mobile-copy')].filter(el => !el.closest('.nearu-mobile-card'));
      copies.forEach(el => { el.style.paddingTop = '0px'; });
      const origin = paper.getBoundingClientRect().top;
      copies.forEach(el => {
        const y = baseline(el) - origin;
        let delta = ((20 - y) % 28 + 28) % 28;
        if (delta > 27.9) delta = 0;
        el.style.paddingTop = delta + 'px';
      });
    }
  }
  document.fonts.ready.then(() => requestAnimationFrame(alignGrid));
  addEventListener('resize', () => requestAnimationFrame(() => requestAnimationFrame(alignGrid)));
  window.KOI_CONFIG = { mount: '#footer-koi', bg: [25, 5, 35], hoverOnly: true };
  if (location.hash) requestAnimationFrame(() => {
    const target = sectionFor(location.hash);
    if (target) window.scrollTo(0, target.getBoundingClientRect().top + scrollY - (innerWidth < 900 ? 70 : 25));
  });
})();
