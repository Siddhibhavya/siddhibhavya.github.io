# Playbook for the next chat — the two remaining case studies

Read this file, `CLAUDE.md` and `CASE-STUDY-GUIDELINES.md` (§1, §3, §4). That is
enough context. **Do not** read whole CSS/JS files or `_source/`; grep for the
class you need. Siddhi gives feedback in short messages and wants visible
results fast — act, verify once, report briefly.

## State
- Done + live: Syncletter (`work/syncletter.html`, `css/pages/syncletter.css`,
  `js/syncletter.js`), NearU (`work/nearu.html`, `css/pages/nearu.css`,
  `js/nearu.js`, `js/nearu-mobile.js`), the home/side-quests/about pages, the
  M.I.K.U bank (`js/bank.js`), résumé links (`js/config.js`).
- Remaining: **NCFE redesign** (`work/ncfe-redesign.html`, still a placeholder)
  and **Are they Driving?** (`work/are-they-driving.html`, placeholder).
- Figma file `Nc087O4ophE87f3EyMdcVh` ("Portfolio"). Frames: NearU `351:1516`,
  Syncletter `419:964`, NCFE `438:3070`. **`438:3070` ("NCFE ") is currently a
  copy of the Syncletter layout** (palette already synced to the website) —
  it is a structural starting point, not NCFE content. No Are they Driving
  frame was found: ask Siddhi for the node link, and for the real copy /
  images / links before building. Never invent content.
- Figma edits: already recoloured to the site palette (see below) on the
  three case-study frames; use `use_figma` (load the `figma-use` skill first).

## Hidden projects (HIDDEN-UNTIL-READY)
Only finished case studies are public. NCFE – Redesign and Are they Driving? are hidden until Siddhi says so (Are they Driving? will
become a different project). To hide/unhide, search the repo for `HIDDEN-UNTIL-READY`: `home.html` (cards carry `hidden`, wrapper has
`hide-low`), `css/pages/work.css` (wrapper heights), `js/config.js` (`hidden: true` on the project), `js/bank.js` (`"hidden":true` on
the ncfe-redesign-*, are-they-driving-* and projects-5 entries; projects-1 / projects-8 answers now only mention Syncletter and NearU),
`work/ncfe-redesign.html` / `work/are-they-driving.html` (noindex + redirect to home unless `?preview`). Never publish an unfinished
project card or M.I.K.U answer for it.
Original answers to restore: projects-1 "There are four on the index: Syncletter, NearU, NCFE - Redesign and Are they Driving? Pick one and
I’ll tell you more." (+ the two extra buttons); projects-8 "…NCFE - Redesign and Are they Driving? are still on their way — for now their
cards on My Work open a summary."

## Phone layouts
Siddhi prefers Syncletter's original approach: the phone shows the scaled desktop canvas (no separate phone layout). A separate
phone layout was tried and rejected — don't rebuild it for Syncletter. NearU keeps its own phone layout (`js/nearu-mobile.js`).

## Fastest way to build a case study
1. Copy the closest finished page: Syncletter for a single-canvas page,
   NearU when you also need a separate phone layout.
2. Page skeleton: `<body class="<x>-page" data-shell="sidebar" data-toc='[…]'>`,
   a `.x-viewport > .x-canvas` (1448 wide, absolutely positioned children with
   `data-node-id`), `js/<x>.js` for scaling (`fit()`), `RULED` snapping and
   `CANVAS_H`; import the page CSS in `css/site.css`; the checker
   (`node tools/check.js`) tells you what is missing.
3. Add the project card link on `home.html`, bank answers in `js/bank.js`
   (JSON entries; edit with a script, never regex-replace by hand).
4. Diagrams/charts are inline SVG built by a small Python/Node generator
   script; keep the generator until the design is approved.

## Design rules (all already in the docs — the short version)
- Palette lives only in `css/base.css`: paper `#fff1df`, burgundy
  `--maroon #7b2b3d`, borders `#4a1a2c`, body text `--espresso #4a2e22`, light
  labels `--chestnut #5c3a21`, headings Museum Purple `#39265f`, highlights bold
  `var(--hl-red)` (`#8f2000`), Cosmic Ink `#1b0b2e`. Project colours only on
  product elements (Syncletter teal `#075e54`; NearU yellow `#FEC12D`, blue
  `#0D57CE`, black `#17120E`, cream `#FFFAEB`, coral `#FC5956`).
