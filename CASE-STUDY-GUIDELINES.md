# Building a new case-study page — read this first

Every case study (`work/*.html`) has its own layout — that's expected and fine.
What must **not** vary page to page is the site's global brand: the sidebar,
the colours, the fonts, and the graph-paper background. This doc is the
reference for keeping those consistent, plus the specific bugs this project
already hit once so the next page doesn't repeat them.

**Standing rule: she supplies content, not chrome.** From here on, Siddhi is
only providing the page-specific material (copy, screenshots, Figma frames,
placeholder areas to fill in) — the sidebar/navbar, page background, and grid
are a given on every new page and should be wired up automatically as part of
adding that page, without her having to ask for each one. Use §1 below (the
sidebar's `data-shell`/`data-toc` modes, the two grid techniques) to add them
by default; only skip one if she explicitly says to.

## 1 · Global brand — reuse, don't reinvent

### Colours (`css/base.css`, `:root`)
| Token | Hex | Use |
|---|---|---|
| `--plum` | `#1b0b2e` | landing + footer bg |
| `--cream` | `#fff1df` | sidebar text on dark, page bg elsewhere |
| `--maroon` | `#7b2b3d` | sidebar/explore-box bg, headings, "HOME" links, arrows |
| `--maroon-edge` | `rgba(119,51,68,.93)` | borders on maroon UI (drawer button, nudge pill) |
| `--ink` | `#1b0b2e` | the real EXPLORE nav's active-item text (reads harsh on a cream pill — prefer `--brown` there, see §3) |
| `--brown` | `#57443e` | active pill text, "Connect with me!" title |
| `--brown-soft` | `rgba(53,35,26,.7)` | bio/connect-link body text |
| `--pill` | (check base.css) | the EXPLORE nav-pill fill |
Never introduce a new hex for something these already cover — a new case study
page reusing `#57443e` instead of `var(--brown)` is a paper cut that shows up
the next time the palette changes.

### Brand ownership — the site is the environment, the project is the exhibit (2026-09-29)

**Siddhi's brand = the environment. The project's brand = content displayed
inside it.** Roughly 75–85% of the visible interface on *every* page, case
studies included, uses the global site palette. The portfolio never changes
its colour identity to match the project being viewed. A visitor should feel
"I'm still in Siddhi's portfolio, viewing the Syncletter exhibit" — not "I've
entered the Syncletter website."

**Site brand palette (as briefed):** Cosmic Ink `#1B0B2E`, Museum Purple
`#39265F`, Archive Burgundy `#7b2b3d`, Gallery Cream `#FFF1DF`, Paper
`#F7E9DC`, Ink Brown `#57443E`, Muted Ink `#8A746B`.
**Migrated 2026-09-29:** these hexes are now the live values in `css/base.css` (`--plum`=Cosmic Ink, `--maroon`=Burgundy, `--brown`=Ink Brown, `--cream`/case-study paper=Gallery Cream, `--card`/`--pill`=Paper, headings=Museum Purple `#39265f`). Change them only in `base.css`, never per page.

**Highlighted words (2026-09-29):** feature names and key insights inside case-study copy are bold `var(--hl-red)` (`#8f2000`, NearU's red two tones darker) on every case study — NearU and Syncletter share it. Don't hard-code the hex.

**Case-study text browns (2026-09-29):** body copy uses `var(--espresso)` (`#4a2e22`, 11:1 on cream); lighter/secondary text (≤20px, small labels, captions, uppercase tags) uses `var(--chestnut)` (`#5c3a21`, 9:1). Don't hard-code either hex on a page.

**Site brand controls (never project colours):** page backgrounds, global
typography, navigation/Contents, menu, Resume button, global buttons,
case-study headings and section titles, page dividers, general borders,
general cards, research text, metadata, footer, global links, decorative site
elements.

**Project colours are secondary and contextual.** Allowed only in components
that *represent, explain or demonstrate the product*: feature boxes and
pills, prototype UI, product diagrams, branded callouts, selected data
visualisations, icons, screenshots, mockups, component demos, brand-system
sections.

**The test, before applying any project colour:** *is this element
representing the PRODUCT, or structuring the WEBSITE?* Product → project
colour allowed. Website → site palette.

| Element | Colour |
|---|---|
| "RESEARCH" label | Site burgundy |
| Research paragraph | Site ink brown |
| Large case-study headline | Site museum purple |
| Page background, navigation, dividers | Site palette |
| "Reply Cues" feature pill, Syncletter feature box, WhatsApp prototype, Syncletter icon | Syncletter teal/green |
| NearU feature boxes, pills, branding demos, illustrations, product UI | NearU yellow/blue/black |

Never turn a whole case-study page Syncletter-green or NearU-yellow/blue.
Apply this consistently to every case study, including all future projects.

### Approved case-study paper colours (2026-09-28)

All case studies use the NearU/Syncletter paper background: **`#fff1df`**.
Apply it consistently to the page, layout, viewport, canvas and mobile paper
so exposed edges and section boundaries have no colour seams. This is distinct
from `--cream` (`#fff1df`, sidebar text) and `--card` (`#f7e9dc`, shell cards).
The footer keeps `var(--plum)`; Contents keeps `var(--maroon)` with
`var(--pill)` for the selected row and `var(--brown)` for its text.
Product screenshots and intentionally filled cards retain their own colours.
Reuse these approved values; consolidate them into a shared paper token when
extending the common styles instead of introducing another similar beige.

### Fonts
- **Ancizar Sans** (`var(--font-ui)`, self-hosted in `assets/fonts/`) — all UI chrome, body copy. Regular/medium are upright; bold/black use the italic file. It is enlarged 122% (`size-adjust` in `css/base.css`) so sizes and baselines match what the layouts were built on; a line that must be bold but upright uses `'Ancizar Sans Upright'`.
- **Ancizar Serif** (`var(--font-serif)`) — display headings ("Building NearU", the sidebar name).
- **Blank Script** (`var(--font-script)`) — the one decorative use on the landing page. Don't reuse it elsewhere without asking.
- A case study's own brand fonts (e.g. NearU's "Futura 100" / "Liberation Sans" swatches) are content about *that product*, not site chrome — they stay scoped to that page's brand section and never leak into `--font-ui`/`--font-serif`.

### The sidebar (Index / M.I.K.U card)
This is **one shared component**, built once by `js/shell.js` + `css/shell/sidebar.css` + `css/shell/compact.css`, and every page must use it rather than building its own:
- `<body data-page="…" data-root="…">` — no `data-shell` attribute — gets the
  full shell: sidebar, footer, arrival animation, pjax router (root-level
  pages only).
- `data-shell="sidebar"` — a page that draws its **own** canvas and footer
  (like a literal Figma-canvas case study) but still wants the real sidebar,
  drawer, Resume pill and M.I.K.U chat. This mode was added in this project
  for `work/nearu.html`; use it for the next one instead of hand-building a
  sidebar again.
- `data-shell="none"` — no shell at all (landing page only).
- `data-toc='[{"id":"context","label":"Context"}, …]'` — swaps the sidebar's
  avatar/bio/EXPLORE-nav for a "Contents" list of the page's own sections
  (see `tocList()`/`initToc()` in `shell.js`, `§4b` in `sidebar.css`). Use
  this for any case study with in-page sections — it's the "Home"
  back-link + jump list + scrollspy pill, all reusing EXPLORE's own box/pill
  styling and motion.
- Never copy `sidebarHTML()`'s markup into a page-specific file. If the
  Contents variant needs a new capability, extend `initToc`/`sidebarHTML`
  in `shell.js` so every case study benefits.

### Approved Contents navigation (2026-09-28)

Use this behavior for every case study, regardless of section count or label
length. NearU and Syncletter are the approved visual reference.

- Inactive labels share a left edge. The selected label slides inward to an
  **optical center with its arrow**. Animate `left`/`transform`; changing
  `justify-content` alone snaps. Selection must not push text to the far right.
- Reserve separate space for the arrow throughout the animation. The current
  design uses a 273px row, 16px outer insets, a 21px arrow and a 12px label/arrow
  gap. Center their combined width, measuring each label after fonts load.
  Compare measurements in the same coordinate system when the sidebar scales.
- Keep the rounded maroon panel, subtle inset border/shadow, cream moving pill,
  warm brown active text and visible keyboard focus. Keep `aria-current` in
  sync with selection and respect reduced-motion preferences.
- Clicking selects immediately while the page scrolls; intermediate sections
  must not steal that selection during the jump. Normal scroll tracking resumes
  when the jump finishes. Keep the pill and row heights synchronized.
- The panel hugs its links. Cap gaps at **24 design pixels**, with **30px top
  and bottom padding**; fewer sections produce a shorter panel. Reserve a
  visible gap above Connect. Reduce gaps toward 8px before reducing label size.
  The current starting label size is 31px, with a 38px row height.
- Calculate height from the actual item count and available space. Handle zero
  or one section without dividing by zero. For longer labels or larger lists,
  use wrapping/adequate row height or an accessible scrolling list if needed;
  never clip labels, overlap rows/arrows, or cover Connect to force a fit.
- Keep this behavior in the shared shell. The current approved implementation
  is gated by `.nearu-page`/`.syncletter-page` in `sidebar.css` and `initToc()`.
  When adding another case study, extend the shared case-study hook so it gets
  these defaults; do not assume `data-toc` alone currently enables them or copy
  the sidebar into the new page.

### Pill labels and grid edges (approved 2026-09-28)

- Center pill text horizontally and vertically using a single flex/grid
  container. Put the label inside the pill; avoid separate absolute text
  coordinates that drift when its height, width or copy changes. Use explicit
  line-height and remove paragraph margins within pills.
- Apply this to case-study tags, prototype/research links and small UI pills.
  The approved Contents navigation above retains its own selection animation.
- A pill with an icon must still leave clear space around centered text.
  Reserve balanced icon space or widen the pill; check the actual text and icon
  bounds after fonts load. Keep neighboring pills clear when dimensions change.
- Make the entire link pill clickable and keyboard focusable. Background,
  border and label hover together as one element, with reduced motion supported.
- Syncletter's two **Try prototype** pills extend downward to the next horizontal
  grid rule. Keep their top positions and set height from the grid phase/step:
  the current design-space bottoms are 793px and 7763px, giving heights of 47px
  and 48px. Recalculate from the grid if their position changes. Center the text
  in the resulting pill; button labels are excluded from paper-baseline snapping.
- Verify centering, icon clearance, grid contact and hover/focus behavior at
  desktop and compact widths. Keep the whole pill and grid scaled together.

### Background grid
Two different techniques exist, pick based on how the page is built:
- **Pages built as normal HTML flow** (About, Work, Quests, Gallery): use
  `css/pages/decor.css`'s CSS-drawn grid (`--gk`/`--gx`/`--gy` per page,
  §1 "Graph-paper grid"). This is the default — reach for it first.
