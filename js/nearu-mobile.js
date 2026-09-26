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
  plate(mobile, [1687,1688,1689,1691], 420, 382, 444, 50);
  copy(mobile, 1535, 'nearu-mobile-title');
  copy(mobile, 1546);
  plate(mobile, [1552,1553,1565], 414, 766, 930, 260);
  plate(mobile, [1585], 458, 1082, 890, 572);

  let s = section('context', 1537);
  copy(s, 1536, 'nearu-mobile-subtitle'); copy(s, 1547);
  s = section('solution', 1538);
  copy(s, 1549);
  plate(s, [1521,1522,1575,1576,1577,1578,1579,1580,1630], 480, 2352, 765, 407);
  s = section('ideation', 1539);
  copy(s, 1550);
  plate(s, [1581,1583,1587], 427, 3058, 899, 247);
  plate(s, [1582,1584,1596], 470, 3294, 856, 247);
  copy(s, 1586);
  plate(s, [1599,1600,1601,1602,1631,1632], 620, 3690, 440, 452);
  copy(s, 1603);

  s = section('research', 1540);
  copy(s, 1604); copy(s, 1541, 'nearu-mobile-label'); copy(s, 1605);
  card(s, 1608); card(s, 1610);
  copy(s, 1614, 'nearu-mobile-label'); card(s, 1613);
  copy(s, 1542, 'nearu-mobile-label'); copy(s, 1606);
  copy(s, 1545, 'nearu-mobile-label');
  plate(s, [1520,1615,1616], 370, 6191, 350, 400);
  copy(s, 1617);
  plate(s, [1618,1619,1620,1621,1622,1623,1624,1625,1626,1627,1628,1629], 500, 6810, 685, 635);
  copy(s, 1544, 'nearu-mobile-label'); copy(s, 1564);

  s = section('design', 1543);
  plate(s, [1633,1634,1635,1636,1637,1638,1640,1641,1642,1643,1644,1645,1646,1647,1664], 473, 7813, 774, 655);
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

  // Images retain reserved geometry, including before decode on a slow connection.
  function fit() {
    if (innerWidth >= 900) return;
    plates.forEach(({box,stage,width,height}) => {
      const scale = Math.min(1, box.clientWidth / width);
      stage.style.transform = 'scale(' + scale + ')';
      box.style.height = Math.ceil(height * scale / 28) * 28 + 'px';
    });
  }
  new ResizeObserver(fit).observe(mobile);
  fit();
})();
