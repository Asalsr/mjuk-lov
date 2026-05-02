---
name: code-refactoring-analyzer
description: Use when user wants to refactor specific code — a function, file, component, or recent diff. Identifies refactoring opportunities and suggests specific patterns with before/after examples. Scoped to the code the user points at, not the whole repo. Triggers on "refactor this", "how can I improve this function", "clean up this file", "what can be refactored", "simplify this component", "review code structure", or "check for refactoring opportunities". Unlike tech-debt-analyzer (repo-wide reports), this skill is tactical and scoped.
context: fork
compatibility: Designed for Claude Code
metadata:
  author: mjuk-lov
  version: "2.0"
---

# Code Refactoring Analyzer

## Overview

Tactical refactoring analysis scoped to specific code — a function, file, component, or recent diff. Identifies opportunities and suggests specific patterns with before/after examples.

**Core principle:** Inform and educate, never block. Show opportunities with clear patterns and let developers decide.

**This skill suggests. It does not edit.** For auto-fixes, use `simplify`. For repo-wide reports, use `tech-debt-analyzer`.

## When to Use

- "Refactor this function/file/component"
- "How can I improve this code?"
- "Check for refactoring opportunities in [scope]"
- After `/execute` completes — focuses on recently changed files
- Scoped to specific areas: "analyze [file/folder] for refactoring"

---

## Workflow

<workflow>

### Step 1: Determine Scope

```
User specifies scope?
  → Specific file(s)/function(s)/folder
  → Analyze those only

Post-implementation (automatic)?
  → git diff --name-only main...HEAD | grep -E "\.(ts|tsx|js|jsx)$"
  → Analyze modified files only

No scope specified?
  → Ask: "What code should I analyze? A specific file, folder, or your recent changes?"
```

### Step 2: Run Detection

Read `references/detection-patterns.md` for thresholds and patterns.

**Automated analysis** (if scripts available):
```bash
python3 scripts/detect_code_smells.py <file1> <file2> --output json
```

**Manual analysis** (always — scripts catch only some patterns):
1. Read the code
2. Check for: duplication, poor naming, god objects, deep nesting, long params, magic numbers, extract opportunities
3. Use detection patterns from `references/detection-patterns.md`

**If scripts unavailable:** Continue with manual review only. Log: "Automated detection unavailable — manual review only."

### Step 3: Classify Findings

For each finding, use the priority matrix from `references/detection-patterns.md`:
- **High-Impact:** High churn + significant complexity reduction
- **Quick Win:** <1 hour, low risk, noticeable improvement
- **Lower Priority:** Low churn or high effort

Check git churn: `git log --follow --oneline <file> | wc -l`
High churn + high complexity = High-Impact priority.

### Step 4: Suggest Patterns

For each finding, reference a pattern from `references/refactoring-patterns.md`:
- Name the pattern (e.g., "Extract Method", "Guard Clauses")
- Show before/after code example using the actual code
- Estimate effort
- Explain impact

### Step 5: Present Report

</workflow>

---

## Output Format

<formatting>

### When Findings Exist

```markdown
## Refactoring Analysis

**Scope:** [files/folder analyzed]
**Files Analyzed:** N

### High-Impact Opportunities

#### [1] [Title]
**Location:** `path/to/file.ts:line`
**Pattern:** [Extract Method | Split Service | ...]
**Effort:** ~Xh
**Why:** [impact on maintainability, churn data]

\`\`\`typescript
// Before
[actual code]

// After
[suggested refactoring]
\`\`\`

### Quick Wins

#### [1] [Title]
**Location:** `path/to/file.ts:line`
**Pattern:** [Named Constant | Guard Clauses | ...]
**Effort:** ~15min

[before/after example]

### Lower Priority
- [brief one-liners for low-priority items]
```

### When No Findings Exist

```markdown
## Refactoring Analysis

No refactoring opportunities found in the analyzed code.

**Good practices observed:**
- [specific positive observations]

Want a broader analysis? Try: "analyze [folder] for refactoring" or use `tech-debt-analyzer` for a full repo scan.
```

</formatting>

---

## What This Skill Is NOT

<rules>

- **Not a repo-wide scanner** — for that, use `tech-debt-analyzer`
- **Not an auto-fixer** — for that, use `simplify` (which edits the diff directly)
- **Not a blocker** — findings are suggestions, never prevent workflow progression
- **Non-blocking language:** "Consider" not "Must", "Opportunity" not "Issue"

### Compared to Related Skills

| Skill | Scope | Action | Output |
|-------|-------|--------|--------|
| **simplify** | diff only | Edits files | Fixed code |
| **code-refactoring-analyzer** (this) | function/file/diff | Suggests | Refactoring suggestions with patterns |
| **tech-debt-analyzer** | whole repo | Scans + documents | Prioritized debt register/report |

</rules>

## References

- `references/detection-patterns.md` — Shared thresholds, automated + manual detection patterns, priority matrix
- `references/refactoring-patterns.md` — Catalog of refactoring patterns with examples
- `scripts/detect_code_smells.py` — Automated code smell detection
- `assets/REFACTORING_REPORT_TEMPLATE.md` — Full report template
