---
name: receiving-code-review
description: Use when receiving code review feedback on a PR — before implementing any suggestion, verify every claim against the real codebase and real database state. Prevents blind implementation, performative agreement, and migration-file-as-truth mistakes. Triggers on "review feedback", "address review comments", "fix review items", or when PR review comments need to be handled.
compatibility: Designed for Claude Code
metadata:
  author: mjuk-lov
  version: "2.0"
---

# Receiving Code Review

## Overview

Code review feedback requires technical verification, not performative agreement or blind implementation.

**Core principle:** Every reviewer claim is a hypothesis until verified against the actual codebase and — for database work — the actual running database.

<rules>
## Critical Rules

1. **Verify before implementing** — every suggestion, no matter who made it, gets checked against the real codebase first
2. **Migration files are NOT the database** — never confirm or deny database state by reading migration files. Query the actual database.
3. **No performative agreement** — no "Great catch!", "You're absolutely right!", "Thanks for the feedback!". State what you found and act.
4. **Push back with evidence** — if a suggestion is wrong for this codebase, say so with file paths and line numbers
5. **Clarify before partial implementation** — if any item is unclear, stop and ask about ALL unclear items before implementing any
6. **One item at a time** — implement, test, verify. Then next item.
7. **Human reviewer authority** — if the reviewer is the repo owner or tech lead, their architectural decisions take precedence. Still verify technical claims.
</rules>

---

<workflow>
## The Response Pattern

### Step 1: Read and Classify

Read all feedback items. Classify each:

| Classification | Meaning | Action |
|---------------|---------|--------|
| **Clear + verifiable** | Specific file/line, concrete change | Verify, then implement |
| **Clear + architectural** | Design decision, approach change | Verify impact, discuss if large |
| **Unclear** | Vague, ambiguous, or missing context | Ask before doing anything |
| **Contradicts owner decisions** | Conflicts with CLAUDE.md or prior decisions | Flag to repo owner first |

If ANY items are unclear, ask about all unclear items before implementing any items — they may be related.

### Step 2: Verify Against the Real Codebase

<rules>
**CRITICAL: Every factual claim in review feedback must be verified.**

For each feedback item, before implementing:

1. **"This function/component already exists"** → `Grep` for the name. Does it? Where? Is it the same signature?
2. **"This pattern is used elsewhere"** → `Grep` for the pattern. How many occurrences? Is the suggested pattern actually the convention?
3. **"This is unused / dead code"** → `Grep` for imports and references. Is it actually unused, or used in a way the reviewer missed?
4. **"This breaks X"** → `Read` the referenced file. Does the change actually break it, or is the reviewer working from stale mental model?
5. **"This should use utility Y"** → `Read` the utility. Does it actually do what the reviewer thinks? Same signature? Same behavior?
6. **"Remove this, it's not needed"** → `Grep` for all consumers. Safe to remove?

Do NOT skip verification because the reviewer sounds confident. Confident reviewers with stale context are the #1 source of incorrect suggestions.
</rules>

### Step 3: Verify Database State Against the Actual Server

<rules>
**CRITICAL: For migration file PRs, NEVER verify database state by reading migration files.**

Migration files can be:
- Repaired after being applied (file content ≠ what ran)
- Renamed or squashed post-application
- Applied out of order in different environments
- Present locally but never applied to the target environment

When review feedback claims something about current database state ("this column already exists", "this policy is already in place", "this table has RLS enabled"):

1. **Determine the target environment:**
   - PR merges to `main` → verify against **production** database
   - PR merges to `dev`/`staging`/feature branch → verify against **development** database

2. **Run the actual query:**
   ```sql
   -- Column exists?
   SELECT column_name FROM information_schema.columns
   WHERE table_schema = '{schema}' AND table_name = '{table}' AND column_name = '{column}';

   -- Table has RLS?
   SELECT relrowsecurity FROM pg_class
   WHERE relname = '{table}' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = '{schema}');

   -- Policy exists?
   SELECT policyname FROM pg_policies
   WHERE tablename = '{table}' AND schemaname = '{schema}';

   -- Function exists?
   SELECT routine_name FROM information_schema.routines
   WHERE routine_schema = '{schema}' AND routine_name = '{function}';

   -- Index exists?
   SELECT indexname FROM pg_indexes
   WHERE schemaname = '{schema}' AND tablename = '{table}';
   ```