- **Pages built as a literal, absolute-positioned Figma canvas** (NearU):
  the grid is drawn directly on the canvas element with a `linear-gradient`
  background-size/position tuned to the canvas's own design-space
  coordinates (see `css/pages/nearu.css`'s comment "the Figma tile PNG …
  exported fully transparent"). If a Figma export's own grid/tile asset is
  transparent or missing, don't chase the broken asset — draw the grid this
  way instead.
- Anchor vertical rules to the text column. Keep one continuous paper grid
  through the content, including uncovered viewport edges.

### Text must sit on the grid (approved 2026-09-28)

**This is a global design rule (restated 2026-09-29).** It applies to *every*
piece of text you add or move — new sections, diagrams, captions, side notes,
labels beside images, list items — on desktop **and** phone, and it must be
re-verified after each edit, not just when the page is first built.
- Desktop: 41px rows, phase 14px. Phone: 28px rows, phase 20px.
- Give text whole-row line-heights (41 / 28) and whole-row block heights, and
  shift blocks in whole rows, so every following line stays on a rule.
- Register each new text node with the page's snapping code (`RULED` in
  `js/syncletter.js`; `ruledIds` in `js/nearu.js`, which also snaps the phone
  Reflection list as a unit).
- Alignment runs once fonts load **and again after the page load event**:
  images and SVG art settle late and shift everything below them.
