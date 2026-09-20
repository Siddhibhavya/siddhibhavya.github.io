# How I made it

Hi! I'm Siddhi — a designer tinkering at the intersection of human-computer interaction, accessibility and efficiency. This is my portfolio, and I wanted it to feel like a little museum you wander through rather than a page you scroll past. This file is the behind-the-scenes tour: what it is, how I designed it, how it's built, and how I keep it going.

---

## What the site is

A small museum of my work, with me as the (slightly over-excited) host.

- **Landing** — a dark, starry entrance with a koi swimming behind it. Press *Be my Guest* to go through.
- **My Work** — project cards that straighten up and open out when you hover: Syncletter, NearU, NCFE – Redesign and *Are they Driving?* (The full case studies are still on their way — for now each card opens a short summary.)
- **About Me** — who I am, on graph paper, with a few things you're allowed to pick up and throw around.
- **Side Quests** — a collage of things I made just because.
- **Guest Gallery** and **Welcome Aboard** — visitors draw a card, sign it, and leave it in my gallery.
- **SiddhiLM** — a little chatbot that talks the way I do.

## The design

I designed everything in **Figma** first — every frame, every little doodle — and then built the site to match it as closely as I could, down to the pixel.

**Palette** (I never "tune" these, they come straight out of Figma):

| | Colour | Where |
|---|---|---|
| Plum | `#190523` | landing page + footer |
| Cream | `#ffece1` | the page background |
| Maroon | `#7f404e` | the sidebar, buttons, pills |
| Ink | `#0e0314` | text |
| Card | `#ffeddb` | project cards |
| Brown | `#7f5744` | soft body text |
| String green | `#075e54` | the long green line in Welcome Aboard |
| String orange | `#ff9a00` | the thin orange line that chases it |

**Fonts**

- **Inter** — almost all the text.
- **Ancizar Serif** — titles, my name, the big "Namaste, I am Siddhi".
- **Blank Script** — my own handwriting font, used for the word *museum* on the landing page and for signatures in the guest gallery.

Inter and Ancizar Serif load from Google Fonts. Blank Script is included in `assets/fonts/`.

## How it's built

Plain **HTML, CSS and JavaScript**. There's no framework, no bundler and no build step — what you see in this repo is exactly what gets served.

- **The Figma layout scales to any screen.** Every page is laid out on a fixed design canvas (1448px wide) using the exact numbers from Figma, then scaled down proportionally to fit the window — so the spacing and type keep the same ratios on a laptop as on a big monitor. On small screens (under 900px) the sidebar turns into a drawer: a little star button says *Index* and slides the card out.
- **The koi are p5.js.** The background fish are a p5.js sketch (loaded from a CDN). One swims across the landing page; a quieter one lives in the footer and wakes up when you hover it.
- **In-place page navigation.** Moving between My Work, About, Side Quests and the Guest Gallery doesn't reload the page. A small script fetches the next page and swaps just the content, so the sidebar and footer stay put and the highlight pill glides to its new spot. If anything goes wrong, it quietly falls back to a normal page load.
- **Sensible structure.** CSS is split into a `shell/` folder (the frame around every page) and a `pages/` folder (one file per page), tied together by one `css/site.css`. Each script does one job and runs on its own, so if one breaks the rest of the site keeps working.

```
index.html, home.html, about.html, …   the pages
css/        site.css (the one stylesheet) + shell/ + pages/
js/         one script per job (shell, chat, guest, about, landing, koi …)
assets/     images, fonts, cursors, audio, video
```

## The interactions I'm proudest of

- **The gooey Index ⇄ Siddhi LM tab.** The sidebar's folder tab isn't a picture — it's drawn in SVG and melts from one side to the other like liquid when you switch tabs (a blur + contrast trick, animated by hand so the leading edge shoots ahead and the trailing edge catches up).
- **Welcome Aboard.** Draw a card, sign it on the line, pick a colour and press *Create*. Then everything happens in one unbroken take: the cards slide, two strings (a thick green one and a thin orange one, traced from my Figma frames) are pulled across the screen, "Thank You" rises, the strings are fed off to the right, and you're gently returned to the main site.
- **Things you can move on About.** The stars, the fish-bone patch and the dino can be picked up and thrown — they slide, bounce off the edges and tilt as you drag. Tap one and it spins or wobbles. (A little pill tells you this the first time you scroll.)
- **The "View case study" cursor.** Hover a project card and the cursor turns into a coloured pill — green for Syncletter, yellow for NearU, blue for NCFE, red for *Are they Driving?* — that follows you around.

Also: the default cursor is a little white star, and it glows on the dark parts of the site.

## How SiddhiLM works

SiddhiLM lives entirely in your browser. There's **no AI service and nothing is sent anywhere** — it's a bot that talks like me using answers I wrote myself.

1. **The question bank** (`js/bank.js`) is a big list of questions people might ask me — about design, my projects, hobbies, this website — each with alternate wordings and, if I've written one, my answer (and sometimes pictures).
2. **Matching.** When you type a message, the bot scores it against every question by shared words, giving rarer words more weight ("Syncletter" counts for more than "the"). A strong match gets my answer; a near match gets a gentle "did you mean…?"; no match gets a friendly "ask me directly" with buttons to reach me.
3. **The jail.** Before matching, the bot checks whether someone is trying something they shouldn't — telling it to ignore its instructions, being rude, asking for private details like phone numbers or passwords, or asking it to do their homework or write code. Those get a cheeky, escalating "nope" instead of an answer, and a nudge back to talking about design.

Unanswered questions are left blank on purpose: the bot would rather say *"I haven't written that one down yet"* than make something up about me.

## Run it locally

Because pages are swapped with `fetch`, open the site through a tiny local server (double-clicking `index.html` won't do it justice). From this folder, use whichever you have:

```bash
python -m http.server 5173
```

or

```bash
npx serve -l 5173
```

Then open <http://localhost:5173>.

## How I update it

- **Text and links** — `js/config.js` holds my tagline, links and the project blurbs.
- **Chatbot answers** — add or edit entries in `js/bank.js` (each is a question, some alternate wordings, and an `a` answer; add `img: [{ src, alt }]` for pictures).
- **Pictures, video, fonts** — drop them into `assets/`.
- **Look and feel** — the CSS file for that page in `css/pages/`, or `css/shell/` for the sidebar and footer. Change a rule where it lives rather than adding another lower down.
- **Publishing** — the site is hosted on GitHub Pages straight from the `main` branch. I commit, push, and it's live within a couple of minutes.

## A few honest notes

- Guest cards are saved in each visitor's own browser, so at the moment you'll see your own cards (plus a few seeds), not everyone's. A shared wall would need a small backend — it's on my list.
- Case studies and a résumé PDF are on their way.

Thanks for visiting the museum. 🌟
