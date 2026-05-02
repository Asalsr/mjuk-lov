---
name: codebase-discovery
description: Use before creating any spec/PRD to deeply understand the existing codebase. Spawns parallel subagents that search for existing components, utilities, patterns, API endpoints, and state management relevant to the requested feature. Produces a structured Codebase Context Report that feeds into the PRD — preventing duplicate implementations, wrong assumptions, and missed reuse opportunities. Triggers automatically in /start Phase 2.5 (after Triage, before Architectural Review). Also use standalone via "discover codebase for [feature]", "what exists for [area]", "codebase context for [request]".
context: fork
compatibility: Designed for Claude Code
metadata:
  author: mjuk-lov
  version: "1.0"
---

# Codebase Discovery Skill

## Overview

Deep codebase analysis that runs **before** planning to ensure specs are grounded in reality. Spawns parallel subagents — each focused on a different discovery dimension — then merges results into a structured Codebase Context Report.

**Core principle:** Know what exists before you plan what to build.

**Inspired by:** The pr-review skill's parallel subagent pattern (Codebase Context Reviewer, Pattern Reviewer, etc.), adapted from post-hoc review to pre-planning discovery.

## When to Use

- Automatically in `/start` Phase 2.5 (after Triage routes to Bug/Chore/Feature, before Architectural Review)
- Standalone: invoke on any feature idea to understand what the codebase already provides
- Skip for Quick Fixes (they don't create specs)

## Why This Exists

Without structured codebase discovery, `/start` relies on:
- **Phase 0**: Duplicate-work-detector — only checks merged PRs, never actual code
- **Phase 0.5**: Explore — only asks the user questions, never searches the codebase
- **Phase 3**: Architectural Review — has a checklist but no enforced search process

This skill fills the gap between "check if someone already did this work" (Phase 0) and "plan how to build it" (Phase 3-4) with **actual codebase search**.

## Scope Classification

Before spawning subagents, classify the request to determine which subagents are relevant:

<data>
| Request Scope | Subagents Spawned |
|---------------|-------------------|
| Frontend-only | Component Inventory, Utility & Hook Scanner, Pattern Mapper |
| Database-only | API & Data Scanner, Pattern Mapper |
| Full-stack | All 4 subagents |
| Unclear | All 4 subagents (safe default) |

**Classification signals:**
- Mentions "page", "component", "UI", "form", "chart", "dashboard" → has-frontend
- Mentions "table", "migration", "RLS", "schema", "API", "endpoint", "query" → has-database
- Both → full-stack
- Neither → default to all 4
</data>

## Discovery Process

<workflow>

### Step 1: Extract Search Targets

From the user's request and triage classification, extract:

1. **Feature keywords** — nouns describing what's being built (e.g., "date picker", "export", "notification")
2. **Domain area** — which part of the app (e.g., "dashboard", "explore page", "settings")
3. **Technical concepts** — libraries, patterns, data types mentioned (e.g., "chart", "filter", "CSV")
4. **Affected entities** — data models involved (e.g., "startup", "user", "investment")

These become the search targets passed to each subagent.

### Step 2: Load Static Context

Read these files if they exist (skip gracefully if missing):

1. **CLAUDE.md** (repo root) — tech stack, conventions, key directories
2. **package.json** — installed dependencies (critical for "do we already have a library for X?")
3. **tsconfig.json / next.config.* / vite.config.*** — framework setup hints
4. **src/ directory listing** (1 level deep) — understand app structure

Summarize key facts: framework, UI library, state management, data fetching approach, key directories.

### Step 3: Spawn Parallel Subagents

Read `references/subagent-prompts.md` for the full prompt templates.

Spawn relevant subagents **IN PARALLEL** via Agent tool. Each receives:
1. Its domain-specific prompt from `references/subagent-prompts.md`
2. The extracted search targets from Step 1
3. The static context summary from Step 2

**Model selection for subagents:**

| Subagent | Model | Rationale |
|----------|-------|-----------|
| Component Inventory | sonnet | Glob/Grep pattern matching, fast scan |
| Utility & Hook Scanner | sonnet | Grep across utils/hooks, well-defined search |
| API & Data Scanner | sonnet | Grep for API routes, schema, data fetching |
| Pattern Mapper | sonnet | Read sibling files, compare structures |

### Step 4: Merge Results

After all subagents complete:

1. **Collect** all discoveries from each subagent
2. **Deduplicate** — if two subagents found the same file, merge entries
3. **Classify relevance** — HIGH (directly reusable), MEDIUM (similar/extendable), LOW (pattern reference only)
4. **Produce** the Codebase Context Report

</workflow>

## Output Format

<formatting>

The skill produces a structured report that is consumed by Phase 3 (Architectural Review) and Phase 4 (PRD Creation). It is NOT shown to the user as a standalone document — it feeds into the PRD's "Technical Considerations" and "Architectural Decisions" sections.

```markdown
## Codebase Context Report

**Generated for:** [feature/bug/chore description]
**Scope:** [frontend | database | full-stack]
**Subagents run:** [list]

### Existing Components (HIGH relevance)
[Components that can be directly reused or extended]
- `src/components/ui/DatePicker.tsx` — Used in 3 forms, supports range selection
- `src/components/charts/LineChart.tsx` — Charting wrapper, used on dashboard

### Existing Utilities & Hooks (HIGH relevance)
[Utilities and hooks that solve part of the problem]
- `src/hooks/useItems.ts` — Data hook fetching the item list with filters
- `src/lib/utils.ts:cn()` — Class name merger, used everywhere

### Existing API Endpoints / Data Patterns
[API routes, query patterns, data fetching approaches in use]
- `src/services/itemService.ts` — Data-layer queries for item CRUD
- Query key pattern: `queryKeys.items.list(filters)` factory (if a query library is in use)

### Existing Patterns to Follow
[How similar features are structured in the codebase]
- Pages follow: `app/(dashboard)/[area]/page.tsx` routing
- Data tables use the project's chosen table pattern with column definitions in `columns.tsx`
- Forms use the project's chosen validation library

### Installed Libraries (relevant to request)
[From package.json — what's already available]
- Charting library (if installed) — no need to add a second one
- Data-fetching library (if installed) — use it
- Date utility (if installed) — no need for moment/dayjs

### Gaps Identified
[What does NOT exist and would need to be built]
- No existing CSV export utility — would need to create
- No notification component — would need to build or install

### Recommendations
[Concrete suggestions for the PRD]
- REUSE: Use existing `DataTable` component at `src/components/ui/data-table.tsx`
- EXTEND: Add export method to existing `itemService.ts`
- FOLLOW: Match the filter pattern from `app/(dashboard)/explore/` page
- CREATE: New `useExport` hook (nothing similar exists)
```

</formatting>

## Integration with /start

<workflow>
```
/start
  ├─ Phase 0: Duplicate Work Check
  ├─ Phase 0.5: Explore (if confidence < 70%)
  ├─ Phase 1: Triage → classify as Quick Fix / Bug / Chore / Feature
  ├─ Phase 2: Route to workflow
  │
  ├─ Phase 2.5: CODEBASE DISCOVERY (this skill) ← NEW
  │     ├─ Extract search targets from request + triage
  │     ├─ Load static context (CLAUDE.md, package.json, directory structure)
  │     ├─ Spawn parallel subagents (Component, Utility, API, Pattern)
  │     ├─ Merge results into Codebase Context Report
  │     └─ Pass report to Phase 3 and Phase 4
  │
  ├─ Phase 3: Architectural Review (informed by discovery report)
  ├─ Phase 4: Create Spec/PRD (includes discovery findings)
  ├─ Phase 4.5: Plan Review
  └─ Phase 5: STOP for user review
```

**Skip condition:** Quick Fixes skip directly to implementation (no discovery needed).
</workflow>

## How Discovery Feeds Into Downstream Phases

<rules>

### Phase 3 (Architectural Review) uses discovery to:
- Skip "Have I searched for similar features?" — already answered
- Present concrete reuse options to the user (not hypothetical)
- Ground library analysis in actual `package.json` data

### Phase 4 (PRD Creation) uses discovery to:
- Populate "Technical Considerations" with real file paths
- List architectural decisions as "Reuse X" vs "Create Y" (evidence-based)
- Include "Existing Patterns to Follow" section

### Phase 4.5 (Plan Review) uses discovery to:
- Verify claims are already grounded (reducing MEDIUM findings)
- Focus review on gaps and edge cases instead of basic claim verification

</rules>

## Subagent Search Budgets

<rules>
Each subagent has a bounded search budget to keep discovery fast:

| Subagent | Max Glob | Max Grep | Max Read | Target Time |
|----------|----------|----------|----------|-------------|
| Component Inventory | 8 | 6 | 4 | ~15s |
| Utility & Hook Scanner | 4 | 10 | 4 | ~15s |
| API & Data Scanner | 4 | 8 | 6 | ~15s |
| Pattern Mapper | 4 | 4 | 8 | ~20s |

**Total budget across all subagents:** ~30 Glob, ~28 Grep, ~22 Read calls.
Running in parallel, wall-clock time should be ~20s.
</rules>

## Rules

<rules>

- **Never block** — if a subagent errors or times out, proceed with results from others
- **Never hallucinate paths** — every file path in the report must come from an actual Glob/Grep hit
- **Search budget is a ceiling, not a target** — stop early if enough context is found
- **HIGH relevance = directly reusable** — don't inflate relevance to look thorough
- **Gaps are valuable** — knowing what DOESN'T exist is as important as what does
- **Don't read entire files** — scan structure (first 30-50 lines) unless specifics are needed
- **Skip for Quick Fixes** — no discovery overhead for trivial changes
- **Respect repo size** — on very large repos, prefer Grep with specific patterns over broad Glob sweeps

</rules>

## Examples

<examples>

<example name="feature-with-existing-components">
<input>
Request: "Add a date range filter to the startup explore page"
Triage: Feature, frontend-only
</input>
<output>
Subagents discover:
- Component Inventory: Found `DatePicker` at `src/components/ui/date-picker.tsx`, `FilterPanel` at `src/app/(dashboard)/explore/components/FilterPanel.tsx`
- Utility & Hook Scanner: Found `useStartupFilters` hook, `useQueryParams` for URL state
- Pattern Mapper: Explore page uses FilterPanel → useFilters → query params → TanStack Query pattern

Report recommends: EXTEND existing FilterPanel + REUSE DatePicker + FOLLOW useQueryParams pattern
→ Phase 3 skips "search for existing" and goes straight to "extend vs create" decision
→ PRD says "Extend FilterPanel.tsx with DateRangePicker using existing date-picker component"
</output>
</example>

<example name="feature-with-no-existing-code">
<input>
Request: "Add real-time notifications"
Triage: Feature, full-stack
</input>
<output>
Subagents discover:
- Component Inventory: No notification/toast components found
- Utility & Hook Scanner: No WebSocket hooks, no notification-related hooks
- API & Data Scanner: No notification endpoints, no notification table in schema references
- Pattern Mapper: Other real-time features → none found

Report gaps: notification component, WebSocket/SSE setup, notification table, notification API
Report installed libs: `sonner` in package.json (toast library!)

→ Phase 3 knows this is greenfield but can use existing `sonner` for toasts
→ PRD scoped correctly as "large feature, needs new table + component + hook"
</output>
</example>

<example name="bug-with-codebase-context">
<input>
Request: "Login returns 401 for valid users"
Triage: Bug, full-stack
</input>
<output>
Subagents discover:
- API & Data Scanner: Found auth flow in `src/lib/auth.ts`, auth provider config in the project's config file, access-control rules on the `profiles` resource
- Utility & Hook Scanner: Found `useAuth` hook at `src/hooks/useAuth.ts`, `useSession` at `src/hooks/useSession.ts`
- Pattern Mapper: Auth middleware pattern in `src/middleware.ts`

→ Phase 3 (Bug investigation) knows exactly where to look
→ Investigation plan targets specific files instead of "explore auth system"
</output>
</example>

</examples>

## References

- `references/subagent-prompts.md` — Full prompt templates for each discovery subagent
