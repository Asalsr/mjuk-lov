<!-- Scout Header
Purpose: Code smell detection patterns shared by refactoring-analyzer and tech-debt-analyzer
When to use: During code analysis — patterns for identifying refactoring opportunities
Size: ~123 lines
-->

# Detection Patterns

> Shared detection patterns used by both code-refactoring-analyzer and tech-debt-analyzer.
> Each skill uses these patterns differently: refactoring-analyzer suggests fixes for specific code,
> tech-debt-analyzer aggregates them into a repo-wide report.

---

## Configuration Thresholds

| Category | Threshold | Default | Description |
|----------|-----------|---------|-------------|
| Large Files | `MAX_FILE_LINES` | 500 lines | Files exceeding this are flagged |
| Complex Functions | `MAX_CYCLOMATIC_COMPLEXITY` | 10 | Cyclomatic complexity threshold |
| Function Length | `MAX_FUNCTION_LINES` | 50 lines | Functions exceeding this are flagged |
| Deep Nesting | `MAX_NESTING_LEVELS` | 4 levels | Nesting deeper than this is flagged |
| Long Parameters | `MAX_PARAMETERS` | 5 params | Functions with more params are flagged |
| God Object Methods | `MAX_METHODS_PER_CLASS` | 10 methods | Classes/services exceeding this |
| Duplication | `MIN_DUPLICATIONS` | 3 occurrences | Minimum to suggest consolidation |

These are guidelines based on industry best practices. Adjust per project.

---

## Automated Detection

### Code Smell Detection Script

```bash
# Full repo scan
python3 scripts/detect_code_smells.py src --output json

# Specific files (scoped analysis)
python3 scripts/detect_code_smells.py path/to/file1.ts path/to/file2.tsx --output json
```

Detects:
- **Large files** (>500 lines)
- **Complex functions** (cyclomatic complexity >10, length >50 lines)
- **Debt markers** (TODO, FIXME, HACK, XXX, BUG comments)
- **Console statements** (debug code left in)
- **Weak typing** (`any` in TypeScript)
- **Long parameter lists** (>5 params)
- **Deep nesting** (>4 levels)
- **Magic numbers** (hardcoded numeric values)

### Dependency Analysis Script

```bash
python3 scripts/analyze_dependencies.py package.json
```

Detects:
- **Deprecated packages** (request, tslint, node-sass, etc.)
- **Duplicate functionality** (multiple date libs, HTTP clients)
- **Unsafe version constraints** (*, latest)
- **Overly strict versions** (exact versions without ^ or ~)

---

## Manual Detection Patterns

These require reading the code — not detectable by scripts alone.

### Duplicated Code
1. Search for similar patterns: `grep -r "if.*email.*@" --include="*.ts" --include="*.tsx"`
2. Look for copy-pasted blocks (similar structure, different values)
3. Check for repeated conditionals or calculations
4. **Threshold:** 3+ occurrences → suggest consolidation

### Poor Naming
1. Single-letter variables (except loop counters `i`, `j`, `k`)
2. Unclear abbreviations: `usr`, `btn`, `mgr`, `svc`, `tmp`, `cnt`
3. Generic names: `data`, `info`, `temp`, `value`, `item`, `result`
4. Inconsistent naming (same concept, different names across files)

### God Objects
1. Classes/services with >10 methods
2. Files handling multiple unrelated domains (auth + profile + notifications)
3. Components with data fetching + rendering + validation + routing
4. Files importing from many different domains

### Extract Opportunities
1. Functions >50 lines with clear sections (comments like `// validation`, `// processing`)
2. Repeated JSX patterns in components
3. Complex conditionals that could be named functions
4. Nested callbacks or promise chains

### Architectural Issues
- Tight coupling between components
- Missing abstractions / interfaces
- Poor separation of concerns
- Circular dependencies

---

## Priority Matrix

| Impact / Effort | Low Effort (<1h) | Medium (1-4h) | High (1+ days) |
|----------------|------------------|---------------|----------------|
| **High Impact** | Quick Win | High-Impact | High-Impact |
| **Medium Impact** | Quick Win | Medium | Lower Priority |
| **Low Impact** | Quick Win | Lower Priority | Lower Priority |

**High-churn files get priority boost** — check with `git log --follow --oneline <file> | wc -l`

---

## Refactoring Patterns Quick Reference

| Pattern | When to Use |
|---------|-------------|
| **Extract Method** | Function >50 lines with clear sections |
| **Split Class/Service** | Class with >10 methods or mixed domains |
| **Extract Component** | Repeated JSX or component >300 lines |
| **Guard Clauses** | Deep nesting from validation chains |
| **Parameter Object** | Function with >5 params |
| **Named Constant** | Magic numbers or repeated literals |
| **Consolidate Duplicate** | Same logic in 3+ places |
| **Rename for Clarity** | Abbreviations, single letters, generic names |
| **Decompose Conditional** | Complex if/else with business logic |

For detailed patterns with examples, see `refactoring-patterns.md`.
