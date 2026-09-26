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
- the small sitewide copy conventions (e.g. the drawer reminder just says
  "Menu")

Keep that doc updated as new lessons come up — it's meant to carry across
chats, not just this one.

## Working style

- Nothing invented without checking. When a design detail is ambiguous or
  feedback contradicts an earlier guess, pull the Figma node
  (`get_metadata` / `get_design_context`, file key `Nc087O4ophE87f3EyMdcVh`)
  rather than iterating blind — ask for the specific node link if one isn't
  already given.
- Run `node tools/check.js` after every change; zero errors before calling
  something done.
- Commit only what was actually asked for or touched — don't stage unrelated
  in-progress work found elsewhere in the tree.
