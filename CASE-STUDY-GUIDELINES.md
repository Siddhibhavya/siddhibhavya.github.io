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
| `--plum` | `#190523` | landing + footer bg |
| `--cream` | `#ffece1` | sidebar text on dark, page bg elsewhere |
| `--maroon` | `#7f404e` | sidebar/explore-box bg, headings, "HOME" links, arrows |
| `--maroon-edge` | `rgba(119,51,68,.93)` | borders on maroon UI (drawer button, nudge pill) |
| `--ink` | `#0e0314` | the real EXPLORE nav's active-item text (reads harsh on a cream pill — prefer `--brown` there, see §3) |
| `--brown` | `#7f5744` | active pill text, "Connect with me!" title |
| `--brown-soft` | `rgba(53,35,26,.7)` | bio/connect-link body text |
| `--pill` | (check base.css) | the EXPLORE nav-pill fill |
Never introduce a new hex for something these already cover — a new case study
page reusing `#7f5744` instead of `var(--brown)` is a paper cut that shows up
the next time the palette changes.

### Fonts
- **Inter** (`var(--font-ui)`) — all UI chrome, body copy.
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
- Either way, anchor the grid's origin to the **text column's left edge**
  (and, loosely, a body-paragraph's line-height) so lines don't visibly
  slice through the middle of a line of text.

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

A literal Figma-canvas page (like NearU) is a direct export of many small
absolute-positioned nodes (`nu-1`, `nu-2`, …, one class per Figma node,
`data-node-id` kept for traceability). Treat these as read-only content —
don't "clean up" their geometry by hand; if one looks wrong, re-check its
node in Figma rather than eyeballing a fix, since these numbers are meant to
be exact exports, not approximations.

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

On a page like NearU, the sidebar isn't a separate column next to the canvas —
it's rendered *on top of* the canvas's own left edge. `js/nearu.js`'s `fit()`
reserves the canvas's own local x:0→356 for the sidebar and treats x:356→1440
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

## 7 · Workflow

- Run `node tools/check.js` after every change. Zero errors before saying
  something is done.
- Verify in the browser at both a normal desktop width and the compact
  breakpoint (< 900px, `body.compact` — the drawer, not the full sidebar)
  before calling a sidebar/Contents change finished; several bugs here only
  showed up in one of the two.
- Commit scoped to what you actually touched — don't stage unrelated
  in-progress work from elsewhere in the tree.
