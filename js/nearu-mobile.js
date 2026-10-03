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
  function section(name, id) {
    const el = document.createElement('section');
    el.id = 'mobile-' + name;
    el.tabIndex = -1;
    mobile.append(el);
    copy(el, id, 'nearu-mobile-heading');
    return el;
  }
  function card(parent, id) {
    const box = document.createElement('div');
    box.className = 'nearu-mobile-card';
    copy(box, id); parent.append(box);
  }
  // The desktop canvas draws this as a mind map (two cards, a centre title, a third card). On a phone the three cards
  // can't sit side by side at readable size, so keep the map idea: a centre hub on a trunk with cards branching left/right.
  function mindmap(parent, ids, hubId) {
    const map = document.createElement('div');
    map.className = 'nearu-mobile-map';
    copy(map, hubId, 'nearu-mobile-hub');
    ids.forEach(id => card(map, id));
    parent.append(map);
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
  // "Current ecosystem" chart: a tall version of the desktop diagram (same NearU yellow/blue/black), sized for a phone.
  function ecosystem(parent) {
    copy(parent, 9004, 'nearu-mobile-label');
    const K = '#17120E';
    const nodes = [[56,62,50,'SELLER','y',K],[170,62,50,'MATERIAL|SOURCE','b','#fff'],[284,62,50,'OTHER|SELLER','y',K],
      [170,232,64,'FEST','r','#fff'],[56,402,50,'BUYER','w',K],[170,402,50,'COMMISSION','b','#fff'],[284,402,50,'SELLER','y',K]];
    const stops = {"y": [[0, "#FEC12D", 1], [0.62, "#FEC12D", 1], [0.85, "#FEC12D", 0.9], [1, "#FEC12D", 0]], "b": [[0, "#0D57CE", 1], [0.62, "#0D57CE", 1], [0.85, "#0D57CE", 0.9], [1, "#0D57CE", 0]], "w": [[0, "#FFFAEB", 1], [0.62, "#FFFAEB", 1], [0.85, "#FFFAEB", 0.9], [1, "#FFFAEB", 0]], "r": [[0, "#FC5956", 1], [0.62, "#FC5956", 1], [0.85, "#FC5956", 0.9], [1, "#FC5956", 0]]};
    const defs = Object.entries(stops).map(([k, st]) => `<radialGradient id="eco-${k}-m" cx=".5" cy=".5" r=".5">${st.map(([p,c,o]) => `<stop offset="${p}" stop-color="${c}" stop-opacity="${o}"/>`).join('')}</radialGradient>`).join('');
    const halo = nodes.map(([x,y,r]) => `<circle cx="${x}" cy="${y}" r="${r-4}" fill="rgba(254,193,45,.5)"/>`).join('');
    const bridges = [[56,62,284,62],[170,62,170,232],[170,232,170,402],[56,402,284,402]].map(([a,b,c,d]) =>
      `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke="rgba(254,193,45,.5)" stroke-width="40" stroke-linecap="round"/>`).join('');
    const shapes = nodes.map(([x,y,r,,g]) => `<circle cx="${x}" cy="${y}" r="${r+8}" fill="url(#eco-${g}-m)"/>` + (g === 'w' ? `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${K}" stroke-width="3"/>` : '')).join('');
    const labels = nodes.map(([x,y,,l,,c]) => l.split('|').map((t,i,a) =>
      `<text${t === 'FEST' ? ' class="eco-fest"' : ''} x="${x}" y="${y + (i - (a.length - 1) / 2) * 14 + 4}" text-anchor="middle" fill="${c}">${t}</text>`).join('')).join('');
    const ln = (a,b,c,d,st,en) => `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}"${st ? ' marker-start="url(#eco-head-m)"' : ''}${en ? ' marker-end="url(#eco-head-m)"' : ''}/>`;
    const links = ln(108,62,118,62,1,1) + ln(222,62,232,62,1,1) + ln(170,120,170,160,1,1) + ln(170,304,170,344,1,1) +
      ln(108,402,118,402,0,1) + ln(222,402,232,402,0,1);
    const box = document.createElement('div');
    box.className = 'nearu-mobile-eco';
    box.innerHTML = `<svg viewBox="0 0 340 464" role="img" aria-label="Current campus commerce ecosystem: a seller trades with a material source and other sellers; fests link sellers to buyers; a buyer pays a commission to a seller.">
      <defs>${defs}
        <filter id="eco-blur-m" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="10"/></filter>
        <filter id="eco-grain-m" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7" result="n"/><feColorMatrix in="n" type="saturate" values="0" result="g"/><feComponentTransfer in="g" result="g2"><feFuncR type="linear" slope=".55" intercept=".5"/><feFuncG type="linear" slope=".55" intercept=".5"/><feFuncB type="linear" slope=".55" intercept=".5"/></feComponentTransfer><feComposite in="g2" in2="SourceAlpha" operator="in" result="gm"/><feBlend in="gm" in2="SourceGraphic" mode="multiply"/></filter>
        <marker id="eco-head-m" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M1 0.5 L11 6 L1 11.5 Z" fill="${K}"/></marker>
      </defs>
      <g filter="url(#eco-blur-m)">${halo}${bridges}</g><g filter="url(#eco-grain-m)">${shapes}</g><g class="eco-links">${links}</g><g class="eco-labels">${labels}</g></svg>`;
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
  plate(mobile, [1585], 458, 1082, 890, 572);

  let s = section('context', 1537);
  copy(s, 1536, 'nearu-mobile-subtitle'); copy(s, 1547);
  s = section('solution', 1538);
  copy(s, 1549);
  plate(s, [1521,1522,1575,1576,1577,1578,1579,1580,1630], 480, 2270, 765, 407);
  s = section('ideation', 1539);
  copy(s, 1550);
  plate(s, [1581,1583,1587], 427, 2976, 899, 284);
  plate(s, [1582,1584,1596], 470, 3301, 863, 284);
  copy(s, 1586);
  const abRow = document.createElement('div');
  abRow.className = 'nearu-mobile-ab';
  s.append(abRow);
  plate(abRow, [1599,1600,1601,1602,1631,1632], 671, 3608, 460, 452);   // x/width follow nu-103's desktop left:691 (recentred +61px) and nu-105's right edge at 1105 — keep in sync if either moves
  abNotes(abRow);
  copy(s, 1603);

  s = section('research', 1540);
  copy(s, 1604); copy(s, 1541, 'nearu-mobile-label'); copy(s, 1605);
  mindmap(s, [1608, 1610, 1613], 1614);   // hub ("HOW STUDENTS SELL TODAY") + its three branches, still a mind map on small screens
  ecosystem(s);
  copy(s, 1542, 'nearu-mobile-label'); insights(s);
  copy(s, 1545, 'nearu-mobile-label');
  plate(s, [1520,1615,1616], 370, 6929, 350, 400);
  copy(s, 1617);
  // User needs: the desktop diagram (two boxes under a bracket) can't hold 16px text when scaled to a phone, so stack the two needs as cards.
  copy(s, 1621, 'nearu-mobile-label'); card(s, 1628); card(s, 1629);
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
