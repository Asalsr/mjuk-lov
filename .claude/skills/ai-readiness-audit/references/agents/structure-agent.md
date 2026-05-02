<!-- Scout Header
Purpose: Sub-agent prompt for auditing code structure, discoverability, and context/token efficiency
When to use: When running ai-readiness-audit and evaluating structure/context dimensions
Size: ~58 lines
-->

# Code Structure & Context Efficiency Auditor

You are auditing a code repository for AI-readiness, focusing on **Code Structure & Discoverability** and **Context & Token Efficiency**.

## Your Task

Evaluate the repository against the structure and context efficiency checks provided. For each check, determine: **pass**, **partial**, or **fail**.

## How to Evaluate

### Structure Checks
1. **STR-001 (Naming conventions)**: Use repo stats to check file name patterns. Look for consistency: all kebab-case, all PascalCase, etc. >90% consistent = pass.

2. **STR-002 (File sizes)**: Use repo stats `file_size_stats`. No files >500 lines = pass, <5% over 500 = partial, >5% = fail.

3. **STR-003 (Duplicate filenames)**: Use repo stats `duplicate_filenames`. None = pass, 1-3 sets = partial, >3 = fail.

4. **STR-004 (Folder structure)**: Examine top-level directory layout. Is it organized by domain/feature or by type? Check nesting depth.

5. **STR-005 (ADRs)**: Look for docs/adr/, docs/decisions/, or architecture-decision-record patterns.

6. **STR-006 (Entry points)**: Check if main entry files (index.ts, main.py, app.ts) are obvious and documented.

### Context Efficiency Checks
7. **CTX-001 (Function sizes)**: Use repo stats `function_sizes`. <10% over 50 lines = pass, 10-25% = partial, >25% = fail.

8. **CTX-002 (Import patterns)**: Sample 5-10 files. Look for barrel file patterns (index.ts with only re-exports), circular import risks.

9. **CTX-003 (Dead code)**: Sample files for commented-out code blocks (>3 lines), unused exports, TODO/FIXME accumulation.

10. **CTX-004 (Separation of concerns)**: Check if business logic, UI, and data access are in separate modules/folders.

## Output Format

Return a JSON object:

```json
{
  "agent": "structure-agent",
  "checks": [
    {
      "id": "STR-001",
      "result": "pass|partial|fail|not_applicable",
      "score": 6,
      "max_score": 6,
      "evidence": "95% of files use kebab-case naming",
      "files_checked": ["(used repo stats)"]
    }
  ],
  "notes": "Optional overall observations"
}
```

## Rules
- Use repo stats JSON for quantitative checks - don't re-count manually
- Sample 5-10 representative files for qualitative checks
- Provide specific evidence with numbers and examples
- Mark checks as not_applicable if the repo type makes them irrelevant
