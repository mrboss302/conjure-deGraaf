# Conjure — landing site

Marketing site and beta waitlist for **Conjure**, the AI website studio from deGraaf.

- **Live:** https://conjure.degraaf.app (apex `degraaf.app` redirects here)
- **Stack:** plain static site — `index.html`, `styles.css`, `script.js`. No build step.

## Local preview

Just open `index.html`, or serve the folder:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Waitlist

The beta form posts signups to [Loops.so](https://loops.so) — no backend server.

To activate it:

1. In Loops, go to **Audience → Forms** and create a form.
2. Copy the form's endpoint ID (the `<id>` in `https://app.loops.so/api/newsletter-form/<id>`).
3. Paste it into `LOOPS_FORM_ID` at the top of the waitlist block in `script.js`.
4. Add Contact Properties in Loops for the custom fields the form sends:
   `name`, `platform`, `role`, `building`, `feedbackOptIn`, `source`.

Until `LOOPS_FORM_ID` is set, the form validates and shows the success state
locally (nothing is stored) so the page still works in preview.

## Deploy (Cloudflare Pages)

1. Push this repo to GitHub.
2. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
3. Select this repo. Build command: _none_. Output directory: `/` (root).
4. After the first deploy, go to **Custom domains**:
   - Add `conjure.degraaf.app`.
   - Add `degraaf.app` and set it to **redirect** to `conjure.degraaf.app`.

Cloudflare Pages' free tier covers this (unlimited bandwidth, free SSL,
multiple custom domains per project).

## TODO

- [ ] Set `LOOPS_FORM_ID` in `script.js`.
- [ ] Add a 1200×630 social share image at `og-image.png` (referenced in `index.html`).
- [ ] Replace placeholder Privacy / Terms links in the footer once those pages exist.
