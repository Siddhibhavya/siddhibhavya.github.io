# Project rules for Claude

Plain HTML/CSS/JS portfolio site, no build step. Read `PROJECT-MAP.md` first
(one-page graph of every doc + the perf audit), then `tools/DEV-NOTES.md` for
the folder map and how the site fits together.

## Read this before touching a case-study page (`work/*.html`)

**`CASE-STUDY-GUIDELINES.md`** (project root) is required reading before
adding or editing a case-study page. It covers:
- the global brand every page must reuse (colours, fonts, the shared sidebar
  component and its `data-shell`/`data-toc` modes, the two grid techniques)
  — added automatically on every new page, since Siddhi only supplies content
- pulling the real Figma node before guessing at a size/position/colour
- a list of specific bugs this project already hit once (CSS measurement,
  cascade ordering, centering math on the absolute-canvas pages, media
  weight) so they aren't repeated
- **brand ownership**: the site palette owns ~75–85% of every case-study
  page; project colours appear only on elements that represent the product
  (feature pills/boxes, prototype UI, diagrams, icons, mockups), never on
  page background, body text, headings, navigation, dividers or borders
- the small sitewide copy conventions (e.g. the drawer reminder just says
  "Menu")

Keep that doc updated as new lessons come up — it's meant to carry across
chats, not just this one.

**`NEXT-CHAT-PLAYBOOK.md`** (project root) is the short hand-off for building
the two remaining case studies (NCFE redesign, plus a new project that replaces the removed "Are they Driving?") efficiently:
state, Figma frame ids, the fast build recipe, and token-saving habits.

## Working style

- The approved case-study standards in `CASE-STUDY-GUIDELINES.md` §1 are
  mandatory for every case study: `#fff1df` continuous paper, text baselines
  aligned to grid rules, and left-aligned Contents labels that animate to an
  optical center with their arrow. The panel hugs the actual section count.
  Preserve these defaults as copy, label lengths and section counts change.
  Center case-study pill labels in both axes inside their pill, with clear icon
  spacing and a full-pill click target. Syncletter prototype pills extend to
  the next lower grid rule; see the approved dimensions in the guidelines.
  Extend the shared shell hooks for new pages; the current implementation is
  scoped to NearU and Syncletter. These approved standards take precedence
  over older Figma chrome and do not need fresh approval.

- **NON-NEGOTIABLE: highest quality for text, images and video.** Performance work may change *how*
  assets are delivered (caching, lazy loading, lossless WebP, deferring scripts) but never reduces
  their quality: no lossy re-compression of images or video, no blurry/soft text, no smaller
  dimensions. Text must always render crisp at rest (nothing readable only on hover).
- **Only finished case studies are public.** Unfinished projects stay hidden (see "Hidden projects" in
  `NEXT-CHAT-PLAYBOOK.md`, search `HIDDEN-UNTIL-READY`) until Siddhi says to show them.
- **NON-NEGOTIABLE: parity across versions.** Pill colours, the pills' invert/hover
  animations and every SVG (icons, arrows, doodles, diagrams) exist in every
  version of a page (desktop, tablet, phone). A phone/tablet layout may
  re-arrange them but must never remove, recolour or swap them for something
  else. Prefer showing the desktop composition (scaled or re-flowed) over
  inventing a different one — Siddhi rejected a bespoke Syncletter phone layout
  and kept the scaled desktop canvas.
- **NON-NEGOTIABLE: grid alignment.** No case-study change is finished, and
  nothing may be committed or pushed, until the grid audit
  (`tools/grid-audit.js`, paste into the browser JS tool) reports zero
  off-grid text runs on desktop AND on phone/tablet widths, for every page
  touched. Text baselines on the rules, smallest text 16px (as rendered).
  Filled cards/pills/mockups are the only exceptions. Do not report "done"
  from eyeballing.

- **Global design rules for every element you add or move, on every case
  study, desktop and phone** (not just the first pass — re-check after each
  edit):
  1. **Text sits on the grid lines.** Every line of text (headings, body,
     labels, list items, diagram captions, notes beside images) has its
     baseline on a paper rule: desktop 41px rows (phase 14px), phone 28px
     rows (phase 20px). Use whole-row line-heights and whole-row block
     heights, register new text nodes in the page's ruled list
     (`RULED` in `js/syncletter.js`, `ruledIds` in `js/nearu.js`), and shift
     content in whole rows (41 / 28). Measure the real baseline to verify —
     don't eyeball. See `CASE-STUDY-GUIDELINES.md` "Text must sit on the grid".
  2. **Content is centred in the beige content area**, not the whole canvas
     (see guidelines §4), and equal on both sides on phones.
  3. Highlighted feature names / key insights are bold `var(--hl-red)`.
  4. **The smallest text is 16px** (as rendered, after the canvas scale) for
     every written line on the paper, desktop and phone: body, captions,
     labels, notes, diagram text. Text inside product mockups/screenshots is
     the only exception.
- Nothing invented without checking. When a design detail is ambiguous or
  feedback contradicts an earlier guess, pull the Figma node
  (`get_metadata` / `get_design_context`, file key `Nc087O4ophE87f3EyMdcVh`)
  rather than iterating blind — ask for the specific node link if one isn't
  already given.
- Run `node tools/check.js` after every change; zero errors before calling
  something done.
- **Pages load minified files** (`js/foo.min.js`, `css/intro.min.css`, `css/notfound.min.css`, `css/pages/syncletter.min.css`, and `css/site.css`). Edit the readable source, then run `node tools/build-min.js` (and `node tools/bundle-css.js` for bundled CSS); `check.js` errors if a `.min` file is older than its source. NearU files are not minified yet (`node tools/build-min.js --nearu` once its WIP is committed). Never hand-edit a `.min` file. Commit source + `.min` together.
- **Shared working tree:** another chat may have uncommitted work in the same repo (e.g. the NearU prototype). Before committing run `git status`, stage only your own files/hunks (`git apply --cached` on selected hunks if a file is shared), and leave the rest alone.
- Commit only what was actually asked for or touched — don't stage unrelated
  in-progress work found elsewhere in the tree.
- **Fonts:** Ancizar Sans only (self-hosted, `size-adjust: 122%`); **never Inter**. Bold/black render italic by design; an upright bold uses `'Ancizar Sans Upright'`. Details: `CASE-STUDY-GUIDELINES.md` section 8.
- **Crisp text:** never animate `transform` (or add `will-change`) inside/over a tilted card — it softens the text until hover. Use `margin`/`top`.
- **Paper + scrapbook:** every grid page gets the faint paper veil (`css/shell/paper.css`); My Work/About have the torn corners; each My Work card has a pin (opposite colour of the project). Each also has a torn paper sheet behind it, shown on desktop only (hidden on the phone layout); upcoming cards mirror the card above. Notifications centre on the content area (`--notify-x`). After editing bundled CSS run `node tools/bundle-css.js`.

- **Replies: keep them short.** When the answer is short, say it short ("done", "committed and live"). No recaps or lists unless asked.
