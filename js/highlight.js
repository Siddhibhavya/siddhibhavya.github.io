/* Highlighter: a yellow-ochre zig-zag marker stroke (the colour of the stars) that draws itself behind a word, like a highlighter pen scribbling across the word from left to right.
   Mark a word with  <span class="hl">word</span>  and call  SiddhiHighlight.scan(root)  (js/about.js and js/guest.js do; so does the Welcome Aboard animation).
   scan(root, { instant: true }) draws it already finished — used for the copy of the subtitle that the Create animation glides away, so nothing pops.
   How it looks is in css/shell/widgets.css ("5 · Highlighter"); the colour is --highlight in css/base.css. */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

  /* Builds the stroke for one word. Sizes are in the page's own design pixels (the element's offsetWidth is unaffected by the page being scaled),
     so it fits at every screen size. Up-and-down strokes from the left end to the right end, each slightly different so it looks drawn by hand rather than stamped. */
  function build(el) {
    const cs = getComputedStyle(el), fs = parseFloat(cs.fontSize) || 16, w = el.offsetWidth;
    if (!w) return false;
    const pad = 0.16 * fs, W = w + 2 * pad, H = 0.8 * fs, sw = 0.23 * H;                          // a slim pen: the back-and-forth passes stay visible as faint streaks
    let seed = hash(el.textContent || 'x');
    const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    // the pen zig-zags up and down while it travels from the LEFT end of the word to the RIGHT end, so it draws on from left to right
    const y0 = sw / 2, y1 = H - sw / 2, xL = sw / 2, xR = W - sw / 2;
    const steps = Math.max(6, Math.min(30, Math.round(W / (0.36 * H))));                              // longer words get more strokes, close enough together to read as one scribble
    const pts = [];
    for (let i = 0; i <= steps; i++) pts.push([xL + (i / steps) * (xR - xL) + (rnd() - 0.5) * sw * 0.4, (i % 2 ? y1 : y0) + (rnd() - 0.5) * sw * 0.35]);
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'hl-svg'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('viewBox', '0 0 ' + W.toFixed(1) + ' ' + H.toFixed(1));
    svg.style.width = W.toFixed(1) + 'px'; svg.style.height = H.toFixed(1) + 'px'; svg.style.left = (-pad).toFixed(1) + 'px';
    svg.style.top = '50%'; svg.style.marginTop = (-H / 2 + 0.06 * fs).toFixed(1) + 'px';            // centred on the letters (a touch low, where a real highlighter sits)
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', 'M' + pts.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L'));
    path.setAttribute('pathLength', '1'); path.style.strokeWidth = sw.toFixed(1) + 'px';
    svg.appendChild(path);
    el.insertBefore(svg, el.firstChild);
    el.dataset.hlReady = '1';
    return true;
  }

  function scan(root, opts) {
    const instant = !!(opts && opts.instant);
    const run = () => {
      let n = 0;
      (root || document).querySelectorAll('.hl:not([data-hl-ready])').forEach((el) => {
        if (!build(el)) return;
        if (instant) { el.classList.add('instant', 'on'); return; }
        el.style.setProperty('--hl-delay', (0.55 + n++ * 0.45).toFixed(2) + 's');                    // several words on a page take turns
        requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('on')));
      });
    };
    if (document.fonts && document.fonts.status !== 'loaded') document.fonts.ready.then(run, run); else run();   // measure once the real fonts are in
  }

  window.SiddhiHighlight = { scan };
})();
