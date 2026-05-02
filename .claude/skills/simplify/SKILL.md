---
name: simplify
description: Use after implementation to review changed code for reuse, quality, and efficiency — then fix any issues found. Triggered after writing code, before committing, or on-demand with "simplify this". Unlike code-refactoring-analyzer (suggests only), simplify actively reads the diff and edits the files.
compatibility: Designed for Claude Code
metadata:
  author: mjuk-lov
  version: "1.0"
---

# Simplify

## Purpose

After writing or modifying code, review the diff for opportunities to make it simpler, more reusable, and more efficient — then apply the fixes directly.

**This skill reads, judges, and edits. It does not just report.**

---

## Scope

<rules>

- **Only touch changed code** — run `git diff HEAD` or `git diff --cached` to identify the scope
- Do not refactor surrounding code that was not part of the change
- Do not expand scope to adjacent files unless a fix directly requires it
- Three similar lines of unchanged code ≠ a reason to abstract

</rules>

---

## Workflow

<workflow>

### Step 1 — Identify Changed Code
```
git diff HEAD          # uncommitted changes
git diff --cached      # staged changes
git diff HEAD~1 HEAD   # last commit
```
Read only the changed lines. Note file paths and line numbers.

### Step 2 — Apply the Simplicity Lens
For each changed section, ask:

1. **Reuse** — Is this duplicating something that already exists in the codebase? Check for existing utilities, hooks, helpers before adding new ones.
2. **Quality** — Does this follow the project's code standards? (see checklist below)
3. **Efficiency** — Are there unnecessary operations, redundant state, or avoidable re-renders?

### Step 3 — Fix, Don't Just Flag
- Edit the files directly using Edit tool
- Apply only changes justified by the three lenses above
- Do not add new features or change behavior
- Run linter/formatter after edits if available (`npm run lint -- --fix`)

### Step 4 — Report
Briefly list what was changed and why. One line per fix.

</workflow>

---

## What to Fix

<rules>

### Reuse
- Remove duplication that copies existing codebase utilities
- Replace inline logic with project-standard helpers (e.g., use existing `formatDate`, `cn()`, query key factories)
- Consolidate repeated patterns into existing shared modules — but only if those modules already exist

### Quality
- Remove defensive coding on non-optional types (`thing?.value` when type says `value` is required)
- Remove backwards-compat shims (`// kept for backwards compatibility`, unused re-exports, `_unused` params)
- Remove placeholder comments, TODOs, and historical notes
- Remove silent fallbacks that hide real bugs (`?? 'Unknown'` on required fields)
- Fix `useEffect` misuse — prefer `useMemo`, derived state, or `key=` reset

### Efficiency
- Eliminate redundant state (state that can be derived from existing state/props)
- Remove unnecessary re-renders (missing `useMemo`/`useCallback` on expensive operations — but only when the compute is actually expensive)
- Remove dead code paths introduced in the change
- Simplify over-structured data shapes (unnecessary nesting, wrapper objects with one field)

</rules>

---

## What NOT to Fix

<rules>

- Do not reformat code — run `npm run lint -- --fix` or `bun run lint -- --fix` instead
- Do not refactor code outside the diff
- Do not add new abstractions for one-time-use patterns
- Do not add error handling that the types already prevent
- Do not add type annotations to code you didn't change
- Do not "clean up" surrounding code while you're in the file

</rules>

---

## Checklist

<checklist>

Before marking simplify complete:

- [ ] Diff identified — only touching changed lines
- [ ] No defensive coding on required types
- [ ] No duplicate logic (checked codebase for existing utilities)
- [ ] No backwards-compat hacks
- [ ] No unnecessary state (derived state preferred)
- [ ] No `useEffect` misuse
- [ ] No TODOs, placeholders, or historical comments
- [ ] Linter run after edits (if available)
- [ ] Changes do not alter behavior — only structure

</checklist>

---

<examples>

<example name="redundant-state-simplified">
<input>
Changed code adds a `isLoading` state that mirrors TanStack Query's built-in loading state:
```typescript
const [isLoading, setIsLoading] = useState(false);
const { data } = useQuery({
  queryKey: startupKeys.list(filters),
  queryFn: fetchStartups,
});
// isLoading set manually in useEffect
```
</input>
<output>
Remove `isLoading` state — use `isPending` from `useQuery` directly.
```typescript
const { data, isPending } = useQuery({
  queryKey: startupKeys.list(filters),
  queryFn: fetchStartups,
});
```
</output>
</example>

<example name="defensive-coding-removed">
<input>
Changed code accesses a required field defensively:
```typescript
const name = startup?.name ?? 'Unknown startup';
```
Where `startup: Startup` (not optional).
</input>
<output>
Remove defensive chain — type guarantees the field exists:
```typescript
const name = startup.name;
```
</output>
</example>

<example name="existing-utility-reused">
<input>
Changed code adds inline class merging:
```typescript
className={`flex items-center ${isActive ? 'text-blue-500' : 'text-gray-400'} ${disabled ? 'opacity-50' : ''}`}
```
When the project already has `cn()` from `@/lib/utils`.
</input>
<output>
Replace with existing `cn()` utility:
```typescript
className={cn('flex items-center', isActive ? 'text-blue-500' : 'text-gray-400', disabled && 'opacity-50')}
```
</output>
</example>

<example name="scope-respected">
<input>
Changed file has 3 similar helper functions outside the diff scope.
</input>
<output>
No action. Unchanged code is out of scope for simplify. If the team wants to refactor those helpers, that should be a separate task.
</output>
</example>

</examples>
