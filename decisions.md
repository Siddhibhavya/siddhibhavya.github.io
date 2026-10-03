# Code decisions

Why the code is the way it is. Each entry: what the code does, why, and what breaks if you change it. Add an entry whenever a technical choice is made. Look-and-feel rules and case-study standards are in `CASE-STUDY-GUIDELINES.md`.

## Architecture
- **Plain HTML/CSS/JS, no framework, no build step.** Siddhi edits files directly and publishes to GitHub Pages as is. The only generated file is `css/site.css`.
- **`css/site.css` is generated** from `css/manifest.css` by `node tools/bundle-css.js`. Why: 14 chained `@import`s made a request waterfall. The bundler also minifies (comments and whitespace only, strings and `url()` untouched), 98 KB to 62 KB. `tools/check.js` fails with "css/site.css is stale" if you edit a source file and don't re-run it. `nearu.css` and `syncletter.css` are linked directly, not bundled.
- **pjax shell (`js/shell.js`).** My Work, About, Side Quests and Guest Gallery swap `.main` in place via `fetch` so the sidebar and footer never reload. Each page registers an `init` in `window.SiddhiPages` that re-runs after a swap, so listeners must be idempotent (e.g. `about.js` guards its document listener with `body.dataset.hintDrag`). Any failure falls back to a normal navigation (`location.href`). The fetch has an 8s `AbortController` timeout so a stalled server can't leave the menu dead.
- **`guard(name, fn)` in `shell.js`** wraps every boot step in try/catch, so one broken widget can't stop the rest of the page.
- **Service worker (`sw.js`).** Network first for HTML/CSS/JS so a deploy shows immediately; stale-while-revalidate for images and fonts; video and audio left to the browser (range requests). Not registered on localhost (and unregistered there), so local edits are always live.
- **p5 is local (`assets/vendor/p5.min.js`, 1.11.13), loaded with `defer`.** Why: removes a third-party render dependency and a preconnect. The koi (`js/koi.js`) reads `window.KOI_CONFIG` for its mount point and pauses via IntersectionObserver when off screen.
- **Scripts sit at the end of `<body>`** in a fixed order (config, bank, chat, shell, ...). `tools/check.js` verifies the order. Don't add `defer` to them without checking the pjax re-init.

## Fonts
- **Ancizar Sans, self-hosted TTFs** (`assets/fonts/`), declared in `css/base.css` with `size-adjust: 122%`, `ascent-override: 79.5%`, `descent-override: 19.7%`, `line-gap-override: 0%`. Why: layouts were built on Inter's size and baselines; these numbers keep text on the grid rules without re-measuring every page. Changing them means re-running the grid audit everywhere.
- **Weights 600+ map to the italic file** in `@font-face`, so bold is italic with no per-rule `font-style`. Upright bold uses the separate family `'Ancizar Sans Upright'`.
- **Ancizar Serif still comes from Google Fonts.** The alignment scripts wait on `document.fonts.ready`; making that stylesheet non-blocking could let them measure before the font arrives and mis-align the grid. Self-host it instead if it needs speeding up.

## Paper and grid
- **Paper veil (`css/shell/paper.css`).** Every element that draws the grid becomes an isolated stacking context (`isolation: isolate`) with a `::before` at `z-index: -1`. That paints above the grid background and below all content, so layout and baselines never move. Case studies set `--paper-veil: #fff1df` so their approved colour is unchanged. Grain is two SVG `feTurbulence` data-URIs (alpha tuned down 20% then 30%).
- **Nav card grain** is one `.sb-inner::after` with `mix-blend-mode: multiply`, not a background on the panel. Why: the cream is an SVG tab plus a CSS panel, and texturing them separately left a seam. One multiplied sheet over the whole card shows only on the cream.
- **Text on the grid.** Every text node has its baseline on a paper rule (41px rows, phase 14 desktop; 28px, phase 20 phone). New text nodes must be registered in the page's ruled list (`RULED` in `js/syncletter.js`, `ruledIds` in `js/nearu.js`). `tools/grid-audit.js` is the gate: zero off-grid text at desktop and phone before any case-study commit.
- **`url(%23f)` inside a data-URI trips the checker's `url()` scan.** Write `u%72l(%23f)`.
- **One rule per selector per file.** The checker warns on duplicates; merge them.

## Scrapbook (My Work / About)
- **Corners** are mirrored `<img class="scrap ...">` as the first children of `<main>`, `z-index: -1`. The white-line-then-shadow edge is a `drop-shadow` filter chain, not `box-shadow`, so it follows the torn outline.
- **Card sheets** (`.card-sheet`, one span before each card) are generated images (`tools/make-paper-sheets.js`, sharp, SVG filters, lossless WebP). Per-card CSS variables (`--x --y --r --dx --dy --a --sz --swing`) place and tilt them. The swing rotates the outer span about the pin using `transform-origin` computed with `cos()/sin()` from the card's rotation; the tilt lives on the `::before` so the two don't fight.
- **Swing only on `(hover: hover) and (pointer: fine)` and `body:not(.one-col)`.** Touch devices have no hover.
- **Sheets are `display: none` on `body.one-col` (phone layout).** A clip-path version was tried and rejected; removal is the final decision. Desktop keeps them.
- **Pins** are `<i class="pin">` inside `.card-in`, coloured with `--pin` / `--pin-in` (opposite of the project colour).
- **Crisp text on tilted cards.** A `transform` animation inside or over a rotated card makes the browser composite it and draw the text as a soft bitmap. So the floating pills animate `margin-top`, and nothing in a card gets `will-change`, `backface-visibility` or `translateZ`.

