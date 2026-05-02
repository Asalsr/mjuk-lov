<!-- Scout Header
Purpose: 13 battle-tested process lessons from real UI migration sessions
When to use: Before starting any design transplant — prevents known process failures
Size: ~75 lines
-->

# Process Lessons from Real Migrations

> Battle-tested lessons from 11+ Claude Code sessions, 16+ user corrections,
> and 3 correction cycles during reference UI migrations.
>
> These lessons are encoded into the workflow phases but stated explicitly here
> as reminders. The orchestrator should review this file at the start of any migration.

---

## 13 Lessons

### 1. Pull latest before starting

The very first execution session hit "why am I seeing the same color theme?" because the branch was behind main. Always `git pull` before any changes.

### 2. Extend navigation, never replace it

The sidebar was fully replaced instead of extended, removing production menu items. Required 3 correction sessions to fix. Add new items alongside old ones. Count menu items before and after.

### 3. Always use mock data, but document it

The original migration ported pages with mock data but didn't document which pages needed real data wiring. The user was surprised to find fake data. The fix isn't to wire data during migration (out of scope) — it's to produce a Data Wiring Manifest so the handoff is explicit. Mark mock components with `border-2 border-debug-border` AND `// MOCK DATA` comments.

### 4. Count, don't estimate

Component counts must come from grep/glob. "About 33 charts" was actually 48. Run the scans, record the numbers. Use these as baseline for verification.

### 5. Side-by-side diff before scoping

Before classifying any component as "needs rebuild," open both the production and prototype versions. The actual gap may be much smaller than assumed. 9 pages classified as "rebuild" turned out to be 15-minute wrapping.

### 6. Quality gates per phase, not per milestone

Skipping lint after color cleanup resulted in 96 ESLint errors in the final commit. Run `typecheck + lint + test + build` after every phase.

### 7. Verify git diff before creating PRs

A PR was created containing only spec files, not the actual code changes. Always run `git diff --stat` before `gh pr create`.

### 8. Never push to main

In one session, a push to main was almost executed. Always confirm branch before any push. Always use feature branches.

### 9. Test visual positioning of ported components

ProfileMenu appeared over the header because it wasn't adapted to the production layout's scroll constraints. Prototypes have different layout assumptions.

### 10. The parity contract is a scope fence

Any change that would touch a frozen file is out of scope. This prevents scope creep more effectively than estimation.

### 11. Defer ruthlessly

Import/export pages, alumni data wiring, and filter integration were correctly deferred because they required new backend work. The migration scope is: make it look like the new design. Nothing more.

### 12. No DOM access in services

`getComputedStyle()` was placed in `capitalFlowService` to resolve chart colors at the data layer. This broke SSR and test environments (`document is not defined`). Color resolution belongs in components or hooks — services must remain environment-agnostic. Always add `typeof document !== 'undefined'` guards to any color resolver utility.

### 13. Use runtime color accessors, not static arrays

`DEFAULT_CHART_COLORS` was a static array imported at module load time, so charts never responded to dark/light mode toggle. The fix was switching to `getDefaultChartPalette()` — a function that reads CSS variables on each call. Then the static re-export was removed to prevent consumers from accidentally bypassing the theme-aware function.

---

## Key Principle

**Read the code before scoping. Count before estimating. Wrap before rebuilding. Defer everything that touches frozen files.**

- Phase 1 (Discovery) prevents 80% of migration failures — never skip it
- The wrap-vs-rebuild decision is the single highest-leverage classification
- Per-phase quality gates catch problems when they're cheap to fix
- The parity contract is your scope fence — respect it absolutely
- When in doubt, defer to a separate spec. The migration scope is visual only.
