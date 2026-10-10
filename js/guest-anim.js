/* Welcome Aboard: the "Create" animation (guest-book.html only). js/guest.js saves the card and calls SiddhiGuest.play(mine, past, card); this file only performs.
   Its own scene (a rough baby-blue plaster wall, NOT the gallery's room photo). About 4.5 s of motion, then the caption holds ~2.6 s so it can be read, then goHome() slides up.
     0.0  your card flips into the middle of the wall as the drawing
     0.7  EXPLODED VIEW, huge and centred: glass, mat, drawing, backing and the four moulding bars (in your card colour) float apart in 3D, with measure lines
     1.6  the pieces come back together into the finished frame
     2.1  it is hung: a nail, a wire, one swing and it settles
     2.8  it scales down into its place on the gallery wall (same layout as the gallery page) while the other frames scale in around it
     3.9  the wall slides out to the left and "Thank You / for contributing!" swoops across the bare wall like a gallery caption
   Click or Esc skips the wait. Reduced motion: no movement, just the caption. */
(function () {
  'use strict';
  const G = window.SiddhiGuest;
  if (!G || !document.querySelector('#pad')) return;
  const { reduce, goHome, frameHTML, posterSlots, cardEl } = G;
  const ROOT = document.body.dataset.root || '';
  const ART = 421 / 642;
  const T = { flip: 700, explode: 700, holdTo: 1600, assemble: 500, hang: 700, pull: 800, slideAt: 4600, slide: 1600, thanksAt: 5300, readTo: 11800 };
  const out = 'cubic-bezier(0.22, 1, 0.36, 1)', inout = 'cubic-bezier(0.65, 0, 0.35, 1)';
  const S = 'fill:both';

  G.play = function (mine, past, card) {
    document.body.classList.add('gb-playing');
    document.documentElement.style.overflow = 'hidden';
    window.scrollTo(0, 0);
    const layout = document.querySelector('.layout'), main = document.querySelector('#main'), sidebar = document.querySelector('#sidebar');
    const vw = layout.clientWidth, vh = layout.clientHeight;
    // the exploded frame is huge: as wide as the screen allows, and it must still fit when its pieces spread out
    const Wf = Math.round(Math.min(vw * 0.78, (vh * 0.62) / (ART + 0.32), 860));
    const b = Math.round(Wf * 0.045), m = Math.round(Wf * 0.085), t = b + m, aw = Wf - 2 * t, ah = Math.round(aw * ART), Hf = ah + 2 * t;
    const col = mine.color || '#bb3739';
    const img = '<img src="' + mine.img + '" alt="">';
    const bars = [
      ['top', 'left:0;top:0;width:' + Wf + 'px;height:' + b + 'px;clip-path:polygon(0 0,100% 0,calc(100% - ' + b + 'px) 100%,' + b + 'px 100%)'],
      ['bottom', 'left:0;bottom:0;width:' + Wf + 'px;height:' + b + 'px;clip-path:polygon(' + b + 'px 0,calc(100% - ' + b + 'px) 0,100% 100%,0 100%)'],
      ['left', 'left:0;top:0;width:' + b + 'px;height:' + Hf + 'px;clip-path:polygon(0 0,100% ' + b + 'px,100% calc(100% - ' + b + 'px),0 100%)'],
      ['right', 'right:0;top:0;width:' + b + 'px;height:' + Hf + 'px;clip-path:polygon(0 ' + b + 'px,100% 0,100% 100%,0 calc(100% - ' + b + 'px))']
    ].map((p) => '<i class="xp xp-bar xp-' + p[0] + '" style="background:#1d1a19;' + p[1] + '"></i>').join('');
    const nailY = -Math.round(Hf * 0.16);
    const slots = posterSlots(17), cards = [mine].concat(past.slice(0, 3));
    const wallHTML = slots.map((p, i) => frameHTML(cards[i] || { color: ['#bb3739', '#249343', '#f5a01e', '#2c2696'][i % 4], name: '', img: '' }, p.x, p.y, p.w, false, false, p.h)).join('');

    const ov = document.createElement('div');
    ov.className = 'anim';
    ov.innerHTML =
      '<svg class="anim-lines" viewBox="0 0 1448 1024" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><path class="g" pathLength="1" transform="translate(-72 171.16)" d="M0 670.04931640625C0 670.04931640625 392.9632263183594 303.3006896972656 719.5211791992188 624.5504150390625C1046.0791320800781 945.8001403808594 1325 551.8403472900391 945.29931640625 197.66749572753906C565.5986328125 -156.50535583496094 1318 10.34039306640625 1305 343.84033203125C1292 677.3402709960938 1519.5 715.3403930664062 1519.5 629.840576171875"/><path class="o" pathLength="1" transform="translate(-1 17)" d="M0 0C0 0 72.86075592041016 190.03260040283203 164.5 275.5C258.5666046142578 363.23128509521484 331.85939025878906 406.0883483886719 459.5 422C578.6712875366211 436.8558683395386 650.3555755615234 409.4907646179199 761.5 364C893.15380859375 310.11486053466797 922.3675537109375 196.93949127197266 1057 151C1166.4710159301758 113.64613342285156 1236.5817794799805 116.89418077468872 1352 124.5C1394.799560546875 127.32040143013 1461 138 1461 138"/></svg><div class="anim-group"><div class="anim-wall">' + wallHTML + '</div></div>' +
      '<div class="xf" style="width:' + Wf + 'px;height:' + Hf + 'px;margin:' + (-Hf / 2) + 'px 0 0 ' + (-Wf / 2) + 'px">' +
        '<svg class="xf-measure" width="' + Wf + '" height="' + Hf + '" viewBox="0 0 ' + Wf + ' ' + Hf + '" aria-hidden="true"><path d="M0 ' + (Hf + 46) + 'H' + Wf + 'M0 ' + (Hf + 34) + 'V' + (Hf + 58) + 'M' + Wf + ' ' + (Hf + 34) + 'V' + (Hf + 58) + 'M-46 0V' + Hf + 'M-58 0H-34M-58 ' + Hf + 'H-34M' + t + ' ' + (Hf + 14) + 'V' + (Hf + 34) + 'M' + (Wf - t) + ' ' + (Hf + 14) + 'V' + (Hf + 34) + '"/></svg>' +
        '<div class="xf-swing" style="transform-origin:50% ' + nailY + 'px">' +
          '<svg class="xf-wire" width="' + Wf + '" height="' + Hf + '" viewBox="0 0 ' + Wf + ' ' + Hf + '" aria-hidden="true"><path d="M' + Wf / 2 + ' ' + nailY + 'L' + (b + 6) + ' 2M' + Wf / 2 + ' ' + nailY + 'L' + (Wf - b - 6) + ' 2"/></svg>' +
          '<div class="xf-rig">' +
            '<i class="xp xp-back" style="inset:0"></i>' +
            '<i class="xp xp-draw" style="left:' + t + 'px;top:' + t + 'px;width:' + aw + 'px;height:' + ah + 'px">' + img + '</i>' +
            '<i class="xp xp-mat" style="left:' + b + 'px;top:' + b + 'px;width:' + (Wf - 2 * b) + 'px;height:' + (Hf - 2 * b) + 'px;border-width:' + m + 'px;border-color:' + col + '"></i>' +
            '<i class="xp xp-glass" style="left:' + b + 'px;top:' + b + 'px;width:' + (Wf - 2 * b) + 'px;height:' + (Hf - 2 * b) + 'px"></i>' + bars +
          '</div></div>' +
        '<i class="xf-nail" style="left:' + (Wf / 2) + 'px;top:' + nailY + 'px"></i></div>' +
      '<p class="anim-thanks" role="status" tabindex="-1" aria-label="Thank You for contributing!" style="font-size:' + Math.round(Math.min(120, vw * 0.88 / 7.7, vh * 0.2)) + 'px"><span aria-hidden="true">Thank You</span><span aria-hidden="true">for contributing!</span><i aria-hidden="true"></i></p>';
    layout.appendChild(ov);
    // the stars and fish-bone patches of Welcome Aboard stay pinned exactly where they are, all through the animation
    const stg = document.querySelector('.stage'), decor = document.querySelector('.gb-decor');
    if (stg && decor) {
      const sr = stg.getBoundingClientRect(), lr0 = layout.getBoundingClientRect(), pins = document.createElement('div');
      pins.className = 'anim-pins'; pins.style.cssText = 'left:' + (sr.left - lr0.left) + 'px;top:' + (sr.top - lr0.top) + 'px;scale:' + (sr.width / stg.offsetWidth);
      const dec = decor.cloneNode(true); [...dec.children].forEach((d, i) => { if (i % 2) d.remove(); });   // half as many patches as the page itself, so the wall stays calm
      pins.appendChild(dec);
      ov.insertBefore(pins, ov.firstChild);
    }
    const $ = (s) => ov.querySelector(s), $$ = (s) => [...ov.querySelectorAll(s)];
    const group = $('.anim-group'), wall = $('.anim-wall'), xf = $('.xf'), swing = $('.xf-swing'), rig = $('.xf-rig'), thanks = $('.anim-thanks'), rule = $('.anim-thanks i');
    const frames = $$('.anim-wall .gf'), hero = frames[0];
    // the wall is the gallery's wall layout, scaled up so the whole set of frames fills the screen, and centred
    const gx = frames.map((f) => [parseFloat(f.style.getPropertyValue('--x')), parseFloat(f.style.getPropertyValue('--y')), parseFloat(f.style.getPropertyValue('--w')), parseFloat(f.style.getPropertyValue('--h'))]);
    const x0 = Math.min(...gx.map((g) => g[0])), x1 = Math.max(...gx.map((g) => g[0] + g[2])), y0 = Math.min(...gx.map((g) => g[1])), y1 = Math.max(...gx.map((g) => g[1] + g[3]));
    const ws = Math.min(2.6, (vw * 0.94) / (x1 - x0), (vh * 0.9) / (y1 - y0));
    wall.style.cssText = 'left:' + (vw / 2 - ws * (x0 + x1) / 2) + 'px;top:' + (vh / 2 - ws * (y0 + y1) / 2) + 'px;scale:' + ws;
    let done = false;
    const timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    const onKey = (e) => { if (e.key === 'Escape') finish(); };
    const finish = () => {
      if (done) return;
      done = true;
      timers.forEach(clearTimeout);
      ov.removeEventListener('click', finish); removeEventListener('keydown', onKey);
      goHome();
    };
    if (sidebar) { sidebar.classList.add('gb-out'); sidebar.inert = true; }
    main.classList.add('gb-leaving');
    group.style.visibility = 'hidden'; xf.style.visibility = 'hidden';
    if (reduce) {
      main.style.opacity = '0'; xf.style.display = 'none';
      thanks.style.opacity = '1'; rule.style.scale = '1';
      thanks.focus({ preventScroll: true });
      later(finish, 1800);
      return;
    }
    const A = (el, kf, o) => el.animate(kf, Object.assign({ fill: 'both' }, o));
    const P = (sel) => $(sel);
    const hideParts = ['.xp-back', '.xp-mat', '.xp-glass', '.xp-bar'];
    hideParts.forEach((s) => $$(s).forEach((e) => { e.style.opacity = '0'; }));
    $('.xf-measure').style.opacity = '0'; $('.xf-wire').style.opacity = '0'; $('.xf-nail').style.opacity = '0';
    ov.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 450, fill: 'both' });
    main.style.transition = 'opacity .5s'; main.style.opacity = '0';
    // the two strings, as in the original: the head runs across the screen, then the tail follows it off the right while the caption swoops in (as in the original)
    [['.g', 0], ['.o', 150]].forEach(([sel, d]) => {
      A($('.anim-lines ' + sel), [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 1800, delay: 2700 + d, easing: out, fill: 'both' });
      later(() => A($('.anim-lines ' + sel), [{ strokeDashoffset: 0 }, { strokeDashoffset: -1 }], { duration: 1900, easing: inout }), T.thanksAt + d);
    });

    // 0: the card flips onto the middle of the wall as the drawing
    const lr = layout.getBoundingClientRect(), from = card.getBoundingClientRect();
    const draw = $('.xp-draw');
    xf.style.visibility = 'visible';
    draw.style.opacity = '0';
    const dr = draw.getBoundingClientRect();
    const fly = document.createElement('div');
    fly.className = 'anim-fly';
    fly.style.background = getComputedStyle(card).backgroundColor;
    ov.appendChild(fly);
    const box = (r) => ({ left: r.left - lr.left + 'px', top: r.top - lr.top + 'px', width: r.width + 'px', height: r.height + 'px' });
    A(fly, [Object.assign(box(from), { transform: 'perspective(1800px) rotateY(0deg)', borderRadius: '10px' }), Object.assign(box(dr), { transform: 'perspective(1800px) rotateY(360deg)', borderRadius: '0px' })], { duration: T.flip, easing: out });
    later(() => { draw.style.opacity = '1'; fly.remove(); }, T.flip + 10);

    // 1: exploded view. Everything floats apart in depth (and sideways for the moulding); the rig turns so the depth reads
    const z = (px, x, y) => 'translate3d(' + (x || 0) + 'px,' + (y || 0) + 'px,' + px + 'px)';
    const spread = { '.xp-back': z(-230), '.xp-draw': z(-95), '.xp-mat': z(5), '.xp-glass': z(130), '.xp-top': z(250, 0, -Hf * 0.2), '.xp-bottom': z(250, 0, Hf * 0.2), '.xp-left': z(250, -Wf * 0.15, 0), '.xp-right': z(250, Wf * 0.15, 0) };
    const exploded = 'rotateY(-24deg) rotateX(12deg)';
    later(() => {
      Object.keys(spread).forEach((s) => { const e = $(s); A(e, [{ opacity: s === '.xp-draw' ? 1 : 0, transform: 'none' }, { opacity: 1, transform: spread[s] }], { duration: T.explode, easing: out }); });
      A(rig, [{ transform: 'none' }, { transform: exploded }], { duration: T.explode, easing: out });
      A($('.xf-measure'), [{ opacity: 0 }, { opacity: 1 }], { duration: 500, easing: 'ease-out' });
    }, T.flip);
    // a slow turn while it is held, so the pieces stay alive on screen
    later(() => { A(rig, [{ transform: exploded }, { transform: 'rotateY(-14deg) rotateX(8deg)' }], { duration: T.holdTo - T.flip - T.explode, easing: 'ease-in-out' }); }, T.flip + T.explode);

    // 2: assemble
    const tA = T.holdTo;
    later(() => {
      Object.keys(spread).forEach((s) => A($(s), [{ transform: spread[s] }, { transform: 'none' }], { duration: T.assemble, easing: inout }));
      A(rig, [{ transform: 'rotateY(-14deg) rotateX(8deg)' }, { transform: 'none' }], { duration: T.assemble, easing: inout });
      A($('.xf-measure'), [{ opacity: 1 }, { opacity: 0 }], { duration: T.assemble, easing: 'ease-in' });
    }, tA);

    // 3: hang it: nail, wire, one swing
    const tH = tA + T.assemble;
    later(() => {
      A($('.xf-nail'), [{ opacity: 0, scale: '0.2' }, { opacity: 1, scale: '1' }], { duration: 220, easing: out });
      A($('.xf-wire'), [{ opacity: 0 }, { opacity: 1 }], { duration: 260, delay: 120 });
      A(swing, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-4deg)', offset: 0.3 }, { transform: 'rotate(2.4deg)', offset: 0.6 }, { transform: 'rotate(-1deg)', offset: 0.82 }, { transform: 'rotate(0deg)' }], { duration: T.hang, easing: 'ease-in-out', delay: 140 });
    }, tH);

    // 4: scale down into its place on the wall while the other frames scale in around it
    const tP = tH + T.hang + 40;
    later(() => {
      group.style.visibility = 'visible';
      hero.style.opacity = '0';
      const hr = hero.getBoundingClientRect(), fr = xf.getBoundingClientRect(), k = hr.width / fr.width;
      A($('.xf-wire'), [{ opacity: 1 }, { opacity: 0 }], { duration: 250 }); A($('.xf-nail'), [{ opacity: 1 }, { opacity: 0 }], { duration: 250 });
      A(xf, [{ transform: 'none' }, { transform: 'translate(' + (hr.left + hr.width / 2 - fr.left - fr.width / 2) + 'px,' + (hr.top + hr.height / 2 - fr.top - fr.height / 2) + 'px) scale(' + k + ')' }], { duration: T.pull, easing: inout });
      A(xf, [{ opacity: 1 }, { opacity: 1, offset: 0.7 }, { opacity: 0 }], { duration: T.pull });
      A(hero, [{ opacity: 0 }, { opacity: 0, offset: 0.7 }, { opacity: 1 }], { duration: T.pull });
      frames.slice(1).forEach((f, i) => A(f, [{ opacity: 0, scale: '0.8' }, { opacity: 1, scale: '1' }], { duration: 450, delay: 120 + i * 55, easing: out }));
    }, tP);

    // 5: the wall slides out; the caption swoops in across the bare wall, then stays
    later(() => { A(group, [{ transform: 'translateX(0)' }, { transform: 'translateX(' + -(vw + 80) + 'px)' }], { duration: T.slide, easing: inout }); }, T.slideAt);
    later(() => {
      thanks.style.opacity = '1';
      // typed out on the wall: each line is uncovered letter by letter, the second line after the first
      [...thanks.querySelectorAll('span')].forEach((l, i) => { const n = l.textContent.length; A(l, [{ clipPath: 'inset(-0.1em 100% -0.2em 0)' }, { clipPath: 'inset(-0.1em 0 -0.2em 0)' }], { duration: n * 85, delay: i * (9 * 85 + 250), easing: 'steps(' + n + ', end)' }); });
      A(rule, [{ scale: '0 1' }, { scale: '1 1' }], { duration: 700, delay: 2900, easing: out });
      later(() => thanks.focus({ preventScroll: true }), 1200);
    }, T.thanksAt);
    later(finish, T.readTo);
    ov.addEventListener('click', finish);
    addEventListener('keydown', onKey);
  };
})();
