/* Shared shell: builds the sidebar (Index / M.I.K.U) and footer, scales the design to the window, and runs the small-screen drawer,
   the in-place page navigation, the email pop-up and the "View case study" cursor.
   Pages opt in with <body data-page="…" data-root="…">. data-shell="none" skips it (landing). Needs js/config.js (window.SITE) first.

   Contents: 1 Helpers · 2 Scaling · 3 Markup · 4 Gooey tab switch · 5 Chat UI · 6 Page navigation · 7 Widgets · 8 Boot
   Each feature in Boot runs inside guard(), so an error in one (say the chat) can never stop the sidebar, footer or navigation from appearing. */
(function () {
  'use strict';
  const SITE = window.SITE;
  if (!SITE) { console.error('[shell] js/config.js must load before js/shell.js'); return; }
  const body = document.body;
  const root = document.documentElement;
  const R = body.dataset.root || '';
  const page = body.dataset.page || '';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------ 1 · Helpers */
  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* private mode */ } },
    del(k) { try { sessionStorage.removeItem(k); } catch (e) { /* private mode */ } }
  };
  const guard = (name, fn) => { try { return fn(); } catch (err) { console.error('[shell] ' + name + ' failed:', err); return null; } };

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pretty = (h) => h.replace(/\.html(?=$|[?#])/, '');                 // links are written without .html (GitHub Pages serves /about as about.html)
  const hrefOf = (item) => (item.href ? R + pretty(item.href) : '#lm');
  const lk = (u) => (/^(https?:|mailto:|#)/.test(u) ? u : R + u);
  const links = () => Object.fromEntries(Object.entries(SITE.links).map(([k, v]) => [k, lk(v)]));   // SITE.links with paths made relative to this page

  /* ------------------------------------------------------------------ 2 · Scaling */
  const COMPACT_W = 900, COMPACT_H = 830;
  const QUESTS_MIN = 0.62;                                              // Side Quests on a phone: the smallest the artwork is drawn (1 = the full 1092px design)
  const ONE_COL_W = 760;                                                // narrower than this, the Home cards stack in ONE column (css/pages/work.css, "4b") and Welcome Aboard gets its phone layout (css/pages/guest.css)
  function fit() {
    const vw = root.clientWidth, vh = window.innerHeight;
    // Everything is drawn on a 1448-wide design. On smaller windows it shrinks proportionally (never grows),
    // so type sizes and the distances between things keep the same ratios.
    const u = Math.min(1, vw / 1448);
    const compact = vw < COMPACT_W;                                       // small screens: no side column — a star "Index" button brings the card out
    body.classList.toggle('compact', compact);
    body.classList.toggle('one-col', vw < ONE_COL_W && !!document.querySelector('.home-wrap'));   // read first: they change the stage's size below
    body.classList.toggle('book-phone', vw < ONE_COL_W && body.dataset.fit === 'screen');
    if (!compact && body.classList.contains('sb-open')) body.classList.remove('sb-open');
    // compact: the card is a shorter design (760 tall: small avatar, no bio) and is sized to the window, leaving room for the close star
    const sb = compact ? Math.max(0.5, Math.min(1, (vw - (vw < 560 ? 64 : 100)) / 356, vh / COMPACT_H)) : Math.max(0.3, Math.min(u, vh / 1024));
    root.style.setProperty('--sb-s', sb.toFixed(4));
    root.style.setProperty('--sb-h', (compact ? COMPACT_H : Math.max(1024, vh / sb)).toFixed(1) + 'px');
    root.style.setProperty('--fs', Math.max(0.3, u).toFixed(4));
    const main = document.querySelector('.main');
    if (main) {
      const stageEl = main.querySelector('.stage');
      const sw = (stageEl && stageEl.offsetWidth) || 1092;   // the design width of this page's stage (1092 normally, 1448 for Welcome Aboard, 480 for the one-column Home, 720 for Welcome Aboard on a phone)
      let ss = Math.min(1, main.clientWidth / sw);
      if (compact && body.dataset.page === 'quests' && stageEl) {
        // The artwork is never shrunk below QUESTS_MIN on a phone: it is bigger than the screen instead, so you scroll down a little and swipe sideways
        // (css/pages/quests.css lets the page pan). It also fills the available height when that is larger.
        const footerHeight = document.querySelector('.footer')?.offsetHeight || 0;
        const topGap = parseFloat(getComputedStyle(main).paddingTop) || 0;
        ss = Math.min(1, Math.max(ss, QUESTS_MIN, (vh - footerHeight - topGap) / stageEl.offsetHeight));
      }
      if (body.dataset.fit === 'screen') ss = Math.min(ss, vh / ((stageEl && stageEl.offsetHeight) || 1024));   // welcome-aboard pages fit one full screen
      root.style.setProperty('--stage-s', ss.toFixed(4));
      root.style.setProperty('--stage-m', Math.max(0, (main.clientWidth - sw * ss) / 2).toFixed(1) + 'px');   // where the stage starts inside the main column (it is centred when the window is wider than the design)
      scatterHome(main, stageEl, ss);
    }
  }

  // Sample the open background, choosing the most widely separated position each time.
  function scatterHome(main, stage, scale) {
    if (!stage || !main.querySelector('.home-wrap')) return;
    const width = main.clientWidth, height = main.clientHeight;
    const signature = `${width}:${height}:${scale}`;
    if (main.dataset.doodleSize === signature && main.querySelector('.home-doodles')) return;
    main.dataset.doodleSize = signature;
    stage.querySelectorAll('.eye').forEach((el) => el.remove());
    main.querySelector('.home-doodles')?.remove();
    const layer = document.createElement('div');
    layer.className = 'home-doodles';
    layer.setAttribute('aria-hidden', 'true');
    const size = Math.max(0.6, scale), radius = 65 * size;
    const gap = 180 * size, colorGap = gap * 2.1;
    const margin = (width - stage.offsetWidth * scale) / 2;
    const top = stage.parentElement.offsetTop;
    const cards = [...stage.querySelectorAll('.card')].map((el) => ({
      left: margin + el.offsetLeft * scale,
      top: top + el.offsetTop * scale,
      right: margin + (el.offsetLeft + el.offsetWidth) * scale,
      bottom: top + (el.offsetTop + 437) * scale
    }));
    const palette = ['#ff9a00', '#bb3739', '#033530', '#2c2696'];
    const placed = [];
    const count = Math.min(32, Math.max(5, Math.round(width * height / 110000)));
    for (let i = 0; i < count; i++) {
      let best = null, bestDistance = -1;
      for (let attempt = 0; attempt < 350; attempt++) {
        const x = radius + Math.random() * Math.max(0, width - radius * 2);
        const y = radius + Math.random() * Math.max(0, height - radius * 2);
        // Let doodles peek from card edges, but never bury their centers under a card.
        if (cards.some((r) => x > r.left && x < r.right && y > r.top && y < r.bottom)) continue;
        const distance = Math.min(...placed.map((p) => Math.hypot(x - p.x, y - p.y)));
        if (distance < gap || distance <= bestDistance) continue;
        const colors = palette.filter((color) => placed.every((p) => p.color !== color || Math.hypot(x - p.x, y - p.y) >= colorGap));
        if (!colors.length) continue;
        best = { x, y, color: colors[Math.floor(Math.random() * colors.length)] };
        bestDistance = distance;
      }
      if (!best) break; // Preserve spacing when the background has no more room.
      placed.push(best);
      const eye = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      eye.setAttribute('viewBox', '0 0 123.952 62.0001');
      eye.innerHTML = '<use href="#eye-star"/>';
      eye.style.cssText = `left:${best.x}px;top:${best.y}px;width:${124 * size}px;height:${62 * size}px;color:${best.color};rotate:${Math.random() * 100 - 50}deg`;
      layer.appendChild(eye);
    }
    main.prepend(layer);
  }

  /* ------------------------------------------------------------------ 3 · Markup */
  function sidebarHTML() {
    const items = SITE.nav.map((n) => {
      const active = n.id === page ? ' is-active' : '';
      const extra = n.action === 'lm' ? ' data-action="lm"' : '';
      return `<a class="nav-item${active}" data-nav="${n.id}" href="${hrefOf(n)}"${extra}${active ? ' aria-current="page"' : ''}>` +
        `<span>${esc(n.label.toUpperCase())}</span><img class="arrow" src="${R}assets/ui/nav-arrow.svg" alt="" width="21" height="24"></a>`;
    }).join('');

    const quick = SITE.nav.filter((n) => n.id !== 'lm').map((n) => `<a href="${hrefOf(n)}">${esc(n.label)}</a>`).join('');
    const L = links();

    return `
<div class="sb-inner">
  <svg class="sb-top" viewBox="0 0 356 160" aria-hidden="true">
    <defs>
      <filter id="sb-goo" x="-20" y="-20" width="396" height="200" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur"/>
        <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 26 -13"/>
      </filter>
    </defs>
    <path class="sb-static" fill="#ffece1" d=""/>
    <g class="sb-goo-group" fill="#ffece1" filter="url(#sb-goo)">
      <rect x="6" y="66" width="338" height="94" rx="8"/>
      <rect class="goo-tab" x="6" y="12" width="149" height="76" rx="8"/>
    </g>
  </svg>
  <div class="sb-body"></div>

  <div role="tablist" aria-label="Sidebar">
    <button class="sb-tab" role="tab" data-tab="index" id="tab-index" aria-controls="pane-index"><span>INDEX</span></button>
    <button class="sb-tab" role="tab" data-tab="lm" id="tab-lm" aria-controls="pane-lm"><span>M.I.K.U</span></button>
  </div>

  <section class="pane pane-index" id="pane-index" role="tabpanel" aria-labelledby="tab-index">
    <img class="avatar-ring" src="${R}assets/ui/avatar-ring.svg" alt="">
    <div class="avatar-photo"><img src="${R}assets/ui/avatar.png" alt="Illustrated portrait of Siddhi"></div>
    <p class="name">Siddhi Bhavya</p>
    <p class="role">${esc(SITE.tagline)}</p>
    <p class="bio">I am a designer tinkering at the intersection of human-computer interaction, accessibility, and efficiency.</p>
    <div class="explore-box"></div>
    <span class="explore-title">EXPLORE</span>
    <nav aria-label="Explore"><i class="nav-pill" aria-hidden="true"></i>${items}</nav>
    <div class="connect">
      <h2 class="connect-title">Connect with me!</h2>
      <div class="connect-links">
        <a href="${L.email}" data-action="email">Email</a><a href="${L.linkedin}" target="_blank" rel="noopener">Linkedin</a>
        <a href="${L.instagram}" target="_blank" rel="noopener">Instagram</a><a href="${L.resume}" target="_blank" rel="noopener">Resume</a>
      </div>
    </div>
  </section>

  <section class="pane pane-lm" id="pane-lm" role="tabpanel" aria-labelledby="tab-lm">
    <button type="button" class="lm-clear">Clear chat</button>
    <div class="lm-nav"><div class="lm-nav-grid">${quick}</div></div>
    <div class="lm-thread" aria-live="polite">
      <div class="lm-intro"><div class="lm-intro-in">
        <p class="lm-greet">Hey there!<br>This is M.I.K.U</p>
        <p class="lm-info">M.I.K.U is a chatbot created by Siddhi, named after her cat, Miku. I, M.I.K.U, will answer anything about Siddhi. (Well, Siddhi answers them — I am just a cat.)</p>
      </div></div>
      <div class="lm-suggest">
        <button type="button"><img src="${R}assets/ui/arrow-left.svg" alt="" width="13" height="13"><span>What is M.I.K.U?</span></button>
        <button type="button"><img src="${R}assets/ui/arrow-left.svg" alt="" width="13" height="13"><span>Tell me about your side projects?</span></button>
        <button type="button"><img src="${R}assets/ui/arrow-left.svg" alt="" width="13" height="13"><span>What does your design process look like?</span></button>
      </div>
    </div>
    <form class="lm-form" autocomplete="off">
      <input type="text" name="q" placeholder="Type in a message" aria-label="Type in a message" maxlength="240">
      <button type="submit" aria-label="Send message"><img src="${R}assets/ui/send.svg" alt=""></button>
    </form>
  </section>
</div>`;
  }

  function footerHTML() {
    const L = links();
    const nav = SITE.nav.map((n) => `<a href="${hrefOf(n)}"${n.action === 'lm' ? ' data-action="lm"' : ''}>${esc(n.id === 'work' ? 'Work' : n.label)}</a>`).join('');
    return `
<div class="footer-koi" id="footer-koi" aria-hidden="true"></div>
<div class="footer-inner">
  <p class="footer-tag">Great ideas are yet to be built.<br>Why not with you?</p>
  <div class="footer-links">
    <div class="footer-col footer-contact">
      <a href="${L.email}" data-action="email">Email</a><a href="${L.instagram}" target="_blank" rel="noopener">Instagram</a>
      <a href="${L.linkedin}" target="_blank" rel="noopener">Linkedin</a><a href="${L.resume}" target="_blank" rel="noopener">Resume</a>
    </div>
    <div class="footer-col footer-nav">${nav}</div>
    <a class="footer-space" href="${R || './'}"><img src="${R}assets/ui/star-back.svg" alt=""><span>Back to space</span></a>
  </div>
</div>`;
  }

  /* ------------------------------------------------------------------ 4 · Gooey tab switch */
  function initSidebar(sidebar) {
    const stat = sidebar.querySelector('.sb-static');
    const goo = sidebar.querySelector('.sb-goo-group');
    const gooTab = sidebar.querySelector('.goo-tab');
    const blur = sidebar.querySelector('feGaussianBlur');
    const paneIndex = sidebar.querySelector('.pane-index');
    const paneLm = sidebar.querySelector('.pane-lm');

    // Cream shapes = the Figma "Union" path eroded by its 12px inner border.
    const TAB = { index: { l: 6, r: 155 }, lm: { l: 201, r: 344 } };   // l: 6 = the slim burgundy line on the left
    const PATH = {
      index: 'M6 20A8 8 0 0 1 14 12H147A8 8 0 0 1 155 20V51A15 15 0 0 0 170 66H336A8 8 0 0 1 344 74V160H6Z',
      lm: 'M6 74A8 8 0 0 1 14 66H186A15 15 0 0 0 201 51V20A8 8 0 0 1 209 12H336A8 8 0 0 1 344 20V160H6Z'
    };

    let state = store.get('siddhi.tab') === 'lm' ? 'lm' : 'index';
    let busy = false, queued = null;

    const setGeo = (l, r) => { gooTab.setAttribute('x', l.toFixed(2)); gooTab.setAttribute('width', (r - l).toFixed(2)); };
    const applyPanes = () => {
      sidebar.dataset.tab = state;
      paneIndex.inert = state !== 'index';
      paneLm.inert = state !== 'lm';
      sidebar.querySelectorAll('.sb-tab').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === state)));
    };

    stat.setAttribute('d', PATH[state]);
    setGeo(TAB[state].l, TAB[state].r);
    applyPanes();

    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    function setTab(to) {
      if (to === state) return;
      store.set('siddhi.tab', to);
      if (busy) { queued = to; return; }
      const from = state;
      state = to;
      applyPanes();
      if (to === 'lm') requestAnimationFrame(() => { const i = sidebar.querySelector('.lm-form input'); if (i && !reduce) setTimeout(() => i.focus({ preventScroll: true }), 420); });

      if (reduce) { stat.setAttribute('d', PATH[to]); setGeo(TAB[to].l, TAB[to].r); return; }

      // The tab is a liquid blob: its leading edge shoots ahead, the trailing edge lags then
      // snaps in, while the blur radius swells and settles — that's the gooey stretch.
      busy = true;
      const A = TAB[from], B = TAB[to], dir = B.l > A.l ? 1 : -1, dur = 680, t0 = performance.now();
      stat.style.opacity = '0'; goo.style.opacity = '1';
      (function frame(now) {
        const t = Math.min(1, (now - t0) / dur);
        const lead = easeOut(Math.min(1, t / 0.6));
        const trail = easeInOut(Math.min(1, Math.max(0, (t - 0.1) / 0.9)));
        const l = A.l + (B.l - A.l) * (dir > 0 ? trail : lead);
        const r = A.r + (B.r - A.r) * (dir > 0 ? lead : trail);
        setGeo(l, r);
        blur.setAttribute('stdDeviation', (4 + 4.5 * Math.sin(Math.PI * t)).toFixed(2));
        if (t < 1) return requestAnimationFrame(frame);
        stat.setAttribute('d', PATH[to]);
        requestAnimationFrame(() => {
          goo.style.opacity = '0'; stat.style.opacity = '1';
          busy = false;
          if (queued && queued !== state) { const q = queued; queued = null; setTab(q); } else queued = null;
        });
      })(t0);
    }

    sidebar.querySelectorAll('.sb-tab').forEach((t) => t.addEventListener('click', () => setTab(t.dataset.tab)));
    sidebar.addEventListener('keydown', (e) => {
      if (!e.target.classList.contains('sb-tab')) return;
      if (e.key === 'ArrowRight') { setTab('lm'); sidebar.querySelector('#tab-lm').focus(); }
      if (e.key === 'ArrowLeft') { setTab('index'); sidebar.querySelector('#tab-index').focus(); }
    });
    return { setTab, getTab: () => state };
  }

  /* A quiet nudge from the M.I.K.U tab: "Ask me questions! :3", shown for 3 seconds — but only if the visitor has not used M.I.K.U (opened its tab or sent a message)
     during their first 10 minutes on the site, and only while the Index tab is the open one (so on a phone, while the menu card is open). If it still hasn't been
     used it comes back every further 10 minutes. The clock is the visitor's whole visit (sessionStorage), not one page, so moving between pages doesn't restart it. */
  function initNudge(sidebar) {
    const EVERY = 10 * 60 * 1000, SHOW = 3000;
    let t0 = Number(store.get('siddhi.t0')) || 0;
    if (!t0) { t0 = Date.now(); store.set('siddhi.t0', String(t0)); }
    const used = () => store.get('siddhi.miku-used') === '1' || store.get('siddhi.tab') === 'lm' || (store.get('siddhi.chat') || '[]').length > 2;
    const markUsed = () => store.set('siddhi.miku-used', '1');
    new MutationObserver(() => { if (sidebar.dataset.tab === 'lm') markUsed(); }).observe(sidebar, { attributes: true, attributeFilter: ['data-tab'] });
    sidebar.querySelector('.lm-form').addEventListener('submit', markUsed);

    const pill = document.createElement('div');
    pill.className = 'lm-nudge'; pill.setAttribute('role', 'status'); pill.textContent = 'Ask me questions! :3';
    sidebar.querySelector('.sb-inner').appendChild(pill);                 // inside the scaled card, so it stays lined up with the tab
    const canShow = () => !document.hidden && sidebar.dataset.tab === 'index' && (!body.classList.contains('compact') || body.classList.contains('sb-open'));
    const timer = setInterval(() => {
      if (used()) { clearInterval(timer); return; }
      const shown = Number(store.get('siddhi.nudges')) || 0;
      if (Date.now() < t0 + EVERY * (shown + 1) || !canShow()) return;
      store.set('siddhi.nudges', String(shown + 1));
      pill.classList.add('on');
      setTimeout(() => pill.classList.remove('on'), SHOW - 400);            // 0.4s in, held, 0.4s out: gone after 3 seconds
    }, 5000);
  }

  /* ------------------------------------------------------------------ 5 · Chat UI (the answers come from js/chat.js -> SiddhiLM.reply) */
  function initChat(sidebar, setTab) {
    const thread = sidebar.querySelector('.lm-thread');
    const form = sidebar.querySelector('.lm-form');
    const input = form.querySelector('input');
    thread.querySelector('.lm-intro').style.marginTop = 'auto';       // the greeting + intro: sits at the bottom while the thread is short
    let log = [], epoch = 0;
    try { log = JSON.parse(store.get('siddhi.chat') || '[]'); } catch (e) { log = []; }

    const persist = () => store.set('siddhi.chat', JSON.stringify(log.slice(-40)));
    const toBottom = () => { thread.scrollTop = thread.scrollHeight; };

    function bubble(m, animate) {
      const el = document.createElement('div');
      el.className = 'msg ' + m.role;
      if (!animate) el.style.animation = 'none';
      if (m.text) {
        const p = document.createElement('div');
        p.textContent = m.text;
        p.style.whiteSpace = 'pre-line';
        el.appendChild(p);
      }
      if (m.images && m.images.length) {                              // pictures scale to the bubble (and so to the card / window)
        const box = document.createElement('div');
        box.className = 'msg-imgs' + (m.images.length > 1 ? ' multi' : '');
        m.images.forEach((im) => {
          const src = /^(https?:|data:)/.test(im.src) ? im.src : R + im.src;
          const a = document.createElement('a'), img = document.createElement('img');
          a.href = src; a.target = '_blank'; a.rel = 'noopener'; a.title = im.alt || 'Open the picture';
          img.src = src; img.alt = im.alt || ''; img.loading = 'lazy'; img.decoding = 'async';
          img.addEventListener('load', () => { if (animate) toBottom(); });            // keep the newest message in view once the picture has its height
          a.appendChild(img); box.appendChild(a);
        });
        el.appendChild(box);
        el.classList.add('has-img');
      }
      const links = (m.actions || []).filter((a) => !a.ask), asks = (m.actions || []).filter((a) => a.ask);
      if (links.length) {                                             // links and buttons stay inside the bubble…
        const row = document.createElement('div');
        row.className = 'msg-actions';
        links.forEach((a) => {
          const link = document.createElement(a.tab || a.ask ? 'button' : 'a');
          link.textContent = a.label;
          if (a.raw) { link.href = lk(a.raw); if (/^https?:/.test(a.raw)) { link.target = '_blank'; link.rel = 'noopener'; } if (/^mailto:/.test(a.raw)) link.dataset.action = 'email'; }   // Email opens the address pop-up (copy / Gmail), like the sidebar's
          else if (a.href) { link.href = R + pretty(a.href); if (/^work\//.test(pretty(a.href))) { link.target = '_blank'; link.rel = 'noopener'; } }   // case studies open in a new tab
          if (a.tab) { link.type = 'button'; link.addEventListener('click', () => setTab(a.tab)); }
          row.appendChild(link);
        });
        el.appendChild(row);
      }
      thread.appendChild(el);
      thread.querySelectorAll('.lm-follow').forEach((f) => f.remove());        // …and the suggested questions are a list under the newest answer only, styled like the starters
      if (asks.length && m.role === 'bot') {
        const list = document.createElement('div');
        list.className = 'lm-follow';
        if (!animate) list.style.animation = 'none';
        asks.forEach((a) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.innerHTML = `<img src="${R}assets/ui/arrow-left.svg" alt="" width="13" height="13"><span></span>`;
          b.querySelector('span').textContent = a.label;
          b.addEventListener('click', () => send(a.ask));
          list.appendChild(b);
        });
        thread.appendChild(list);
      }
      thread.classList.add('has-chat');
      toBottom();
    }

    log.forEach((m) => bubble(m, false));

    function send(text) {
      text = text.trim();
      if (!text) return;
      const u = { role: 'user', text }, mine = epoch;
      thread.querySelectorAll('.lm-follow').forEach((f) => f.remove());        // the old suggestions go as soon as something is asked
      log.push(u); bubble(u, true); persist();
      const typing = document.createElement('div');
      typing.className = 'msg bot typing'; typing.innerHTML = '<i></i><i></i><i></i>';
      thread.appendChild(typing); toBottom();
      const brain = window.SiddhiLM ? window.SiddhiLM.reply(text, log.slice(-8)) : { text: 'My chat brain did not load — try reloading the page, or write to me through the Email link.' };
      Promise.resolve(brain).then((r) => {
        setTimeout(() => {
          typing.remove();
          if (mine !== epoch) return;                    // the chat was cleared while this reply was on its way
          const b = { role: 'bot', text: r.text, actions: r.actions || [], images: r.images || [] };
          log.push(b); bubble(b, true); persist();
        }, reduce ? 0 : 520 + Math.min(900, r.text.length * 6));
      });
    }

    // the greeting and intro slide up and away as soon as the visitor starts typing (css/shell/chat.css, .is-typing) and come back if the box is emptied
    // without sending; once something is sent they stay away (.has-chat) until "Clear chat"
    const syncTyping = () => thread.classList.toggle('is-typing', input.value.length > 0);
    input.addEventListener('input', syncTyping);
    form.addEventListener('submit', (e) => { e.preventDefault(); const v = input.value; input.value = ''; send(v); syncTyping(); });
    thread.querySelectorAll('.lm-suggest button').forEach((b) => b.addEventListener('click', () => { send(b.querySelector('span').textContent); input.value = ''; syncTyping(); }));

    sidebar.querySelector('.lm-clear').addEventListener('click', () => {
      epoch++; log = []; persist();
      thread.querySelectorAll('.msg, .lm-follow').forEach((m) => m.remove());
      thread.classList.remove('has-chat'); thread.scrollTop = 0;
      syncTyping();
      input.focus({ preventScroll: true });
    });
  }

  /* ------------------------------------------------------------------ 6 · Page navigation (no page reloads)
     Clicking a sidebar/footer link between the four main pages swaps only the page content: the sidebar and
     footer stay mounted, the highlight pill glides to the new item, the content cross-fades. Anything else
     (case studies, Welcome Aboard, modified clicks, failures) falls back to a normal navigation.
     To add a page to this list, also load its page script (js/about.js, js/quests.js, js/guest.js …) on every page in the list. */
  const PAGE_ID = { 'home': 'work', 'about': 'about', 'side-quests': 'quests', 'guest-gallery': 'gallery' };   // page name (the address without .html) -> data-page
  const nameOf = (pathname) => pathname.split('/').pop().replace(/\.html$/, '');
  const PJAX_PAGES = new Set(Object.keys(PAGE_ID));
  const PILL_TOP = { work: 500, about: 573, quests: 641, lm: 709, gallery: 778 };   // Figma pill tops (keep in sync with sidebar.css .nav-item[data-nav])

  function setActive(sidebar, pageId) {
    if (sidebar) {
      sidebar.querySelectorAll('.nav-item').forEach((a) => {
        const on = a.dataset.nav === pageId;
        a.classList.toggle('is-active', on);
        if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
      });
      const pill = sidebar.querySelector('.nav-pill');
      if (pill) {
        if (PILL_TOP[pageId] != null && pageId !== 'lm') { pill.style.top = 'calc(' + PILL_TOP[pageId] + 'px + var(--nav-dy, 0px))'; pill.classList.remove('is-hidden'); }
        else pill.classList.add('is-hidden');
      }
    }
  }
  function initRouter(sidebar) {
    if (R !== '' || !sidebar) return;                                 // only the root-level pages share this shell
    let busy = false;

    const targetOf = (a) => {
      if (!a || a.target || a.hasAttribute('download') || a.dataset.action) return null;
      let u; try { u = new URL(a.href, location.href); } catch (e) { return null; }
      if (u.origin !== location.origin || !PJAX_PAGES.has(nameOf(u.pathname))) return null;
      return u;
    };

    async function go(u, push) {
      if (busy) return;
      busy = true;
      const main = document.querySelector('.main');
      setActive(sidebar, PAGE_ID[nameOf(u.pathname)]);       // instant feedback: the pill moves on click, before the fetch returns
      try {
        const res = await fetch(u.href, { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
        const next = doc.querySelector('.main');
        if (!next || doc.body.dataset.sidebar === 'none' || doc.body.dataset.root) throw new Error('not a shell page');

        const pageId = doc.body.dataset.page;
        setActive(sidebar, pageId);                                    // the pill starts gliding straight away
        if (!reduce) await Promise.race([   // (a tab in the background doesn't run animations, so never wait for one for more than a moment)
          main.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(6px)' }], { duration: 170, easing: 'ease-in', fill: 'forwards' }).finished,
          new Promise((done) => setTimeout(done, 300))
        ]);

        body.dataset.page = pageId;
        if (doc.body.dataset.fit) body.dataset.fit = doc.body.dataset.fit; else delete body.dataset.fit;
        document.title = doc.title;
        main.innerHTML = next.innerHTML;
        if (push) history.pushState({ shell: 1 }, '', u.href);
        window.scrollTo(0, 0);
        fit();
        Object.values(window.SiddhiPages || {}).forEach((init) => { try { init(); } catch (e) { console.error(e); } });

        main.getAnimations().forEach((a) => a.cancel());
        if (!reduce) main.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
      } catch (err) {
        location.href = u.href;                                        // anything unexpected: a normal navigation
      } finally { busy = false; }
    }

    document.addEventListener('click', (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const u = targetOf(e.target.closest && e.target.closest('a[href]'));
      if (!u) return;
      e.preventDefault();
      if (u.pathname === location.pathname) { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); return; }
      go(u, true);
    });
    window.addEventListener('popstate', () => { const u = new URL(location.href); if (PJAX_PAGES.has(nameOf(u.pathname))) go(u, false); else location.reload(); });
    history.replaceState({ shell: 1 }, '', location.href);
    setActive(sidebar, page);
    requestAnimationFrame(() => requestAnimationFrame(() => sidebar.classList.add('ready')));   // enable the pill's transition after first paint
  }

  /* ------------------------------------------------------------------ 7 · Widgets */
  /* "Email": pressing the word pops the address up as a button right over it */
  function initEmailPop() {
    const address = SITE.links.emailAddress || SITE.links.email.replace(/^mailto:/, '');
    let pop = null, anchor = null;
    const place = () => {
      if (!pop || !anchor) return;
      const r = anchor.getBoundingClientRect();
      const w = pop.offsetWidth, h = pop.offsetHeight;
      const left = Math.min(window.innerWidth - w - 8, Math.max(8, r.left + r.width / 2 - w / 2));
      const top = Math.max(8, r.top + r.height / 2 - h / 2);
      pop.style.left = left + 'px'; pop.style.top = top + 'px';
    };
    const close = () => { if (!pop) return; const p = pop; pop = null; anchor = null; p.classList.add('out'); setTimeout(() => p.remove(), 180); };
    const open = (a) => {
      close();
      anchor = a;
      pop = document.createElement('div');
      pop.className = 'email-pop';
      const addr = document.createElement('a');                    // the address: opens the mail app, and copies itself for anyone without one
      addr.className = 'email-addr'; addr.href = SITE.links.email; addr.textContent = address;
      addr.setAttribute('aria-label', 'Write to ' + address);
      addr.addEventListener('click', () => {
        try { navigator.clipboard.writeText(address); } catch (e) { /* ignore */ }
        pop.classList.add('copied'); setTimeout(close, 1400);
      });
      const gmail = document.createElement('a');                   // or write it straight away in Gmail, address already filled in
      gmail.className = 'email-gmail'; gmail.textContent = 'Gmail'; gmail.target = '_blank'; gmail.rel = 'noopener';
      gmail.href = 'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(address);
      gmail.setAttribute('aria-label', 'Write to ' + address + ' in Gmail');
      gmail.addEventListener('click', () => setTimeout(close, 250));
      pop.append(addr, gmail);
      document.body.appendChild(pop);
      place();
    };
    document.addEventListener('click', (e) => {
      const a = e.target.closest && e.target.closest('a[data-action="email"]');
      if (a) { e.preventDefault(); if (anchor === a) close(); else open(a); return; }
      if (pop && !e.target.closest('.email-pop')) close();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, { passive: true });
  }

  /* Small screens: the side column is replaced by a star "Index" button that brings the Index / M.I.K.U card out over the page */
  function initDrawer(sidebar) {
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'sb-toggle'; btn.setAttribute('aria-controls', 'sidebar'); btn.setAttribute('aria-expanded', 'false');
    // three icons stacked in one small circle: the star and the hamburger take turns; while the card is open it shows a cross
    btn.innerHTML =
      '<svg class="ic ic-star" viewBox="0 0 26.43 24.6" width="22" height="21" aria-hidden="true"><path fill="currentColor" d="M13.2138 0L13.7383 2.4682C14.7637 7.29346 18.6375 10.9996 23.5034 11.8106L26.4276 12.298L22.4183 13.348C18.1231 14.473 14.8 17.8777 13.7797 22.199L13.2138 24.596L12.5773 22.0499C11.5172 17.8095 8.2352 14.4808 4.01012 13.3609L0 12.298L2.91569 11.8062C7.72009 10.9958 11.5576 7.3609 12.6271 2.60748L13.2138 0Z"/></svg>' +
      '<svg class="ic ic-menu" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>' +
      '<svg class="ic ic-close" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
    const note = document.createElement('div');                       // the little label that slides out of the corner now and then
    note.className = 'sb-note'; note.setAttribute('aria-hidden', 'true'); note.textContent = 'Menu · Index & M.I.K.U';
    const scrim = document.createElement('div');
    scrim.className = 'sb-scrim';
    document.body.append(scrim, btn, note);
    const set = (on) => {
      body.classList.toggle('sb-open', on);
      btn.setAttribute('aria-expanded', String(on));
      btn.setAttribute('aria-label', on ? 'Close the menu' : 'Open the menu');
      if (on) note.classList.remove('on');
    };
    set(false);
    btn.addEventListener('click', () => set(!body.classList.contains('sb-open')));
    scrim.addEventListener('click', () => set(false));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && body.classList.contains('sb-open')) set(false); });
    sidebar.addEventListener('click', (e) => {                        // going somewhere: put the card away
      const a = e.target.closest && e.target.closest('a[href]');
      if (a && !a.dataset.action && !a.getAttribute('href').startsWith('mailto:')) setTimeout(() => set(false), 120);
    });

    if (!reduce) {                                                    // the star and the hamburger take turns; the label appears for 2 seconds as soon as the page opens, then every so often
      setInterval(() => { if (!body.classList.contains('sb-open') && !document.hidden) btn.classList.toggle('as-menu'); }, 3200);
      const remind = (delay) => setTimeout(() => {
        if (body.classList.contains('compact') && !body.classList.contains('sb-open') && !document.hidden) { note.classList.add('on'); setTimeout(() => note.classList.remove('on'), 2000); }
        remind(10 * 60 * 1000);                                         // then again every 10 minutes
      }, delay);
      remind(600);                                                  // the first time is right as the page opens
    }
    return { open: () => set(true), close: () => set(false) };
  }

  /* "Resume": a pill in the top-right corner of every main-site page, always in reach */
  function mountResume() {
    const a = document.createElement('a');
    a.className = 'resume-pill'; a.href = links().resume; a.target = '_blank'; a.rel = 'noopener';
    a.innerHTML = '<svg viewBox="0 0 16 18" width="13" height="15" aria-hidden="true"><path d="M3 1h7l4 4v11a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z M10 1v4h4 M5 9h6 M5 12h6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"/></svg><span>Resume</span>';
    document.body.appendChild(a);
  }

  /* Work cards: over a case study the cursor becomes a coloured "View case study" pill (colour = the card's, data-cs).
     Only a mouse or trackpad triggers it (pointerType below), so touch screens never see it — but a mouse plugged in or paired later (a tablet) works without a reload. */
  function initCaseCursor() {
    const pill = document.createElement('div');
    pill.className = 'cs-cursor'; pill.setAttribute('aria-hidden', 'true');
    pill.innerHTML = '<svg viewBox="0 0 41.71 19.27" width="41" height="19" fill="none"><path d="M21.7172 7.38518C6.35654 8.87304 5.8737 18.2341 5.8737 18.2341L40.3816 17.1377C40.3816 17.1377 37.0779 5.89732 21.7172 7.38518Z" stroke="#fff" stroke-width="2"/><ellipse cx="22.3934" cy="11.4674" rx="5.50658" ry="4.2" fill="#fff"/><g stroke="#fff"><path d="M0 9.2L7.4 13.9"/><path d="M18.9 0.1L19.7 8"/><path d="M40.7 4.7L34.4 10.6"/><path d="M31.4 0.2L27.9 7.3"/><path d="M8.1 2.7L12.2 10.6"/></g></svg><span>View case study</span>';
    document.body.appendChild(pill);
    let x = -200, y = -200, tx = -200, ty = -200, raf = 0, on = false;
    const tick = () => {
      x += (tx - x) * 0.24; y += (ty - y) * 0.24;
      pill.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`;
      raf = (on || Math.abs(tx - x) + Math.abs(ty - y) > 0.5) ? requestAnimationFrame(tick) : 0;
    };
    const show = (card) => {
      pill.style.setProperty('--cs', card.dataset.cs || '#7f404e');
      if (!on) { x = tx; y = ty; }                                    // appear right under the pointer, then follow
      on = true; pill.classList.add('on'); document.body.classList.add('cs-on');
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const hide = () => { on = false; pill.classList.remove('on'); document.body.classList.remove('cs-on'); };
    document.addEventListener('pointermove', (e) => {
      tx = e.clientX; ty = e.clientY;
      if (e.pointerType && e.pointerType !== 'mouse') return;
      const card = e.target.closest && e.target.closest('.card[data-cs]');
      if (card) show(card); else if (on) hide();
    }, { passive: true });
    document.addEventListener('pointerleave', hide);
    window.addEventListener('blur', hide);
    document.addEventListener('scroll', () => { if (on) { const el = document.elementFromPoint(tx, ty); if (!(el && el.closest('.card[data-cs]'))) hide(); } }, { passive: true });
  }

  /* ------------------------------------------------------------------ 8 · Boot */
  function mountSidebar(layout) {
    const sidebar = document.createElement('aside');
    sidebar.className = 'sidebar'; sidebar.id = 'sidebar'; sidebar.setAttribute('aria-label', 'Site navigation');
    sidebar.innerHTML = sidebarHTML();
    layout.insertBefore(sidebar, layout.firstChild);
    return sidebar;
  }

  /* arriving from the landing page (Skip Intro) or the Thank You screen, which both slide away upward: the whole page rises into place from below.
     body.entering (css/shell/layout.css) lasts only as long as the animation. */
  function markArrival(layout) {
    if (!store.get('siddhi.enter')) return;
    body.classList.add('entering');
    const done = () => body.classList.remove('entering');
    layout.addEventListener('animationend', (e) => { if (e.target === layout) done(); });
    setTimeout(done, 1600);                                              // safety net
  }

  function mountFooter(layout) {
    let footer = document.querySelector('.footer');
    if (!footer) { footer = document.createElement('footer'); footer.className = 'footer'; layout.parentNode.appendChild(footer); }
    footer.innerHTML = footerHTML();
    window.KOI_CONFIG = { mount: '#footer-koi', bg: [25, 5, 35], hoverOnly: true };   // the koi sketch (js/koi.js) reads this when p5 starts
  }

  /* Tidy address: someone who arrives on /home.html (an old link or bookmark) sees /home in the address bar. Both work on GitHub Pages. */
  function cleanAddress() {
    const p = location.pathname, tidy = p.replace(/(^|\/)index\.html$/, '$1').replace(/\.html$/, '');
    if (tidy !== p) history.replaceState(history.state, '', tidy + location.search + location.hash);
  }

  function boot() {
    guard('address', cleanAddress);
    if (body.dataset.shell === 'none') { fit(); window.addEventListener('resize', fit); return; }

    const layout = document.querySelector('.layout');
    const noSidebar = body.dataset.sidebar === 'none';       // e.g. Welcome Aboard: full screen, footer only
    guard('scaling', fit);                                    // sets body.compact before the sidebar exists, so a small screen never flashes it open

    const sidebar = noSidebar ? null : guard('sidebar markup', () => mountSidebar(layout));
    if (!noSidebar) guard('arrival', () => markArrival(layout));
    store.del('siddhi.enter');                                // the arrival flag is single-use
    guard('footer markup', () => mountFooter(layout));

    const sb = sidebar ? guard('tabs', () => initSidebar(sidebar)) : null;
    if (sb) {
      guard('chat', () => initChat(sidebar, sb.setTab));
      guard('nudge', () => initNudge(sidebar));
      guard('page navigation', () => initRouter(sidebar));
    }
    const drawer = sb ? guard('drawer', () => initDrawer(sidebar)) : null;
    guard('case-study cursor', initCaseCursor);

    // "M.I.K.U" links (footer, quick links): open the chat tab — or, with no sidebar on this page, open it on the home page
    document.querySelectorAll('[data-action="lm"]').forEach((a) => a.addEventListener('click', (e) => {
      e.preventDefault();
      if (sb) { if (drawer && body.classList.contains('compact')) drawer.open(); else window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); sb.setTab('lm'); }
      else { store.set('siddhi.tab', 'lm'); location.href = R + 'home'; }
    }));

    if (!noSidebar) guard('resume pill', mountResume);
    guard('email pop-up', initEmailPop);
    guard('scaling', fit);
    window.addEventListener('resize', fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    window.SiddhiShell = { setTab: sb ? sb.setTab : () => {}, fit };
  }

  boot();
})();
