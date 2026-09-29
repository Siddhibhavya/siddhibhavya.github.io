# Project rules for Claude

Plain HTML/CSS/JS portfolio site, no build step. Read `tools/DEV-NOTES.md`
first for the folder map and how the site fits together.

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

- Nothing invented without checking. When a design detail is ambiguous or
  feedback contradicts an earlier guess, pull the Figma node
  (`get_metadata` / `get_design_context`, file key `Nc087O4ophE87f3EyMdcVh`)
  rather than iterating blind — ask for the specific node link if one isn't
  already given.
- Run `node tools/check.js` after every change; zero errors before calling
  something done.
- Commit only what was actually asked for or touched — don't stage unrelated
  in-progress work found elsewhere in the tree.
