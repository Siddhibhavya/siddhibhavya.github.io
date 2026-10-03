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

  /* hover summaries: each picture rolls down the shared yellow scroll with a line about the project (desktop, mouse only). */
  const SUMMARIES = {
    '.q-poster': 'Heckler is a small project built with ESP32, with only one goal in mind: to disturb me. It holds a countdown of 45 minutes, then plays an unstoppable tune that detunes unless you start a break timer. The break runs for 10 minutes and reminds you. After which, the button press starts the same cycle again.',
    '.q-phone2': 'Convince Me is an app prototype that argues with you while shopping, whenever you are about to exceed your budget.',
    '.q-frog': 'A small RPG game where your goal is to help the froggy cross the pond safely.',
    '.q-brain': 'An academic exercise to depict “you”, made when I was really burnt out.',
    '.q-basket': 'When I first learnt woodworking, baskets were my first project. Then I built a kitchen set for myself.',
    '.q-abstract': 'A take on synesthesia: how does one particular song make me feel? This one was Lana Del Rey’s “Born to Die”.',
    '.q-sword': 'I love swords, so I built a 4ft sword for myself and cut the hilt out of brass.',
    '.q-camera': 'Archives of Dhanushkodi. What if you were an archivist sent to Dhanushkodi in the 1980s, and your job was to click images? A VR experience built with Arduino.',
    '.q-cat': 'My collection of cat pics.',
    '.q-mystery': 'Caryl Churchill’s play Love and Information, shown through a lens of mystery.',
    '.q-album': 'A sound design project for my minor: I wanted to represent anxiety and paranoia through the night.'
  };
  const SELECTOR = Object.keys(SUMMARIES).join(',');
  const canHover = matchMedia('(hover: hover) and (pointer: fine)');
  let scroll = null;
  function panel(stage) {
    if (!scroll || !scroll.isConnected) { scroll = document.createElement('div'); scroll.className = 'q-scroll'; scroll.setAttribute('aria-hidden', 'true'); scroll.append(document.createElement('p')); stage.append(scroll); }
    return scroll;
  }
  document.addEventListener('mouseover', (e) => {
    if (!canHover.matches || !e.target.closest) return;
    const item = e.target.closest(SELECTOR), stage = document.querySelector('.stage.quests');
    if (!stage || document.body.classList.contains('compact')) return;
    const box = scroll && scroll.isConnected ? scroll : null;
    if (!item || !stage.contains(item)) { if (box) box.classList.remove('open'); return; }
    if (box && box.dataset.for === item.className && box.classList.contains('open')) return;
    const sel = Object.keys(SUMMARIES).find(k => item.matches(k)), el = panel(stage);
    const sr = stage.getBoundingClientRect(), ir = item.getBoundingClientRect(), s = sr.width / stage.offsetWidth || 1;
    el.firstChild.textContent = SUMMARIES[sel]; el.dataset.for = item.className;
    const left = Math.max(0, Math.min((ir.left - sr.left) / s + ir.width / s * 0.3, stage.offsetWidth - 249));
    el.style.left = left + 'px'; el.style.top = ((ir.top - sr.top) / s + ir.height / s * 0.37) + 'px';
    el.classList.add('open');
  });
  document.addEventListener('mouseout', (e) => { if (scroll && !e.relatedTarget) scroll.classList.remove('open'); });
})();
