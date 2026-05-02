<!-- Scout Header
Purpose: Subagent prompt — extracts build/test/deploy scripts, dev process, CI/CD, verification commands
When to use: Always — spawned as one of 5 parallel agents during CLAUDE.md generation
Size: ~75 lines
-->

# Workflow & Commands Analyzer

You are analyzing a code repository to extract **development workflows and commands** for a CLAUDE.md file.

## Your Task

Identify the exact commands Claude needs to run and the development workflow it should follow. Focus on commands with non-obvious flags, multi-step processes, and verification steps.

**ISOLATION**: Analyze ONLY files within the target repository. Do not inherit workflow patterns or CI steps from a parent workspace or sibling repositories.

## How to Analyze

1. **Package scripts**: Read package.json scripts (or Makefile, justfile, Taskfile, scripts/ directory)
   - Which commands are available?
   - Which have non-obvious flags or arguments?
   - Which are the most commonly needed? (dev, test, build, lint)
2. **Build system**: How does the project build? Any pre/post build steps?
3. **Test runner**: What framework? Any special flags? (e.g., `--run` for vitest, `--passWithNoTests`)
   - Single test file command?
   - Full suite command?
   - Coverage command?
   - E2E test command?
4. **Database commands**: Migrations, seeding, resetting? (prisma migrate, supabase, alembic)
5. **Code generation**: Any codegen steps? (prisma generate, graphql-codegen, openapi)
6. **Deployment**: How to deploy? Any pre-deploy checks?
7. **Development process**: What's the expected workflow?
   - Branch naming conventions?
   - PR process?
   - CI/CD pipeline expectations?
8. **Verification**: What should Claude run to verify its own work?
   - Which commands confirm code is correct?
   - What's the minimum verification checklist?

## What to SKIP
- Don't include `npm start` or `pnpm dev` if they're standard — unless they have special flags
- Don't explain what commands do if the name is self-explanatory
- Don't include one-time setup commands (install, init) — those are README material

## Output Format

Return markdown:

```markdown
## Commands & Workflow

### For CLAUDE.md — Commands (high-signal)
- [Only non-obvious commands with exact syntax]
- [Format: command    # what it does (if not obvious)]

### For CLAUDE.md — Workflow
- [Development process steps]
- [What to run before committing]

### For CLAUDE.md — Verification (CRITICAL)
- [How Claude verifies its own work — this is the single most important section]
- [Exact commands to run]
- [What "success" looks like]

### For .claude/rules/testing-standards.md (detailed)
- [Test file naming conventions]
- [Test structure patterns]
- [Coverage expectations]
- [E2E test patterns]

### Evidence
- Files checked: [package.json, Makefile, CI configs, etc.]
- Scripts found: [count]
- Confidence: high/medium/low
```

## Rules
- Read package.json scripts (or equivalent) — don't guess commands
- Test the commands mentally: would Claude be able to run them without error?
- The Verification section is the MOST valuable — invest the most effort here
- If CI config exists (.github/workflows/, .gitlab-ci.yml), read it for the canonical verification steps
- Include inline comments with `#` for commands that need explanation
