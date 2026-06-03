# Mjuk Lov — launch checklist (M8)

The recipe app (Phase 1) is feature-complete. These are the steps to ship it.
Items marked 🧑 need your real values/credentials.

## 1. Environment variables (Vercel)
- 🧑 Add **`OPENAI_API_KEY`** in Vercel → Project → Settings → Environment Variables.
  Without it, the AI assistant and the "make vegan/vegetarian" adapter return an error
  in production. (Locally the key is read from `spike/.env`.) See `.env.example`.
- Optional: `PROVIDER=claude` + `ANTHROPIC_API_KEY` to switch the AI provider.

## 2. Content before launch
- 🧑 **Videos** — recipes ship with `"youtubeId": null` (branded placeholder). To add a
  video, set `"youtubeId": "<11-char id>"` in the recipe's JSON (embedding a public
  video needs no account). Self-hosting your own `.mp4` is a future option.
- Add more recipes anytime: `npm run import -- <url>` → review → `npm run label -- <slug>`
  → set `allergens.approvedBy` and `"published": true`.

## 3. Footer / contact (placeholders)
- 🧑 `app/components/Footer.tsx` still has placeholder **phone**, **email**, and
  **neighbourhood** (flagged in the handbook §). Replace with real values before launch.

## 4. Quality gate
- `npm run build` — must pass (TypeScript + static generation).
- `npm test` — allergen-engine unit tests must be green.
- Spot-check `/sv/recept`, `/en/recept`, a recipe page, `/sitemap.xml`, `/robots.txt`.

## 5. Deploy
- 🧑 Push to your Vercel project (existing setup). Recipe pages are static (SSG);
  `/api/ai`, `/sitemap.xml`, `/robots.txt` are server routes.
- 🧑 Point the **mjuklov.se** domain.

## Allergen safety reminder
Allergen labels are **drafts requiring human approval** (`approvedBy`). Re-running
`npm run label` clears approval — always re-check before re-publishing. The AI
"adapt" suggestions are review-only and never auto-published.