- Verify with the real baseline probe (zero-size inline element with
  `vertical-align:baseline`, in the page): `((baseline - origin - phase) mod
  step)` should be 0 (or exactly one step). Don't eyeball it.

- Align the actual font **baseline** of headings, paragraphs, lists and captions
  on paper with horizontal rules. Grid alignment here refers to page content;
  Contents navigation and text inside filled cards/buttons keep their own layout.
- The desktop canvas reference is a **41px grid**, vertical phase **14px**, with
  1px rules in `rgba(46,20,10,.12)`. Use 41px body line-height and whole multiples
  such as 82px for larger titles. Nested paragraphs, spans and list items must
  follow the same rhythm; fractional line-heights or arbitrary paragraph margins
  cause later lines to drift even when the first line aligns.
- After `document.fonts.ready`, measure a real baseline with a zero-size inline
  baseline probe. Convert screen measurements to canvas coordinates and snap
  to `phase + round((baseline - phase) / step) * step`. Even headings with an
  82px line-height snap their first baseline to the nearest **41px** rule.
  Recalculate after resizing or changing content; avoid cumulative drift.
- A scaled canvas keeps its design-space grid and typography scaled together,
  including on phones. A mobile layout that reflows uses its own coherent grid:
  NearU's reference is 28px spacing, 20px phase, 28px body line-height and 56px
  display line-height. Measure again after wrapping changes.
- Allow text blocks to grow when copy changes. Reflow or adjust neighboring
  blocks to preserve clear space around images, quotes and other text. Never
  rely on an old fixed text height or hide overflow to conceal longer content.
- Check all lines and nearby elements after alignment, not just the first
  baseline. Verify fonts loaded, long copy, desktop and compact widths, and
  grid continuity between the transformed canvas and its surrounding viewport.

## 2 · Figma is ground truth — pull it before guessing

When a component's exact size/position/colour is in question (and especially
once feedback on a guess starts contradicting itself), stop iterating blind
and pull the actual node:
```
get_metadata(nodeId, fileKey)        → precise x/y/width/height per child
get_design_context(nodeId, fileKey)  → rendered code + a screenshot
```
Figma file for this project: `Nc087O4ophE87f3EyMdcVh`. Ask for the specific
node link if one isn't already given — don't guess a node id.
`get_metadata`'s child coordinates are relative to the **top-level frame's**
own x/y, not the page: subtract the frame's own `x`/`y` from each child's to
get local (0,0-origin) coordinates you can use directly as CSS `left`/`top`
within that component's own positioned box.

The approved paper, grid and Contents standards above take precedence over
older Figma chrome. Apply them without asking for approval again. Content
geometry may be adjusted as needed for baseline alignment and collision-free
text growth; preserve the product artwork and unrelated design details.

A literal Figma-canvas page (like NearU) is a direct export of many small
absolute-positioned nodes (`nu-1`, `nu-2`, …, one class per Figma node,
`data-node-id` kept for traceability). Preserve exported artwork geometry.
Beyond the approved text-alignment and text-growth adjustments above, re-check
a questionable node in Figma before changing its geometry.

## 3 · Bugs this project already hit once — don't repeat them

