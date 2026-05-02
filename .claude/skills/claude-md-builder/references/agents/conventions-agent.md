<!-- Scout Header
Purpose: Subagent prompt — samples 10-15 files to extract naming, export, component, error handling patterns
When to use: Always — spawned as one of 5 parallel agents during CLAUDE.md generation
Size: ~64 lines
-->

# Coding Conventions Analyzer

You are analyzing a code repository to extract **coding conventions** for a CLAUDE.md file and .claude/rules/ files.

## Your Task

Identify the actual coding patterns used in this repo. Focus ONLY on conventions that are non-default, non-obvious, or that contradict common patterns. If the repo follows standard practices for its framework, say so — don't inflate the output.

**ISOLATION**: Analyze ONLY files within the target repository. Do not import conventions from a parent workspace CLAUDE.md or sibling repositories.

## How to Analyze

Sample 10-15 source files (mix of components, utilities, services, types) and check:

1. **Export patterns**: Named exports only? Default exports? Mixed? Re-exports via barrel files?
2. **Naming conventions**: camelCase, PascalCase, kebab-case for files? Any prefixes/suffixes? (e.g., `*.service.ts`, `use*.ts` for hooks)
3. **Component patterns** (if frontend):
   - Function declarations vs arrow functions?
   - Props inline vs extracted type?
   - Server vs client component conventions?
   - Where do hooks live relative to components?
4. **Error handling**: try/catch, Result pattern, error boundaries, throwing vs returning?
5. **Type patterns**: Interfaces vs types? Zod schemas? Enums vs const objects?
6. **API response shape**: Standardized? (e.g., `{ success, data, error }`)
7. **Import ordering**: Any consistent pattern? (framework, external, internal, relative)
8. **Comment style**: JSDoc? Inline? None?
9. **State management patterns**: How is state organized?
10. **Testing patterns**: What test framework? File naming (`.test.ts` vs `.spec.ts`)? Colocation vs `__tests__/`?

## What to SKIP
- Don't mention conventions that are default for the framework
- Don't mention linter-enforced rules (these should be hooks, not CLAUDE.md lines)
- Don't mention formatting (Prettier handles this)
- Don't flag inconsistencies unless they represent a deliberate convention

## Output Format

Return markdown:

```markdown
## Conventions

### For CLAUDE.md (high-signal, keep lean)
- [Only non-default patterns, e.g., "Named exports only (no default exports)"]
- [Patterns that contradict common practice, e.g., "Arrow functions for components, not function declarations"]
- [Include WHY if non-obvious]

### For .claude/rules/coding-conventions.md (detailed)
- [Full convention inventory with DO/DON'T examples]
- [Import ordering rules]
- [Component structure template]
- [Type/interface conventions]

### Evidence
- Files sampled: [list of 10-15 files checked]
- Consistency score: [X/N files followed the pattern]
- Confidence: high/medium/low
```

## Rules
- Read actual source files — conventions are in the code, not in config
- Only report patterns with >80% consistency across sampled files
- If a pattern has <80% consistency, it's not a convention — skip it
- Distinguish between deliberate conventions and accidental patterns
- Include concrete examples of DO and DON'T in the rules/ output
