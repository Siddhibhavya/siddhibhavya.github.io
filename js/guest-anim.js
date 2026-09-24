/* Welcome Aboard: the "Create" choreography (guest-book.html only). Loaded after js/guest.js, which calls SiddhiGuest.play(mine, past, card).

   Cards flip and shrink, then the cards and two broad strings leave together.
   Thank You reveals from the left, settles with a small bounce, then slides up into Home. */
(function () {
  'use strict';
  const G = window.SiddhiGuest;
  if (!G) { console.error('[guest-anim] js/guest.js must load first'); return; }
  const { $, reduce, cardEl, goHome } = G;

  /* ------------------------------------------------------------------ 1 · Timing (ms) — change the feel here */
  const T = 6450;                    // two extra seconds for strings/cards, then the text and Home
  const D = 240;                    // gentle follow-through keeps the reference loops clearly defined
  const FLIGHT = 1100;               // one complete flip as our card shrinks into the strip
  const HOLD = 1600;                 // reduced-motion reading time before Home
  const SLIDE_MS = 4850, EXIT_K = 9.2;   // cards and strings finish together
  const THANKS_MS = 3000;            // reveal while the strings are still in frame
  const STRING_MS = 2850;            // original path clock, stretched across SLIDE_MS
  const ORANGE_DELAY = 120;          // the orange line follows a beat behind the green one
  const STEP = [-194, 62];           // the strip's slide per Figma step (state 1 -> 2)
  const SLOTS = [{ x: 86, y: 184 }, { x: 470, y: 538 }, { x: 846, y: 192 }, { x: 1230, y: 546 }];   // Figma slots; the 4th is the third "past" card entering at the edge
  const CARD = { w: 507, h: 274, pl: 12, pt: 8, pw: 436, ph: 257 };

  /* Reference Figma curves, including the portions passing behind the cards. */
  const GREEN = [
    { off: [-72, 171.1595916748047], d: 'M0 670.04931640625C0 670.04931640625 392.9632263183594 303.3006896972656 719.5211791992188 624.5504150390625C1046.0791320800781 945.8001403808594 1325 551.8403472900391 945.29931640625 197.66749572753906C565.5986328125 -156.50535583496094 1318 10.34039306640625 1305 343.84033203125C1292 677.3402709960938 1519.5 715.3403930664062 1519.5 629.840576171875' },
    { off: [-13.5, 189.89683532714844], d: 'M1465 148.10317993164062C1422 174.10316467285156 770.1932678222656 -231.46615600585938 918.241943359375 199.3489990234375C1066.2906188964844 630.1641540527344 1014.6979064941406 885.3195495605469 702.1506958007812 586.56982421875C389.6034851074219 287.8200988769531 0 609.1031494140625 0 609.1031494140625' },
    { off: [-8.5, 30.608810424804688], d: 'M1457.5 40.39117431640625C1183.5 -66.10879516601562 676.5 31.612884521484375 1096.5 409.89117431640625C1516.5 788.1694641113281 757.7991943359375 1062.4247436523438 539.5 732.3911743164062C321.2008056640625 402.35760498046875 0 302.39117431640625 0 302.39117431640625' }
  ];
  const ORANGE = [
    { off: [-1, 17], d: 'M0 0C0 0 72.86075592041016 190.03260040283203 164.5 275.5C258.5666046142578 363.23128509521484 331.85939025878906 406.0883483886719 459.5 422C578.6712875366211 436.8558683395386 650.3555755615234 409.4907646179199 761.5 364C893.15380859375 310.11486053466797 922.3675537109375 196.93949127197266 1057 151C1166.4710159301758 113.64613342285156 1236.5817794799805 116.89418077468872 1352 124.5C1394.799560546875 127.32040143013 1461 138 1461 138' },
    { off: [7.5, 166], d: 'M0 0C125.8208999633789 45.57537841796875 194.37943267822266 83.68888854980469 299.5 166.5C428.4195556640625 268.0592956542969 438.2151641845703 391.64893341064453 572.5 486C725.2831420898438 593.3483276367188 840.7490692138672 666.0822277069092 1025.5 639C1232.6660766601562 608.631986618042 1442.5 302 1442.5 302' },
    { off: [-5.5, 9.722223281860352], d: 'M0 438.77783203125C33.814720153808594 332.25054931640625 154.64603424072266 110.25404739379883 250.5 52.77783966064453C352.84010314941406 -8.587604522705078 752.5 -105.72225952148438 977.5 357.2777404785156C1202.5 820.2777404785156 1327.328456878662 498.9440689086914 1382 584.77734375C1422.8142776489258 648.85498046875 1427 719.2777709960938 1457 764.27734375' }
  ];

  /* ------------------------------------------------------------------ 3 · String maths */
  const PHONE = window.matchMedia('(max-width: 759px)').matches;                   // phones do the same shape with about half the points: far less work per frame
  const BODY_N = PHONE ? 150 : 301, LEAD_N = PHONE ? 12 : 24, LEAD_LEN = 900;      // samples along the line; straight lead-in/out so it reaches any screen edge
  const lerp = (a, b, f) => a + (b - a) * f;
  const rand = (a, b) => a + Math.random() * (b - a);
  const unit = (a, b) => { const dx = a[0] - b[0], dy = a[1] - b[1], l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l]; };
  const bez = (a, b, c, d, w) => { const u = 1 - w; return [u * u * u * a[0] + 3 * u * u * w * b[0] + 3 * u * w * w * c[0] + w * w * w * d[0], u * u * u * a[1] + 3 * u * u * w * b[1] + 3 * u * w * w * c[1] + w * w * w * d[1]]; };
  // Quintic Hermite keeps both velocity and acceleration continuous at the middle shape.
  const curve = (a, b, c, d, u) => {
    const v0 = (c - a) / 2, v1 = (d - b) / 2, delta = c - b;
    return b + v0 * u + u * u * u * ((10 * delta - 6 * v0 - 4 * v1) + u * ((-15 * delta + 8 * v0 + 7 * v1) + u * (6 * delta - 3 * v0 - 3 * v1)));
  };
  const stringEase = (x) => { const u = Math.min(1, Math.max(0, x)); return u * u * u * (10 + u * (-15 + 6 * u)); };
  const sm = (a, b, x) => { const v = Math.min(1, Math.max(0, (x - a) / (b - a))); return v * v * (3 - 2 * v); };
  const polyD = (pts) => {                                          // a smooth curve through the points: quadratic curves between the mid-points of neighbours (no visible corners)
    const n = pts.length, f = (v) => v.toFixed(2);
    if (n < 3) return 'M' + pts.map((q) => f(q[0]) + ' ' + f(q[1])).join('L');
    let d = 'M' + f(pts[0][0]) + ' ' + f(pts[0][1]);
    for (let i = 1; i < n - 1; i++) d += 'Q' + f(pts[i][0]) + ' ' + f(pts[i][1]) + ' ' + f((pts[i][0] + pts[i + 1][0]) / 2) + ' ' + f((pts[i][1] + pts[i + 1][1]) / 2);
    return d + 'L' + f(pts[n - 1][0]) + ' ' + f(pts[n - 1][1]);
  };

  /* A Figma path (absolute cubic Beziers) -> [tail ... head] points, tail = the left end. The three states of a line don't all run the same way
     in Figma and don't have the same number of segments, so every line is resampled evenly by arc length: point i of one state then corresponds
     to point i of the next. */
  function sampleKey(raw) {
    const nums = raw.d.match(/-?\d*\.?\d+(?:e-?\d+)?/gi).map(Number), ctl = [];
    for (let i = 0; i < nums.length; i += 2) ctl.push([nums[i] + raw.off[0], nums[i + 1] + raw.off[1]]);
    if (ctl[0][0] > ctl[ctl.length - 1][0]) ctl.reverse();
    const dense = [ctl[0]], cum = [0];
    for (let c = 0; c + 3 < ctl.length; c += 3) {
      for (let j = 1; j <= 90; j++) {
        const w = j / 90, p = bez(ctl[c], ctl[c + 1], ctl[c + 2], ctl[c + 3], w), q = dense[dense.length - 1];
        dense.push(p); cum.push(cum[cum.length - 1] + Math.hypot(p[0] - q[0], p[1] - q[1]));
      }
    }
    const body = [], total = cum[cum.length - 1];
    for (let i = 0, k = 0; i < BODY_N; i++) {
      const target = (total * i) / (BODY_N - 1);
      while (k < cum.length - 2 && cum[k + 1] < target) k++;
      const span = cum[k + 1] - cum[k] || 1, f = (target - cum[k]) / span;
      body.push([lerp(dense[k][0], dense[k + 1][0], f), lerp(dense[k][1], dense[k + 1][1], f)]);
    }
    const td = unit(body[0], body[4]), hd = unit(body[BODY_N - 1], body[BODY_N - 5]), out = [];
    const tail = body[0], head = body[BODY_N - 1];
    const left = [tail[0] - LEAD_LEN, tail[1] + td[1] * 180];
    const right = [head[0] + LEAD_LEN, head[1] + hd[1] * 180];
    for (let j = 0; j < LEAD_N; j++) out.push(bez(left, [left[0] + 300, left[1]], [tail[0] + td[0] * 180, tail[1] + td[1] * 180], tail, j / LEAD_N));
    for (const p of body) out.push(p);
    for (let j = 1; j <= LEAD_N; j++) out.push(bez(head, [head[0] + hd[0] * 180, head[1] + hd[1] * 180], [right[0] - 300, right[1]], right, j / LEAD_N));
    return out;
  }
  const keysOf = (states) => states.map((r) => sampleKey(r));
  const KEYS_G = keysOf(GREEN), KEYS_O = keysOf(ORANGE);
  const NP = KEYS_G[0].length;

  /* Every point travels the same route through the three states, but starts later the further it is from the head. So where two states don't
     line up (the angles differ) the head goes to the next shape first and the body follows through behind it, instead of the whole line wobbling. */
  const keyPoint = (KEYS, i, p) => {                                 // smooth position, velocity and acceleration through all three states
    const A = KEYS[0][i], B = KEYS[1][i], C = KEYS[2][i];
    const [a, b, c, d, u] = p <= 1 ? [A, A, B, C, p] : [A, B, C, C, p - 1];
    return [curve(a[0], b[0], c[0], d[0], u), curve(a[1], b[1], c[1], d[1], u)];
  };
  function stringD(KEYS, t, delay, exit = 0) {
    const pts = new Array(NP);
    t -= delay;
    for (let i = 0; i < NP; i++) {
      const tau = Math.min(1, Math.max(0, (t - D * (1 - i / (NP - 1))) / (STRING_MS - D - delay)));
      pts[i] = keyPoint(KEYS, i, 2 * stringEase(tau));
    }
    // Reveal by distance, not sample index: the long lead-in and dense loops move at the same pace.
    const lengths = [0];
    for (let i = 1; i < NP; i++) lengths.push(lengths[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const front = stringEase(t / 1150) * lengths[NP - 1];
    const back = exit * lengths[NP - 1];
    if (back >= front) return '';
    const at = (distance) => {
      let n = 0;
      while (n < NP - 2 && lengths[n + 1] < distance) n++;
      const f = (distance - lengths[n]) / (lengths[n + 1] - lengths[n] || 1);
      return [lerp(pts[n][0], pts[n + 1][0], f), lerp(pts[n][1], pts[n + 1][1], f)];
    };
    // The head draws left-to-right; the tail follows along that same continuous curve.
    const seg = [at(back)];
    for (let i = 1; i < NP - 1; i++) if (lengths[i] > back && lengths[i] < front) seg.push(pts[i]);
    seg.push(at(front));
    return polyD(seg);
  }

  /* ------------------------------------------------------------------ 3b · Background stars and fish-bone patches
     Each one wanders off on its own loose, randomised path that generally trends left-to-right (never back the way it came), so the whole
     background feels like it's flowing past, roughly finishing as "Thank You" settles in. Driven here (not the old straight-line CSS fly-off in
     guest.css), so every play() looks a little different. */
  function driftDecor(main) {
    const els = [...main.querySelectorAll('.gb-decor .dc')];
    const TXT = { x0: 167, y0: 331, x1: 1137, y1: 643 };                 // the raw "Thank You / for contributing!" box (measured, .ov-thanks)
    const outsideText = (x, y) => Math.hypot(Math.max(TXT.x0 - x, 0, x - TXT.x1), Math.max(TXT.y0 - y, 0, y - TXT.y1));
    const GAP = 26, TEXT_MARGIN = 50;
    // No fade, and it does not leave: each one wanders to a new resting spot nearby, clear of the thank-you text — only the strings (leave(), below)
    // actually exit the screen. Landing spots are chosen the same way js/guest.js scatters the page's own decorations: try a lot of candidate spots
    // (biased rightward, but reaching in any direction so there is always room somewhere), keep the roomiest, shrinking the required gap a little each
    // round if the bigger ones can't otherwise fit — so 15 of them can share the screen without a visitor's card and the text ending up crowded.
    const items = els.map((el) => {
      const cx = parseFloat(el.style.getPropertyValue('--cx')) || 0, cy = parseFloat(el.style.getPropertyValue('--cy')) || 0;
      const w = parseFloat(el.style.getPropertyValue('--w')) || 200, h = parseFloat(el.style.getPropertyValue('--h')) || 200;
      const baseR = parseFloat(el.style.getPropertyValue('--r')) || 0;
      const fish = el.classList.contains('fish');
      const swayX = rand(12, 30), swayY = rand(10, 26), swayR = rand(4, 12);
      const bodyHalf = (fish ? 0.35 : 0.42) * Math.max(w, h);            // how much room it really takes up (same formula as js/guest.js, scatterDecor)
      const reach = bodyHalf + Math.max(swayX, swayY);                  // plus the sway it will do
      return { el, cx, cy, baseR, swayX, swayY, swayR, bodyHalf, reach, dxEnd: 0, dyEnd: 0 };
    }).sort((a, b) => b.bodyHalf - a.bodyHalf);                          // biggest (pickiest) first
    for (let squeeze = 1, round = 0; round < 14; round++, squeeze *= 0.92) {
      const placed = []; let ok = true;
      for (const it of items) {
        let best = null;
        for (let k = 0; k < 500 && (!best || k < 160); k++) {
          const dx = rand(-260, 700), dy = rand(-420, 420);              // where it could end up, generally biased to the right but free to go any way
          const fx = it.cx + dx, fy = it.cy + dy;
          if (fx < it.reach * 0.6 || fx > 1448 - it.reach * 0.6 || fy < it.reach * 0.6 || fy > 1024 - it.reach * 0.6) continue;   // stays on the stage
          if (outsideText(fx, fy) < it.reach + TEXT_MARGIN - 20) continue;                                                        // clear of the text
          let room = Infinity;
          for (const p of placed) room = Math.min(room, Math.hypot(p.fx - fx, p.fy - fy) - (p.it.bodyHalf + it.bodyHalf + GAP) * squeeze);
          if (room < 0) continue;
          if (!best || room > best.room) best = { fx, fy, room };
        }
        if (!best) { ok = false; break; }
        placed.push({ it, fx: best.fx, fy: best.fy });
      }
      if (!ok) continue;
      for (const { it, fx, fy } of placed) { it.dxEnd = fx - it.cx; it.dyEnd = fy - it.cy; }
      break;                                                             // everyone found a spot: done (if every round fails, they simply don't drift)
    }
    items.forEach(({ el, baseR, swayX, swayY, swayR, dxEnd, dyEnd }) => {
      const dx1 = dxEnd * rand(0.25, 0.4), dy1 = rand(-60, 60);          // a light wander first, not yet committed to a direction
      const dx2 = dxEnd * rand(0.65, 0.85), dy2 = rand(-100, 100);       // picking up speed, heading right
      const spin = rand(-35, 35);
      // after it settles (by ~40% in), a slow figure-of-eight-ish sway around that spot — small, so it never wanders back onto the text
      el.animate([
        { translate: '0px 0px', rotate: baseR + 'deg', offset: 0 },
        { translate: `${dx1.toFixed(0)}px ${dy1.toFixed(0)}px`, rotate: (baseR + spin * 0.4).toFixed(1) + 'deg', offset: 0.16 },
        { translate: `${dx2.toFixed(0)}px ${dy2.toFixed(0)}px`, rotate: (baseR + spin * 0.75).toFixed(1) + 'deg', offset: 0.32 },
        { translate: `${dxEnd.toFixed(0)}px ${dyEnd.toFixed(0)}px`, rotate: (baseR + spin).toFixed(1) + 'deg', offset: 0.42, easing: 'ease-in-out' },
        { translate: `${(dxEnd + swayX).toFixed(0)}px ${(dyEnd - swayY).toFixed(0)}px`, rotate: (baseR + spin + swayR).toFixed(1) + 'deg', offset: 0.6, easing: 'ease-in-out' },
        { translate: `${(dxEnd - swayX * 0.7).toFixed(0)}px ${(dyEnd + swayY).toFixed(0)}px`, rotate: (baseR + spin - swayR).toFixed(1) + 'deg', offset: 0.8, easing: 'ease-in-out' },
        { translate: `${(dxEnd + swayX * 0.4).toFixed(0)}px ${(dyEnd - swayY * 0.5).toFixed(0)}px`, rotate: (baseR + spin + swayR * 0.5).toFixed(1) + 'deg', offset: 1 }
      ], { duration: rand(5400, 6000), delay: rand(0, 300), easing: 'cubic-bezier(.32,0,.67,1)', fill: 'forwards' });
    });
  }

  /* ------------------------------------------------------------------ 4 · play() */
  function play(mine, past, card) {
    document.body.classList.add('gb-playing');
    document.documentElement.style.overflow = 'hidden';
    window.scrollTo(0, 0);
    const layout = $('.layout'), sidebar = $('#sidebar'), main = $('#main');
    const title = $('.gb-title'), sub = $('.gb-sub'), paper = $('.gb-paper');

    const ov = document.createElement('div');
    ov.className = 'gb-ov';
    ov.innerHTML = `<div class="gb-ov-stage">
        <svg class="gb-trail gb-trail-o" width="1448" height="1024" viewBox="0 0 1448 1024" aria-hidden="true"><path d=""/></svg>
        <svg class="gb-trail gb-trail-g" width="1448" height="1024" viewBox="0 0 1448 1024" aria-hidden="true"><path d=""/></svg>
        <h2 class="ov-title">Welcome Aboard</h2>
        <p class="ov-sub">Draw yourself a little <span class="hl">drawing</span>! Exhibit in my <span class="hl">guest gallery</span>!</p>
        <div class="ov-strip"></div>
        <p class="ov-thanks" role="status" tabindex="-1" aria-label="Thank You for contributing!"><span class="ov-reveal" aria-hidden="true"><span>Thank You</span></span><span class="ov-reveal" aria-hidden="true"><span>for contributing!</span></span></p>
      </div>`;
    layout.appendChild(ov);
    const ovStage = $('.gb-ov-stage', ov), trailG = $('.gb-trail-g path', ov), trailO = $('.gb-trail-o path', ov), trailOsvg = $('.gb-trail-o', ov), thanks = $('.ov-thanks', ov), strip = $('.ov-strip', ov);
    const titleEl = $('.ov-title', ov), subEl = $('.ov-sub', ov);
    const thanksLines = [...thanks.querySelectorAll('.ov-reveal > span')];
    // Pick each letter's height once, so it bounces smoothly instead of jittering each frame.
    const thanksChars = thanksLines.map((line) => {
      const chars = [...line.textContent].map((letter) => {
        const el = document.createElement('span');
        el.className = 'ov-char'; el.textContent = letter === ' ' ? '\u00a0' : letter;
        return { el, height: 5 + Math.floor(Math.random() * 5) };
      });
      line.replaceChildren(...chars.map(({ el }) => el));
      return chars;
    });
    if (window.SiddhiHighlight) window.SiddhiHighlight.scan(subEl, { instant: true });                // the highlights come along, already drawn, so nothing pops when the subtitle glides away
    // the whole scene is one full screen: contained in the window, centred. On a phone or a portrait tablet the wide scene can't be shrunk to the width of the
    // screen (everything would be tiny) — it is fitted to the height instead and only the middle of it is seen: Thank You is drawn to fit that (guest.css) and the
    // strip of cards is shifted so that our card lands in the middle of the screen, with the other cards sliding in from the right.
    const W = layout.clientWidth, H = layout.clientHeight, NARROW = W < 900;
    const s = NARROW ? Math.min(1, H / 1024, W / 640) : Math.min(1, W / 1448, H / 1024);
    const SX = NARROW ? 724 - (SLOTS[0].x + CARD.w / 2) : 0;         // the strip's shift to the right, in stage px
    if (NARROW) { ovStage.classList.add('narrow'); ovStage.style.setProperty('--thanks-fs', Math.min(128, Math.floor((W / s) * 0.8 / 7.7)) + 'px'); }   // the two lines are about 7.7 em wide
    ovStage.style.setProperty('--ov-s', s);
    ovStage.style.setProperty('--ov-x', (W - 1448 * s) / 2 + 'px');
    ovStage.style.setProperty('--ov-y', (H - 1024 * s) / 2 + 'px');

    if (reduce) {                                                    // reduced motion: no choreography, straight to the thank-you, everything simply appears
      main.style.transition = 'opacity .3s'; main.style.opacity = '0';
      if (sidebar) { sidebar.classList.add('gb-out'); sidebar.inert = true; }
      strip.remove(); titleEl.remove(); subEl.remove();
      trailOsvg.remove(); trailG.parentNode.remove();
      thanks.style.opacity = '1';
      thanksLines.forEach((line) => { line.style.transform = 'translateX(0)'; line.parentNode.style.clipPath = 'inset(0)'; });
      setTimeout(goHome, HOLD);
      return;
    }

    // where everything is right now, in overlay design px
    const r0 = ovStage.getBoundingClientRect(), k = r0.width / 1448;
    const conv = (r) => ({ x: (r.left - r0.left) / k, y: (r.top - r0.top) / k, w: r.width / k, h: r.height / k });
    const c0 = conv(card.getBoundingClientRect()), p0 = conv(paper.getBoundingClientRect());
    const tr = conv(title.getBoundingClientRect()), sr = conv(sub.getBoundingClientRect());
    const tdx = tr.x + tr.w / 2 - 742.5, tdy = tr.y + tr.h / 2 - 54, sdx = sr.x + sr.w / 2 - 723.5, sdy = sr.y + sr.h / 2 - 120;

    // cards: ours + the previous three, all inside one strip that slides as a unit
    const mineEl = cardEl(mine, 'strip'), others = past.map((c) => cardEl(c, 'strip'));
    [mineEl, ...others].forEach((el, i) => { el.style.left = SLOTS[i].x + 'px'; el.style.top = SLOTS[i].y + 'px'; strip.appendChild(el); });
    const paperMine = $('.gc-paper', mineEl), sigMine = $('.gc-sig', mineEl);
    const rightEdge = (W / s + 1448) / 2 + 30;                       // just past the right end of the screen, in stage px
    const fromRight = others.map((_, i) => rightEdge - SX - SLOTS[i + 1].x);
    const leftEdge = (1448 - W / s) / 2;
    // Include the final card, overflowing signatures and shadows, even on very wide viewports.
    const stripRight = Math.max(...[mineEl, ...others].map((el, i) => SLOTS[i].x + Math.max(CARD.w, el.scrollWidth)));
    const exitSteps = Math.max(EXIT_K, (stripRight + SX - leftEdge + 64) / -STEP[0]);

    const apply = (elapsed) => {
      const t = Math.max(0, elapsed);                                // rAF timestamps can precede our start time by a hair
      const x = Math.min(1, t / T), f = stringEase(t / FLIGHT);
      // the strip slides the whole time (already moving while our card lands in it) and simply slides out of the screen
      const kk = exitSteps * stringEase(t / SLIDE_MS);
      strip.style.transform = `translate(${STEP[0] * kk + SX}px, ${STEP[1] * (0.25 * kk + 0.75 * (1 - Math.exp(-kk)))}px)`;
      // our card scales down from the drawing pad into slot 1
      Object.assign(mineEl.style, { left: lerp(c0.x - SX, SLOTS[0].x, f) + 'px', top: lerp(c0.y, SLOTS[0].y, f) + 'px', width: lerp(c0.w, CARD.w, f) + 'px', height: lerp(c0.h, CARD.h, f) + 'px' });
      Object.assign(paperMine.style, { left: lerp(p0.x - c0.x, CARD.pl, f) + 'px', top: lerp(p0.y - c0.y, CARD.pt, f) + 'px', width: lerp(p0.w, CARD.pw, f) + 'px', height: lerp(p0.h, CARD.ph, f) + 'px' });
      mineEl.style.transform = `perspective(1800px) rotateY(${360 * f}deg)`;
      sigMine.style.opacity = String(sm(0.4, 1, f));
      // the previous three start sliding from the very end of the screen, one after another
      others.forEach((el, i) => { const g = stringEase((t - 180 - i * 160) / 1250); el.style.translate = `${fromRight[i] * (1 - g)}px 0`; });
      // title + subtitle glide left as the sidebar leaves, then fade
      const fo = String(1 - sm(0.12, 0.38, x));
      titleEl.style.translate = `${tdx * (1 - f)}px ${tdy * (1 - f)}px`; titleEl.style.opacity = fo;
      subEl.style.translate = `${sdx * (1 - f)}px ${sdy * (1 - f)}px`; subEl.style.opacity = fo;
      // Left-to-right reveal, with a staggered 5–9px upward bounce for each character.
      thanks.style.opacity = '1';
      thanksLines.forEach((line, i) => {
        const elapsed = t - THANKS_MS - i * 120;
        const reveal = stringEase(elapsed / 850);
        const offset = -28 * (1 - reveal);
        line.parentNode.style.clipPath = `inset(0 ${100 * (1 - reveal)}% 0 0)`;
        line.style.transform = `translateX(${offset}px)`;
        thanksChars[i].forEach(({ el, height }, j) => {
          const bounce = Math.min(1, Math.max(0, (elapsed - 450 - j * 18) / 420));
          const lift = bounce === 1 ? 0 : -height * Math.pow(Math.sin(Math.PI * bounce), 2);
          el.style.transform = `translateY(${lift}px)`;
        });
      });
      const stringTime = Math.min(t / SLIDE_MS, 1) * STRING_MS;
      const lineExit = stringEase((stringTime - 1350) / (STRING_MS - 1350));
      trailG.setAttribute('d', stringD(KEYS_G, stringTime, 0, lineExit));
      trailO.setAttribute('d', stringD(KEYS_O, stringTime, ORANGE_DELAY, lineExit));
      // Cards and strings finish together while the thank-you remains visible.
      if (t >= SLIDE_MS) {
        strip.style.visibility = 'hidden';
        trailG.parentNode.style.visibility = trailOsvg.style.visibility = 'hidden';
      }
    };

    apply(0);                                                        // paint the first frame before the originals disappear (no flash)
    main.classList.add('gb-leaving');
    driftDecor(main);
    card.style.visibility = 'hidden'; title.style.visibility = 'hidden'; sub.style.visibility = 'hidden';
    if (sidebar) { sidebar.classList.add('gb-out'); sidebar.inert = true; }

    const start = performance.now();
    const frame = (now) => {
      const t = Math.max(0, now - start);
      apply(Math.min(t, T));
      if (t < T) return requestAnimationFrame(frame);
      strip.remove(); titleEl.remove(); subEl.remove();
      thanks.focus({ preventScroll: true });
      trailOsvg.remove(); trailG.parentNode.remove();
      goHome();                                                   // bounce has settled; immediately start the upward handoff
    };
    requestAnimationFrame(frame);
  }

  G.play = play;
})();
