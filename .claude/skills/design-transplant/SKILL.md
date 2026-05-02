---
name: design-transplant
description: Use when transplanting or migrating visual design from a prototype/design
  repository (e.g. Lovable, Figma-to-code, v0) into a production repository. Orchestrates
  modular phases — Discovery, Theme/CSS, Structural Comparison, Component Porting,
  Navigation, Color Cleanup, Verification — each powered by dedicated sub-agents.
  Handles full-app migrations, page-by-page transplants, theme changes, and navigation
  redesign while preserving all production functionality. Triggers on "transplant design",
  "migrate UI from", "reskin page from", "merge visual design from", "port design".
context: fork
compatibility: Designed for Claude Code
metadata:
  author: mjuk-lov
  version: "3.0"
---

# Design Transplant

## Overview

A modular, sub-agent-driven workflow for transplanting visual design from a prototype/design repository into a production repository. The core principle: **CSS transplant, not regeneration — copy actual values from the source. Wrap existing components, never rebuild them. Visual changes only — never touch business logic, data fetching, authentication, or service layers.**

Each phase is powered by a dedicated sub-agent that auto-discovers the target repo's conventions — no hardcoded tokens, file paths, or schema rules. Phases are ordered lowest-risk to highest-risk so each leaves the app in a deployable state.

## When to Use

- Migrating UI/design from a Lovable, Figma-to-code, v0, or prototype repo into a production app
- Porting a new color palette, typography, or UI layout from one codebase to another
- Adding new pages/routes with mock data (to be connected to real data later)
- Redesigning navigation (sidebar, header) while preserving existing functionality
- Batch page-by-page UI transplants across a codebase

**When NOT to use:**
- Building new pages from scratch (use `frontend-developer` instead)
- Pure refactors with no visual design source
- Backend-only changes (no UI transplant component)
- Pure CSS theme changes with no component structure changes (just edit `index.css`)

## The Problem This Solves

UI migrations fail in predictable ways. This skill prevents fourteen failure modes observed in real migrations — see `references/process-lessons.md` for the full list and `references/common-mistakes.md` for detection/fix patterns.

## Phase Definitions

| Phase | Name | Agent | Risk | When to Skip |
|-------|------|-------|------|--------------|
| 0 | Context Collection | Orchestrator | None | Never |
| 1 | Discovery & Audit | Discovery Agent | None (read-only) | Never |
| 2 | Theme & CSS Transplant | Orchestrator | Very Low | No CSS changes |
| 3 | Structural Comparison + Backend Wiring | Sub-agents (parallel) | None (read-only) | Phases 3a/3b skippable independently |
| 4 | Component Porting | Orchestrator | Medium | No component changes |
| 5 | Navigation Redesign | Orchestrator | High | No nav changes |
| 6 | Color Cleanup Sweep | Orchestrator | Low | No remaining colors |
| 7 | DB Security Check | DB Security Agent | None (audit) | No DB access in target |
| 8 | Verification | Verification Agent | None (audit) | Never |

**Default order:** 0 → 1 → 2 → 3 (parallel) → 4 → 5 → 6 → 7 → 8 → Report.
**Minimum set:** 0, 1, 4, 8. **Always enforce:** Discovery + at least one edit phase + Verification.

## Phase Selection Logic

<instructions>

After collecting context in Phase 0, present phase selection:

```
AskUserQuestion:
  question: "Which phases should run? Default is all."
  options:
    A: "All phases (recommended)"
    B: "Skip Navigation (Phase 5) — no sidebar/nav changes"
    C: "Skip DB Security (Phase 7) — no database access"
    D: "Minimum: Discovery + Component Porting + Verification (0,1,4,8)"
    E: "Custom selection — I'll specify"
```

</instructions>

## Wrap vs Rebuild Decision Framework

<rules>

This is the single most important decision. Getting it wrong causes the biggest scope overruns.

**Before classifying any component, open BOTH the production and prototype versions side by side.**

| Signal | Classification |
|---|---|
| Same `useQuery` hooks, same service calls | **Wrap** (~15 min) |
| Same chart/table component structure internally | **Wrap** |
| Only CSS classes and grid layout differ | **Wrap** |
| New component wraps existing children without changing them | **Wrap** |
| Different data source or query params needed | **Rebuild** (defer to separate spec) |
| New API endpoints or DB views required | **Rebuild** (defer) |
| Service layer modifications needed | **Rebuild** (defer) |

If only the *container* and *styling* differ → it's a WRAP, not a rebuild.
If the *data flow* or *business logic* differ → it's a REBUILD. Defer it.

</rules>

---

<workflow>

## Phase 0: Context Collection

Collect via `AskUserQuestion`:

1. **Source repo path** — absolute path to the design/prototype repository
2. **Target repo path** — absolute path to the production repository
3. **Scope** — specific page, set of pages, or full-app migration
4. **Phase selection** — which phases to run (see above)

