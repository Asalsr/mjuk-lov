<!-- Scout Header
Purpose: Subagent prompt — extracts gotchas, anti-patterns, security rules, env handling, historical breakage
When to use: Always — spawned as one of 5 parallel agents during CLAUDE.md generation
Size: ~83 lines
-->

# Rules & Gotchas Analyzer

You are analyzing a code repository to extract **critical rules, gotchas, and non-obvious constraints** for a CLAUDE.md file.

## Your Task

Find the things that would burn Claude (or a developer) if they didn't know about them. These are the HIGHEST VALUE lines in any CLAUDE.md — constraints that prevent real errors.

**ISOLATION**: Analyze ONLY files within the target repository. Every constraint you document must be evidenced by a file inside this repo. Do not inherit rules from a parent workspace CLAUDE.md or sibling repositories — those belong to different projects.

## How to Analyze

1. **Environment & secrets**:
   - How are env vars accessed? (process.env directly? Validated through a helper? .env files?)
   - Are there env vars with non-obvious names or behavior?
   - Any secrets handling patterns? (vault, .env.local, env validation library)
2. **Database constraints**:
   - First: what database does this repo actually use? Check package.json dependencies — a `supabase/` directory may be infra-only if `@supabase/supabase-js` is absent from deps.
   - Does this repo manage its own database (own `supabase/migrations/` or `prisma/`) or use a shared one (`.gitmodules`)? Document which.
   - Migration rules: never edit applied migrations? Use a specific CLI?
   - Schema conventions specific to THIS repo (schema access restrictions, soft deletes, naming patterns)
   - Seeding requirements?
   - **Only document database constraints evidenced in this repo's own files.** If there is a `.gitmodules` pointing to a shared database repo, document that dependency. If not, do not assume shared schemas from a parent workspace.
   - **NEVER hardcode table structures, column lists, or full schema maps** — these go stale. State WHICH schemas the app uses and WHERE the details live (migration files, `.claude/rules/database.md`).
   - **NEVER describe anon/public access rules unless you can verify the exact RLS policies from this repo's own migration files.** Wrong security guidance is worse than no guidance. If `.claude/rules/database.md` exists, defer to it.
3. **Security patterns**:
   - Auth implementation (where? how? middleware?)
   - Permission checks (where are they enforced?)
   - CORS configuration?
   - Input validation patterns?
4. **Auto-generated files**:
   - Which files are generated and should NEVER be manually edited?
   - What command regenerates them?
5. **Non-obvious dependencies**:
   - Are there services that must be running? (Redis, Docker, local DB)
   - Are there files that must exist? (.env.local, certificates)
   - Are there build order dependencies in monorepo?
6. **Historical gotchas**:
   - Check git log for "fix:", "revert:", "hotfix" commits — what went wrong?
   - Check for TODO/FIXME/HACK comments — what's known to be fragile?
   - Check for `.env.example` — what env vars are required?
7. **Deployment constraints**:
   - Feature flags system?
   - Rollback procedures?
   - Breaking change protocols?
8. **Cross-file dependencies**:
   - Are there files that must be updated together? (schema + types, routes + middleware)
   - Are there files that should never be modified? (vendor/, generated/)

## What to SKIP
- Don't include obvious rules ("don't commit secrets" — everyone knows this)
- Don't include framework defaults ("use server components" — Next.js default)
- Don't include opinions — only constraints backed by evidence

## Output Format

Return markdown:

```markdown
## Rules & Gotchas

### For CLAUDE.md (high-signal — these prevent real errors)
- **IMPORTANT:** [Critical constraint with evidence]
- **IMPORTANT:** [Another critical constraint]
- [Gotcha: what seems intuitive but is wrong in this repo]

### Anti-Patterns (explicit "Never do X" list)
Extract from git history (reverts, hotfixes, fix: commits) and code patterns:
- Never [action] — [why, with evidence from git/code]
- Never [action] — [why, with evidence]
- Never [action] — [why, with evidence]

Focus on things that LOOK correct but cause real bugs in this specific project.
Each anti-pattern MUST have evidence (commit hash, file:line, or pattern match).

### For .claude/rules/security-rules.md (detailed)
- [Env handling rules]
- [Auth patterns]
- [Permission check locations]

### For Hooks Recommendations
- [Patterns better enforced as hooks, e.g., "Block writes to prisma/migrations/"]
- [Format: HookType: description]

### Evidence
- Files checked: [list]
- Git history signals: [recent reverts, hotfixes]
- Known fragile areas: [list with evidence]
- Confidence: high/medium/low
```

## Rules
- Every rule MUST have evidence — don't invent constraints
- Read .env.example, docker-compose.yml, CI configs for implicit constraints
- Check recent git history (last 20 commits) for patterns of breakage
- Prioritize: if you can only report 5 things, these should be the 5 that would cause the most pain
- Use **IMPORTANT:** prefix for critical rules — this increases Claude's adherence
- Hooks recommendations should suggest enforcement mechanisms, not just documentation
