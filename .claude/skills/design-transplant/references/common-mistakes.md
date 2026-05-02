<!-- Scout Header
Purpose: 14 universal failure modes when migrating visual design from prototype to production
When to use: During design transplant planning or verification phases
Size: ~213 lines
-->

# Common Mistakes in Design Transplants

> Generalized patterns that apply to ANY source-to-target repo transplant.
> These are not hardcoded to any specific project — they describe universal failure modes
> when merging visual design from a prototype into a production codebase.
>
> The Verification Agent checks the diff against this list.
> The orchestrator reads this before executing component porting.

---

## Failure Modes Table

These 14 failure modes were observed in real migrations. Each maps to the phase that prevents it.

| # | Failure Mode | Prevention |
|---|---|---|
| 1 | Old menu items removed — sidebar replaced instead of extended | Phase 5: "Add new items, never replace. Count before and after." |
| 2 | Forgot to pull latest — CSS changes didn't take effect | Prerequisites: "Verify target builds with latest code before changes" |
| 3 | Empty pages rendered — components not wired to routes | Phase 5: "After adding routes, navigate to each page and verify" |
| 4 | Ported component overlapped header — wrong layout positioning | Phase 4: "Test visual positioning in production layout constraints" |
| 5 | Hardcoded hex colors left in CSS — incomplete sweep | Phase 6: "Scan after EVERY phase, not just at the end" |
| 6 | Mock data shipped without documentation | Phase 4: "Mark with debug-border + Data Wiring Manifest" |
| 7 | Duplicate menu items — add + replace both happened | Phase 5: "Count menu items. Compare old vs new count." |
| 8 | Almost pushed to main — destructive git near-miss | Rules: "Never push to main. Always feature branch." |
| 9 | PR with only spec files — code not staged | Phase 8: "Verify git diff includes ALL intended changes" |
| 10 | 96 ESLint errors in final commit — lint skipped | Per-phase quality gates: lint is mandatory |
| 11 | "Rebuild" framing went unchallenged — 9 pages were actually 15-min wraps | Phase 1: "Mandatory side-by-side comparison before classification" |
| 12 | Old pages left unwrapped — "CSS only" scope when wrapping was trivial | Phase 1: "Classify additive wrapping as LOW risk, separate from rebuild" |
| 13 | DOM access in service layer — `getComputedStyle()` in service broke SSR/tests | Phase 2: "Color resolvers in components/hooks ONLY, never services" |
| 14 | Static color arrays bypassed theme — never responded to dark mode toggle | Phase 2: "Runtime accessor functions, not static arrays" |

---

## Detailed Patterns

### 1. Removing Loading States

**Pattern:** Source prototypes rarely implement loading states. During transplant, the target's loading branches (`if (isLoading)`, Skeleton components, spinner states) get deleted along with the old JSX structure.

**What happened:** Source prototype showed the happy-path only. Target's `<CapitalFlowsSkeleton />` was removed during JSX replacement.

**Detection:** Backend Wiring Inventory includes all loading states. If any item's code is absent from the post-transplant diff, this is triggered.

**Fix:** After replacing JSX layout, re-attach every loading state branch from the inventory. Loading states wrap the visual content — they are independent of the layout structure.

---

### 2. Dropping Error Handling

**Pattern:** Source prototypes show happy-path only. The target's `if (error)` branches, empty state components (ChartEmptyState, EmptyState), and error boundaries disappear.

**Detection:** Backend Wiring Inventory includes all error states. Absence from diff = violation.

**Fix:** Preserve all error/empty state rendering branches from the target. These are typically at the top of the render function, before the main JSX return.

---

### 3. Losing i18n Translations

**Pattern:** Source prototypes use hardcoded strings ("Capital Flows", "Loading..."). The target's `t('key')` translation calls get overwritten with static text.

**Detection:** Backend Wiring Inventory lists all i18n keys. Post-transplant, search for hardcoded strings where `t()` calls should be.

**Fix:** Keep all `t()` calls from the target. If source introduces new UI text, add new translation keys rather than hardcoding strings.

---

### 4. Schema Violation (Auto-Detected)

**Pattern:** Source prototype accesses data differently than the target's established patterns — querying the wrong schema, bypassing the service layer, or using direct table access.

**What happened:** Dashboard app queried `web` schema because the source prototype did. Dashboard uses `dashboard` schema exclusively.

**Detection:** Discovery Agent builds schema access rules from the target's existing service files. DB Security Agent checks source code against these discovered rules.

**Fix:** Replace any data access in the transplanted code with the target's established patterns.

---

### 5. Hardcoded Colors Slipping Through

**Pattern:** Source uses Tailwind palette colors (`text-green-500`, `bg-blue-100`) or hex values (`#4A90D9`) that aren't converted to the target's semantic tokens.

**Detection:** Post-transplant regex scan for:
- Hex: `#[0-9a-fA-F]{3,8}`
- Tailwind palette: `(text|bg|border|fill|stroke)-(red|green|blue|yellow|purple|orange|pink|cyan|amber|emerald|teal|indigo|violet|fuchsia|rose|lime|sky)-\d+`
- Inline styles: `color:`, `backgroundColor:`, `borderColor:` with literal values