- **`scrollWidth` on a `position:absolute; inset:0` flex label does not
  measure the text** — it reports the container's own size, which is always
  ≥ the text. To auto-fit a label's font size to available width, measure
  the actual glyphs: `range.selectNodeContents(span); range.getBoundingClientRect().width`.
- **Same-specificity CSS rules: later in the file wins**, regardless of which
  "section" comment it's under. A page-specific override placed *before* the
  shared rule it's meant to override (e.g. `.toc-item` before `.nav-item` in
  `sidebar.css`) silently loses. When adding an override for a shared class,
  put it *after* that shared rule's own definition, and say so in a comment.
- **Two elements that must move together need to be kept in sync explicitly.**
  The Contents pill's height didn't track the item's height once the item's
  height became responsive — the pill stopped vertically centering its
  label. If A's geometry depends on B's, set both from the same computed
  value in the same function.
- **IntersectionObserver silently stopped firing** for the Contents
  scrollspy in this project's environment (a fresh, adhoc IO fired fine, but
  the "real" one didn't after its containing function returned — possibly a
  GC/retention issue in this specific embedded browser). The fix was to
  switch to the same `scroll` + `requestAnimationFrame` pattern already used
  elsewhere in this codebase (`js/nearu.js`'s original `updateSection`) —
  prefer that proven pattern over IntersectionObserver for scrollspy-style
  "what's in view" tracking here.
- **A responsive box that hugs/stretches to its content must reserve room
  for whatever sits below it** (here, `.connect`). Compute the real pixel
  budget (`elementBelow.offsetTop - box's own top - its own padding`) and
  fit within it — first by shrinking the gap between items, only shrinking
  the items/labels themselves as a last resort — rather than assuming a
  fixed height will always have room.
- **A shared, static asset's colour is global.** Recolouring
  `assets/ui/nav-arrow.svg` (hardcoded `fill`, not `currentColor` — it's
  loaded via `<img src>`, which can't inherit page CSS) changes it
  everywhere the site uses it, not just on the one page you're looking at.
  That's usually what you want for a genuine brand-colour fix, but say so
  explicitly rather than discovering it by surprise.

## 4 · Centering content on a literal Figma-canvas page

On NearU, the shared sidebar occupies its own column beside the viewport.
`js/nearu.js`'s `fit()` removes the exported canvas's x:0→356 sidebar area
and treats x:356→1440
(1084px) as the actual visible "beige" content column
(`canvas.style.transform = translateX(inset) scale(scale) translateX(-356px)`).

**A block is only mathematically centered if it's centered within that
356→1440 content column — not within the full 1448-wide canvas.** Centering
against the full canvas width (`left = (1448 - width) / 2`) looks centered in
a design tool with no sidebar in the way, but on the live page it sits
noticeably left of true center, and for a wide-enough block it clips behind
the sidebar entirely. The correct formula for any block meant to read as
centered in the content area:
```
left = 356 + (1084 - block_width) / 2
```
This project's flow-diagram images (`nu-207`, `nu-208`, `nu-213` in
`css/pages/nearu.css`) were centered with the *wrong* (full-canvas) formula
for most of this session before this was caught — re-check any element
centered before this doc existed.

**Optical vs. mathematical centering:** the formula above gives you
mathematical centering. For a block with uneven visual weight (e.g. a flow
diagram whose right side is denser/taller than its left, or a row of phone
mockups where one phone is visually heavier), check the *rendered* result
against the content column's actual visible center
(`sidebar.getBoundingClientRect().right` to `innerWidth`, midpoint) — not just
trust the formula — and nudge a few px if it reads as lopsided. Verify at more
than one window width; the whole canvas scales uniformly, so a correct
placement stays correct everywhere, but it's worth re-checking at a narrow
width (near the compact breakpoint), a normal width, and a wide one.

## 5 · Media weight — check it, don't assume it's fine

A case study built from Figma exports accumulates screenshots/videos fast,
and Figma's own SVG export can be deceptively huge: an SVG that contains
several raster images as embedded `<pattern>` fills (common for photo-heavy
frames like a hero banner) stores each one separately, base64-encoded, with
none of a real image format's compression — NearU's header banner was
**3.3MB as an SVG**, and the exact same pixels came out to **91KB as WebP**
(via `sharp`, see below). That gap is exactly the kind of thing that makes
images "sometimes not show up" on a phone: an always-visible (can't be
lazy-loaded), always-heavy asset that a slow connection may time out on.

Checklist for a new case study's assets:
- After dropping in Figma exports, check sizes: `ls -la assets/work/<page>/`
  (or sort by size) — anything over ~500KB for a single still image is worth
  a second look, especially if it's above the fold.
- An SVG that looks simple but is several hundred KB+ is almost always
  embedded raster content, not complex vector paths — re-export it as a
  compressed raster (WebP first choice, PNG if it needs to be lossless)
  rather than shipping the SVG as-is. `sharp` (`npm install sharp --no-save`
  — dev-only, not part of the published site, nothing to add to git) can
  rasterize an SVG straight to WebP/PNG at whatever density you need:
  ```js
  const sharp = require('sharp');
  await sharp('in.svg', { density: 144 }).webp({ quality: 85 }).toFile('out.webp');
  // density: 144 = 2x a 72dpi-based SVG's own viewBox size — adjust to match the source
  ```
  Check the result for transparency (`(await sharp(out).metadata()).hasAlpha`)
  before assuming a JPEG (no alpha channel) is safe to use instead.
- Add `loading="lazy"` to every `<img>` that isn't in the first viewport
  (skip it only on the hero/header image, which is always visible and so
  gains nothing from it). On this project's absolutely-positioned/transformed
  canvas pages, don't assume lazy-loading alone fixes a heavy page — verify
  the actual bytes each asset is shipping first.
- Videos: keep `preload="metadata"` + a `poster` image + JS play/pause on
  visibility (already the pattern here) so a video that can't/won't play
  still shows something instead of a blank box.

## 6 · Small copy/UI conventions worth knowing

- The drawer's periodic reminder pill (`.sb-note`, next to the star/hamburger
  toggle on a compact screen) just says **"Menu"** — not "Menu · Index &
  M.I.K.U" or "Menu · Contents". This is shared, sitewide text in
  `js/shell.js`; don't reintroduce a longer page-specific version of it.

