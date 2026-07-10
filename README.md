# The Quiet Few Collective

The premium parent-brand website + installable PWA for **The Quiet Few Collective LLC** — the house
brand for quiet builders, sharp tools, and limited drops. It houses the apps (Miqat, Codewatt,
Wireway, Three to Five, and more) as a purchase hub and builds anticipation for future clothing drops.

> *Built quiet. Moved precise.*

Zero build step. Zero runtime dependencies. Plain HTML/CSS/JS — production-ready and easy to migrate
to any framework later.

---

## File structure

```
quietfew-site/
├── index.html            # All page markup (semantic, accessible)
├── styles.css            # Design system + all styles (deep black / warm cream)
├── app.js                # Interactions (cursor glow, tilt, magnetic, reveals, waitlist)
├── manifest.webmanifest  # PWA manifest (name, theme, icons)
├── service-worker.js     # Offline app-shell caching (network-first nav, cache-first assets)
├── assets/
│   ├── quiet-few-emblem.png          # Supplied emblem logo (used as-is)
│   ├── quiet-few-wordmark-icon.png   # Supplied wordmark/shush icon (used as-is)
│   ├── icon-192.png / icon-512.png   # PWA icons (generated from the emblem)
│   ├── icon-maskable-512.png         # Maskable icon w/ safe-zone padding
│   ├── apple-touch-icon.png          # iOS home-screen icon
│   └── favicon-16.png / favicon-32.png
├── _tools/gen-icons.mjs  # One-off icon generator (needs sharp; see below)
├── package.json          # Dev-only: sharp for icon regen + a local-server script
└── README.md
```

`_mockup_ref/` (the original starter zip) and `node_modules/` are git-ignored — neither ships.

---

## Preview locally

The site is fully static — serve the folder over HTTP (service workers require `http://`/`https://`,
not `file://`):

```bash
cd quietfew-site
python3 -m http.server 5173      # then open http://localhost:5173
```

Any static server works equally well:

```bash
npx serve .        # or:  php -S localhost:5173
```

To verify the PWA: open DevTools → **Application** → **Manifest** (installable) and
**Service Workers** (registered). Toggle **Offline** and reload — the shell still loads.

---

## Deploy

No build command, no framework. Point any static host at this folder.

### Vercel
```bash
npm i -g vercel
vercel            # from the project root; accept defaults
```
Or drag-and-drop the folder in the Vercel dashboard. Framework preset: **Other**.
Build command: *(none)* · Output directory: `.`

### Netlify
```bash
npm i -g netlify-cli
netlify deploy --dir=. --prod
```
Or drag the folder onto <https://app.netlify.com/drop>. No build command needed.

### Cloudflare Pages
Connect the repo in the Cloudflare dashboard → **Pages** → build command: *(none)*,
output directory: `/`. Or `npx wrangler pages deploy .`.

### Custom domain
Point `www.thequietfewcollective.com` at the host per its DNS docs. After the domain is live,
update the absolute URL in the `og:image` / social tags in `index.html` if you want rich previews.

---

## Connect the waitlist backend

The form is wired but **not** connected to a provider yet — during development, submissions are
validated and stored in `localStorage` so nothing is lost.

**Where:** `app.js` → the `submitEmail(email)` function (marked with a big `CONNECT YOUR BACKEND HERE`
banner). Replace the stub body with a real request. Everything else (validation, honeypot, loading
state, success/error messaging) already works.

> ⚠️ **Never hardcode a secret API key in `app.js`** — it ships to the browser. Post to a small
> serverless function (Vercel/Netlify/Cloudflare Functions) that holds the key server-side.

**Example — serverless endpoint (recommended):**
```js
async function submitEmail(email) {
  const res = await fetch("/api/waitlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error("Subscription failed");
  return true;
}
```

**Example — Mailchimp / Klaviyo / Supabase / Firebase:** all support either a hosted form action or a
REST call from a serverless function. Put the list ID / API key in the function's environment
variables (e.g. `KLAVIYO_KEY`), not in the client.

**Shopify:** if you sell through Shopify, swap the app-card links (below) for product URLs and use
Shopify's customer/marketing signup form or a Klaviyo integration for the waitlist.

---

## Swap in real app links

Each app card in the **Apps** section links to `#waitlist` as a safe placeholder.

**Where:** `index.html` → `<section id="apps">` → each `<a class="app-link" data-app="…">`.
Change `href="#waitlist"` to the live store/app URL (Play Store, App Store, or the app's own page).
Update the `.badge` (e.g. change `badge-soon "Coming soon"` to `badge-live "Live"`) and the
"Get notified" label as apps ship. The `data-app` attribute is a ready hook for click analytics
(see the commented `plausible(...)` example at the bottom of `app.js`).

Add a new app by copying one `<article class="app-card reveal tilt-card">` block and bumping the
`app-index` number. The grid reflows automatically.

---

## Regenerate PWA icons

Icons are pre-generated and committed, so you normally don't need this. If you swap the source
emblem, regenerate them:

```bash
npm install          # installs sharp (dev-only)
npm run icons        # writes assets/icon-*.png from assets/quiet-few-emblem.png
```

The generator (`_tools/gen-icons.mjs`) contains the logo on brand black and never crops it; the
maskable variant keeps an 80% safe zone so the OS mask only trims the black padding.

---

## Notes for maintainers

- **Brand tokens** live at the top of `styles.css` (`--black #050504`, `--cream #f3ecd9`, fonts).
- **Motion** is fully gated behind `prefers-reduced-motion` — reveals, cursor glow, tilt, magnetic
  buttons, and the marquee all disable cleanly.
- **Accessibility:** semantic landmarks, skip link, focus-visible rings, ARIA live region on the
  waitlist status, honeypot spam trap.
- **Logos** are used exactly as supplied — not distorted, recolored, or cropped.
- Update the SW cache by bumping `CACHE_VERSION` in `service-worker.js` after changing shell files.
```