- **Every text line sits on the paper grid** (desktop 41px rows/phase 14, phone
  28px/phase 20) and content is **centred in the beige area** (canvas x≈898/902).
  Whole-row line-heights, shift things in whole rows, register text in the
  page's ruled list, alignment re-runs on `load`. Verify with the baseline probe.
- Section labels: chestnut, weight 500, uppercase; section headings heavy
  burgundy; diagrams: flat fills, no borders (flowcharts use the standard
  colours), fat home-arrow triangle for arrows, text inside shapes centred.
- Links open in a new tab; Contents (sidebar) lists every section.

## Habits that save tokens and credits
- One targeted `Grep` beats reading a file. The absolute canvas CSS has
  hundreds of one-line rules — search by `.syn-NN` / `.nu-NN`.
- **Write scripts with the Write tool, then run them.** Shell heredocs with
  quotes/apostrophes break; on Windows Python cannot see `/tmp` (use paths
  under the project or the scratchpad).
- Moving content down/up: script it (regex on `top:` in the page's CSS rules)
  and remember all of: **every** `top:` in a rule (some rules declare it twice),
  any `%` insets on canvas children (convert to px first — they drift when the
  canvas height changes), canvas height in **CSS + JS (`CANVAS_H`) + layers/plates**
  (NearU), inline `style="top:…"` in the HTML, and the footer/plate below.
- Verify with **measurements** (`getBoundingClientRect` via the browser JS tool)
  and one screenshot at the end; screenshots are JPEG-soft and cannot judge
  blur. The pane resizes on its own — re-check `innerWidth`. To test phone
  layout use the mobile preset then reset to desktop.
- Blurry text on tilted/scaled things: no rounded `overflow:hidden` on a
  rotated box, no `will-change`/`backface-visibility`/`filter` layers around
  text, prefer `zoom` over `transform: scale` for scaling content.
- Don't loop on Figma screenshots; pull node metadata once, then build.
- Run `node tools/check.js` after each change, commit only when asked (then
  `git add -A && git commit && git push origin main` — the repo is the live
  GitHub Pages site).
- The Bash tool's safety check sometimes errors transiently: retry the same
  command once or use PowerShell.

## Definition of done for a case study
Contents item + scrollspy work (desktop and phone, `#mobile-<id>` headings),
phone layout reads well, text on grid everywhere (measure), content centred,
highlights in `--hl-red`, links new-tab, M.I.K.U answers added from the page's
own facts (no inventions), home card + Figma frame matched to the page,
`node tools/check.js` clean, then commit/push on request.

## Added 2026-10: look-and-feel rules to carry into NCFE and Are they Driving?
- Fonts: Ancizar Sans (self-hosted, size-adjusted; bold = italic; no Inter). Paper veil/grain on every grid page (`css/shell/paper.css`).
- My Work cards already have a pin (yellow for NCFE, green for Driving). Each card also has a torn paper sheet behind it (`<span class="card-sheet ...">`), desktop only: hidden on the phone layout.
- Case-study cards open in the same tab; notifications centre on the content area; keep tilted-card text crisp (no transform animations inside). Full list: `CASE-STUDY-GUIDELINES.md` section 8.


## State after 2026-10-03 (read with CASE-STUDY-GUIDELINES.md section 9)
- NearU and Syncletter are rebuilt: shorter copy, spider / loop / T-chart, persona on torn paper, memos, film + demo frame with call-outs, centred media. Open item: **recordings of each part of the NearU app** to replace the buyer/seller image, and the NearU prototype link (owner will supply).
- Moving content: edit the shift tables (`SHIFTS`, `SYN_SHIFTS`), then run `tools/gaps.js` and `tools/grid-audit.js` at 1200 and 400px; fix gaps > ~100px and any overlap before committing.
- A doc with the original (pre-edit) copy of both pages exists in Claude Docs ("Case studies: original copy"); git `94a7589` has the originals.