Validate both paths exist. Verify target builds before starting: `git pull && typecheck && lint && test && build`.
Create a feature branch — **never work directly on main**.

## Phase 1: Discovery & Audit

Read `references/subagent-prompts.md` § Discovery Agent.

Spawn **two Discovery Agents in parallel** (both are read-only):

**Agent 1 — Target Inventory:** Scans the production codebase for routes, components, hooks, services, hex colors, CSS variables, menu items. Returns exact counts (baseline for verification).

**Agent 2 — Source Inventory:** Scans the prototype for new CSS variables, new components, new routes, font changes, theme defaults, hardcoded colors.

The orchestrator merges both inventories into:
1. **Diff classification** — each difference classified as CSS-only / Additive wrapping / New component / Structural change / Behavior change (OUT OF SCOPE) / New backend (DEFERRED)
2. **Transplant Map JSON** — see `references/output-schema.md` and `references/transplant-map-template.md`
3. **Frozen files list** — auto-detected by convention patterns (see subagent-prompts.md)
4. **Baseline counts** — routes, menu items, components, hooks, hex colors (used in verification)

**Present the discovery plan to the user for approval before proceeding.**

### Execution Gate

After user approves: execute ALL remaining phases continuously without stopping. Do not ask additional confirmation between phases. Only stop if a quality gate fails.

## Phase 2: Theme & CSS Transplant

**Goal:** Make the target visually match the source without changing any JavaScript components.

