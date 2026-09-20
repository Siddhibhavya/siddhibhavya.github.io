/* Side Quests: the "An effort was made" patch. Click it and a pill pops up; click it again, click elsewhere, press Esc or wait 5 s and it goes.
   Everything is delegated from `document`, so it keeps working after the shell swaps the page content in place (no re-init needed). */
(function () {
  'use strict';
  if (window.__questsPatch) return;
  window.__questsPatch = true;

  let timer = 0;
  const note = () => document.getElementById('patchNote');

  function close() {
    clearTimeout(timer);
    const el = note(), btn = document.querySelector('.q-patch');
    if (!el || el.hidden) return;
    if (btn) btn.setAttribute('aria-expanded', 'false');
    el.classList.remove('on'); el.classList.add('off');
    setTimeout(() => { el.hidden = true; el.classList.remove('off'); }, 240);
  }

  document.addEventListener('click', (e) => {
    const el = note();
    if (!el) return;                                                   // not on the Side Quests page
    const btn = e.target.closest && e.target.closest('.q-patch');
    if (!btn) { close(); return; }
    if (!el.hidden && !el.classList.contains('off')) { close(); return; }
    el.hidden = false; el.classList.remove('off'); void el.offsetWidth; el.classList.add('on');
    btn.setAttribute('aria-expanded', 'true');
    clearTimeout(timer); timer = setTimeout(close, 5000);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
})();