### Standing rule: every link opens in a new tab (2026-09-28)

Any link added as page content — a prototype, a research board, a game, a
Drive file, the playlist, a social/contact link, a résumé, a case study —
opens in a new tab (`target="_blank" rel="noopener"`), full stop. This
applies whether it's written directly in a page (`work/*.html`,
`side-quests.html`, `about.html`, …) or added as a `go`/`raw` entry in
`js/bank.js` for M.I.K.U. `js/shell.js`'s chat-bubble action renderer already
does this generically for every bank-sourced link (the one exception is
`mailto:`, which pops the address card instead of navigating anywhere) — new
bank entries don't need anything extra. A hand-written `<a>` on a page still
needs `target="_blank" rel="noopener"` added explicitly.
The only things that stay same-tab are the sidebar's own EXPLORE nav, the
**case-study cards in the My Work section** (`home.html` — they open in the same
tab, the normal flow; Side Quests links still open in a new tab) and the
pjax shell's internal page routing (`js/shell.js`'s `sidebarHTML()`/router) —
that's core site chrome, not content, and swapping it to a new tab would
break the SPA feel the shell is built for.

## 7 · Workflow

- Run `node tools/check.js` after every change. Zero errors before saying
  something is done.
- Verify in the browser at both a normal desktop width and the compact
  breakpoint (< 900px, `body.compact` — the drawer, not the full sidebar)
  before calling a sidebar/Contents change finished; several bugs here only
  showed up in one of the two.
- Commit scoped to what you actually touched — don't stage unrelated
  in-progress work from elsewhere in the tree.

## 8 · Site-wide rules learnt while building the My Work / About / landing updates (2026-10)

