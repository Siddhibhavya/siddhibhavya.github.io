/* Syncletter user flow on phones/tablets (< 900px): the snaking desktop chart is swapped for a linear, top-to-bottom chart
   with the same colours, shapes and arrow SVG. The rest of the page stays the scaled desktop canvas, so the linear chart is
   drawn at natural size (16px text) by counter-scaling it inside the canvas, and everything below it is pushed down. */
(function () {
  'use strict';
  const canvas = document.querySelector('.syn-canvas');
  const viewport = document.querySelector('.syncletter-viewport');
  if (!canvas || !viewport) return;
  const FLOW_TOP = 6381, FLOW_ROOM = 615, BELOW = 6950;   // canvas px: chart top, room before the next block, first block below
  const ARROW = '<span class="lin-arr" aria-hidden="true"><svg viewBox="0 0 21.17 24.48"><path d="M20.5 13.1c.7-.4.7-2.2 0-2.7L1.5.1C.6-.4 0 .7.1 2.1l2.8 9.5c.1.4.1.8 0 1.1L.1 22.4c-.2 1 .5 2.4 1.5 1.9z"/></svg></span>';
  const node = (kind, html) => '<div class="lin-node lin-' + kind + '">' + html + '</div>';
  const num = n => '<b>' + n + '</b>';
  const tag = t => '<p class="lin-branch">' + t + '</p>';
  const wrap = document.createElement('div');
  wrap.className = 'syn-lin';
  wrap.innerHTML = '<div class="syn-lin-in">' +
    node('start', 'Start') + ARROW +
    node('io', num('01') + 'Receive a message') + ARROW +
    node('proc', num('02') + 'Click icon to activate') + ARROW +
    node('proc', num('03') + 'Select message<small>Rule-based check runs on-device, no network call</small>') + ARROW +
    node('dec', num('04') + 'Add your meaning or Reply cues?') + ARROW +
    tag('Add your meaning') + ARROW +
    node('io', 'Type your meaning') + ARROW + node('proc', 'Save') + ARROW + node('proc', 'Go back') +
    tag('Then back to Reply cues') +
    tag('Click Reply cues') + ARROW +
    node('proc', num('05') + 'Reply cues') + ARROW +
    node('proc', num('06') + 'Search words in library') + ARROW +
    node('proc', num('07') + 'Write response with suggested ideas / ways') + ARROW +
    node('io', num('08') + 'Send message') + ARROW +
    node('end', 'End') + '</div>';
  canvas.append(wrap);
  const inner = wrap.firstChild;

  function apply() {
    const phone = innerWidth < 900;
    canvas.classList.toggle('syn-lin-on', phone);
    [...canvas.children].forEach(el => { if (el.dataset.linShift) { el.style.marginTop = ''; delete el.dataset.linShift; } });
    let extra = 0;
    if (phone) {
      const s = new DOMMatrix(getComputedStyle(canvas).transform).a || 1;
      const W = Math.min(380, viewport.clientWidth - 40);
      inner.style.width = W + 'px';
      wrap.style.transform = 'scale(' + (1 / s) + ')';
      wrap.style.left = (902 - W / (2 * s)) + 'px';
      wrap.style.top = FLOW_TOP + 'px';
      const footprint = inner.offsetHeight / s;
      extra = Math.max(0, Math.ceil((footprint - FLOW_ROOM) / 41) * 41);   // whole paper rows, so text below stays on the grid
      [...canvas.children].forEach(el => {
        if (el === wrap || el.classList.contains('syn-lin')) return;
        const top = parseFloat(getComputedStyle(el).top);
        if (top >= BELOW) { el.style.marginTop = extra + 'px'; el.dataset.linShift = '1'; }
      });
    }
    canvas.style.setProperty('--flow-extra', extra + 'px');
    window.synFlowExtra = extra;
    if (window.synFit) window.synFit();
    if (window.synAlign) requestAnimationFrame(window.synAlign);
  }
  let t = 0;
  const later = () => { clearTimeout(t); t = setTimeout(apply, 60); };
  addEventListener('resize', later);
  document.fonts.ready.then(apply);
  apply();
})();