3. **If you don't have database access:** State this explicitly:
   "Cannot verify — need to query the {environment} database. Run: `{query}`"
   Do NOT guess based on migration files.

4. **Report what you found:** Include the query and its result in your response, not just the conclusion.
</rules>

### Step 4: Evaluate and Respond

For each verified item:

**If the suggestion is correct:**
```
Fixed. [Brief description of what changed in which file]
```
or
```
Good catch — [specific issue]. Fixed in [file:line].
```
Do NOT add "Thanks!", "Great point!", or any gratitude. The fix speaks for itself.

**If the suggestion is wrong for this codebase:**
```
Checked — [what the reviewer claimed] is not the case here.
[Evidence: file path, grep result, query result].
[Current state and why it's correct / what the actual fix should be].
```

**If the suggestion conflicts with repo conventions:**
```
This conflicts with the repo convention in CLAUDE.md / established pattern.
[Evidence: the convention and where it's documented].
[Suggest: follow convention, or discuss changing it?]
```

**If you can't verify:**
```
Can't verify this without [what's needed — DB access, specific file, context].
Should I [specific next step]?
```

### Step 5: Implement

After verification, implement in priority order:

1. **Blockers** — security issues, data exposure, broken functionality
2. **Simple fixes** — typos, imports, naming
3. **Complex changes** — refactoring, logic changes, architectural shifts

For each item: implement → test → verify no regressions → next item.
</workflow>

---

## YAGNI Check

<instructions>
When a reviewer suggests adding features, abstractions, or "proper" implementations:

1. `Grep` for actual usage of the thing being discussed
2. If unused or single-use: "This is only used in one place / not called anywhere. Add complexity when there's a second consumer?"
3. If used: implement properly

Three similar lines of code is better than a premature abstraction. Don't add error handling for impossible scenarios. Don't add configuration for things that won't change.
</instructions>

---

## Source-Specific Handling

<data>

### From the Repo Owner / Tech Lead
- **Trusted on architectural decisions** — implement after verifying technical claims
- Still verify factual claims (file exists, pattern used, etc.)
- Skip to action — no performative acknowledgment needed

### From External / AI Reviewers
- **Every claim is unverified** until you check the codebase
- Check: technically correct for THIS codebase? Not a generic best practice that doesn't apply here?
- Check: does the reviewer understand the full context (multi-schema architecture, submodule structure, etc.)?
- Check: does this break existing functionality?
- If the suggestion conflicts with repo owner's prior decisions → stop and discuss with repo owner first

### From CI / Automated Checks
- Treat as factual (CI ran the code, you didn't)
- Fix the actual issue, don't just make the check pass
- If a CI check seems wrong, investigate the check configuration before assuming it's correct
</data>

---

## When to Push Back

Push back (with evidence) when:
- Suggestion breaks existing functionality (show the test / consumer that breaks)
- Reviewer lacks full context (show the context they're missing)
- Violates YAGNI (show the grep proving it's unused)
- Technically incorrect for this stack (show the docs / existing pattern)
- Conflicts with repo owner's architectural decisions (reference the decision)

**How to push back:**
- Lead with evidence (file paths, grep results, query results)
- Ask specific questions, not vague disagreements
- Reference working code, not theoretical concerns
- If architectural: involve the repo owner

---

## Gracefully Correcting Your Own Pushback

If you pushed back and were wrong:
```
Verified — you're right. I checked [X] and it does [Y]. My initial read was wrong because [reason]. Implementing now.
```
State the correction factually. No long apology. Move on.

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Performative agreement | State the technical finding or just act |
| Blind implementation | Verify every claim against the codebase |
| Trusting migration files for DB state | Query the actual database |
| Batch without testing | One item at a time, test each |
| Assuming reviewer is right | Check if it breaks things, check if claim is factual |
| Avoiding pushback | Technical correctness > social comfort |
| Partial implementation when items are unclear | Clarify ALL unclear items first |
| Guessing DB state without access | State you can't verify, provide the query to run |
