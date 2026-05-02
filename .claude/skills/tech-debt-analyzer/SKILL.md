---
name: tech-debt-analyzer
description: Use when analyzing technical debt across a whole codebase — producing debt registers, quality reports, dependency audits, and trend analysis. Scans the entire repo (not just a diff), categorizes findings by severity, and outputs a structured report or debt register document. Triggers on "tech debt audit", "analyze technical debt", "code quality report", "dependency audit", "create debt register", "how much tech debt do we have", "codebase health check". Unlike code-refactoring-analyzer (scoped to specific code), this skill is strategic and repo-wide.
context: fork
compatibility: Designed for Claude Code
metadata:
  author: mjuk-lov
  version: "2.0"
---

# Technical Debt Analyzer

## Overview

Systematically identify, categorize, and document technical debt across an entire codebase. Produces structured reports and debt registers that help teams prioritize and plan remediation.

**Core principle:** Scan wide, categorize deep, document clearly. This is a reporting tool — it produces artifacts, not inline fixes.

**This skill reports. It does not edit.** For scoped refactoring suggestions, use `code-refactoring-analyzer`. For auto-fixes, use `simplify`.

---

## When to Use

- "How much tech debt do we have?"
- "Run a tech debt audit"
- "Create a debt register for this repo"
- "Analyze codebase health"
- "Dependency audit"
- Quarterly codebase health reviews
- Before major feature work (assess baseline)

---

## Workflow

<workflow>

### Step 1: Automated Analysis

Run both detection scripts. Read `references/detection-patterns.md` for thresholds.

```bash
# Code smell detection
python3 scripts/detect_code_smells.py src --output json

# Dependency analysis
python3 scripts/analyze_dependencies.py package.json
```

If scripts unavailable, fall back to manual review with Grep/Glob tools using the patterns in `references/detection-patterns.md`.

### Step 2: Manual Review

Complement automated findings with areas scripts can't detect. See `references/debt_categories.md` for the full taxonomy.

**Key manual review areas:**
- **Architectural debt:** Tight coupling, circular dependencies, missing abstractions
- **Test debt:** Coverage gaps on critical paths, fragile tests, missing E2E
- **Documentation debt:** Missing README, outdated API docs, no ADRs
- **Performance debt:** N+1 queries, memory leaks, large bundles
- **Security debt:** Missing input validation, exposed secrets, no auth

### Step 3: Categorize and Assess

**9 debt categories** (details in `references/debt_categories.md`):
1. Code Quality — smells, complexity, duplication
2. Architectural — structure, coupling, abstractions
3. Test — coverage gaps, fragile tests
4. Documentation — missing or outdated docs
5. Dependency — outdated or problematic packages
6. Performance — inefficiencies, bottlenecks
7. Security — vulnerabilities, weaknesses
8. Infrastructure — DevOps, deployment issues
9. Design — UI/UX inconsistencies

**Severity levels:**

| Severity | Criteria | Action |
|----------|----------|--------|
| Critical | Security vulns, data loss risk, production-breaking | Immediate fix |
| High | Performance problems, arch issues blocking features | This/next sprint |
| Medium | Code quality in high-churn files, missing docs | This quarter |
| Low | Minor smells, optimization opportunities | When convenient |

Use the priority matrix from `references/detection-patterns.md` to cross-reference impact vs effort.

### Step 4: Generate Report

Two output formats depending on user need:

**Quick report** (default — presented in terminal):
```markdown
## Technical Debt Analysis

**Repo:** [name]
**Files Analyzed:** N | **Total Issues:** N

| Severity | Count |
|----------|-------|
| Critical | N |
| High     | N |
| Medium   | N |
| Low      | N |

### Critical Items
[list with file:line, description, recommended action]

### High Priority Items
[list]

### Summary by Category
[table: category, count, worst severity]

### Recommendations
1. [top priority actions]
```

**Full debt register** (when user asks for "debt register" or "document"):
- Use template from `assets/DEBT_REGISTER_TEMPLATE.md`
- Each item gets: ID, category, severity, location, description, impact, proposed solution, effort estimate
- Save to `TECH_DEBT_REGISTER.md` in project root
- Include: Active items, Trends, Review schedule

### Step 5: Architecture Decision Records (Optional)

When major decisions surface during analysis, offer to create ADRs using `assets/ADR_TEMPLATE.md`.

</workflow>

---

## Compared to Related Skills

<rules>

| Skill | Scope | Action | Output |
|-------|-------|--------|--------|
| **simplify** | diff only | Edits files | Fixed code |
| **code-refactoring-analyzer** | function/file/diff | Suggests | Refactoring suggestions with patterns |
| **tech-debt-analyzer** (this) | whole repo | Scans + documents | Debt register/report |

</rules>

---

## Prevention Strategies

<checklist>
After producing the report, recommend these preventive measures:

- [ ] Code review checklist includes debt checks (complexity, coverage, docs)
- [ ] Linting enforces thresholds (complexity ≤10, max-lines ≤50, max-params ≤5)
- [ ] TypeScript strict mode enabled
- [ ] 80% minimum test coverage threshold
- [ ] 20% of sprint capacity allocated for debt reduction
- [ ] Monthly dependency updates (security patches)
- [ ] Quarterly full codebase re-analysis
</checklist>

## References

- `references/detection-patterns.md` — Shared thresholds, detection patterns, priority matrix
- `references/debt_categories.md` — Full taxonomy of 9 debt categories with indicators
- `references/refactoring-patterns.md` — Patterns catalog (shared with code-refactoring-analyzer)
- `references/WORKFLOWS.md` — Detailed workflow examples
- `scripts/detect_code_smells.py` — Automated code smell detection
- `scripts/analyze_dependencies.py` — Dependency health analysis
- `assets/DEBT_REGISTER_TEMPLATE.md` — Full debt register template
- `assets/ADR_TEMPLATE.md` — Architecture Decision Record template
