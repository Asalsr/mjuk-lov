---
name: conflict-resolver
description: Use when git merge conflicts are detected during rebase, merge, or pull. Classifies conflicts as trivial (lockfiles, import ordering, auto-generated files), structural (whitespace, same block changed differently, tsconfig.json), or logic (business rule changes). Auto-resolves only trivial conflicts without user input. Guides structural/logic conflicts with context-aware suggestions. Validates resolutions by running quality gate. Invoke when conflict markers are detected or via /git commit and /git push flows.
compatibility: Designed for Claude Code
metadata:
  author: mjuk-lov
  version: "1.0"
---

# Conflict Resolver Skill

## Overview

Intelligent conflict resolution that classifies conflicts by complexity and handles them appropriately — auto-resolving safe ones, guiding complex ones, and always validating the result.

**Announce at start:** "Using conflict-resolver skill to handle these conflicts."

**Core principle:** Auto-resolve what is safe. Involve the user only where their judgment matters.

---

## Conflict Classes

<data>

| Class | Characteristics | Resolution |
|-------|----------------|------------|
| **Trivial** | Lockfiles, import ordering (no side-effects), auto-generated files | Auto-resolve — no user input |
| **Structural** | Same function/block changed differently on each side | Suggest merged version — user confirms |
| **Logic** | Business rules, API contracts, algorithm changes | Show both sides — user decides |

</data>

---

## Workflow

<workflow>

### Step 1: Identify All Conflicted Files

```bash
git status
git diff --name-only --diff-filter=U
```

List all conflicted files before doing anything else.

### Step 2: Classify Each Conflict

For each conflicted file, read the file content and examine the conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`).

**Classify as TRIVIAL if any of the following:**
- The file is a lockfile: `package-lock.json`, `bun.lockb`, `yarn.lock`, `pnpm-lock.yaml`
- The difference is **only import statement ordering** (same imports, different order) **AND** the file contains no bare side-effecting imports (no `import './styles.css'`, `import 'polyfill'`, or other imports with no bindings)
- The file is auto-generated: generated type files (e.g. `*.generated.ts`), `.prettierrc` formatting changes

**Classify as STRUCTURAL if any of the following:**
- The difference is **whitespace-only** — whitespace changes may represent intentional formatter enforcement from the remote; user confirms which to keep
- The file is `tsconfig.json` — hand-maintained configuration, not auto-generated; path and compiler option changes require user confirmation
- The file contains bare side-effecting imports (`import './styles.css'`, `import 'polyfill'`) and has an import ordering conflict
- The same function, class, or JSX block was modified on both sides with different but non-semantic changes
- A variable was renamed on one side and logic was added on the other
- A component was extracted on one side while the original was modified on the other

**Classify as LOGIC if:**
- Business rules or conditions differ between the two sides
- API request/response shapes conflict
- Algorithm or calculation differs
- Security-sensitive code (auth, permissions, validation) is involved

### Step 3: Present Classification Summary

Before resolving anything, show the user what was found:

```
Conflict Analysis
═══════════════════════════════════════
Conflicted files: X

  TRIVIAL (will auto-resolve):
  ✓ package-lock.json       [lockfile → accept theirs]
  ✓ src/components/index.ts [import ordering]

  STRUCTURAL (needs confirmation):
  ⚠ src/styles/globals.css  [whitespace — may be formatter enforcement]
  ⚠ src/components/FilterBar.tsx

  LOGIC (needs your decision):
  ⚡ src/lib/auth/session.ts
═══════════════════════════════════════
Proceeding with auto-resolution of trivial conflicts...
```

### Step 4: Auto-Resolve Trivial Conflicts

For each TRIVIAL file, apply the appropriate strategy:

**Lockfiles** (`package-lock.json`, `bun.lockb`, `yarn.lock`, `pnpm-lock.yaml`):
```bash
git checkout --theirs <file>
git add <file>
```
Rationale: Lockfiles are generated from package manifests. "Theirs" (from remote) is always correct — the developer regenerates locally by running `npm install` (or `bun install`, `yarn install`) after the rebase completes. Note this in the resolution summary so the user remembers to regenerate.

**Import ordering conflicts (no side-effecting imports):**
Read the file, merge both import lists while preserving existing grouping structure (external packages → internal `@/` aliases → relative imports, separated by blank lines). Sort alphabetically within each group (named/type imports only). Write back the resolved content, then:
```bash
git add <file>
```
Note: Files with bare side-effecting imports (`import './x'`, `import 'polyfill'`) are classified as STRUCTURAL (Step 2) — they never reach this step.

**Auto-generated files** (e.g. `*.generated.ts`):
```bash
git checkout --theirs <file>
git add <file>
```

After each auto-resolution, note what was done (logged in summary, not prompted).

### Step 5: Guided Resolution — Structural Conflicts

For whitespace-only structural conflicts, add a note explaining why the user is being asked:
```
─── STRUCTURAL CONFLICT: src/styles/globals.css ───
(Whitespace-only difference — may be intentional formatter enforcement from remote)

OUR VERSION: [whitespace style A]
THEIR VERSION: [whitespace style B]

Keep ours [O] or accept theirs [T]?
```

For all other STRUCTURAL files:

1. Show the conflict with ±5 lines of context:
```
─── STRUCTURAL CONFLICT: src/components/FilterBar.tsx ───

