/* A simple word filter for typed signatures (window.SiddhiWords.isClean(text)).
   It is a friendly speed-bump, not a wall: it catches the obvious rude words (and the usual tricks like "f u c k", "sh1t", "fuuuck"),
   links, email addresses and phone numbers. Anyone determined can still get round it, which is why cards also have a "hidden" flag you can flip
   in the Firebase console, and why the gallery runs every name through this filter again before showing it.

   How it works: the text is lower-cased, accents and number-for-letter swaps (0→o 1→i 3→e 4→a 5→s 7→t @→a $→s !→i) are undone, and it is cut into words.
   • STRONG words are unmistakable, so they are caught anywhere inside a word (after squashing repeated letters).
   • WORDS are ambiguous inside other words ("ass" is in "Cassandra"), so they only count when they are the whole word.
   • SAFE lists innocent words that happen to contain a STRONG word (the "Scunthorpe problem").
   To add a word, put it in the right list below — nothing else to change. */
(function () {
  'use strict';

  const STRONG = [
    'fuck', 'shit', 'bitch', 'cunt', 'pussy', 'whore', 'nigger', 'nigga', 'faggot', 'retard', 'bastard', 'asshole', 'wanker', 'twat', 'bollocks',
    'cocksucker', 'dickhead', 'jerkoff', 'blowjob', 'handjob', 'cumshot', 'hitler',
    'madarchod', 'behenchod', 'bhenchod', 'bhosdi', 'bhosad', 'chutiya', 'chutiye', 'gaandu', 'gandu'
  ];
  const WORDS = [
    'ass', 'arse', 'dick', 'cock', 'tit', 'tits', 'boob', 'boobs', 'penis', 'vagina', 'anal', 'cum', 'porn', 'sex', 'sexy',
    'rape', 'rapist', 'slut', 'fag', 'kike', 'spic', 'chink', 'coon', 'gook', 'dyke', 'tranny', 'nazi', 'kkk'
  ];
  const SAFE = ['scunthorpe', 'shiitake', 'shitake', 'niggard', 'niggardly', 'retardant', 'retardation'];

  const LEET = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b', '@': 'a', '$': 's', '!': 'i', '+': 't' };
  const collapse = (s) => s.replace(/(.)\1+/g, '$1');                          // "fuuuck" -> "fuck"
  const STRONG_C = STRONG.map(collapse);
  const SAFE_C = SAFE.map(collapse);

  function tokens(text) {
    const folded = String(text).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[0134578@$!+]/g, (c) => LEET[c]);
    const raw = folded.split(/[^a-z]+/).filter(Boolean);
    const out = []; let run = '';                                              // "f u c k" / "f.u.c.k": single letters in a row are one word
    for (const t of raw) {
      if (t.length === 1) { run += t; continue; }
      if (run) { out.push(run); run = ''; }
      out.push(t);
    }
    if (run) out.push(run);
    return out;
  }

  function isClean(text) {
    const s = String(text == null ? '' : text);
    if (/https?:|www\.|\.(com|net|org|io|in|me|co)\b|\S@\S|\d{7,}/i.test(s.replace(/\s+/g, ''))) return false;   // links, emails, phone numbers
    for (const t of tokens(s)) {
      const c = collapse(t);
      if (SAFE_C.includes(c)) continue;
      if (STRONG_C.some((w) => c.includes(w))) return false;
      if (WORDS.includes(t) || WORDS.includes(t.replace(/(.)\1{2,}/g, '$1$1'))) return false;
    }
    return true;
  }

  window.SiddhiWords = { isClean };
})();