1. **Font change** — compare Google Fonts imports, update `@import url(...)` and `body` font-family
2. **CSS variable transplant** — for each `:root` and `.dark` variable in source:
   - Different value in target → **replace**
   - Missing in target → **add**
   - Exists in target but not source → **keep** (don't delete production variables)
3. **Style file transplant** — replace hardcoded hex in CSS with `hsl(var(--variable))` references
4. **Chart/color constants** — add runtime accessor functions (NOT static arrays). Use `typeof document !== 'undefined'` guards. Color resolvers belong in components/hooks ONLY, never in services.

**Rules:** Zero JavaScript component changes. Copy actual HSL values from source. Keep existing variable groups the new design doesn't override.

**Quality gate:** `typecheck && build`

## Phase 3: Structural Comparison + Backend Wiring (Parallel)

Launch two sub-agents simultaneously:

**3a: Design Analyst** — Read `references/subagent-prompts.md` § Design Analyst. Compares JSX tree structures, identifies new/changed/removed elements, flags conflicts.

**3b: Backend Wiring Agent** — Read `references/subagent-prompts.md` § Backend Wiring Agent. Inventories all backend connections in target: hooks, services, auth, i18n, loading/error states, accessibility, toasts.

Both return structured JSON. The orchestrator uses both outputs in Phase 4.

## Phase 4: Component Porting (Design Transplant)

This phase is executed directly by the orchestrator (needs file editing).

Read `references/common-mistakes.md` before executing.

**Step 0: Structural comparison (MANDATORY).** Before touching any component, identify what the target has that the source lacks: loading states, error states, i18n, auth guards, React Query hooks, accessibility attributes. Every item found MUST be preserved.

**Step 1: Port new components.** For each new component from source:
- Copy from source, adapt imports to target patterns (`@/` aliases)
- Keep prototype's mock data — mark with `// MOCK DATA — see Data Wiring Manifest`
- Add `border-2 border-debug-border` to mock-data component containers
- Replace hardcoded colors with semantic tokens or `useChartColors()` hook
- Never import from source repo — recreate in target
- Record each mock page in the Data Wiring Manifest

**Step 2: Apply additive wrapping.** For existing components classified as "wrap":
- Read existing + reference implementation
- Add wrapper imports and state hooks
- Add `key` props to children
- Wrap content section — keep headers/controls outside wrapper
- Preserve all loading/error/i18n/auth/accessibility from target

**Step 3: Parallelize large work.** For files with 50+ replacements or 5+ components, launch one Agent per large file.

**Quality gate:** `typecheck && lint && test && build`

## Phase 5: Navigation Redesign

**CRITICAL: Add new items, never replace. Count menu items before and after.**

1. **Record baseline** — count all current menu items, write down exact list
2. **Extend navigation** — keep EVERY existing item, add new sections/items from source
3. **Verify completeness** — new count >= old count, every baseline item still present
4. **Route preservation** — if route path changes, add `<Navigate to="/new-path" replace />` at old path

**Quality gate:** `typecheck && lint && test && build` + manual menu item count comparison

## Phase 6: Color Cleanup Sweep

After all structural changes, comprehensive color cleanup:

1. **Scan** — `grep -rn '#[0-9a-fA-F]{6}' src/ --include='*.tsx' --include='*.ts'` + Tailwind palette scan
2. **Map** — use Transplant Map's token mapping for each remaining color
3. **Replace** — use agents for files with 50+ replacements
4. **Verify** — re-scan, only documented exceptions should remain

**Exceptions to leave:** SVG procedural gradients, frozen files, shadcn framework patterns, database-driven colors (`style={{ backgroundColor: dbRecord.color }}`).

**Quality gate:** `typecheck && lint && test && build`

## Phase 7: DB Security Check

Read `references/subagent-prompts.md` § DB Security Agent.

**Conditional:** Only run if Transplant Map shows database access. Verifies schema boundaries, RLS compliance, data access hierarchy.

## Phase 8: Verification

Read `references/subagent-prompts.md` § Verification Agent.

Spawn with: git diff, Transplant Map, Backend Wiring Inventory, `references/common-mistakes.md`.

Reviews diff for: frozen file modifications, remaining hardcoded colors, lost backend wiring, source imports, common mistakes, dark mode breakage.

Runs quality commands. Returns Verification Findings JSON.

## Report Synthesis

After all phases, read `assets/TRANSPLANT_REPORT_TEMPLATE.md`.

Combine all agent outputs into the two-zone report:
- **Zone 1 (Investigation):** Discovery summary, structural comparison, backend inventory, verification results
- **Zone 2 (PR-Ready):** Summary, changes, parity contract, Data Wiring Manifest, test plan

**Data Wiring Manifest:** For every page using mock data, document: page name, mock data shape, likely hook/service, priority. Include in PR description under `## Data Wiring Manifest`.

</workflow>

---

## Agent Execution Mode

<rules>

1. **Execute all phases continuously after approval.** After Phase 1 approval, proceed through all phases without stopping (unless quality gate fails).
2. **Commit after each phase** — incremental commits at natural boundaries for rollback points.
3. **Never modify frozen files** — if transplant seems to require it, STOP. The approach is wrong.
4. **Never import from source repo** — recreate or adapt everything in target.
5. **Mock data is correct for ported pages** — document in Data Wiring Manifest, don't wire data during migration.
6. **Run quality gates per phase, not per milestone** — `typecheck + lint + test + build` after every phase.
7. **Verify git diff before PR** — check for frozen file changes, leftover colors, missing states, source imports.
8. **If uncertain, preserve target and leave TODO** — `// TODO: review — source had [description] here`.
9. **Respect discovered conventions** — use Transplant Map's mappings, not hardcoded tables.
10. **One PR per scope** — for large migrations, one PR per major phase or page group.
11. **Runtime color accessors, not static arrays** — `getDefaultChartPalette()` reads CSS vars per call. Remove static re-exports that bypass theme.
12. **No DOM access in services** — `getComputedStyle()` belongs in components/hooks only. Add `typeof document` guards.

</rules>

## Sub-Agent Architecture

<instructions>

This skill uses sub-agents to parallelize work and catch issues early. All launched via the `Agent` tool.

| Agent | Type | When | Blocking? |
|-------|------|------|-----------|
| Target Discovery | Explore | Phase 1 (parallel) | Yes |
| Source Discovery | Explore | Phase 1 (parallel) | Yes |
| Design Analyst | Explore | Phase 3a (parallel) | No — continue to 3b |
| Backend Wiring | Explore | Phase 3b (parallel) | No — continue to 3a |
| Quality Gate | qa-tester | After each phase (background) | Only on FAIL |
| Color Audit | Explore | After Phases 2, 4, 5 (background) | No — tracked for Phase 6 |
| Component Porter | general-purpose | Phase 4, one per large file | Yes — wait for all |
| DB Security | Explore | Phase 7 | Yes |
| Verification | Explore | Phase 8 | Yes |

**Rules:**
- Never launch more agents than needed
- Background agents are fire-and-forget until notified
- Quality gate failures are BLOCKING — stop and fix
- Color audit violations are NON-BLOCKING — tracked, fixed in Phase 6
- Component porting agents get explicit file ownership — never two agents on same file
- Discovery agents always parallel — no reason to scan sequentially

</instructions>

## Scope Control

<rules>

The migration boundary is: **"Make the existing app look like the new design."**

| In Scope (UI Only) | Out of Scope (Defer) |
|---|---|
| CSS variable changes | New database views or tables |
| Font and typography updates | New API endpoints or functions |
| Component wrapping (additive) | Service layer query changes |
| New navigation structure | Backend import/export functionality |
| New routes with mock data | Connecting mock pages to real data |
| Color centralization | Filter components needing new query params |
| Theme default changes | Permission/role system changes |
| Data Wiring Manifest (docs) | Wiring mock data to real hooks/services |

**When in doubt:** If a change would touch any frozen file, it's out of scope.

</rules>

## References

- `references/subagent-prompts.md` — Detailed prompts for all 5 sub-agents
- `references/output-schema.md` — JSON schemas for agent outputs
- `references/common-mistakes.md` — 14 failure modes with detection and fixes
- `references/process-lessons.md` — 13 battle-tested lessons from real migrations
- `references/transplant-map-template.md` — Annotated Transplant Map example
- `assets/TRANSPLANT_REPORT_TEMPLATE.md` — Two-zone report template
