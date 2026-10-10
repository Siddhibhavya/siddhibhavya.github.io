/* Responsive reading layout, composed from the original live Figma layers.
   No duplicate copy, redrawn illustrations, or flattened section screenshots. */
(function () {
  'use strict';
  const canvas = document.querySelector('.nearu-canvas');
  if (!canvas) return;
  const mobile = document.createElement('article');
  mobile.className = 'nearu-mobile';
  mobile.setAttribute('aria-label', 'NearU case study');
  document.querySelector('.nearu-viewport').append(mobile);
  const source = id => canvas.querySelector('[data-node-id="351:' + id + '"]');
  function clone(id) {
    const el = source(id).cloneNode(true);
    [el, ...el.querySelectorAll('*')].forEach(n => {
      n.removeAttribute('id'); n.removeAttribute('data-node-id');
      n.removeAttribute('tabindex');
    });
    return el;
  }
  function copy(parent, id, extra = '') {
    const el = clone(id);
    el.classList.add('nearu-mobile-copy');
    if (extra) el.classList.add(extra);
    parent.append(el);
    return el;
  }
  const plates = [];
  function plate(parent, ids, x, y, width, height) {
    const box = document.createElement('div');
    box.className = 'nearu-mobile-art';
    const stage = document.createElement('div');
    stage.className = 'nearu-mobile-art-stage';
    const layers = document.createElement('div');
    layers.className = 'nearu-mobile-art-layers';
    layers.style.left = -x + 'px'; layers.style.top = -y + 'px';
    stage.style.width = width + 'px'; stage.style.height = height + 'px';
    ids.forEach(id => layers.append(clone(id)));
    stage.append(layers); box.append(stage); parent.append(box);
    plates.push({box, stage, width, height});
  }
  // Videos on phones: the whole 4:3 clip at full column width (the desktop's crop of it cut phones off), watermark corner trimmed by a slight zoom.
  function vid(parent, id, cls = '') {
    const v = source(id).querySelector('video').cloneNode(true);
    v.removeAttribute('data-node-id');
    const box = document.createElement('div');
    box.className = 'nearu-mobile-video ' + cls;
    box.append(v);
    parent.append(box);
  }
  // A designed block (treemap, persona paper) cloned whole: its own CSS reflows it into one column.
  function block(parent, id, cls = '') {
    const el = clone(id);
    el.classList.add('nearu-mobile-block');
    if (cls) el.classList.add(cls);
    parent.append(el);
    return el;
  }
  // Brand board: the four colour swatches re-flowed for phones. Scaled down with the desktop composition every swatch label fell under 16px, collided with its neighbour
  // and the display "Aa" spilled out of its swatch, so here each swatch is a real box with its own text. Colours and copy are read from the canvas nodes.
  function brandBoard(parent) {
    const bg = id => getComputedStyle(source(id)).backgroundColor, txt = id => source(id).textContent.trim(), ink = id => getComputedStyle(source(id)).color;
    const board = document.createElement('div');
    board.className = 'nearu-mobile-brand';
    const swatch = (cls, fill, hexId, extra) =>
      '<div class="bb-sw ' + cls + '" style="background:' + bg(fill) + ';color:' + ink(hexId) + '">' + (extra || '') + '<span class="bb-hex">' + txt(hexId) + '</span></div>';
    board.innerHTML =
      swatch('bb-coral', 1633, 1643, '<span class="bb-aa bb-futura">' + txt(1638) + '</span><span class="bb-font">' + txt(1641) + '</span>') +
      swatch('bb-blue', 1634, 1644, '<span class="bb-aa bb-liberation">' + txt(1637) + '</span><span class="bb-font">' + txt(1642) + '</span>') +
      swatch('bb-cream', 1636, 1646) + swatch('bb-yellow', 1635, 1645);
    parent.append(board);
  }
  // Demo recordings: clones of the canvas phones (same shell, video and caption), scaled in fit() to share the column.
  function recs(parent, sels) {
    const row = document.createElement('div');
    row.className = 'nearu-mobile-recs';
    sels.forEach(sel => row.append(canvas.querySelector(sel).cloneNode(true)));
    parent.append(row);
  }
  function section(name, id) {
    const el = document.createElement('section');
    el.id = 'mobile-' + name;
    el.tabIndex = -1;
    mobile.append(el);
    copy(el, id, 'nearu-mobile-heading');
    return el;
  }
  // What changed from A to B, shown under the comparison (on the desktop canvas these sit beside each phone).
  function abNotes(box) {
    [['A', 9002], ['B', 9003]].forEach(([tag, id]) => {
      const col = clone(id);
      col.classList.remove('nu-ab', 'nu-ab-a', 'nu-ab-b');
      col.classList.add('nearu-mobile-ab-col');
      const label = document.createElement('b');
      label.textContent = tag;
      col.prepend(label);
      col.classList.add(tag === 'A' ? 'is-a' : 'is-b');
      box.append(col);
    });
  }
  // "Current ecosystem" as a loop (same design as the reference: boxes on a ring joined by solid arrows, a dark core with dashed arrows from the
  // boxes that trade there). One builder, two layouts: a wide ring on the desktop canvas, a tall zig-zag ring on phones. Text is real SVG text, 16px or more.
  const LOOP = [
    { t: 'Material source', s: ['supplies', 'makers'] },
    { t: 'Seller', s: ['makes, posts', 'and sells'], hl: 1 },
    { t: 'Buyer', s: ['finds sellers', 'at fests, DMs'] },
    { t: 'Commission', s: ['pays a peer', 'to make it'] },
    { t: 'Other sellers', s: ['swap tips', 'and supplies'] }
  ];
  const LOOP_DASHED = [1, 2, 4];
  function loopSVG(cfg) {
    const { w, h, bw, bh, core, pos, uid } = cfg, [cx, cy, cw, ch] = core;
    const edge = (x, y, hw, hh, dx, dy) => { const t = Math.min(hw / Math.abs(dx || 1e-9), hh / Math.abs(dy || 1e-9)); return [x + dx * t, y + dy * t]; };
    const unit = (dx, dy) => { const l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l]; };
    let ring = '', dash = '', boxes = '';
    pos.forEach(([x, y], i) => {
      const [bx, by] = pos[(i + 1) % pos.length], [ux, uy] = unit(bx - x, by - y);
      const [sx, sy] = edge(x, y, bw / 2 + 6, bh / 2 + 6, ux, uy), [ex, ey] = edge(bx, by, bw / 2 + 8, bh / 2 + 8, -ux, -uy);
      const mx = (sx + ex) / 2, my = (sy + ey) / 2, [ox, oy] = unit(mx - cx, my - cy), len = Math.hypot(ex - sx, ey - sy);
      ring += `<path class="lp-ring" d="M${sx.toFixed(1)} ${sy.toFixed(1)} Q${(mx + ox * len * .2).toFixed(1)} ${(my + oy * len * .2).toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}" marker-end="url(#${uid}-head)"/>`;
    });
    LOOP_DASHED.forEach(i => {
      const [x, y] = pos[i], [ux, uy] = unit(cx - x, cy - y);
      const [sx, sy] = edge(x, y, bw / 2 + 6, bh / 2 + 6, ux, uy), [ex, ey] = edge(cx, cy, cw / 2 + 8, ch / 2 + 8, -ux, -uy);
      dash += `<path class="lp-dash" d="M${sx.toFixed(1)} ${sy.toFixed(1)} L${ex.toFixed(1)} ${ey.toFixed(1)}" marker-end="url(#${uid}-head)"/>`;
    });
    pos.forEach(([x, y], i) => {
      const n = LOOP[i];
      boxes += `<rect class="lp-box${n.hl ? ' lp-hl' : ''}" x="${x - bw / 2}" y="${y - bh / 2}" width="${bw}" height="${bh}" rx="8"/>` +
        `<text class="lp-title" x="${x}" y="${y - 12}" text-anchor="middle">${n.t}</text>` +
        n.s.map((t, k) => `<text class="lp-sub" x="${x}" y="${y + 12 + k * 20}" text-anchor="middle">${t}</text>`).join('');
    });
    const coreSvg = `<rect class="lp-core" x="${cx - cw / 2}" y="${cy - ch / 2}" width="${cw}" height="${ch}" rx="10"/>` +
      `<text class="lp-core-t" x="${cx}" y="${cy - 2}" text-anchor="middle">Fests</text><text class="lp-core-s" x="${cx}" y="${cy + 24}" text-anchor="middle">most sales happen here</text>`;
    return `<svg class="loop-svg" viewBox="0 0 ${w} ${h}" aria-hidden="true"><defs><marker id="${uid}-head" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="11" markerHeight="11" markerUnits="userSpaceOnUse" orient="auto"><path d="M1 1 L11 6 L1 11 Z" fill="#17120E"/></marker></defs>${dash}${ring}${boxes}${coreSvg}</svg>`;
  }
  const LOOP_WIDE = { w: 820, h: 600, bw: 176, bh: 88, core: [410, 300, 230, 88], pos: [[410, 62], [702, 228], [590, 500], [230, 500], [118, 228]], uid: 'lpd' };
  const LOOP_TALL = { w: 340, h: 530, bw: 148, bh: 92, core: [170, 320, 190, 88], pos: [[170, 52], [262, 176], [262, 464], [78, 464], [78, 176]], uid: 'lpm' };
  const desktopEco = canvas.querySelector('.nu-eco');
  if (desktopEco) desktopEco.innerHTML = loopSVG(LOOP_WIDE);
  function ecosystem(parent) {
    copy(parent, 9004, 'nearu-mobile-label');
    const box = document.createElement('div');
    box.className = 'nearu-mobile-eco';
    box.setAttribute('role', 'img');
    box.setAttribute('aria-label', source(9005).getAttribute('aria-label') || '');
    box.innerHTML = loopSVG(LOOP_TALL);
    parent.append(box);
    const note = document.createElement('ul');
    note.className = 'nearu-mobile-eco-note';
    note.innerHTML = '<li>' + source(9006).textContent.trim() + '</li>';
    parent.append(note);
  }
  // The four problem -> opportunity blocks (same markup as the desktop canvas), stacked in one column.
  function insights(parent) {
    const box = document.createElement('div');
    box.className = 'nearu-mobile-insights';
    source(1606).querySelectorAll('.nearu-insight').forEach(a => box.append(a.cloneNode(true)));
    parent.append(box);
  }
  // Reflection: the same five steps as a vertical list; each step's red circle sits behind and partly under its text.
  function reflection(parent) {
    const list = document.createElement('ol');
    list.className = 'nearu-mobile-refl';
    const fills = [['#0D57CE', '#fff'], ['#FEC12D', '#17120E'], ['#FC5956', '#fff'], ['#FEC12D', '#17120E'], ['#0D57CE', '#fff']];
    canvas.querySelectorAll('.refl-step').forEach((el, i) => {
      const [num, word] = el.querySelector('.rs-label').textContent.split('·').map(t => t.trim());
      const li = document.createElement('li');
      li.innerHTML = '<span class="refl-c" style="background:' + fills[i][0] + ';color:' + fills[i][1] + '"><b>' + num + '</b><span>' + word + '</span></span>' +
        '<div><span class="rs-title">' + el.querySelector('.rs-title').textContent + '</span><span class="rs-text">' + el.querySelector('.rs-text').textContent + '</span></div>';
      list.append(li);
    });
    parent.append(list);
    reflLines.push(list);
  }
  // Thick line through the circle centres: vertical runs with smooth S-bends, entering above and leaving below the list.
  const reflLines = [];
  function drawReflLines() {
    reflLines.forEach(list => {
      const box = list.getBoundingClientRect();
      if (!box.width) return;
      const pts = [...list.querySelectorAll('.refl-c')].map(c => {
        const r = c.getBoundingClientRect();
        return [r.left + r.width / 2 - box.left, r.top + r.height / 2 - box.top, r.height / 2];
      });
      if (!pts.length) return;
      let d = 'M' + pts[0][0] + ' ' + Math.max(-4, pts[0][1] - pts[0][2] - 44) + ' L' + pts[0][0] + ' ' + pts[0][1];
      for (let i = 0; i < pts.length - 1; i++) {
        const [x1, y1, r] = pts[i], [x2, y2] = pts[i + 1], g = 8, k = 46;
        d += ' L' + x1 + ' ' + (y1 + r + g) + ' C' + x1 + ' ' + (y1 + r + g + k) + ' ' + x2 + ' ' + (y2 - r - g - k) + ' ' + x2 + ' ' + (y2 - r - g) + ' L' + x2 + ' ' + y2;
      }
      const last = pts[pts.length - 1];
      d += ' L' + last[0] + ' ' + (box.height + 80);
      let svg = list.querySelector('.nearu-mobile-refl-line');
      if (!svg) {
        svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'nearu-mobile-refl-line');
        svg.setAttribute('aria-hidden', 'true');
        svg.innerHTML = '<path/>';
        list.prepend(svg);
      }
      svg.setAttribute('viewBox', '0 0 ' + box.width + ' ' + box.height);
      svg.firstChild.setAttribute('d', d);
    });
  }
  function phones(parent, ids, captions = []) {
    const row = document.createElement('div');
    row.className = 'nearu-mobile-phones';
    ids.forEach((id, i) => {
      const figure = document.createElement('figure');
      const img = source(id).querySelector('img').cloneNode(true);
      img.className = 'nearu-phone-frame'; img.loading = 'lazy'; img.decoding = 'async';
      figure.append(img);
      if (captions[i]) copy(figure, captions[i], 'nearu-mobile-caption');
      row.append(figure);
    });
    parent.append(row);
  }
  function flow(parent, id) {
    const link = clone(id);
    link.className = 'nearu-mobile-flow nearu-image-link';
    const img = link.querySelector('img');
    img.className = ''; img.loading = 'lazy'; img.decoding = 'async';
    parent.append(link);
  }
  plate(mobile, [1566], 404, 37, 998, 281);
  // Tag pills: real pills on one paper row (28px), left-aligned, same colours / border / shadow / hover as the canvas ones.
  const tagRow = document.createElement('div');
  tagRow.className = 'nearu-mobile-tags';
  tagRow.innerHTML = '<span>' + source(1689).textContent.trim() + '</span><span>' + source(1691).textContent.trim() + '</span>';
  mobile.append(tagRow);
  copy(mobile, 1535, 'nearu-mobile-title');
  copy(mobile, 1546);
  // Project facts chip: the desktop panel's four columns as a 2 x 2 grid at readable size.
  const fact = (h, v) => '<div class="nearu-fact"><p class="nearu-fact-h">' + h + '</p><p class="nearu-fact-v">' + v.join('<br>') + '</p></div>';
  const facts = document.createElement('div');
  facts.className = 'nearu-mobile-facts';
  facts.innerHTML = fact('Teammates', ['Siddhi Bhavya', 'Ridhi Lakhina', 'Naaysha Doshi']) + fact('Timeline', ['May 2026', 'Jul to Aug 2026']) +
    fact('My Role', ['Design', 'Research', 'Interactions']) + fact('Skills', ['Interaction Design', 'Prototyping', 'Figma']);
  mobile.append(facts);
  // Try demo pill: a clone of the canvas pill (same label, colours, hover), as wide as the column on phones; the click is delegated in js/nearu-demo.js.
  mobile.append(canvas.querySelector('.nu-demo').cloneNode(true));
  vid(mobile, 1585, 'is-demo');

  let s = section('context', 1537);
  copy(s, 1536, 'nearu-mobile-subtitle'); copy(s, 1547); copy(s, 9100, 'nearu-mobile-label'); block(s, 9101, 'nearu-mobile-gigs'); copy(s, 9102, 'nearu-mobile-label'); copy(s, 9103);
  s = section('solution', 1538);
  copy(s, 1549);
  plate(s, [1521,1522,1575,1577,1578,1579,1630], 480, 2270, 765, 407);   // the blue frame, logo chip, wordmark film and captions, as before
  const art = s.querySelector('.nearu-mobile-art-layers');   // the two phone slots hold the buyer / seller recordings
  ['.nu-rec-seller', '.nu-rec-buyer'].forEach(sel => art.append(canvas.querySelector(sel).cloneNode(true)));
  s = section('ideation', 1539);
  copy(s, 1550);
  const cap = sel => { const el = canvas.querySelector(sel).cloneNode(true); el.classList.add('nearu-mobile-copy'); s.append(el); return el; };   // her captions, cloned from the canvas
  const shot = sel => { const el = canvas.querySelector(sel).cloneNode(true); s.append(el); return el; };   // a screenshot board
  // First look: logo, film, first design screens. Final look: logo, film, final screens, design system. Then the paragraph.
  copy(s, 1583, 'nearu-mobile-label'); plate(s, [1587], 392, 3026, 240, 78); cap('.nu-cap-near'); vid(s, 1581, 'is-wire'); shot('.nu-ide-first'); cap('.nu-cap-first');
  copy(s, 1584, 'nearu-mobile-label'); plate(s, [1596], 1260, 3026, 154, 88); cap('.nu-cap-neu'); vid(s, 1582, 'is-wire');
  // Final screens and the design system sit side by side (two columns) on phones and tablets.
  { const row = document.createElement('div'); row.className = 'nearu-mobile-final-row';
    const left = document.createElement('div'); left.append(canvas.querySelector('.nu-ide-final').cloneNode(true));
    const wrap = document.createElement('div'); wrap.className = 'nu-ide-wrap'; ['.nu-ide-variants', '.nu-cap-ds'].forEach(sel => wrap.append(canvas.querySelector(sel).cloneNode(true)));
    const note = canvas.querySelector('.nu-cap-final').cloneNode(true); note.classList.add('nearu-mobile-copy'); const right = document.createElement('div'); right.append(wrap, note); row.append(left, right); s.append(row); }   // the caption fills the space under the design-system board
  copy(s, 1586);
  const abRow = document.createElement('div');
  abRow.className = 'nearu-mobile-ab';
  s.append(abRow);
  plate(abRow, [1599,1600,1601,1602,1631,1632], 671, 3608, 460, 452);   // x/width follow nu-103's desktop left:691 (recentred +61px) and nu-105's right edge at 1105 — keep in sync if either moves
  abNotes(abRow);
  copy(s, 1603);

  s = section('research', 1540);
  copy(s, 1604); copy(s, 1541, 'nearu-mobile-label'); copy(s, 1605);
  copy(s, 1614, 'nearu-mobile-label'); block(s, 9020);   // how students sell today: the colourful treemap, stacked
  ecosystem(s);
  copy(s, 1542, 'nearu-mobile-label'); insights(s);
  block(s, 9022);                                          // user persona on torn paper
  copy(s, 1621, 'nearu-mobile-label'); block(s, 9021);   // user needs treemap
  copy(s, 1544, 'nearu-mobile-label'); copy(s, 1564);

  s = section('design', 1543);
  copy(s, 1640, 'nearu-mobile-label');
  brandBoard(s);
  plate(s, [1647,1664], 509, 8784, 724, 421);   // logo + packaging artwork (original y, before the shift table runs)
  copy(s, 1639, 'nearu-mobile-label');
  phones(s, [1652,1653,1654,1655], [1659,1656,1657,1658]);
  copy(s, 1710);
  phones(s, [1667,1668,1672,1670], [1660,1661,1662,1663]);
  copy(s, 1676, 'nearu-mobile-label'); flow(s, 1678);
  copy(s, 1677, 'nearu-mobile-label'); flow(s, 1684);

  s = section('onboarding', 1674);
  phones(s, [1680,1681,1682,1683]);
  copy(s, 1711);
  recs(s, ['.nu-rec-onboarding', '.nu-rec-dark']);
  s = section('scope', 1675);
  copy(s, 1712); copy(s, 1713);

  s = section('reflection', 9010);
  reflection(s);

  // Images retain reserved geometry, including before decode on a slow connection.
  // the tag pills' bottom edge sits on a paper rule (28px rows, phase 20), like Syncletter's
  function alignTags() {
    if (innerWidth >= 900) return;
    tagRow.style.position = 'relative'; tagRow.style.top = '0px';
    const bottom = tagRow.getBoundingClientRect().bottom - mobile.getBoundingClientRect().top;
    const off = (((20 - bottom) % 28) + 28) % 28;
    tagRow.style.top = (off ? off - 28 : 0) + 'px';   // up to the rule above: the pills hug the hero image instead of the title
  }
  function fit() {
    if (innerWidth >= 900) return;
    mobile.querySelectorAll('.nearu-mobile-recs').forEach(row => {
      const n = row.children.length, gap = 20, room = Math.min(row.clientWidth, 560) - gap * (n - 1);
      row.querySelectorAll('.nu-rec').forEach(r => r.style.setProperty('--s', Math.min(.5597, room / n / 402).toFixed(4)));
    });
    plates.forEach(({box,stage,width,height}) => {
      const scale = Math.min(1, box.clientWidth / width);
      stage.style.transform = 'scale(' + scale + ')';
      stage.style.marginLeft = Math.max(0, (box.clientWidth - width * scale) / 2) + 'px';   // plates narrower than the column sit centred, not hugging the left edge
      box.style.height = Math.ceil(height * scale / 28) * 28 + 'px';
      // Text inside a scaled plate: make each line exactly one paper row (28px) on screen so every line sits on a rule.
      // …and never let it render under 16px: grow the font to 16/scale where the plate is scaled down a lot.
      [...box.querySelectorAll('.nu-93, .nu-94, .nu-153, .nu-154, .nu-165, .nu-84, .nu-85')].filter(t => !t.classList.contains('nu-165') || t.textContent.trim() === 'Logo').forEach(t => {
        t.style.fontSize = ''; t.style.lineHeight = (28 / scale) + 'px';
        const nominal = parseFloat(getComputedStyle(t).fontSize);
        if (nominal * scale < 16) t.style.fontSize = (16 / scale) + 'px';
      });
    });
  }
  new ResizeObserver(() => { fit(); alignTags(); drawReflLines(); }).observe(mobile);
  addEventListener('resize', () => { fit(); alignTags(); });   // belt and braces: some browsers report the final width only after load / rotation
  addEventListener('load', () => { fit(); alignTags(); drawReflLines(); });
  addEventListener('load', () => requestAnimationFrame(alignTags));
  document.fonts.ready.then(drawReflLines);
  fit();
})();