Context (5 lines before):
  const FilterBar = ({ filters, onChange }) => {
    const [open, setOpen] = useState(false);

OUR VERSION (HEAD):
  const handleReset = () => {
    onChange({});
    setOpen(false);
    analytics.track('filter_reset');  ← added analytics
  };

THEIR VERSION (remote):
  const handleReset = useCallback(() => {
    onChange({});
    setOpen(false);
  }, [onChange]);  ← wrapped in useCallback

Context (5 lines after):
  return (
    <div className="filter-bar">
```

2. Suggest a merged version:
```
SUGGESTED MERGE:
  const handleReset = useCallback(() => {
    onChange({});
    setOpen(false);
    analytics.track('filter_reset');
  }, [onChange]);

Apply this merge? [Y] Yes  [E] Edit first  [O] Keep ours  [T] Keep theirs
```

3. Apply the chosen resolution and `git add <file>`.

### Step 6: Guided Resolution — Logic Conflicts

For each LOGIC file:

1. Show both versions clearly labeled:
```
─── LOGIC CONFLICT: src/lib/auth/session.ts ───

⚡ This conflict involves business logic — your judgment is required.

OUR VERSION (HEAD):
  if (user.role === 'admin' || user.permissions.includes('read')) {
    return { authorized: true };
  }

THEIR VERSION (remote):
  if (user.role === 'admin' && !user.suspended) {
    return { authorized: true };
  }

These changes represent different authorization rules.

Options:
[O] Keep ours   — our rule (role admin OR has read permission)
[T] Keep theirs — their rule (role admin AND not suspended)
[M] Merge both  — combine both conditions (you'll edit the result)
[A] Abort       — stop resolution, return to clean state
```

2. Apply user's choice and `git add <file>`.

### Step 7: Continue Rebase or Merge

After all files are resolved:

```bash
git rebase --continue
# OR if merging:
git merge --continue
```

If `--continue` raises additional conflicts (multi-step rebase), repeat from Step 1 for the new set.

### Step 8: Run Quality Gate

After the rebase/merge completes successfully:

```bash
npm run typecheck 2>&1 || true
npm run lint 2>&1 || true
```

Present results using the warn-but-allow pattern (consistent with `/execute` quality gate phase). Do not block on warnings — report and let user decide.

### Step 9: Resolution Summary

```
Conflict Resolution Complete
════════════════════════════════════════════
Auto-resolved (trivial):
  ✅ package-lock.json         [lockfile → theirs]
  ✅ src/components/index.ts   [import sort]

Manually resolved:
  ✅ src/styles/globals.css        [structural whitespace → kept theirs]
  ✅ src/components/FilterBar.tsx  [structural → suggested merge accepted]
  ✅ src/lib/auth/session.ts       [logic → kept ours]

Quality Gate:
  TypeScript: ✅ PASS
  Lint:       ✅ PASS

Rebase complete. All conflicts resolved.
════════════════════════════════════════════
```

</workflow>

---

## Abort Handling

If the user chooses to abort at any point:

```bash
git rebase --abort
# OR
git merge --abort
```

Report: "Resolution aborted. Repository returned to state before rebase/merge began."

---

## Edge Cases

<rules>

**File deleted on one side, modified on the other:**
Git marks these as conflicted but produces no conflict markers. The file will appear in `git status` as `deleted by them` or `deleted by us`.
- Show the user: "Remote deleted this file; our branch modified it. Keep file [K] or accept deletion [D]?"
- If keep: `git add <file>`
- If delete: `git rm <file>`
Do NOT use `git checkout --ours/--theirs` on these — it will not resolve the conflict correctly.

**Binary file conflicts:**
- Always treat as STRUCTURAL (cannot diff meaningfully)
- Show file name and sizes of each version
- Ask: keep ours / keep theirs / abort

**Multiple conflict markers in one file:**
- Classify the file by its *highest* class (if any hunk is LOGIC, the whole file is LOGIC)
- Walk through each hunk sequentially within the guided resolution

**Rebase with many steps (multi-commit rebase):**
- After each `git rebase --continue`, check for new conflicts
- Repeat classification + resolution cycle until rebase completes

**If `git rebase --continue` fails after resolution:**
- Read the error output carefully
- Check if any files were staged incorrectly
- Report error with context; do not auto-retry

</rules>

---

## Safety Rules

<rules>

**Never:**
- Auto-resolve STRUCTURAL or LOGIC conflicts without user confirmation
- Use `git checkout --ours` or `git checkout --theirs` on a file with logic conflicts without asking
- Run `git rebase --skip` (skips commits silently — use abort instead)
- Force-push as a resolution strategy

**Always:**
- Show the full classification summary before starting resolution
- Run quality gate after resolution completes
- Preserve the user's ability to abort at any step

</rules>

---

## Examples

<examples>

<example name="lockfile-only">
<input>
Conflicts detected in 1 file: package-lock.json
</input>
<output>
Conflict Analysis
═══════════════════════════════
  TRIVIAL (auto-resolve):
  ✓ package-lock.json  [lockfile → accept theirs]

Auto-resolving package-lock.json... done.

Running quality gate...
TypeScript: ✅ PASS | Lint: ✅ PASS

Conflict Resolution Complete — 1 trivial conflict auto-resolved.
</output>
</example>

<example name="mixed-conflicts">
<input>
Conflicts in 3 files: yarn.lock, src/components/Table.tsx, src/api/routes.ts
</input>
<output>
Conflict Analysis
═════════════════════════════════════════
  TRIVIAL:   yarn.lock           [lockfile]
  STRUCTURAL: src/components/Table.tsx
  LOGIC:      src/api/routes.ts
═════════════════════════════════════════

Auto-resolving yarn.lock (lockfile → theirs)... done.

─── STRUCTURAL CONFLICT: src/components/Table.tsx ───
[shows conflict + suggested merge]
Apply this merge? [Y] Yes  [E] Edit  [O] Ours  [T] Theirs

─── LOGIC CONFLICT: src/api/routes.ts ───
[shows both versions, asks user to decide]
</output>
</example>

</examples>
