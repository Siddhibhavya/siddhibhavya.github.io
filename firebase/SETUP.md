# Setting up the shared Guest Gallery (Firebase Firestore, free Spark plan)

Nothing in this repository is secret. The Firebase "config" you paste into `js/firebase-config.js` only says *which* project to talk to — every Firebase website shows it publicly. What protects the data is `firebase/firestore.rules`, which you publish in the console below. Never put a password, a service-account JSON file, a private key or an admin token anywhere in the code.

## 1 · Create the project ✅
Firebase console → **Add project**. Google Analytics isn't needed — turn it off. Stay on the free **Spark** plan (don't add a billing account: Spark can never be charged).

## 2 · Register a web app and copy its settings
1. **Project overview** → click the **`</>`** (Web) icon → App nickname `portfolio` → leave **Firebase Hosting unticked** → **Register app**.
2. Copy the `firebaseConfig` object it shows (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`).
3. Paste those values into **`js/firebase-config.js`** (between the quotes).

## 3 · Create the database — in production mode
**Build → Firestore Database → Create database** → pick **Standard edition** if asked → Database ID `(default)` → choose a location close to your visitors (it can't be changed later) → **Start in production mode** → Create.
Never choose "test mode": it leaves the database open to everyone for 30 days.

## 4 · Publish the security rules
**Firestore Database → Rules** tab → select everything, delete it, paste the whole of **`firebase/firestore.rules`** → **Publish**.

Check them in the **Rules Playground** (the button next to Publish). Path `/cards/aaaaaaaaaaaaaaaaaaaa`, **unauthenticated**:
- **get** with `hidden: false` data → allowed; `hidden: true` → denied
- **update** or **delete** → denied
- **create** with a wrong field or a `name` of 40 letters → denied

## 5 · Nothing to add by hand
The `cards` collection appears by itself when the first card is saved.

## 6 · Create the index
The gallery asks for "the newest 16 cards that aren't hidden", which needs one index.
**Firestore Database → Indexes → Composite → Add index**
- Collection ID: `cards`
- Fields: `hidden` → **Ascending**, then `t` → **Descending**
- Query scope: **Collection** → **Create**

It takes a minute or two to show **Enabled**. (If you skip this, the first time the gallery loads, your browser's console prints a link that creates the same index for you.)

## 7 · Lock the API key to your website
[Google Cloud console](https://console.cloud.google.com) → select the same project → **APIs & Services → Credentials** → open **Browser key (auto created by Firebase)** → **Application restrictions: Websites** → add
- `https://siddhibhavya.github.io/*`
- `http://localhost:5173/*` (for testing on your computer)

Save. (The key isn't a secret, but this stops other websites using your quota.)

## 8 · Try it
Open the site → Welcome Aboard → draw, sign, **Create**. Then Firestore → **Data** → `cards` should hold your card, and the Guest Gallery shows it (a visitor may take up to a minute to see new cards — the browser caches for 60 s).

## Taking a card down
Firestore → **Data** → `cards` → click the card → hover the **`hidden`** field → ✏️ → change `false` to **`true`** (keep it a *boolean*) → **Update**. It disappears from the gallery for everyone. To remove it for good, delete the document. To bring it back, set `hidden` to `false`.

## The free plan, in numbers
(Check the current limits and your use under Firestore → **Usage**.) Spark includes about 1 GiB stored, 50,000 reads and 20,000 writes a day, and about 10 GiB of downloads a month. A card is roughly 10–40 KB, and a gallery view reads 16 cards, so it comfortably covers a portfolio's traffic. If a limit is ever reached, Firestore just refuses requests until it resets — nothing is charged — and the site quietly falls back to showing each visitor their own cards.

## What the site does to stay inside the limits
- The drawing is shrunk to a 480 px WebP before saving (never above 55,000 characters; the rules refuse anything over 70,000).
- One card per browser every 30 seconds; the gallery reads 16 cards and remembers them for 60 seconds.
- The Firebase code is only downloaded on the Gallery and Welcome Aboard pages.

## Not covered (ideas for later)
Rules can't tell a person from a script, so someone could still post many cards by hand-crafting requests. If that ever happens, hide the cards in the console and consider turning on **Firebase App Check** (reCAPTCHA) for Firestore.
