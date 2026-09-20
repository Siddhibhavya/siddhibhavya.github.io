/* Welcome Aboard: the "Create" choreography (guest-book.html only). Loaded after js/guest.js, which calls SiddhiGuest.play(mine, past, card).

   ONE unbroken timeline: the strip of cards slides, the strings are fed through it, the Thank You rises — nothing stops between "stages".
   Then both strings are fed out of the screen to the right while Thank You stays, and the main website opens.

   Contents: 1 Timing · 2 The two strings (Figma paths) · 3 String maths · 4 play() · 5 Exit run-out */
(function () {
  'use strict';
  const G = window.SiddhiGuest;
  if (!G) { console.error('[guest-anim] js/guest.js must load first'); return; }
  const { $, reduce, cardEl, goHome } = G;

  /* ------------------------------------------------------------------ 1 · Timing (ms) — change the feel here */
  const T = 4700;                    // the whole animation
  const D = 1440;                    // how long each point of a string lags the head (head-to-tail follow-through)
  const FLIGHT = 620;                // our card flying from the pad into the strip
  const HOLD = 5000;                 // Thank You stays this long, counted from fully visible, then the main website opens
  const SLIDE_MS = 3490, EXIT_K = 9.2;   // the strip travels EXIT_K Figma steps (enough to clear the screen) over SLIDE_MS
  const EXIT_AT = 400, EXIT_MS = 1750;   // after the animation: when the lines start leaving to the right, and how long they take
  const ORANGE_DELAY = 120;          // the orange line follows a beat behind the green one
  const STEP = [-194, 62];           // the strip's slide per Figma step (state 1 -> 2)
  const SLOTS = [{ x: 86, y: 184 }, { x: 470, y: 538 }, { x: 846, y: 192 }, { x: 1230, y: 546 }];   // Figma slots; the 4th is the third "past" card entering at the edge
  const CARD = { w: 507, h: 274, pl: 12, pt: 8, pw: 436, ph: 257 };

  /* ------------------------------------------------------------------ 2 · The two strings
     Straight from the Figma frames "Drawing gone", "gone 2" and "gone 3" (absolute frame px): a thick green line (16px) and a thinner
     orange one (10px). Each is three states of ONE line; `off` is the layer's x/y in the frame. If a line is moved in Figma, paste its new path here. */
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
  const unit = (a, b) => { const dx = a[0] - b[0], dy = a[1] - b[1], l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l]; };
  const bez = (a, b, c, d, w) => { const u = 1 - w; return [u * u * u * a[0] + 3 * u * u * w * b[0] + 3 * u * w * w * c[0] + w * w * w * d[0], u * u * u * a[1] + 3 * u * u * w * b[1] + 3 * u * w * w * c[1] + w * w * w * d[1]]; };
  const cr = (a, b, c, d, u) => 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
  const sine = (x) => -(Math.cos(Math.PI * Math.min(1, Math.max(0, x))) - 1) / 2;
  const outC = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
  const sm = (a, b, x) => { const v = Math.min(1, Math.max(0, (x - a) / (b - a))); return v * v * (3 - 2 * v); };
  const polyD = (pts) => {                                          // a smooth curve through the points: quadratic curves between the mid-points of neighbours (no visible corners)
    const n = pts.length, f = (v) => v.toFixed(1);
    if (n < 3) return 'M' + pts.map((q) => f(q[0]) + ' ' + f(q[1])).join('L');
    let d = 'M' + f(pts[0][0]) + ' ' + f(pts[0][1]);
    for (let i = 1; i < n - 1; i++) d += 'Q' + f(pts[i][0]) + ' ' + f(pts[i][1]) + ' ' + f((pts[i][0] + pts[i + 1][0]) / 2) + ' ' + f((pts[i][1] + pts[i + 1][1]) / 2);
    return d + 'L' + f(pts[n - 1][0]) + ' ' + f(pts[n - 1][1]);
  };

  /* A Figma path (absolute cubic Beziers) -> [tail ... head] points, tail = the left end. The three states of a line don't all run the same way
     in Figma and don't have the same number of segments, so every line is resampled evenly by arc length: point i of one state then corresponds
     to point i of the next. */
  function sampleKey(raw, leadOut) {
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
    for (let j = LEAD_N; j >= 1; j--) out.push([body[0][0] + td[0] * LEAD_LEN * j / LEAD_N, body[0][1] + td[1] * LEAD_LEN * j / LEAD_N]);
    for (const p of body) out.push(p);
    for (let j = 1; j <= LEAD_N; j++) out.push([body[BODY_N - 1][0] + hd[0] * leadOut * j / LEAD_N, body[BODY_N - 1][1] + hd[1] * leadOut * j / LEAD_N]);
    return out;
  }
  const keysOf = (states) => states.map((r, i) => sampleKey(r, i === 0 ? 0 : LEAD_LEN));   // state 1 ends inside the screen, so no lead-out yet
  const KEYS_G = keysOf(GREEN), KEYS_O = keysOf(ORANGE);
  const NP = KEYS_G[0].length;

  /* Every point travels the same route through the three states, but starts later the further it is from the head. So where two states don't
     line up (the angles differ) the head goes to the next shape first and the body follows through behind it, instead of the whole line wobbling. */
  const keyPoint = (KEYS, i, p) => {                                 // Catmull-Rom through the three states: no velocity kink at the middle one
    const A = KEYS[0][i], B = KEYS[1][i], C = KEYS[2][i];
    const [a, b, c, d, u] = p <= 1 ? [A, A, B, C, p] : [A, B, C, C, p - 1];
    return [cr(a[0], b[0], c[0], d[0], u), cr(a[1], b[1], c[1], d[1], u)];
  };
  function stringD(KEYS, t, delay) {
    const pts = new Array(NP);
    t -= delay;
    for (let i = 0; i < NP; i++) {
      const tau = Math.min(1, Math.max(0, (t - D * (1 - i / (NP - 1))) / (T - D - delay)));
      pts[i] = keyPoint(KEYS, i, 2 * sine(tau));
    }
    const front = (1 - Math.pow(1 - Math.min(1, Math.max(0, t) / 2120), 2)) * (NP - 1);   // the line is drawn on from the tail while it is already moving
    const n = Math.floor(front), seg = pts.slice(0, n + 1);
    if (n < NP - 1) { const a = pts[n], b = pts[n + 1], f = front - n; seg.push([lerp(a[0], b[0], f), lerp(a[1], b[1], f)]); }
    return polyD(seg);
  }

  /* ------------------------------------------------------------------ 5 · Exit run-out
     After the Thank You is in, both lines are fed out of the screen to the right: every point slides further along the line's own path (the final
     Figma shape), and the path is continued off the right edge, so it leaves like a rope being pulled through. */
  function runOut(K, limitX) {
    const ext = K.slice(), hd = unit(K[K.length - 1], K[K.length - 5]);
    let p = K[K.length - 1];
    for (let j = 1; j <= 90; j++) {                                  // 9000px of run-out that swings round to point right
      const b = Math.min(1, j / 5), vx = hd[0] * (1 - b) + b, vy = hd[1] * (1 - b), l = Math.hypot(vx, vy) || 1;
      p = [p[0] + (vx / l) * 100, p[1] + (vy / l) * 100]; ext.push(p);
    }
    const cum = [0];
    for (let i = 1; i < ext.length; i++) cum.push(cum[i - 1] + Math.hypot(ext[i][0] - ext[i - 1][0], ext[i][1] - ext[i - 1][1]));
    let last = ext.length - 1; while (last > 0 && ext[last][0] > limitX) last--;
    return { ext, cum, n: K.length, max: cum[Math.min(ext.length - 1, last + 1)] };   // max = how far to slide until the whole line is off screen
  }
  function slide(R, ds) {
    const pts = new Array(R.n); let j = 0;
    for (let i = 0; i < R.n; i++) {
      const sv = R.cum[i] + ds;
      while (j < R.ext.length - 2 && R.cum[j + 1] < sv) j++;
      const f = Math.min(1, (sv - R.cum[j]) / (R.cum[j + 1] - R.cum[j] || 1));
      pts[i] = [lerp(R.ext[j][0], R.ext[j + 1][0], f), lerp(R.ext[j][1], R.ext[j + 1][1], f)];
    }
    return polyD(pts);
  }

  /* ------------------------------------------------------------------ 4 · play() */
  function play(mine, past, card) {
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
        <p class="ov-thanks" role="status" tabindex="-1">Thank You<br>for contributing!</p>
      </div>`;
    layout.appendChild(ov);
    const ovStage = $('.gb-ov-stage', ov), trailG = $('.gb-trail-g path', ov), trailO = $('.gb-trail-o path', ov), trailOsvg = $('.gb-trail-o', ov), thanks = $('.ov-thanks', ov), strip = $('.ov-strip', ov);
    const titleEl = $('.ov-title', ov), subEl = $('.ov-sub', ov);
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
      trailG.setAttribute('d', polyD(KEYS_G[2])); trailO.setAttribute('d', polyD(KEYS_O[2]));
      thanks.style.transition = 'opacity .3s';
      requestAnimationFrame(() => requestAnimationFrame(() => { thanks.style.opacity = '1'; }));
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

    const apply = (elapsed) => {
      const t = Math.max(0, elapsed);                                // rAF timestamps can precede our start time by a hair
      const x = Math.min(1, t / T), f = outC(t / FLIGHT);
      // the strip slides the whole time (already moving while our card lands in it) and simply slides out of the screen
      const kk = EXIT_K * sine(t / SLIDE_MS);
      strip.style.transform = `translate(${STEP[0] * kk + SX}px, ${kk <= 1 ? STEP[1] * kk : STEP[1] * (1 + 0.25 * (kk - 1))}px)`;
      // our card scales down from the drawing pad into slot 1
      Object.assign(mineEl.style, { left: lerp(c0.x - SX, SLOTS[0].x, f) + 'px', top: lerp(c0.y, SLOTS[0].y, f) + 'px', width: lerp(c0.w, CARD.w, f) + 'px', height: lerp(c0.h, CARD.h, f) + 'px' });
      Object.assign(paperMine.style, { left: lerp(p0.x - c0.x, CARD.pl, f) + 'px', top: lerp(p0.y - c0.y, CARD.pt, f) + 'px', width: lerp(p0.w, CARD.pw, f) + 'px', height: lerp(p0.h, CARD.ph, f) + 'px' });
      sigMine.style.opacity = String(sm(0.4, 1, f));
      // the previous three start sliding from the very end of the screen, one after another
      others.forEach((el, i) => { const g = outC((t - 150 - i * 135) / 910); el.style.translate = `${fromRight[i] * (1 - g)}px 0`; });
      // title + subtitle glide left as the sidebar leaves, then fade
      const fo = String(1 - sm(0.12, 0.38, x));
      titleEl.style.translate = `${tdx * (1 - f)}px ${tdy * (1 - f)}px`; titleEl.style.opacity = fo;
      subEl.style.translate = `${sdx * (1 - f)}px ${sdy * (1 - f)}px`; subEl.style.opacity = fo;
      // thank-you rises while the cards leave
      const th = sm(0.62, 0.9, x);
      thanks.style.opacity = String(th); thanks.style.translate = `0 ${26 * (1 - th)}px`;
      trailG.setAttribute('d', stringD(KEYS_G, t, 0));
      trailO.setAttribute('d', stringD(KEYS_O, t, ORANGE_DELAY));
    };

    apply(0);                                                        // paint the first frame before the originals disappear (no flash)
    main.classList.add('gb-leaving');
    card.style.visibility = 'hidden'; title.style.visibility = 'hidden'; sub.style.visibility = 'hidden';
    if (sidebar) { sidebar.classList.add('gb-out'); sidebar.inert = true; }

    const limitX = (W / s + 1448) / 2 + 60;                          // beyond this x (stage px) nothing is on screen
    const leave = () => {
      const RG = runOut(KEYS_G[2], limitX), RO = runOut(KEYS_O[2], limitX), t0 = performance.now();
      const step = (now) => {
        const ug = Math.min(1, Math.max(0, (now - t0) / EXIT_MS)), uo = Math.min(1, Math.max(0, (now - t0 - 140) / EXIT_MS));   // orange a beat behind
        trailG.setAttribute('d', slide(RG, RG.max * sine(ug)));
        trailO.setAttribute('d', slide(RO, RO.max * sine(uo)));
        if (uo < 1) requestAnimationFrame(step); else { trailOsvg.remove(); trailG.parentNode.remove(); }
      };
      requestAnimationFrame(step);
    };

    const start = performance.now();
    const frame = (now) => {
      const t = Math.max(0, now - start);
      apply(Math.min(t, T));
      if (t < T) return requestAnimationFrame(frame);
      strip.remove(); titleEl.remove(); subEl.remove();
      thanks.focus({ preventScroll: true });
      setTimeout(leave, EXIT_AT);                                    // the words stay; the lines run out of the screen to the right
      setTimeout(goHome, HOLD - (T - 0.9 * T));                      // "Thank you" is fully in at 0.9 T; it then stays for HOLD (5 s) before the main website
    };
    requestAnimationFrame(frame);
  }

  G.play = play;
})();
