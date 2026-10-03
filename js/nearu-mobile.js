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
  vid(mobile, 1585, 'is-demo');

  let s = section('context', 1537);
  copy(s, 1536, 'nearu-mobile-subtitle'); copy(s, 1547);
  s = section('solution', 1538);
  copy(s, 1549);
  plate(s, [1521,1522,1575,1576,1577,1578,1579,1580,1630], 480, 2270, 765, 407);
  s = section('ideation', 1539);
  copy(s, 1550);
  copy(s, 1583, 'nearu-mobile-label'); vid(s, 1581, 'is-wire'); plate(s, [1587], 1021, 3030, 260, 84);
  copy(s, 1584, 'nearu-mobile-label'); vid(s, 1582, 'is-wire'); plate(s, [1596], 470, 3301, 230, 167);
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
  plate(s, [1633,1634,1635,1636,1637,1638,1640,1641,1642,1643,1644,1645,1646,1647,1664], 473, 8551, 774, 655);
  copy(s, 1639, 'nearu-mobile-label');
  phones(s, [1652,1653,1654,1655], [1659,1656,1657,1658]);
  copy(s, 1710);
  phones(s, [1667,1668,1672,1670], [1660,1661,1662,1663]);
  copy(s, 1676, 'nearu-mobile-label'); flow(s, 1678);
  copy(s, 1677, 'nearu-mobile-label'); flow(s, 1684);

  s = section('onboarding', 1674);
  phones(s, [1680,1681,1682,1683]);
  copy(s, 1711);
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
    tagRow.style.top = ((((20 - bottom) % 28) + 28) % 28) + 'px';
  }
  function fit() {
    if (innerWidth >= 900) return;
    plates.forEach(({box,stage,width,height}) => {
      const scale = Math.min(1, box.clientWidth / width);
      stage.style.transform = 'scale(' + scale + ')';
      stage.style.marginLeft = Math.max(0, (box.clientWidth - width * scale) / 2) + 'px';   // plates narrower than the column sit centred, not hugging the left edge
      box.style.height = Math.ceil(height * scale / 28) * 28 + 'px';
      // Text inside a scaled plate: make each line exactly one paper row (28px) on screen so every line sits on a rule.
      // …and never let it render under 16px: grow the font to 16/scale where the plate is scaled down a lot.
      [...box.querySelectorAll('.nu-93, .nu-94, .nu-153, .nu-154, .nu-165')].filter(t => !t.classList.contains('nu-165') || t.textContent.trim() === 'Brand').forEach(t => {
        t.style.fontSize = ''; t.style.lineHeight = (28 / scale) + 'px';
        const nominal = parseFloat(getComputedStyle(t).fontSize);
        if (nominal * scale < 16) t.style.fontSize = (16 / scale) + 'px';
      });
    });
  }
  new ResizeObserver(() => { fit(); alignTags(); drawReflLines(); }).observe(mobile);
  addEventListener('load', () => requestAnimationFrame(alignTags));
  document.fonts.ready.then(drawReflLines);
  fit();
})();