### Typography
- **Ancizar Sans** is the UI/body font everywhere — self-hosted from `assets/fonts/` (variable TTFs), declared in `css/base.css`. **Inter is gone from the project**: never add it back, and never link it from Google Fonts. Ancizar Serif (Google Fonts) stays for headings; Blank Script for the one decorative landing use; Noto Serif Devanagari only for the About page's Hindi greeting.
- The family is declared with `size-adjust: 122%` + `ascent-override: 79.5%` + `descent-override: 19.7%` so it keeps the size, x-height and **baselines** the layouts were built on. Because of that, text already seated on grid rules stayed on them; re-measure (About paragraphs, case-study audit) if these numbers ever change.
- **Regular and medium are upright. Bold / black (weight 600+) are italic** — done by mapping those weights to the italic file in `@font-face`, so no per-rule `font-style` is needed. A line that must be bold but upright uses `font-family: 'Ancizar Sans Upright'` (e.g. Syncletter's "I learnt, I wasn't the only one struggling!").

### Crisp text (non-negotiable)
- Text inside a tilted card must be crisp at rest, not only on hover. A **transform animation inside (or overlapping) a rotated card makes the browser composite the card, which draws its text as a rotated bitmap (soft)**. Animate such things with `margin`/`top`, not `transform`. **Exception (2026-10-03): the My Work floating pills** use a `transform` keyframe on a `will-change: transform` layer (pill + text flattened into one GPU layer): the old `margin-top` drift snapped the text to whole pixels and read as stepped and "draggy"; smoothness won over a slight resample softness inside the tilt. Don't add `will-change`, `backface-visibility` or `translateZ` to cards.

### Paper effect (every page)
- `css/shell/paper.css`: every element that draws the graph-paper grid is an isolated stacking context with a `::before` at `z-index: -1` — a 50% cream veil plus a very faint SVG-noise grain. It sits **above the grid and behind all content**; the grid, baselines and layout don't move. Case studies use `#fff1df` as the veil colour so their approved paper colour is unchanged. Keep the grain faint: reading comes first.

### Scrapbook (My Work + About Me; Figma 151:8359)
- **Corners**: torn star-paper top-left (`assets/scrapbook/corner-tl.png`) on My Work and About Me; cardboard bottom-right (`corner-br.png`) on **My Work only**. About's corner is smaller so it never touches the title. Both are mirrored `<img class="scrap ...">` as the first children of `<main>`; the star paper has a **white line first, then a shadow beyond it** (`drop-shadow` chain, not box-shadow); the cardboard casts a soft shadow along its torn edge.
- **Cards** (`css/pages/work.css`): 10px radius; every card has a **thumbtack** centred on its top edge, whose colour is the **opposite of the project's colour** (Syncletter green -> red, NearU orange -> blue, NCFE blue -> yellow, Are they Driving? red -> green) via `--pin` / `--pin-in` on the card. The hover "View case study" cursor pill stays (the background eye-star doodles on My Work were removed instead).
- **The torn paper sheets are DESKTOP-ONLY: they show on the two-column layout and are hidden (`display: none`) on the phone / small-tablet layout (`body.one-col`).** Siddhi asked for them gone on phone; they stay on desktop. Never clip them or add other phone variants.
- **Torn paper sheet behind each card** (`<span class="card-sheet sheet-...">` placed immediately before its card; `.card-sheet` in `paper.css`): a generated image (`tools/make-paper-sheets.js` -> `assets/scrapbook/sheet-*.webp`, lossless) with rough fibrous edges, soft wrinkles, faint grain and **its own tone** — white (Syncletter), yellowish-cream lighter than the page (NearU), pale blue (NCFE), pale green (Driving). Per-card inline vars: `--x --y --r` (copy the card's), `--dx --dy` (sheet centre vs card centre), `--a` (sheet angle relative to the card), `--sz` (size), `--swing` (hover angle). Each sheet carries a soft `drop-shadow` that follows its torn outline.
- **Swing (desktop only — mouse + two-column layout; none on phone/tablet/touch)**: hovering a card swings its sheet about the card's pin like a pendulum (its bottom drags out sideways and settles lower, with an overshoot). Syncletter's goes one way (`--swing:-9deg`), NearU's the opposite (`9deg`). **Upcoming cards follow the card above them: NCFE (under Syncletter) swings like Syncletter's but with its tip nearer the other edge (mirrored `--dx` / `--a`); Are they Driving? (under NearU) likewise.** On the phone layout the sheets are bigger/offset so they still show round the card (`body.one-col ...` overrides at the end of `paper.css`).
- Regenerate sheets with `node tools/make-paper-sheets.js` (needs `npm install sharp --no-save`; dev-only). Tear roughness is set by the displacement `scale` numbers in that file.

### Notifications
- Any toast/notification pill is centred on the **content area (the page minus the sidebar)**, not on the window: use `left: var(--notify-x, 50%)` with `transform: translateX(-50%)`. `--notify-x` is set in `js/shell.js` `fit()` (half the window when the sidebar is a drawer). The "You can move some elements" hint on About shows **once** (3 s, remembered for the session via `sessionStorage`), never in a loop.

### Build / tooling gotchas
- `css/site.css` is a **generated bundle**: after editing `css/base.css`, `css/shell/*` or `css/pages/{work,decor,guest,quests,about}.css`, run `node tools/bundle-css.js` or `tools/check.js` fails with "css/site.css is stale". `nearu.css` / `syncletter.css` are linked directly, not bundled.
- A `url()` inside a data-URI SVG trips the checker's `url()` scan: write it `u%72l(%23id)`.
- Don't let two rules for one selector coexist in a file — the checker warns; merge them.
- `data-start` on a `<video>` starts it at N seconds and loops back to N (used to skip the Syncletter demo's "create a room" intro without re-encoding).
- Landing page (`index.html` + `css/pages/landing.css`, Figma 109:6512): tickets (`assets/landing/ticket-*.svg`) straighten on hover; "All aboard to the creative archives of" letters scatter away from the pointer; the orbit ellipse constants in `js/landing.js` (`PIVOT`, `EL`) must be re-fitted if the ring SVG changes.
- About title (`js/about-title.js`): the name is ransom-note tiles that jumble for **3 s (every 0.25 s)** then settle, then an orange "!" mark (Figma 483:219, `assets/about/exclaim.svg`) jumps in tilted 26deg (tail on the "i"), holds, straightens and slides to stand to the right of the "i". The greeting types the Hindi word -> backspace -> "Hello!" over a 30 s pass, stays on "Hello!" for 2 min, then loops.

## Minimum text size
The smallest text on the paper is **16px as rendered** (font-size x canvas scale), desktop and phone. Only text inside product mockups/screenshots may be smaller. Audit with the browser: walk text nodes, skip those inside images/mockups, flag `fontSize * scale < 16`.

## Same pills, animations and SVGs in every version
Pill colours, invert/hover animations and every SVG must be present and identical in the desktop, tablet and phone versions. Re-arranging is fine; removing, recolouring or replacing them is not.

### Landing / Welcome Aboard additions (2026-10)
- Landing text is "Board to the creative archives of SIDDHI". The two tickets never touch each other (even straightened and lifted on hover), each carries the brand tip star (`assets/ui/star-back.svg`, small), and a click punches a semicircle out of the ticket's right edge (`.punched`, `--punch` animated mask). "Be my Guest" slides up like the Thank You -> main site transition: the Welcome Aboard page is preloaded in a hidden iframe (`js/landing.js` `preloadPeek`) and rises under the leaving landing.
- The Welcome Aboard / Thank You screens (`guest-book.html`) carry the paper veil and two small corners too. On Thank You the drifting stars and fish-bone patches spread over the whole screen but must never touch the text: `js/guest-anim.js` measures the real `.ov-thanks` box (not a hard-coded one) — re-check this whenever the font or type size changes.
- Compact drawer: the subtitle ("Interaction design @ ANU") shares the name's left edge (`css/shell/compact.css`).

## 9 · Lessons from the 2026-10-03 round (Syncletter + NearU rebuild)

### Moving content on the absolute canvas: whole-row shift tables
- When copy grows or shrinks, don't edit 100 `top` values. Both canvases carry a **shift table** run before alignment: `SHIFTS` in `js/nearu.js`, `SYN_SHIFTS` in `js/syncletter.js`. Each entry is `[fromY, rows, exceptClass?]`; thresholds are in the **original Figma y**, all entries that match an element **add up**, and `rows` is a whole number of 41px rows so the paper rules stay aligned. The canvas height (`--flow-extra` / `height !important`) follows the sum.
- The phone layouts clone nodes by **original** coordinates (cloned before the shifts run), so they are unaffected; new blocks must be cloned whole (`block()` in `js/nearu-mobile.js`) and reflow with their own CSS.
- Elements placed at their final y in CSS (the Syncletter facts chip, the green frame, the NearU ideation art) are either below no threshold or excluded by class; say so in the comment next to the entry.
- After any copy change run **`tools/gaps.js`** (paste in the JS tool, or `fetch('/tools/gaps.js')` + `eval`): it lists every empty band taller than 110 canvas px. Target ~80–100px between blocks. Also scan for text boxes that overlap (see the snippet in the 2026-10-03 chat: `p,h1,h2,li` rect intersections).

### Centre media on the content area
- Videos, diagrams, screenshots, plates and CTA pills centre on the content area to the right of the sidebar: **x = 900 on NearU, 902 on Syncletter** (not on the 448/434 text column). The Figma export left some blocks 20-40px left of it; `XSHIFTS` in `js/nearu.js` and the CSS `left` values fix them. Staggered side-by-side art (A/B phones, ideation videos) is judged as a composition.

### Components added this round (copy the pattern, don't reinvent)
- **Spider diagram** (`.nu-spider`, "How students sell today"): hub circle + three legs, SVG lines behind; phone = hub, then legs on a trunk line.
- **T chart** (`.nu-tchart`, "User needs"): two equal columns, equal rows, 4px centre rule; phone keeps two columns. Keep both sides the same number of rows.
- **Loop diagram** (`loopSVG()` in `js/nearu-mobile.js`): ring of boxes with solid curved arrows and a dark core with dashed arrows; one builder, `LOOP_WIDE` for the canvas, `LOOP_TALL` for phones. Text is real SVG text >= 16px.
- **Persona on torn paper** (`.nu-persona`): paper = `sheet-white.webp` as a **mask** over a multiplied tan colour (`::after`) with a blurred copy as the shadow (`::before`); the filter route turned olive. Light beige type + light red highlights on the dark paper. The portrait frame hugs the illustration: the image is cropped with percentages (`left/top/width/height` on the `<img>`), and the ribbon (`nu-130`) and the Figma "Hi!" bubble (`assets/work/nearu/hi-bubble.svg`, node 520:16) are positioned in the same percentages.
- **Insight memos** (`.nearu-insight`): NearU tints, tape strip, folded corner, no clip-path (it would clip the shadow). `p` line-heights stay on `.ins-problem`/`.ins-opp`; only inline children `inherit` (inheriting on the `p` pulled the 41px grid line-height in and misaligned the arrows).
- **Project facts chip** sits **above** the Syncletter green frame (desktop and phone). Columns share one left edge each; "August 2026" must not wrap.

### Syncletter recording frame
- One green frame (`.syn-rec`) plays the 24s film first (`.syn-intro-video`, `is-intro`), then fades to the phone demo (`.syn-demo`) whose call-outs appear. The `play`/`ended` capture handlers in `js/syncletter.js` gate the demo until the film ends.
- **Call-outs** (`.syn-rec-tag` + SVG leader lines): labels only on the left/right of the phone; thin green line + ring drawn from the label to a point on the screen. Target points are **keyframed from the footage** (`data-kf="time:fx:fy|..."`, fractions of the phone video) because the card moves (keyboard). Measure with the canvas flood-fill used on 2026-10-03 (cream `#faf2ea` pixels, largest component). Measure label geometry with `offsetLeft/offsetTop` (they ignore the slide-in `translate`); toggling `.on` to measure made the labels flash.

### Phone layout pitfalls found
- A stray `::before` with `position:absolute` on a block that becomes `position:static` on phones paints across the whole page: give such blocks `position:relative` on phones.
- Regex clean-ups of CSS can mangle selectors: after any scripted CSS edit grep for doubled selector fragments.
- The mobile Reflection text gets its own rule pass at the end of `alignGrid` in `js/nearu.js`; a fixed `top: 1.6px` offset drifts with font metrics.
- Tag pills on NearU phone are real 28px pills; they sit on the rule **above** (hug the hero), not below.

### Tooling and housekeeping
- `tools/grid-audit.js` skips `.nu-persona`, `.nu-tchart`, `.nearu-mobile-facts` (filled/paper blocks). Add new filled blocks there and to the `exempt` list in `js/nearu.js`.
- Browser pane: the pane resizes by itself and can bounce between pages if the user is browsing; test in a **second tab** (`tabs_create`), set the width, reload, then measure with JS. CSS `zoom: .66` on `<html>` gives a wider screenshot but offsets scroll positions.
- Dead CSS: scan for classes missing from the HTML/JS before deleting (watch for JS-built class names like `sm-fc-` + kind). Never minify or recompress media (no build step by design).
- Original (pre-edit) copy of both case studies is kept in a Claude doc ("Case studies: original copy") and in git at `94a7589`.

## 10 · NearU prototype pop-up + phone brand board (2026-10-03)

- **Try demo** (`.nu-demo`, desktop canvas + a clone in the phone layout) is the Syncletter "Try prototype" pill but a `<button data-nearu-demo>`: it opens `js/nearu-demo.js`'s pop-up (blue NearU frame, Restart/Close, Esc, focus kept inside, page scroll locked) instead of a new tab. Desktop pill: left 478, top 910, 850x47 (bottom on rule 957); the `[1030, 3]` shift row makes room and `.nu-demo` is skipped by the shift loop. Phone: full-screen pop-up (<= 520px), the prototype fills it; wider: the 402x874 prototype is scaled as one piece with a bezel ring.
- **The prototype is a built, static copy** in `prototype/nearu/` (source: React/Vite in `Downloads/NearU_onboarding_centered`). Refresh it with `node tools/sync-nearu-prototype.js` (local tool). Start states for recordings: `?screen=Explore|Search|Cart|Profile|Wishlist|Storefront|Analytics|Payouts|Checkout|Confirmed|Listings|Orders|OnboardingCreate|OnboardingMode|OnboardingVerify|OnboardingLogin|SellerSetup` and `&mode=seller`; the pop-up's Restart reloads a clean session. `tools/check.js` skips `prototype/`.
- **Phone brand board** (`brandBoard()` in `js/nearu-mobile.js`, `.nearu-mobile-brand`): the scaled desktop swatches put every label under 16px, overlapped neighbours, and the display "Aa" spilled out because Futura is not installed on most phones (fallback fonts have different metrics). Swatches are real boxes (6 + 5 + 3 paper rows), labels 16px, text clipped inside its swatch. Never rely on an uninstalled brand font for sizing: give the box a fixed size and `overflow:hidden`.
- Prototype icons: stand-alone icons share one 28px box (`--icon-lg`); SVGs are cropped tight to their drawing (the cart sat in a 59x34 canvas and looked tiny). The two search nav icons were missing from the export and were drawn to match.

## 11 · Recordings, popup window, spill + accessibility passes (2026-10-03, later)

- **Demo recordings** (`.nu-rec`): Solution = the original blue frame, yellow logo chip, wordmark film and Seller / Buyer captions, with only the two phone images replaced by the recordings (`.nu-rec-art`, 163 x 354, same slots; cloned into the phone plate too); Onboarding = the paragraph on the left and the onboarding recording on the right. No backing panel: the video sits in the shared phone shell (`.nu-demo-screen`: bezel ring, island, side keys; `--s` scales the 402 x 874 handset, 225px wide on desktop). Phones: same blocks cloned by `recs()` in `js/nearu-mobile.js`, scaled in `fit()` to share the column. Shift rows added in `js/nearu.js`: `[1990, -1]` (tighter Context -> Solution) and `[12750, 10, 'nu-245']` (room for the onboarding recording).
- **Re-record after any prototype change:** `node tools/sync-nearu-prototype.js` then `node tools/record-nearu.js all` (needs the site served on :5173; headless Chrome + ffmpeg-static, 2x, H.264 crf 14). Scripts per run live in `RUNS` in that file.
- **Pop-up window** follows Figma 208:2521: blue title bar ("Prototype Demo", X), `#f1e7c8` body (a shade lighter than the Figma #e8d9ae, per Siddhi), yellow Restart / Back pills, handset in the middle.
- **Kabir's "Hi!" bubble** pops up (scale + rise from its tail) when the portrait is >= 40% in view, fades out after 8s, replays when it returns. One timer per portrait (the canvas copy and the phone copy used to share one and cancelled each other). Its start offset must never push it left: the portrait clips overflow.
- **Spill audit:** `tools/spill-audit.js` (paste at 1440 / 1024 / 768 / 390 / 320) lists text that sticks out of its chip, is clipped by an overflow-hidden ancestor, or runs past the viewport. Zero on every page at the time of writing, except guest-gallery signature false positives (the signature sits below the drawing paper by design).
- **Accessibility pass (axe-core 4.10):** landmarks (the Resume pill sits in `nav[aria-label=Résumé]`), one `h1` per page (visually hidden on My Work and Side Quests), the prototype has `h1` in a banner, an `aria-hidden` status bar, named toggles with `aria-pressed`, a focusable featured carousel and body-text contrast >= 4.5:1. The pop-up is `role="dialog"` labelled by its title with a focus trap and Esc to close. Recordings carry descriptive `aria-label`s and pause under reduced motion.
