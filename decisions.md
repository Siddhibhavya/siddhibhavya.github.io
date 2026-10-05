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
- **Ancizar Serif is now self-hosted (2026-10-05):** `assets/fonts/AncizarSerif-latin(.-ext).woff2` (the exact Google files, variable 400-500), `@font-face` in `css/base.css` without size-adjust so it renders as before (widths checked against the hosted font), Syncletter adds a 600-900 face so it still has no synthetic bold, the latin file is preloaded, and the Google stylesheet + preconnects are gone from every page except About (Noto Serif Devanagari fallback). (Old note, kept for context:) Ancizar Serif used to come from Google Fonts. The alignment scripts wait on `document.fonts.ready`; making that stylesheet non-blocking could let them measure before the font arrives and mis-align the grid. Self-host it instead if it needs speeding up.

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
- **Syncletter decision cards** ("No AI implementation", "Scalability") sit above Reflection: filled cards (grid-exempt), teal border, label chips, key phrases bold red; Reflection onward is pushed down by the `[8300, 14]` entry in `SYN_SHIFTS`. Syncletter alignment also re-runs on `load` and when fonts finish (cold-cache first visits misaligned the headings).
- **About greeting hugs its text** (no reserved width) so ", I am" stays close to Namaste/Hello.

## 2026-10-04 performance and robustness pass
- **Minified copies, readable sources** (`tools/build-min.js`): `js/*.min.js` (esbuild, no top-level renaming), `css/intro.min.css` / `css/notfound.min.css` (landing and 404 become one file instead of an @import chain), `css/pages/syncletter.min.css`, and the already-minified `css/site.css`. `tools/check.js` fails when a `.min` is older than its source. `config.js` and `firebase-config.js` stay hand-edited and unminified. NearU waits until its WIP is committed (`--nearu`).
- **WOFF2 for Ancizar Sans** (lossless, `format('woff2')` first, TTF kept as fallback): -190 KB on a cold load.
- **Network-aware warming:** the case-study image warm-up and video pre-buffering are skipped on 2g/3g or `saveData`.
- **Chat endpoint gets an 8 s abort** (it had none); the gallery already had 10 s timeouts, a 1-minute cache and a local fallback.
- **Cross-device audit tool** `tools/overflow-audit.js` (iframes at 360-2560 px per page): zero overflow, zero broken images.
- **Several chats may share the repo**: commit only your own files or hunks; see CLAUDE.md.

## 2026-10-04 later: lag and slide-up fixes
- **Thank You → main site slide-up:** `js/guest.js` now warms the main page (`preloadHome`, hidden `.gb-peek` iframe) in idle time ~2 s after Welcome Aboard loads, not only 4.85 s after Share. Why: the download started late, `goHome` then waited up to 1.2 s and often fell back to sliding away alone. Skipped for reduced motion and `saveData`; the old 4.85 s trigger stays as a fallback (the function is idempotent).
- **NearU media loading (`js/nearu.js`):** no blanket `preload=auto` / eager images. Observers start images ~2400 px ahead and videos ~3 screens ahead (600 px on slow links). Why: the old pass pulled ~22 MB at once, buffered 14 video decoders and loaded the hidden phone layout's 7 duplicate videos and 30 images. Same files, same quality. Safari/Firefox have no `navigator.connection`, so slow links are detected from the throughput of files already downloaded (under 1.5 Mbit/s).
- **Grid alignment is coalesced (`queueAlign`):** fonts-ready, load, +800 ms, resize (120 ms debounce) and the paper ResizeObserver share one scheduled pass. The desktop pass reads every baseline, then writes every `top` (one layout, not one per text block). Why: it ran 4-6 times at load with forced reflow (342 ms + 123 ms long tasks).
- **NearU files are minified** (`node tools/build-min.js --nearu`); `work/nearu.html` loads the `.min` files.
- **Landing → Welcome Aboard (Be my Guest) is faster:** `GUEST_MS` 2200 → 1500 ms, easing `cubic-bezier(0.4,0,0.2,1)` (the old ease-in barely moved for the first third), and the rise starts on the press instead of after `tune.play()` resolves (that wait showed as a pause in a screen recording). The tune fades over the last 550 ms as before.
- Map of all docs and the audit: `PROJECT-MAP.md`.

- **M.I.K.U on case-study pages:** `work/*.html` now load `bank.min.js` + `chat.min.js` before the shell (they were missing, so the chat said it had not loaded). The opening suggestions and the follow-up questions there come from that project's own bank topic (`PROJECT_TOPICS` in `js/chat.js`, slug to topic name); other pages are unchanged. `projectStarters` must call `buildIndex()` first because the bank is built lazily.
- **Removed the Are they Driving? project** (page, card, config, bank entries, image); a new project takes its slot. See NEXT-CHAT-PLAYBOOK.md.

- **Service worker no longer forces a server round trip for every script (2026-10-05).** Commit 8b87c63 made CSS/JS/HTML `fetch(req,{cache:'no-cache'})` network-first; on the live site that put ~30 scripts behind a revalidation each (measured in Chrome on the live site: DOMContentLoaded 7.4 s, load 47 s with the worker vs 2.0 s / 9.8 s without). Now: HTML network first with a 3 s limit; CSS/JS/JSON stale-while-revalidate; p5 cache first; `CACHE` is stamped per deploy by `scripts/build-public.js`, which drops the old cache. Cost: after a deploy the first reload can still show the previous CSS/JS; the next shows the new one.

- **Load-time pass 2 (2026-10-05), design untouched.** (a) `sw.js` v4: precaches the shell files at install, cache-first for `assets/fonts|vendor|scrapbook` (bump `CACHE` when those change), image cache capped at 220 entries. (b) The footer koi's p5 (1 MB) + `koi.js` are no longer script tags on home/about/side-quests/guest-gallery: `lazyKoi()` in `js/shell.js` injects them (koi first, then p5, which self-starts) once the page has loaded and the footer is within 800 px of view, or when the browser is idle (8 s cap). It waits for `load` so the canvas is sized to the laid-out footer exactly as before. Landing (`index.html`) and Welcome Aboard keep their tags. (c) The two Ancizar Sans WOFF2 files are `<link rel=preload>`ed on the pages that use them. Not done: deferring the page scripts (little gain, they sit at the end of body) and self-hosting Ancizar Serif (needs a font download, ask first).

## Checks before committing
- `node tools/check.js` (zero errors), `node tools/bundle-css.js` after editing bundled CSS, and the grid audit at 1440px and 375px for every case-study page touched.
- Commit only what was asked. The raw `Ancizar_Sans/` download is not published (the site uses `assets/fonts/`).
