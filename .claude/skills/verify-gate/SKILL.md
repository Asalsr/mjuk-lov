---
name: verify-gate
description: >
  Run the Mjuk Lov verification gate — TypeScript typecheck, Vitest tests,
  production build, ESLint on changed files, and the contrast audit for UI
  changes — then report a clear pass/fail summary. Use this whenever the user
  wants to verify, test, or check their changes: before committing, before
  pushing, before opening a PR, or when they ask "does this pass", "did I break
  anything", "is this good to merge", "run the checks", or just "verify"/"test"
  — even if they don't name the specific commands. This is the §7 gate from the
  mjuk-lov-rules house rules; run it before any commit/push/merge.
---

# Verify gate

This repo has a fixed set of checks that must pass before code is committed,
pushed, or merged (house rules §7). The point of this skill is to run them in a
sensible order, scope the slow/noisy ones correctly, and give the user one
honest pass/fail summary instead of a wall of output. Don't claim success
without having actually seen each command's exit status — the whole reason this
gate exists is that "looks fine" has shipped broken builds before.

## What runs, and why it's ordered this way

Run these from the repo root, **stopping to report if a cheap check fails**
before spending time on an expensive one:

1. **`npx tsc --noEmit`** — typecheck. Cheapest signal; catches most breakage
   first. (~seconds)
2. **`npx vitest run`** — the unit tests. The allergen engine and the unit
   converter are the legal/correctness-critical paths, so a red test here is
   never "just a test." (~1s)
3. **`npm run build`** — the Next.js production build. This is the real gate:
   SSG re-renders every recipe, so a malformed recipe or a bad schema change
   fails the build even when tsc/tests pass. Slowest step (~1–2 min); worth it.
4. **ESLint on changed files** — see scoping below. A repo-wide `npm run lint`
   is noisy (it lints `.claude/skills/**` temp files and has pre-existing
   warnings), so lint only what changed to keep the signal clean.
5. **Contrast audit** — `npx tsx scripts/contrast-audit.ts` — only when UI/CSS
   changed (see scoping). Accessibility (no-opacity-on-text, AA contrast) is
   enforced here; this is the guardrail for house-rules §3.

tsc and vitest are cheap enough to always run. If both pass, run the build. Run
eslint and the contrast audit based on what actually changed.

## Scoping the changed-file checks

Figure out what changed so eslint and the contrast audit run on the right
things. Compare the working tree + commits against the base branch:

```bash
git diff --name-only master...HEAD; git status --porcelain | sed 's/^...//'
```

- **ESLint**: collect the changed `*.ts`/`*.tsx` files under `app/` and `lib/`
  (skip deletions and `*.json`), then `npx eslint <those files>`. If nothing
  relevant changed, say so and skip. Pre-existing warnings in untouched files
  are not your regression — only flag issues in files this change touched.
- **Contrast audit**: run it if any `app/**/*.tsx` or `app/globals.css` changed
  (UI work). It's a pure script (no dev server, no env) and prints the palette /
  opacity contrast table — confirm nothing the change introduced dips below AA.

If the user explicitly asks for "the full gate" or "everything", run all five
regardless of what changed.

## Reporting

End with a compact summary the user can read at a glance — actual results, not
optimism:

```
Verification gate
  tsc            ✅ pass
  vitest         ✅ 21 passed
  build          ✅ pass (all routes incl. SSG recipes)
  eslint         ✅ clean (3 changed files)
  contrast       ✅ no AA regressions   (or "— skipped, no UI changes")
```

If anything fails, show the **relevant** error lines (not the whole log), name
the file/test, and stop short of any "ready to commit/push" claim — the gate
failing is exactly the moment to surface the problem, not paper over it. Offer
to fix it. Only state the gate passed when every run you did actually exited 0.

## Enforced at push time, too

A git **pre-push hook** (`.githooks/pre-push`, activated with
`git config core.hooksPath .githooks`) runs this same gate automatically and
**blocks the push if it fails** — the full gate (tsc + tests + build) when the
push targets `master`/production, the quick checks (tsc + tests) otherwise.
The shared entry points are `npm run gate` (full) and `npm run gate:quick`.

So the gate can't be forgotten before production: even if this skill isn't
invoked, the hook stops a broken push. Running the skill *during* work just
surfaces problems earlier, before you reach the push. (Emergency bypass:
`git push --no-verify` — use sparingly.)

## Notes

- These are the same commands listed in `mjuk-lov-rules` §7 and the project
  `AGENTS.md`; this skill just automates running and summarizing them.
- `npm test` is an alias for `vitest run` (see `package.json`) — either works.
- Don't add `npm run structure-qty` to the gate — that's an authoring/migration
  tool, not a check. The build already validates recipe data.
