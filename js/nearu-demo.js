/* NearU "Try demo": opens the prototype (prototype/nearu/) in a pop-up frame instead of a new tab.
   Every open starts a fresh, clean session (the iframe is reloaded), so each recording starts from the same state. */
(function () {
  'use strict';
  if (!document.body.classList.contains('nearu-page')) return;
  const SRC = '../prototype/nearu/index.html?v=1.0.2.' + 20261011;   // bump with each prototype build so a stale cached copy is never shown
  const PHONE_W = 402, PHONE_H = 839, CHROME_H = 150, SIDE_W = 296;   // chrome = title bar + body padding + page margin; SIDE_W = room for the Restart / Back column on both sides
  let modal, iframe, opener, scrollY0 = 0;

  function build() {
    modal = document.createElement('div');
    modal.className = 'nu-demo-modal';
    modal.hidden = true;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'nu-demo-title');
    modal.innerHTML =
      '<div class="nu-demo-frame">' +
        '<div class="nu-demo-bar"><h2 class="nu-demo-title" id="nu-demo-title">Prototype Demo</h2><button type="button" class="nu-demo-x" data-close aria-label="Close prototype">X</button></div>' +
        '<div class="nu-demo-body"><div class="nu-demo-screen"><iframe title="NearU prototype"></iframe><i class="nu-key nu-key-l1"></i><i class="nu-key nu-key-l2"></i><i class="nu-key nu-key-l3"></i><i class="nu-key nu-key-r"></i><i class="nu-island"></i></div>' +
        '<div class="nu-demo-actions"><button type="button" data-restart>Restart</button><button type="button" data-back>Back</button></div></div>' +
      '</div>';
    iframe = modal.querySelector('iframe');
    modal.addEventListener('click', e => { if (e.target === modal) close(); });
    modal.querySelectorAll('[data-close], [data-back]').forEach(b => b.addEventListener('click', close));
    modal.querySelector('[data-restart]').addEventListener('click', () => { iframe.src = SRC; });
    document.body.append(modal);
  }
  function fit() {
    if (!modal) return;
    const fluid = innerWidth <= 520;
    modal.classList.toggle('is-fluid', fluid);
    const s = fluid ? 1 : Math.max(0.4, Math.min(1, (innerHeight - CHROME_H) / PHONE_H, (innerWidth - 48 - SIDE_W) / PHONE_W));
    modal.style.setProperty('--s', s.toFixed(4));
  }
  function open(from) {
    if (!modal) build();
    opener = from;
    scrollY0 = scrollY;
    fit();
    iframe.src = SRC;
    modal.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    modal.querySelector('[data-close]').focus();
  }
  function close() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    iframe.src = 'about:blank';   // stop the session; the next open starts clean
    document.documentElement.style.overflow = '';
    scrollTo(0, scrollY0);
    if (opener) opener.focus({ preventScroll: true });
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-nearu-demo]');
    if (b) open(b);
  });
  document.addEventListener('keydown', e => {
    if (!modal || modal.hidden) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'Tab') {   // keep keyboard focus on the two buttons while the pop-up is open
      const btns = [...modal.querySelectorAll('.nu-demo-x, .nu-demo-actions button')], i = btns.indexOf(document.activeElement);
      if (i < 0) { e.preventDefault(); btns[e.shiftKey ? btns.length - 1 : 0].focus(); }
      else if (e.shiftKey && i === 0) { e.preventDefault(); btns[btns.length - 1].focus(); }
      else if (!e.shiftKey && i === btns.length - 1) { e.preventDefault(); btns[0].focus(); }
    }
  });
  addEventListener('resize', fit);
})();
