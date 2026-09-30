/* Syncletter's phone/tablet layout (< 900px). Built from clones of the canvas content so the copy lives in one place
   (work/syncletter.html); the desktop canvas is hidden by css/pages/syncletter-mobile.css at this width.
   Text sits on the 28px paper rules (same pass as js/nearu.js) and is never smaller than 16px. */
(function () {
  'use strict';
  if (!document.body.classList.contains('syncletter-page')) return;
  const canvas = document.querySelector('.syn-canvas');
  const viewport = document.querySelector('.syncletter-viewport');
  if (!canvas || !viewport) return;
  const mob = document.createElement('div');
  mob.className = 'syn-mobile';
  viewport.after(mob);

  const q = s => canvas.querySelector(s);
  const qa = s => [...canvas.querySelectorAll(s)];
  const clean = el => {
    el.removeAttribute('data-node-id'); el.removeAttribute('id');
    el.querySelectorAll('[data-node-id],[id]').forEach(e => { e.removeAttribute('data-node-id'); e.removeAttribute('id'); });
    return el;
  };
  const make = (tag, cls, html = '') => { const e = document.createElement(tag); e.className = cls; e.innerHTML = html; return e; };
  const copy = (parent, sel, cls = '') => {
    const el = clean(q(sel).cloneNode(true));
    el.classList.add('sm-copy');
    cls.split(' ').filter(Boolean).forEach(c => el.classList.add(c));
    parent.append(el);
    return el;
  };
  const say = (parent, cls, html) => { const p = make('p', 'sm-copy ' + cls, html); parent.append(p); return p; };
  const label = (parent, html) => say(parent, 'sm-label', html);
  const section = (id, headSel) => {
    const s = document.createElement('section');
    s.id = 'mobile-' + id; s.tabIndex = -1; mob.append(s);
    copy(s, headSel, 'sm-heading');
    return s;
  };
  const link = (parent, sel, text) => {
    const src = q(sel);
    const a = make('a', 'sm-btn', text || src.textContent.trim());
    a.href = src.href; a.target = '_blank'; a.rel = 'noopener';
    parent.append(a);
    return a;
  };
  const video = (parent, sel, cls) => {
    const v = clean(q(sel).cloneNode(true));
    const wrap = make('div', cls); wrap.append(v); parent.append(wrap);
    return wrap;
  };
  const ARROW = '<span class="sm-arr" aria-hidden="true"><svg viewBox="0 0 21.17 24.48"><path d="M20.5 13.1c.7-.4.7-2.2 0-2.7L1.5.1C.6-.4 0 .7.1 2.1l2.8 9.5c.1.4.1.8 0 1.1L.1 22.4c-.2 1 .5 2.4 1.5 1.9z"/></svg></span>';

  // ---- top: hero, tags, title, intro, prototype link, project facts ----
  const hero = make('div', 'sm-media'); hero.append(clean(q('.syn-14-crop img').cloneNode(true))); mob.append(hero);
  const tags = make('div', 'sm-tags', '<span class="sm-tag">' + q('.syn-15a-label').textContent.trim() + '</span><span class="sm-tag">' + q('.syn-15b-label').textContent.trim() + '</span>');
  mob.append(tags);
  copy(mob, '.syn-2', 'sm-title');
  copy(mob, '.syn-9');
  link(mob, '.syn-17');
  label(mob, 'Skills'); say(mob, '', 'Interaction Design<br>Prototyping<br>Research');
  label(mob, 'Timeline'); say(mob, '', 'August 2026');
  label(mob, 'Tools'); say(mob, '', 'Figma, Figma Motion<br>Firebase<br>Claude Code');

  // ---- context ----
  let s = section('context', '.syn-4');
  copy(s, '.syn-3', 'sm-lede'); copy(s, '.syn-10');
  copy(s, '.syn-6', 'sm-label'); copy(s, '.syn-18');

  // ---- solution ----
  s = section('solution', '.syn-5');
  copy(s, '.syn-11');
  const dark = make('div', 'sm-dark');
  dark.append(make('p', 'sm-copy', q('.syn-33').textContent.trim()));
  dark.append(clean(q('.syn-32a').cloneNode(true)));
  video(dark, '.syn-31 video', 'sm-phone');
  dark.append(make('p', 'sm-copy', q('.syn-34').textContent.trim()));
  s.append(dark);
  copy(s, '.syn-35'); copy(s, '.syn-36');

  // ---- research ----
  s = section('research', '.syn-7');
  copy(s, '.syn-19');
  ['.syn-21', '.syn-23', '.syn-22', '.syn-24'].forEach(sel => copy(s, sel));
  const quote = make('div', 'sm-quote');
  quote.append(make('p', 'sm-copy', q('.syn-25-text').textContent.trim()));
  s.append(quote);
  copy(s, '.syn-27', 'sm-attrib');
  copy(s, '.syn-26', 'sm-learnt');
  copy(s, '.sp-intro', 'sm-centre');
  const dot = c => '<span class="sm-circle" style="--c1:' + c[0] + ';--c2:' + c[1] + '">';
  const stops = id => [...canvas.querySelectorAll('#' + id + ' stop')].map(x => x.getAttribute('stop-color'));
  const sp = id => { const c = stops(id); return dot(c); };
  s.append(make('div', 'sm-spectrum sm-spec-narrow',
    sp('sp1') + 'AI speaks<br>for me</span>' + sp('sp2') + 'I change<br>paraphrase</span>' +
    '<span class="sm-circle sm-teal" style="--c1:' + stops('sp3')[0] + ';--c2:' + stops('sp3')[1] + '">Here’s where Syncletter helps</span>' +
    sp('sp5') + 'Can understand but can’t reply aptly</span>' + sp('sp6') + 'I figure everything out alone</span>'));
  // Tablet width: the desktop composition (one row of circles, the two teal ones in the middle, label underneath).
  const cs = (id, txt, cls = '') => '<span class="sm-circle ' + cls + '" style="--c1:' + stops(id)[0] + ';--c2:' + stops(id)[1] + '">' + txt + '</span>';
  s.append(make('div', 'sm-spec-row',
    cs('sp1', 'AI speaks<br>for me', 'sm-light') + cs('sp2', 'I change<br>paraphrase', 'sm-light') +
    '<span class="sm-teals">' + cs('sp3', '', 'sm-small') + cs('sp4', '', 'sm-small') + '<img class="sm-glyph" src="' + q('.syn-spectrum image').getAttribute('href') + '" alt="">' + '</span>' +
    cs('sp5', 'Can understand but can’t reply aptly') + cs('sp6', 'I figure everything out alone')));
  say(s, 'sm-centre sm-helps', 'Here’s where Syncletter helps');
  copy(s, '.syn-28'); copy(s, '.syn-29');
  const got = make('div', 'sm-got');
  got.append(clean(q('.syn-32b').cloneNode(true)));
  got.append(make('div', 'sm-bubble', '<p>' + q('.syn-38 p').textContent.trim() + '</p>'));
  s.append(got);
  link(s, '.syn-37');

  // ---- design ----
  s = section('design', '.syn-8');
  copy(s, '.syn-40');
  copy(s, '.syn-39', 'sm-label');
  const cards = qa('.syn-grid .syn-card');
  cards.forEach((card, i) => {
    const blk = make('div', 'sm-cardblock');
    const cap = q('.syn-el-' + (i + 1));
    if (cap) blk.append(make('p', 'sm-copy sm-label', cap.textContent.trim()));
    const panel = make('div', 'sm-panel'); panel.append(clean(card.cloneNode(true)));
    blk.append(panel); s.append(blk);
  });
  copy(s, '.syn-41', 'sm-label'); copy(s, '.syn-wf-text');
  video(s, '.syn-slider video', 'sm-wide');
  copy(s, '.syn-42', 'sm-label');
  label(s, q('.syn-flow-label').textContent.trim());
  const node = (kind, html) => '<div class="sm-fc sm-fc-' + kind + '">' + html + '</div>';
  const num = n => '<b>' + n + '</b> ';
  s.append(make('div', 'sm-flow',
    node('start', 'Start') + ARROW +
    node('io', num('01') + 'Receive a message') + ARROW +
    node('proc', num('02') + 'Click icon to activate') + ARROW +
    node('proc', num('03') + 'Select message<br><small>Rule-based check runs on-device, no network call</small>') + ARROW +
    node('dec', num('04') + 'Add your meaning or Reply cues?') +
    '<p class="sm-copy sm-branch">Add your meaning</p>' + ARROW +
    node('io', 'Type your meaning') + ARROW + node('proc', 'Save') + ARROW + node('proc', 'Go back') +
    '<p class="sm-copy sm-branch">then back to Reply cues</p>' +
    '<p class="sm-copy sm-branch">Click Reply cues</p>' + ARROW +
    node('proc', num('05') + 'Reply cues') + ARROW +
    node('proc', num('06') + 'Search words in library') + ARROW +
    node('proc', num('07') + 'Write response with suggested ideas / ways') + ARROW +
    node('io', num('08') + 'Send message') + ARROW +
    node('end', 'End')));
  const shot = make('div', 'sm-wide'); shot.append(clean(q('.syn-devshot img').cloneNode(true))); s.append(shot);
  copy(s, '.syn-43');
  const boxes = qa('.syn-proto-box').map(b => '<div class="sm-box"><p class="sm-copy sm-label">' + b.querySelector('.syn-proto-tag').textContent.trim() + '</p><p class="sm-copy">' + b.querySelector('.syn-proto-text').textContent.trim() + '</p></div>').join(ARROW);
  s.append(make('div', 'sm-proto', boxes));
  copy(s, '.syn-44'); copy(s, '.syn-45');

  // ---- reflection ----
  s = section('reflection', '.syn-46');
  copy(s, '.syn-47');
  link(s, '.syn-48');

  // ---- phone video playback ----
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const vids = [...mob.querySelectorAll('video')];
  const io = new IntersectionObserver(es => es.forEach(({ target, isIntersecting }) => {
    if (isIntersecting && !reduce.matches) target.play().catch(() => {}); else target.pause();
  }), { rootMargin: '150px' });
  vids.forEach(v => { v.muted = true; io.observe(v); });

  // ---- text on the 28px paper rules (phase 20): same top-to-bottom, repeat-until-stable pass as js/nearu.js ----
  const paper = mob;
  function alignGrid() {
    if (innerWidth >= 900) return;
    paper.querySelectorAll('[data-gp]').forEach(el => {
      el.style.paddingTop = el.dataset.gp;
      if (el.dataset.gt) { el.style.removeProperty('top'); el.style.removeProperty('position'); delete el.dataset.gt; }
    });
    const exempt = el => {
      for (let n = el; n && n !== paper; n = n.parentElement) {
        if (n.matches('svg,button,a,video,img,.sm-fc,.sm-tag,.sm-quote,.sm-panel,.sm-circle,.sm-box,.sm-dark,.sm-bubble')) return true;
        if (n.classList.contains('sm-copy')) continue;
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
      const y = probe.getBoundingClientRect().top - paper.getBoundingClientRect().top;
      probe.remove();
      return y;
    };
    const need = y => ((20 - y) % 28 + 28) % 28;
    const push = (block, node) => {
      const delta = need(measure(node));
      if (delta > 27.6 || delta < 0.4) return false;
      if (block.dataset.gp === undefined) block.dataset.gp = block.style.paddingTop;
      block.style.paddingTop = (parseFloat(getComputedStyle(block).paddingTop) + delta) + 'px';
      const left = need(measure(node));
      if (left > 0.6 && left < 27.4) {
        block.style.paddingTop = block.dataset.gp;
        if (getComputedStyle(block).position === 'static') block.style.setProperty('position', 'relative', 'important');
        block.style.setProperty('top', (parseFloat(getComputedStyle(block).top) || 0) + need(measure(node)) + 'px', 'important');
        block.dataset.gt = '1';
      }
      return true;
    };
    for (let pass = 0; pass < 6; pass++) {
      let moved = 0;
      const seen = new Set();
      runs.forEach(node => {
        let block = node.parentElement;
        while (block && block !== paper && getComputedStyle(block).display === 'inline') block = block.parentElement;
        if (!block || block === paper || seen.has(block) || exempt(block)) return;
        seen.add(block);
        if (push(block, node)) moved++;
      });
      if (!moved) break;
    }
  }
  document.fonts.ready.then(() => requestAnimationFrame(alignGrid));
  addEventListener('load', () => { requestAnimationFrame(alignGrid); setTimeout(alignGrid, 800); });
  addEventListener('resize', () => requestAnimationFrame(() => requestAnimationFrame(alignGrid)));
  let busy = false;
  new ResizeObserver(() => {
    if (busy || innerWidth >= 900) return;
    busy = true;
    requestAnimationFrame(() => { alignGrid(); requestAnimationFrame(() => { busy = false; }); });
  }).observe(paper);
  mob.querySelectorAll('img').forEach(i => i.addEventListener('load', () => requestAnimationFrame(alignGrid)));
})();
