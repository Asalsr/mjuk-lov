# Code Refactoring Analysis Report

**Generated:** [YYYY-MM-DD HH:MM]
**Scope:** [Post-Implementation / Full Repository]
**Files Analyzed:** [X]
**Files Modified (if post-implementation):** [Y]

---

## Summary

**Total Opportunities Found:** [N]

| Priority | Count |
|----------|-------|
| High-Impact Opportunities | [X] |
| Quick Wins | [Y] |
| Lower Priority | [Z] |

**Key Findings:**
- [Brief 1-2 sentence summary of most significant findings]
- [If no findings: "Code quality looks good! No immediate refactoring needed."]

---

## High-Impact Opportunities

> **Definition:** Significant improvements worth the effort. High impact on maintainability, reasonable implementation effort.

### [1] [Brief Title]

**Location:** `[file-path]:[line-range]`

**Issue:**
[Clear description of the problem]

**Impact:**
- **Maintainability:** [How this affects future development]
- **Risk:** [Potential issues if left unaddressed]
- **Churn:** [How often this code changes]

**Effort Estimate:** [X days/hours]

**Refactoring Pattern:** [Pattern Name]
```
[Brief description of the pattern]

Example approach:
1. [Step 1]
2. [Step 2]
3. [Step 3]
```

**Code Example:**
```typescript
// Before
[Show problematic code snippet]

// After (suggested)
[Show improved code structure]
```

**Priority Justification:** [Why this is high priority]

---

### [2] [Next High-Impact Item]
[Repeat above structure]

---

## Quick Wins

> **Definition:** Low effort, decent impact. Easy improvements that provide value without significant time investment.

### [1] [Brief Title]

**Location:** `[file-path]:[line-range]`

**Issue:**
[Clear description of the problem]

**Impact:** [Brief impact statement]

**Effort Estimate:** [X minutes/hours]

**Refactoring Pattern:** [Pattern Name]
```
Quick fix:
- [Action item 1]
- [Action item 2]
```

**Example:**
```typescript
// Before
const x = 86400000; // magic number

// After
const MILLISECONDS_PER_DAY = 86400000;
```

---

### [2] [Next Quick Win]
[Repeat above structure]

---

## Lower Priority

> **Definition:** Nice-to-have improvements. Lower impact or higher effort - defer until convenient opportunity arises.

### [1] [Brief Title]

**Location:** `[file-path]:[line-range]`

**Issue:** [Brief description]

**Refactoring Pattern:** [Pattern Name]

**Note:** [Why this is lower priority - low impact, high effort, or acceptable trade-off]

---

### [2] [Next Lower Priority Item]
[Repeat above structure]

---

## Refactoring Patterns Reference

| Pattern | When to Use | Benefit |
|---------|-------------|---------|
| **Extract Method** | Long functions (>50 lines) | Improves readability, enables reuse |
| **Split Class/Service** | Classes with multiple responsibilities | Single Responsibility Principle |
| **Extract Component** | Repeated UI patterns | DRY principle, consistency |
| **Rename for Clarity** | Unclear variable/function names | Code becomes self-documenting |
| **Consolidate Duplicate** | Similar code in multiple places | Reduces maintenance burden |
| **Introduce Explaining Variable** | Complex expressions | Makes logic explicit |
| **Replace Magic Number** | Hardcoded values | Improves maintainability |
| **Decompose Conditional** | Complex if/else logic | Simplifies control flow |

---

## Next Steps

### Immediate Actions (High-Impact)
1. [Action item from High-Impact #1]
2. [Action item from High-Impact #2]

### Quick Improvements (Quick Wins)
- [Action item from Quick Win #1]
- [Action item from Quick Win #2]

### Future Backlog (Lower Priority)
- [Track in technical debt register]
- [Address opportunistically during related work]

---

## Additional Notes

[Any context-specific notes, recommendations, or observations]

---

## How to Request Analysis

**Post-Implementation:** Automatically runs after `/execute` completes.

**On-Demand Analysis:**
- "run refactoring analysis"
- "check for refactoring opportunities"
- "analyze code quality"
- "what can be refactored?"

**Custom Scope:**
- "analyze [file/folder] for refactoring"
- "check [component-name] for improvements"
