# Outturn Website Partner Brief

> This file is the current handoff record for the Outturn website. Update it after every website PR so positioning, page structure, design decisions, implementation status, and open follow-ups remain accurate.

## Current status

- Repository: `artunsarioglu/outturn-website`
- Working branch: `codex/decision-system-positioning`
- Open pull request: [PR #1: Reposition Outturn as a retail decision OS](https://github.com/artunsarioglu/outturn-website/pull/1)
- Base branch: `main`
- Local preview: `http://localhost:4173/`
- PR has not been merged.

## Positioning

Outturn is positioned as an AI-native decision OS for retail, starting with merchandising. It is not positioned as a forecasting product, dashboard, task tracker, or replacement for planning and allocation systems.

The long-term vision is to become the decision brain for retail by connecting commercial context, decisions, ownership, execution, outcomes, and organizational memory.

### Current hero

**Eyebrow**

`AI-native decision OS for retail.`

**Headline**

`The decision system for retail teams.`

**Description**

`Outturn gives retail teams the context to make better commercial decisions, remembers why decisions were made and what happened next, so every future decision starts smarter than the last.`

**Guarantees**

- Built around your retail business
- Every decision has a clear rationale
- Every outcome improves the next decision

## Product story

Outturn continuously reviews reports, emails, sales, inventory, and planning signals across siloed systems. It surfaces only the commercial decisions that require human judgment, in priority order, and keeps monitoring as new signals appear.

Each decision brief brings together:

- Relevant retail and commercial context
- Source-linked evidence and reproducible calculations
- Trade-offs and response options
- A named human owner and approval
- Execution status in existing systems
- Measured outcomes
- Memory that improves the next similar decision

## Current site structure

### Homepage: `index.html`

- Hero positioning and calls to action
- Interactive scrollytelling product demo
- Four-week pilot request form
- Seven-question FAQ
- Updated footer navigation

The homepage no longer includes the Problem, How It Works, Honest AI, or ROI sections inline. Those narratives were moved to dedicated pages.

### The Problem: `the-problem.html`

**Headline:** `Less time for better decisions.`

The page explains that retail teams make decisions across fragmented systems, manual work keeps merchandisers firefighting, decisions leak between teams, reasoning and outcomes are rarely captured, and similar issues repeatedly start from scratch. Category strategy, assortment improvement, long-tail opportunities, and learning from outcomes are squeezed out.

The previous detailed problem visual was removed. The page is intentionally concise and fits within one desktop viewport.

### How It Works: `how-it-works.html`

**Headline:** `An AI-native decision OS built around your business.`

Four-part system:

1. Learn your business
2. Connect your systems
3. Work continuously
4. Learn from outcomes

The page includes company goals, department priorities, role priorities, KPI definitions, decision rules, integrations, continuous commercial analysis, and company memory. Avoid positioning Outturn as a generic workflow tool.

### Honest AI: `honest-ai.html`

**Headline:** `No black-box forecasts. No autonomous agents inside your systems. The math is published.`

The page emphasizes deterministic calculations, source-linked evidence, human approval, clear governance, and knowing when not to act.

## Demo narrative

Demo copy uses American English, including “pants” rather than “trousers.”

The interactive demo follows a decision through these five stages:

1. Your day, prepared
2. Context reconciled
3. Decision
4. Execution
5. Outcome measured

The previous standalone decision-summary screen was merged into the context screen. The Linen Suit decision title, commercial exposure, supporting facts, cited sources, and calculation now appear on one screen.

The second step is titled `See exactly what the decision is built on.` It explains that Outturn combines commercial evidence, business rules, and relevant history. The product panel uses the decision title `Rebalance linen suit inventory before the weekend.` and shows six evidence sources, including similar past decisions.

The first step currently reads:

`Before you start the day, Outturn reviews your reports, emails, sales and inventory signals. It brings forward the decisions that require your judgment, with the relevant context, commercial exposure and past outcomes already prepared.`

The demo must remain sticky while the narration scrolls. Do not add `overflow` to the scrollytelling section or padding to the sticky wrapper because both previously broke the interaction.

## Design direction

The intended feeling is premium, intelligent, precise, original, and commercially urgent without looking like a generic enterprise AI website.

Current visual system:

- Large editorial typography
- Warm neutral base with subtle cool accents
- Restrained glass depth rather than full glassmorphism
- Translucent blurred navigation
- Soft grid and light fields in hero areas
- Dark, precise product UI
- Controlled shadows and thin borders
- Glass treatment extended across the Problem, How It Works, and Honest AI pages

The glass treatment should remain subtle. The product demo itself keeps its original dimensions and sticky behavior.

## Copy rules

- Do not use the em dash character.
- Prefer simple, direct English over slogan-heavy language.
- Avoid generic enterprise AI terminology when a concrete retail explanation is possible.
- Avoid framing Outturn as forecasting, task management, or a workflow tool.
- Keep human judgment and approval explicit.
- Do not invent customers, logos, results, or security capabilities.
- Demo figures must remain clearly identified as sample data.

## Pilot and FAQ

The pilot section now presents a four-week pilot and the request form without the previous detailed weekly plan or unverified claims.

Current FAQ topics:

1. What does Outturn actually do?
2. Is Outturn autonomous?
3. Does Outturn replace our existing systems?
4. Is Outturn a forecasting tool?
5. How can we trust the numbers?
6. What does Outturn need to get started?
7. How does the pilot work?

## Implementation notes

- Static HTML, CSS, and JavaScript site
- Main files: `index.html`, `styles.css`, `main.js`
- Dedicated pages: `the-problem.html`, `how-it-works.html`, `honest-ai.html`
- Local server currently uses port `4173`
- The design changes are contained in named CSS blocks to make rollback easier.
- The LinkedIn icon is present in the footer but is not linked yet. Add the company LinkedIn URL when provided.

## PR history included in PR #1

- `267ca9b` Reposition Outturn as a retail decision OS
- `c79b9c7` Add restrained glass depth across the site
- `0ae2b6a` Add decision memory to the hero message
- `7e48bf0` Tighten the hero product description
- `8d04cf9` Capitalize the hero guarantees
- `38c502b` Clarify the siloed systems in the demo narrative
- `a034e53` Add the website partner handoff brief
- `7e69f86` Refocus the hero on decision memory
- `893b5ab` Combine the decision summary with its context
- `7c618b2` Refine the prepared-day demo message
- `cdc0543` Expand the reconciled context screen

## Required PR closeout

After every website PR:

1. Update this brief with the final copy and page structure.
2. Record material design and interaction decisions.
3. Add or remove follow-ups as their status changes.
4. Update the PR link, branch, merge status, and relevant commit summary.
5. Commit this file to the same PR before considering the PR complete.