## Landing page
- **Tickets are SVG images in `.tk` wrappers.** The click punch is a CSS `mask-image` radial gradient whose radius is the registered property `--punch` (`@property`), animated by `ticket-punch`. Mask is also written `-webkit-mask-image` for Safari.
- **Transition into Welcome Aboard:** a hidden iframe of `guest-book` is created 1.5s after load (`preloadPeek`), parked below the viewport with `inert`, and slid up with the Web Animations API when "Be my Guest" is clicked, so it rises under the landing page. The real navigation happens when the slide ends and shows the same thing. Skipped for reduced motion.
- **Letter scatter** runs only on `.scatter` lines; the orbit ellipse constants (`PIVOT`, `EL` in `landing.js`) must be re-fitted if `assets/landing/orbit.svg` changes.
- **Animation loops pause when the tab is hidden** (`visibilitychange` in `landing.js`, `notfound.js`).

## About title (`js/about-title.js`)
- Async loop with a `live()` check (`my === run && body.contains(title)`) so a page swap kills the old loop instead of leaking it. Hindi graphemes use `Intl.Segmenter` with a spread fallback. The "!" mark is an SVG file, not text, so it renders the same in every browser.

## Notifications
- Positioned with `left: var(--notify-x, 50%)` plus `translateX(-50%)`. `fit()` in `shell.js` sets `--notify-x` to the centre of the content area (the window minus the sidebar; half the window when the sidebar is a drawer).

## M.I.K.U (chat)
- **The bank (`js/bank.js`) is the only source of answers.** M.I.K.U matches questions to written answers; nothing is generated. A blank answer means "not written yet" and points to email. Edited with `tools/chat-bank.html`, which saves through `.claude/dev-server.js`.
- **Entry shape:** `id`, `cat`, `q`, `alts`, `a`, optional `go` (action pills), `img`, `starter`, `hidden`. Hidden entries (unfinished projects) are filtered out in `chat.js`.
- **Email and socials are `go` pills, never typed text.** A `mailto:` pill gets `data-action="email"` and opens the email pop-up; other pills open in a new tab.
- **Private editor notes** live in `tools/bank-notes.json` (tools/ is git-ignored), never in `bank.js`.
- **Remote replies fail safe:** `remoteReply` is wrapped so a failing or offline endpoint falls back to the written bank. The Firebase gallery uses `withTimeout` on every call.

## Media and performance
- **No lossy re-compression of images or video.** Delivery may change (caching, lazy loading, lossless WebP), quality may not.
- **Lazy loading:** below-the-fold images get `loading="lazy" decoding="async"`. The first screenful stays eager.
- **`100dvh` follows every `100vh`** for body, content area and landing, so iOS Safari's collapsing URL bar doesn't crop pages. The sticky sidebar stays `100vh` to avoid resize jitter.
- **`data-start` on a `<video>`** starts it at N seconds and loops back to N, to skip Syncletter's "create a room" intro without re-encoding.
- **Syncletter's transparent demo is WebM (VP9 alpha)** with a 2x variant selected by `media="(min-resolution: 1.5dppx)"`. Known gap: Safari/iOS may not render the alpha; an HEVC-with-alpha source would be needed.

## Case-study pages
- **Phone layouts re-flow or scale the desktop composition; they never drop or recolour pills, animations or SVGs** (parity rule). Syncletter's phone view is the scaled desktop canvas on purpose.
- **Footers "Resume" opens the ATS resume** in a new tab (it used to open an email draft).
- **Unfinished pages** (`ncfe-redesign.html`, `are-they-driving.html`) are noindex stubs that redirect home unless `?preview`. Search `HIDDEN-UNTIL-READY` to un-hide a project (card, sheet, bank entries together).

## 2026-10-03 case-study rebuild
- **Shift tables instead of re-typing tops** (`SHIFTS` / `SYN_SHIFTS`): whole 41px rows, thresholds in original y, entries add up. Phone layouts clone by original y so they don't care.
- **Media is centred on the content area** (x 900 NearU / 902 Syncletter), text stays on the text column.
- **One green frame for film then demo** on Syncletter; call-out targets are keyframed from measured footage, not a single point.
- **Persona paper is a mask over multiplied tan**, not a CSS filter (filter gave olive). Light type on dark paper.
- **How students sell = spider diagram, User needs = T chart, Current ecosystem = loop diagram** (chart vocabulary from the user's "graphic organisers" sheet). Keep both T-chart columns equal in rows.
- **Pruned**: 118 dead NearU CSS rules, unused card/mindmap JS, `syncletter/demo.mp4`, two bracket SVGs. No minification (no build step) and no media recompression.
- **About greeting hugs its text** (no reserved width) so ", I am" stays close to Namaste/Hello.

## Checks before committing
- `node tools/check.js` (zero errors), `node tools/bundle-css.js` after editing bundled CSS, and the grid audit at 1440px and 375px for every case-study page touched.
- Commit only what was asked. The raw `Ancizar_Sans/` download is not published (the site uses `assets/fonts/`).
