/* Syncletter's phone/tablet layout (< 900px). Built from CLONES of the desktop nodes, so every image, SVG, pill (colours + hover animation),
   video and word of copy is the same as on desktop — only the arrangement changes (one centred column, text >= 16px on the 28px paper rules).
   The spectrum is the desktop SVG as is; the user flow is re-drawn as a linear chart with the same colours, shapes and arrow SVG.
   The desktop canvas is hidden at this width by css/pages/syncletter.css ("phone layout"). */
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
  canvas.querySelectorAll('.syn-spectrum [id]').forEach(e => e.setAttribute('data-mid', e.id));
  const qa = s => [...canvas.querySelectorAll(s)];
  const clean = el => {
    el.removeAttribute('data-node-id'); el.removeAttribute('id');
    el.querySelectorAll('[data-node-id],[id]').forEach(e => { e.removeAttribute('data-node-id'); e.removeAttribute('id'); });
    return el;
  };
  const make = (tag, cls, html = '') => { const e = document.createElement(tag); e.className = cls; e.innerHTML = html; return e; };
  // text clone: reset to flow layout, 16px / 28px rows, centred
  const copy = (parent, sel, cls = '') => {
    const el = clean(q(sel).cloneNode(true));
    el.classList.add('sm-copy');
    cls.split(' ').filter(Boolean).forEach(c => el.classList.add(c));
    parent.append(el);
    return el;
  };
  // artwork / pill clone: keeps its own size, colours, SVG and hover animation; only the canvas position is reset
  const art = (parent, sel, cls = '') => {
    const el = clean(q(sel).cloneNode(true));
    el.classList.add('sm-pos');
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
  const ARROW = '<span class="sm-arr" aria-hidden="true"><svg viewBox="0 0 21.17 24.48"><path d="M20.5 13.1c.7-.4.7-2.2 0-2.7L1.5.1C.6-.4 0 .7.1 2.1l2.8 9.5c.1.4.1.8 0 1.1L.1 22.4c-.2 1 .5 2.4 1.5 1.9z"/></svg></span>';

  // ---- top: hero, tags, title, intro, prototype pill, project facts ----
  art(mob, '.syn-14', 'sm-hero');
  const tags = make('div', 'sm-tags'); mob.append(tags);
  art(tags, '.syn-15a'); art(tags, '.syn-15b');
  copy(mob, '.syn-2', 'sm-title');
  copy(mob, '.syn-9');
  const fact = (h, v) => '<div class="sm-fact"><p class="sm-fact-h">' + h + '</p><p class="sm-fact-v">' + v + '</p></div>';
  mob.append(make('div', 'sm-facts',
    fact(q('.syn-13c').textContent.trim(), q('.syn-13e').textContent.trim() + '<br>' + q('.syn-13g').textContent.trim() + '<br>' + q('.syn-13i').textContent.trim()) +
    fact(q('.syn-13b').textContent.trim(), q('.syn-13j').textContent.trim()) +
    fact(q('.syn-13a').textContent.trim(), q('.syn-13d').textContent.trim() + '<br>' + q('.syn-13f').textContent.trim() + '<br>' + q('.syn-13h').textContent.trim())));
  art(mob, '.syn-rec', 'sm-rec');
  art(mob, '.syn-17', 'sm-pill');

  // ---- context ----
  let s = section('context', '.syn-4');
  copy(s, '.syn-3', 'sm-lede'); copy(s, '.syn-10');
  copy(s, '.syn-6', 'sm-label'); copy(s, '.syn-18');

  // ---- solution ----
  s = section('solution', '.syn-5');
  copy(s, '.syn-11');
  const dark = make('div', 'sm-dark'); s.append(dark);
  copy(dark, '.syn-33', 'sm-ondark');
  art(dark, '.syn-32a', 'sm-doodle');
  art(dark, '.syn-31', 'sm-phone');
  copy(dark, '.syn-34', 'sm-ondark');
  copy(s, '.syn-35'); copy(s, '.syn-36');

  // ---- research ----
  s = section('research', '.syn-7');
  copy(s, '.syn-19');
  ['.syn-21', '.syn-23', '.syn-22', '.syn-24'].forEach(sel => copy(s, sel, 'sm-stat'));
  art(s, '.syn-25', 'sm-quote');
  copy(s, '.syn-27', 'sm-attrib');
  copy(s, '.syn-26', 'sm-learnt');
  const spec = art(s, '.syn-spectrum', 'sm-spectrum');   // the desktop spectrum, unchanged (scaled to the column)
  // clean() stripped its gradient/filter ids (the originals sit in the hidden canvas and would not paint): give the clone its own
  const specSrc = q('.syn-spectrum');
  specSrc.querySelectorAll('[id]').forEach(e => {
    const id = e.id, nid = 'm-' + id;
    const target = spec.querySelector('[data-mid="' + id + '"]');
    if (target) target.setAttribute('id', nid);
  });
  spec.querySelectorAll('*').forEach(e => [...e.attributes].forEach(a => {
    if (a.name === 'data-mid') return;
    if (/url\(#/.test(a.value)) a.value = a.value.replace(/url\(#([\w-]+)\)/g, 'url(#m-$1)');
    if ((a.name === 'href' || a.name === 'xlink:href') && a.value.startsWith('#')) a.value = '#m-' + a.value.slice(1);
  }));
  spec.querySelectorAll('[data-mid]').forEach(e => e.removeAttribute('data-mid'));
  copy(s, '.syn-28'); copy(s, '.syn-29');
  const got = make('div', 'sm-got'); s.append(got);
  art(got, '.syn-32b', 'sm-got-icon'); art(got, '.syn-38', 'sm-got-bubble');
  art(s, '.syn-37', 'sm-pill');

  // ---- design ----
  s = section('design', '.syn-8');
  copy(s, '.syn-40');
  copy(s, '.syn-39', 'sm-label');
  // Elements: the same six cards on the same dark plate, stacked in one column at full size (the desktop 2-column composition scaled to a phone
  // made the side labels unreadably small). Each card keeps its label, now above it in 16px cream type.
  const plate = make('div', 'sm-elements sm-el-plate');
  const cards = qa('.syn-grid > .syn-card'), tags6 = qa('.syn-elabel');
  cards.forEach((card, i) => {
    const box = make('div', 'sm-el');
    box.append(make('p', 'sm-el-label', tags6[i] ? tags6[i].textContent.trim() : ''));
    const wrap = make('div', 'syn-grid sm-el-card'); wrap.append(clean(card.cloneNode(true)));
    box.append(wrap); plate.append(box);
  });
  s.append(plate);
  copy(s, '.syn-41', 'sm-label'); copy(s, '.syn-wf-text');
  art(s, '.syn-slider', 'sm-wide');
  copy(s, '.syn-42', 'sm-label');
  say(s, 'sm-label', q('.syn-flow-label').textContent.trim());
  const node = (kind, html) => '<div class="sm-fc sm-fc-' + kind + '">' + html + '</div>';
  const num = n => '<b>' + n + '</b>';
  s.append(make('div', 'sm-flow',
    node('start', 'Start') + ARROW +
    node('io', num('01') + 'Receive a message') + ARROW +
    node('proc', num('02') + 'Click icon to activate') + ARROW +
    node('proc', num('03') + 'Select message<small>Rule-based check runs on-device, no network call</small>') + ARROW +
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
  art(s, '.syn-devshot', 'sm-wide');
  copy(s, '.syn-43');
  art(s, '.syn-proto', 'sm-proto');
  copy(s, '.syn-44'); copy(s, '.syn-45');

  // ---- reflection ----
  s = section('reflection', '.syn-46');
  copy(s, '.syn-47');
  art(s, '.syn-48', 'sm-pill');

  // ---- phone video playback ----
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const io = new IntersectionObserver(es => es.forEach(({ target, isIntersecting }) => {
    if (isIntersecting && !reduce.matches) target.play().catch(() => {}); else target.pause();
  }), { rootMargin: '150px' });
  mob.querySelectorAll('video').forEach(v => { v.muted = true; io.observe(v); });

  // ---- text on the 28px paper rules (phase 20): same top-to-bottom, repeat-until-stable pass as js/nearu.js ----
  const paper = mob;
  function alignGrid() {
    if (innerWidth >= 900) return;
    tags.style.position = 'relative'; tags.style.top = '0px';   // the pill row sits with its bottom edge on a paper rule (the hero above has a fractional height)
    const tb = tags.getBoundingClientRect().bottom - paper.getBoundingClientRect().top;
    tags.style.top = ((((20 - tb) % 28 + 28) % 28) - 28) + 'px';   // one box above the rule it would otherwise sit on
    paper.querySelectorAll('[data-gp]').forEach(el => {
      el.style.paddingTop = el.dataset.gp;
      if (el.dataset.gt) { el.style.removeProperty('top'); el.style.removeProperty('position'); delete el.dataset.gt; }
    });
    const exempt = el => {
      for (let n = el; n && n !== paper; n = n.parentElement) {
        if (n.matches('svg,button,video,img,.sm-fc,.sm-facts,.sm-dark,.sm-panel,.sm-plate,.sm-pill,.sm-elements,.sm-tags > *')) return true;
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