**Exceptions:** Database-driven colors, SVG gradient definitions, debug-border components.

**Fix:** Apply Transplant Map's token mapping to every remaining color.

---

### 6. Mock Data on Production Pages

**Pattern:** Source prototype uses hardcoded mock data. This gets copied into the production component, replacing or coexisting with real data hooks.

**What happened:** Pages ported with mock data but nobody documented which pages needed real data wiring. Users found fake data.

**Detection:** Search for array/object literals with sample names, unused data hooks shadowed by mock, `useState` with data arrays.

**Fix:** For NEW pages: keep mock data, mark with `// MOCK DATA` comment AND `border-2 border-debug-border`, document in Data Wiring Manifest. For EXISTING pages: use the target's data hooks, never shadow them with mock data.

---

### 7. Modifying Frozen Files

**Pattern:** Transplant seems to require changes to auth providers, services, data hooks, or infrastructure files.

**Detection:** Compare git diff against Transplant Map's frozen file list.

**Fix:** If a transplant requires frozen file changes, the approach is wrong. Either adapt the design to work with existing infrastructure, create a separate PR for the backend change first, or mark for future connection.

---

### 8. Importing from Source Repo

**Pattern:** Copy-paste from source includes imports referencing source repo paths.

**What happened:** Components imported directly from the prototype repo path.

**Detection:** Scan import statements for source repo name, `../` paths exiting target, packages in source but not target's `package.json`.

**Fix:** Recreate or adapt the imported code within the target repo. Every import must resolve within the target.

---

### 9. Bypassing Data Access Hierarchy

**Pattern:** Source prototype accesses data directly instead of following the target's established hierarchy (Component → Hook → Service → Schema View).

**What happened:** `<data-client>.from('core.organisations')` used directly, bypassing the target's access-control layer.

**Detection:** Search transplanted code for direct data-client usage that bypasses the discovered pattern.

**Fix:** Route all data access through the target's established hierarchy.

---

### 10. Bypassing Authorization

**Pattern:** Source introduces `.rpc()` calls, direct auth-table queries, or data access that circumvents the target's authorization model.

**Detection:** Security review checks for new RPC calls, raw auth-table access, and patterns that skip the target's scoping functions.

**Fix:** All data access must go through the target's existing authorization chain. New server-side logic is a separate task for the data layer.

---

### 11. Breaking Dark Mode

**Pattern:** Source uses light-mode-only classes (`bg-white`, `text-black`, `text-gray-900`) that don't adapt to dark mode.

**Detection:** Search for:
- `bg-white` (should be `bg-background` or `bg-card`)
- `text-black`, `text-gray-900` (should be `text-foreground`)
- `border-gray-*` (should be `border-border` or `border-muted`)
- Missing `dark:` prefix on color-bearing classes

**Fix:** Replace light-mode-only classes with target's semantic tokens from the token mapping.

---

### 12. Losing Accessibility Attributes

**Pattern:** Source prototype lacks `aria-*` attributes, `role` props, `sr-only` labels, keyboard handlers that the target has.

**Detection:** Backend Wiring Inventory lists all accessibility attributes. Post-transplant, verify each is present.

**Fix:** Re-attach all accessibility attributes from the target's original code.

---

### 13. DOM Access in Service Layer

**Pattern:** `getComputedStyle()` or other DOM APIs placed in service files to resolve chart colors at the data layer. Breaks SSR and test environments (`document is not defined`).

**What happened:** `getComputedStyle()` was placed in `capitalFlowService` to resolve chart colors. Broke all tests.

**Detection:** `grep 'getComputedStyle' src/services/**`

**Fix:** Color resolution belongs in components or hooks ONLY. Services must remain environment-agnostic. Add `typeof document !== 'undefined'` guards to any color resolver utility.

---

### 14. Static Color Arrays Bypassing Theme

**Pattern:** `DEFAULT_CHART_COLORS` was a static array imported at module load time. Charts never responded to dark/light mode toggle because the array was evaluated once.

**What happened:** Static re-export let consumers bypass the theme-aware function.

**Detection:** `grep 'const.*COLORS.*=.*\[' src/` or `grep 'const.*PALETTE.*=.*\[' src/`

**Fix:** Use runtime accessor functions (e.g., `getDefaultChartPalette()`) that read CSS variables on each call. Remove static re-exports that let consumers accidentally bypass the theme-aware function.

---

## Anti-Patterns Quick Reference

| Anti-Pattern | Correct Approach |
|---|---|
| "Replace the sidebar" | EXTEND: keep every existing item, add new ones alongside |
| "Let me wire the real data while I'm here" | Always mock data during migration. Document in Data Wiring Manifest. |
| "This needs a rebuild" | Open both files side by side. If data hooks are same → it's a WRAP |
| "I'll fix lint later" | Run lint after EVERY phase, not just at the end |
| "Let me push this" | NEVER push to main. Always feature branches. |
| "The PR is ready" | Run `git diff --stat` before PR. Verify all files staged. |
| "I'll scan for hex at the end" | Scan after each phase where components change |
| "Put color logic in the service" | Components/hooks ONLY. Services return data. |
| "Just export a static color array" | Runtime accessor functions. Remove static re-exports. |
| "The ported component works" | Test positioning in production layout — prototypes have different constraints |
