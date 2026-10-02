/* About page title: "<greeting>, I am <name>".
   NAME   — "Siddhi" is set in ransom-note tiles (red / yellow / green blocks, serif letters). For 3 seconds every tile keeps changing its font, letter
            colour, block colour and tilt at random, then they stop on a settled arrangement.
   GREETING — typed in slowly: नमस्ते -> backspace -> Hello! . One pass is 30 s; it then stays on "Hello!" for 2 minutes before the whole loop starts again
            (and each new loop gives the name another 3-second spree).
   When the jumble ends, a funny coloured "!" tile jumps in to the right of the name.
   Reduced motion: the greeting stays "Namaste" and the tiles sit settled. */
(function () {
  'use strict';
  let run = 0;                                                            // cancels the previous run when the page is swapped in again

  const HINDI = 'नमस्ते', HELLO = 'Hello!';
  const FONTS = ["'Ancizar Serif', serif", "'Ancizar Sans', sans-serif", "'Blank Script', cursive", 'Georgia, serif', "'Times New Roman', serif",
    "'Courier New', monospace", "Impact, 'Arial Narrow', sans-serif", "'Trebuchet MS', sans-serif", "'Palatino Linotype', serif", "'Brush Script MT', cursive"];
  const BLOCKS = ['#d9606b', '#ffc42b', '#2e9a3f', '#7b2b3d', '#ff9a00', '#075e54', '#bb3739', '#f5e9e2', '#2c2696'];
  const INKS = ['#1b1b1b', '#fff', '#fff2e6', '#190523', '#ffc42b', '#d9606b'];
  // the settled arrangement (red A, yellow R, green t, in the spirit of the reference)
  const SETTLED = [
    { bg: '#d9606b', ink: '#1b1b1b', font: FONTS[0], w: 800, i: 0, rot: -3 },
    { bg: '#ffc42b', ink: '#fff', font: FONTS[3], w: 700, i: 0, rot: 2 },
    { bg: '#2e9a3f', ink: '#fff', font: FONTS[0], w: 700, i: 1, rot: -2 },
    { bg: '#7b2b3d', ink: '#fff2e6', font: FONTS[4], w: 700, i: 0, rot: 3 },
    { bg: '#ff9a00', ink: '#190523', font: FONTS[0], w: 800, i: 0, rot: -2 },
    { bg: '#d9606b', ink: '#fff', font: FONTS[3], w: 700, i: 1, rot: 2 }
  ];
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const rnd = (a, b) => a + Math.random() * (b - a);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const clusters = (s) => (window.Intl && Intl.Segmenter ? [...new Intl.Segmenter('hi', { granularity: 'grapheme' }).segment(s)].map((x) => x.segment) : [...s]);

  function style(tile, t) {
    tile.style.background = t.bg; tile.style.color = t.ink; tile.style.fontFamily = t.font;
    tile.style.fontWeight = t.w; tile.style.fontStyle = t.i ? 'italic' : 'normal';
    tile.style.transform = 'rotate(' + t.rot + 'deg)';
  }
  const randomTile = () => ({ bg: pick(BLOCKS), ink: pick(INKS), font: pick(FONTS), w: pick([400, 700, 900]), i: Math.random() < 0.3 ? 1 : 0, rot: rnd(-7, 7) });

  function init() {
    const title = document.querySelector('.about-title');
    if (!title) return;
    const my = ++run;
    const live = () => my === run && document.body.contains(title);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    title.setAttribute('aria-label', 'Namaste, I am Siddhi');
    title.innerHTML = '<span class="at-greet" aria-hidden="true"><span class="at-typed">Namaste</span><span class="at-caret"></span></span><span aria-hidden="true">, I am </span>' +
      '<span class="at-name" aria-hidden="true">' + [...'Siddhi'].map((c) => '<span class="at-tile">' + c + '</span>').join('') + '<span class="at-tile at-bang">!</span></span>';
    const tiles = [...title.querySelectorAll('.at-tile:not(.at-bang)')], bang = title.querySelector('.at-bang');
    const typed = title.querySelector('.at-typed'), greet = title.querySelector('.at-greet');
    tiles.forEach((t, i) => style(t, SETTLED[i]));
    if (reduce) { bang.classList.add('is-in'); return; }

    // ---- the name: 3 s of random changes, then settle ----
    async function spree() {
      bang.classList.remove('is-in');                                      // the "!" waits out of sight while the tiles jumble
      const end = performance.now() + 3000;
      while (live() && performance.now() < end) {
        tiles.forEach((t) => style(t, randomTile()));
        await sleep(250);
      }
      if (live()) { tiles.forEach((t, i) => style(t, SETTLED[i])); bang.classList.add('is-in'); }   // ...then jumps in to the right of the name
    }

    // ---- the greeting ----
    // reserve the widest of the three words so the rest of the line never jumps while typing
    const widest = () => {
      let w = 0;
      [HINDI, HELLO, 'Namaste'].forEach((s) => { typed.textContent = s; w = Math.max(w, typed.getBoundingClientRect().width); });
      typed.textContent = ''; greet.style.minWidth = (w / (parseFloat(getComputedStyle(title).fontSize) || 64)) + 'em';
    };
    async function typeIn(word, per) { const g = clusters(word); typed.textContent = ''; for (let i = 1; i <= g.length; i++) { if (!live()) return; typed.textContent = g.slice(0, i).join(''); await sleep(per); } }
    async function eraseAll(per) { const g = clusters(typed.textContent); for (let i = g.length - 1; i >= 0; i--) { if (!live()) return; typed.textContent = g.slice(0, i).join(''); await sleep(per); } }

    (async function loop() {
      await document.fonts.ready;
      if (!live()) return;
      widest();
      while (live()) {
        spree();                                                          // not awaited: it runs alongside the typing
        // one 30-second pass: type नमस्ते (slow) · hold · backspace · type Hello!
        const t0 = performance.now();
        await typeIn(HINDI, 380);                                         // ~2.3 s
        await sleep(9000);                                                // read it
        await eraseAll(300);                                              // ~1.8 s
        await sleep(600);
        await typeIn(HELLO, 380);                                         // ~2.3 s
        const rest = 30000 - (performance.now() - t0);                    // top the pass up to 30 s
        if (rest > 0) await sleep(rest);
        await sleep(120000);                                              // then it stays on "Hello!" for 2 minutes
        if (!live()) return;
        await eraseAll(220);                                              // and the loop starts again
        await sleep(500);
      }
    })();
  }

  init();
  (window.SiddhiPages = window.SiddhiPages || {}).aboutTitle = init;      // re-run after an in-place page swap
})();
