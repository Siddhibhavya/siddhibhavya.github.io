/* NearU's independent case-study canvas, section navigation, and local media. */
(function () {
  'use strict';
  if (!document.body.classList.contains('nearu-page')) return;
  const body = document.body;
  const R = body.dataset.root || '';
  const viewport = document.querySelector('.nearu-viewport');
  const canvas = document.querySelector('.nearu-canvas');
  const sectionLinks = [...document.querySelectorAll('[data-node-id="351:1527"] a')];
  const sections = sectionLinks.map(a => document.querySelector(a.hash));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let scale = 1;
  function fit() {
    const mobile = innerWidth < 760;
    scale = Math.min(1, document.documentElement.clientWidth / (mobile ? 1020 : 1440));
    canvas.style.transform = `scale(${scale}) translateX(${mobile ? -390 : 0}px)`;
    viewport.style.height = `${13069 * scale}px`;
    viewport.style.width = `${(mobile ? 1020 : 1440) * scale}px`;
  }
  fit();
  addEventListener('resize', fit);
  // Small screens: the same star/hamburger drawer button as every other page (js/shell.js's initDrawer) — it just
  // brings out .nearu-sidebar instead of .sidebar, since this page skips the shared shell (data-shell="none").
  function initDrawer() {
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'sb-toggle'; btn.setAttribute('aria-controls', 'nearu-sidebar'); btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML =
      '<svg class="ic ic-star" viewBox="0 0 26.43 24.6" width="22" height="21" aria-hidden="true"><path fill="currentColor" d="M13.2138 0L13.7383 2.4682C14.7637 7.29346 18.6375 10.9996 23.5034 11.8106L26.4276 12.298L22.4183 13.348C18.1231 14.473 14.8 17.8777 13.7797 22.199L13.2138 24.596L12.5773 22.0499C11.5172 17.8095 8.2352 14.4808 4.01012 13.3609L0 12.298L2.91569 11.8062C7.72009 10.9958 11.5576 7.3609 12.6271 2.60748L13.2138 0Z"/></svg>' +
      '<svg class="ic ic-menu" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>' +
      '<svg class="ic ic-close" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
    const note = document.createElement('div');
    note.className = 'sb-note'; note.setAttribute('aria-hidden', 'true'); note.textContent = 'Menu · Contents';
    const scrim = document.createElement('div');
    scrim.className = 'sb-scrim';
    body.append(scrim, btn, note);
    const set = (on) => {
      body.classList.toggle('sb-open', on);
      btn.setAttribute('aria-expanded', String(on));
      btn.setAttribute('aria-label', on ? 'Close the menu' : 'Open the menu');
      if (on) note.classList.remove('on');
    };
    set(false);
    btn.addEventListener('click', () => set(!body.classList.contains('sb-open')));
    scrim.addEventListener('click', () => set(false));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && body.classList.contains('sb-open')) set(false); });
    if (!reduce.matches) {
      setInterval(() => { if (!body.classList.contains('sb-open') && !document.hidden) btn.classList.toggle('as-menu'); }, 3200);
      const remind = delay => setTimeout(() => {
        if (body.classList.contains('compact') && !body.classList.contains('sb-open') && !document.hidden) { note.classList.add('on'); setTimeout(() => note.classList.remove('on'), 2000); }
        remind(10 * 60 * 1000);
      }, delay);
      remind(600);
    }
    return set;
  }
  const setDrawer = initDrawer();

  // "Resume": the same pill every other page has, top-right (js/shell.js's mountResume)
  (function mountResume() {
    const a = document.createElement('a');
    a.className = 'resume-pill'; a.href = R + (window.SITE ? window.SITE.links.resume : 'assets/resume/resume.pdf'); a.target = '_blank'; a.rel = 'noopener';
    a.innerHTML = '<svg viewBox="0 0 16 18" width="13" height="15" aria-hidden="true"><path d="M3 1h7l4 4v11a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z M10 1v4h4 M5 9h6 M5 12h6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"/></svg><span>Resume</span>';
    body.appendChild(a);
  })();

  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', event => {
    const target = document.querySelector(a.hash);
    if (!target) return;
    event.preventDefault();
    history.pushState(null, '', a.hash);
    window.scrollTo({ top: target.getBoundingClientRect().top + scrollY - (innerWidth < 760 ? 70 : 25), behavior: reduce.matches ? 'instant' : 'smooth' });
    target.focus({ preventScroll: true });
    setDrawer(false);
  }));
  let pending = false;
  function updateSection() {
    pending = false;
    let active = 0;
    sections.forEach((section, i) => { if (section.getBoundingClientRect().top < innerHeight * .35) active = i; });
    sectionLinks.forEach((a, i) => {
      if (i === active) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });
    document.querySelector('.nearu-nav-pill').style.top = `${219 + sectionLinks[active].offsetTop}px`;
    const footerTop = document.querySelector('[data-node-id="351:1694"]').getBoundingClientRect().top;
    document.querySelector('.nearu-sidebar').style.translate = `0 ${Math.min(0, footerTop - innerHeight)}px`;
  }
  addEventListener('scroll', () => { if (!pending) { pending = true; requestAnimationFrame(updateSection); } }, { passive: true });
  updateSection();
  const videos = [...document.querySelectorAll('video')];
  const observer = new IntersectionObserver(entries => entries.forEach(({ target, isIntersecting }) => {
    if (isIntersecting && !reduce.matches) target.play().catch(() => {});
    else target.pause();
  }), { rootMargin: '150px' });
  videos.forEach(video => { video.muted = true; observer.observe(video); });
  reduce.addEventListener('change', () => videos.forEach(video => {
    if (reduce.matches) video.pause();
    else if (video.getBoundingClientRect().top < innerHeight && video.getBoundingClientRect().bottom > 0) video.play().catch(() => {});
  }));
  document.querySelector('[data-node-id="351:1705"]').addEventListener('click', () => {
    try { sessionStorage.setItem('siddhi.tab', 'lm'); } catch (_) { /* private browsing */ }
  });
  if (location.hash) requestAnimationFrame(() => document.querySelector(location.hash)?.scrollIntoView());
})();
