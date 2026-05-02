# Design Transplant Report Template

> Template for the orchestrator to follow when generating the final transplant report.
> Two-zone design: **Investigation** (internal analysis) and **PR-Ready** (for the PR body).

---

## Report Structure

```markdown
# Design Transplant: [Page Name / Full App]

**Skill:** Design Transplant v3.0
**Date:** [YYYY-MM-DD]
**Source:** [source repo name] → **Target:** [target repo name]
**Phases Run:** [0, 1, 2, 3, 4, 5, 6, 7, 8] or subset
**Scope:** [page route, component path, or "full-app migration"]

---

# Investigation

> Internal analysis — full discovery results, agent outputs, and verification details.

## Discovery Summary

**Baseline Counts:**

| Metric | Before | After | Delta |
|--------|--------|-------|-------|
| Routes | [N] | [N] | [+N] |
| Menu items | [N] | [N] | [+N] |
| Dashboard components | [N] | [N] | [+N] |
| Data hooks | [N] | [N] | [unchanged] |
| Service files | [N] | [N] | [unchanged] |
| Hex colors | [N] | [N] | [-N] |
| CSS variables | [N] | [N] | [+N] |

## Transplant Map Summary

**Source component:** `[source path]` ([N] sub-components)
**Target component:** `[target path]` ([N] sub-components)
**Design system:** [tailwind config found / not found], [N] semantic tokens, dark mode [yes/no]
**Chart colors:** [hook name or "none found"]
**Font change:** [old font] → [new font] (or "none")

### Diff Classification

| Classification | Count | Items |
|---|---|---|
| CSS-only | [N] | [list] |
| Additive wrapping | [N] | [list] |
| New component | [N] | [list] |
| Structural change | [N] | [list] |
| Deferred (out of scope) | [N] | [list] |

### Token Mapping ([N] conversions)

| Source | Target | Confidence |
|--------|--------|------------|
| [text-green-500] | [text-status-positive] | high |
| [#4A90D9] | [useChartColors().palette[0]] | medium |
| ... | ... | ... |

### Frozen Files ([N] patterns, [N] files)

[List frozen file categories discovered]

### Schema Access

**Primary schema:** [schema name or "none"]
**Hierarchy:** [discovered hierarchy]

## Structural Comparison

[Only include if Phase 3a ran. Remove section entirely if skipped.]

**Layout change:** [major/minor/none] — [source layout] → [target layout]
**New elements:** [N]
**Removed elements:** [N]
**Reorganized:** [N]
**Conflict warnings:** [N]
**Wrap vs Rebuild:** [N] components classified as wrap, [N] as rebuild (deferred)

[List any conflict warnings with details]

## Backend Wiring Inventory

[Only include if Phase 3b ran. Remove section entirely if skipped.]

| Category | Count | Status |
|----------|-------|--------|
| React Query hooks | [N] | [all preserved / N missing] |
| Service calls | [N] | [all preserved / N missing] |
| Auth usage | [N] | [all preserved / N missing] |
| i18n keys | [N] | [all preserved / N missing] |
| Loading states | [N] | [all preserved / N missing] |
| Error states | [N] | [all preserved / N missing] |
| Accessibility | [N] | [all preserved / N missing] |
| Toast notifications | [N] | [all preserved / N missing] |

## DB Security Status

[Only include if Phase 7 ran. Remove section entirely if skipped.]

**Status:** [clean / violations_found / not_applicable]
[If violations found, list each with file:line and severity]

## Verification Results

**Overall:** [PASS / FAIL / WARNING]

| Check | Status | Issues |
|-------|--------|--------|
| Frozen files | [pass/fail] | [N findings] |
| Color conversion | [pass/warning] | [N remaining] |
| Backend wiring | [pass/fail] | [N missing items] |
| Source imports | [pass/fail] | [N violations] |
| Navigation count | [pass/fail] | [old] → [new] |
| Common mistakes | [pass/warning] | [N issues] |
| Static color arrays | [pass/warning] | [N found] |
| DOM in services | [pass/fail] | [N violations] |
| Typecheck | [pass/fail] | |
| Lint | [pass/fail] | |
| Tests | [pass/fail] | |
| Build | [pass/fail] | |

### Issues Found

[List each verification finding with file:line, severity, and fix]

### Manual Review Items

[List items from Transplant Map's manual_review that need human judgment]

---
---

# PR-Ready

> Copy-paste the section below as the PR description.

## Summary

- Transplanted visual design from [source repo] for [scope description]
- Preserved all data hooks, services, loading/error states, and i18n
- Converted [N] hardcoded colors to semantic tokens
- [N] new sub-components created
- [N] new routes added (with mock data)

## Changes

- `[path/to/Component.tsx]` — new layout from [source]
- `[path/to/Page.tsx]` — [updated/unchanged]
- [any new sub-components created]
- [any new dependencies added]
- [CSS variable changes: N added, N modified]
- [Font: old → new]

## Parity Contract

- [ ] No frozen files modified
- [ ] All backend wiring preserved ([N] hooks, [N] services, [N] loading states)
- [ ] All colors converted to semantic tokens (no hardcoded hex/palette)
- [ ] No source repo imports
- [ ] Charts use `useChartColors()` hook, not hex values
- [ ] No static color arrays — runtime accessors only
- [ ] No DOM access in service layer
- [ ] Navigation items preserved (count: [old] → [new])
- [ ] Dark mode works (semantic tokens, no light-mode-only classes)
- [ ] Quality gates pass

## Data Wiring Manifest

[For each page using mock data:]

| Page | Mock Data Shape | Likely Hook/Service | Priority |
|------|----------------|-------------------|----------|
| [PageName.tsx] | `{ field1, field2 }[]` | `usePageData` (if exists) or "needs new hook" | High/Medium/Low |
| ... | ... | ... | ... |

[If no mock data pages: "All pages connected to real data. No mock data used."]

## Deferred Items

[List out-of-scope items with reasons]

## Remaining TODOs

[List any TODO comments added during transplant]
[If none: "No outstanding TODOs."]

## Test Plan

- [ ] `[typecheck command]` passes
- [ ] `[lint command]` passes
- [ ] `[test command]` passes
- [ ] `[build command]` passes
- [ ] Visual check in light mode
- [ ] Visual check in dark mode
- [ ] Loading states render correctly
- [ ] Error states render correctly
- [ ] All routes accessible (navigate by URL)
- [ ] Navigation complete (menu items >= baseline)
- [ ] Auth flow works (login → protected page → logout)
```

---

## Usage Notes

### Two-Zone Design

| Zone | Purpose | Audience |
|------|---------|----------|
| **Investigation** | Full discovery, agent outputs, verification details | Developer running the transplant |
| **PR-Ready** | Compact PR description with parity contract + data wiring manifest | PR reviewers |

### Conditional Sections

Remove sections for phases that didn't run:
- Phase 3a skipped → remove "Structural Comparison"
- Phase 3b skipped → remove "Backend Wiring Inventory"
- Phase 7 skipped → remove "DB Security Status"

### Verification Status

- **PASS**: All checks pass, quality commands succeed — PR is ready
- **WARNING**: No blockers but warnings exist — note in PR description
- **FAIL**: Blockers found — must fix before creating PR
