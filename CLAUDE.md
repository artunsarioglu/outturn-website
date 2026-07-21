# Outturn website — working rules

This is the public marketing site for getoutturn.ai (GitHub Pages, CNAME). Static, no build step: `index.html` + `styles.css` + `main.js`, self-hosted Inter. **This repo is PUBLIC — every file here is world-readable and served at getoutturn.ai/<name>. Never add strategy documents, roadmaps, internal assessments, or secrets.**

## Workflow — binding

- **Every change ships as a pull request to `main` — never a direct push.** One coherent change per PR with a clear description; the other partner reviews before merge.
- Push with the personal GitHub account (`gh auth switch --user artunsarioglu`), not the work account; switch back after.
- Bump the `?v=N` query strings on `styles.css` / `main.js` in `index.html` whenever those files change.
- After any JS/CSS change, verify before merging: the scroll demo's stage swaps, source chips, calculation toggle, both option pills (numbers change downstream), Approve → auto-advance, outcome bars, and mobile (panel pins to top, narration scrolls beneath).
- No frameworks, build steps, analytics, or external dependencies without an explicit joint decision.
- Local preview: `python3 -m http.server 5180` in the repo root.

## Copy rules — binding

- No autonomy hype: a human approval always precedes any action verb ("gets the owner's yes, then triggers"). Outturn routes actions into the customer's systems; it never "acts inside" them uninvited.
- Never claim demand forecasting. Every number on the page must be recomputable from inputs shown next to it, or be labeled demo-seeded/illustrative.
- No invented customers, logos, testimonials, or outcome claims. Public stats stay attributed and date-stamped.
- Plain words: never "delta," "residual," "variance," "trailing average." Decisions, money, deadlines.
- Global-first: USD, globalized names and examples.
- Minimalism budget: to add a section, name the one you'd remove.
- Keep the demo arithmetic and record IDs internally consistent after any edit.
