---
name: claude-md-builder
description: Use when creating or regenerating CLAUDE.md files for any repository. Spawns 5 parallel subagents to analyze the repo across stack, architecture, conventions, workflows, and rules/gotchas — then synthesizes a lean, research-backed CLAUDE.md with companion .claude/rules/ files. Supports --update flag for incremental refresh of stale files. Triggers on "create CLAUDE.md", "generate CLAUDE.md", "init CLAUDE.md", "setup CLAUDE.md", "improve CLAUDE.md", or "update CLAUDE.md".
context: fork
model: opus
compatibility: Designed for Claude Code
metadata:
  author: mjuk-lov
  version: "1.0"
---

<instructions>

# CLAUDE.md Builder Skill

You generate high-quality, hand-crafted-style CLAUDE.md files by analyzing the target repository with 5 parallel subagents, then synthesizing their findings into a lean, friction-focused file. You also generate companion `.claude/rules/` files for detailed conventions that don't fit in the main file.

**Research basis:** ETH Zurich (Feb 2026) found that auto-generated files hurt performance while short, human-crafted files helped ~4%. The sweet spot is 60-80 lines of high-signal instructions. This skill aims for that quality bar through structured analysis.

**Core principle:** Every line must exist because removing it would cause Claude to make mistakes. If Claude can infer it from the codebase, don't include it.

## Modes

### Default Mode (no flag)
Full generation — analyzes repo from scratch, generates fresh CLAUDE.md, shows diff if existing file found.

### --update Mode
Incremental refresh for stale CLAUDE.md files. Instead of regenerating from scratch:
1. Reads existing CLAUDE.md and .claude/rules/ files
2. Spawns subagents to detect what's **changed** since the file was last updated (new deps, renamed dirs, new scripts, removed patterns)
3. Produces a targeted diff: lines to add, lines to remove, lines to update
4. Preserves user's custom rules and gotchas — only touches what's stale
5. Flags sections that look outdated with evidence ("package.json now uses vitest but CLAUDE.md references jest")

Use `--update` when the repo has evolved but the CLAUDE.md just needs a refresh, not a rewrite.

</instructions>

<rules>

## Must-Do
1. Always spawn all 5 subagents in PARALLEL for speed
2. Always read existing CLAUDE.md first (if present) before generating
3. Always warn if generated file exceeds 80 lines — suggest what to move to @imports or .claude/rules/
4. Always generate companion .claude/rules/ files for detailed conventions
5. Always use progressive disclosure: lean CLAUDE.md + @imports for depth
6. Always include a Verification section — this 2-3x quality (Boris Cherny)
7. Always show diff against existing CLAUDE.md if one exists
8. Always confirm target repo path with the user if ambiguous

## Must-Avoid
1. Never duplicate what Claude can read from package.json, tsconfig, or README
2. Never include codebase overviews — agents discover structure themselves (ETH Zurich finding)
3. Never include linter rules — use hooks for enforcement, not CLAUDE.md instructions
4. Never include generic advice ("write clean code", "follow best practices")
5. Never exceed ~150 instructions total — Claude's system prompt uses ~50, leaving ~100 for CLAUDE.md
6. Never add lines based on theory — every line should address actual friction
7. Never include emojis in generated CLAUDE.md files
8. Never copy schemas, database tables, or conventions from a parent workspace CLAUDE.md — only document what belongs to this repo's own files
9. Never assume shared infrastructure (databases, submodules, auth) unless the target repo's own files prove it — a `.gitmodules` entry, `.env.example` referencing a shared DB, or an explicit import are all valid evidence; the parent workspace CLAUDE.md is not
10. Never hardcode database table structures, column lists, or full schema maps in CLAUDE.md — these go stale instantly. Instead, state which schemas the app uses and point to `.claude/rules/database.md` or migration files as the source of truth
11. Never describe `anon`/`public` access rules unless you can verify the exact policy from the repo's own migration files or RLS policies — wrong security guidance is worse than no guidance

</rules>

<safety>

- This skill READS the target repository for analysis but WRITES only to CLAUDE.md and .claude/rules/
- Always shows the generated content for user approval before writing
- If existing CLAUDE.md exists, shows diff — never silently overwrites

</safety>

<workflow>

## Phase 0: Target Discovery

### 0.1 Determine Target Repository
- If the user specified a path, use that as the target repo
- If no path specified, use the current working directory
- Confirm the target path with the user if ambiguous

### 0.2 Check for Existing CLAUDE.md
- Look for CLAUDE.md at repo root
- If found, read it and store as `existing_claude_md` for Phase 4 diff
- Also check for: .claude/ directory, .claude/rules/, .claude/skills/, .cursorrules, AGENTS.md

### 0.3 Quick Repo Fingerprint
Gather basic info using Glob and Read tools:
- Package manager — check for ALL lockfiles present (package-lock.json, yarn.lock, pnpm-lock.yaml, bun.lockb). If multiple exist, note the conflict for the stack-agent to resolve via CI config.
- Framework indicators (next.config, vite.config, angular.json, etc.)
- Source root — read vite.config.ts or tsconfig.json path aliases to find the actual source directory (may not be `/src`)
- Language (check file extensions distribution)
- Monorepo signals (workspaces, packages/, apps/, lerna.json)
- Shared submodule — check `.gitmodules` for any submodule entries
- Lovable-managed — check for `.lovable/` directory presence

Store as `repo_fingerprint` JSON for subagent prompts.

## Phase 0.5: --update Mode Branch (Skip to here if --update flag)

If the `--update` flag is set, follow this alternate flow instead of Phases 1-3:

### 0.5.1 Parse Existing CLAUDE.md
- Read and parse sections of existing CLAUDE.md
- Read all `.claude/rules/*.md` files
- Record the current state: sections present, line count, key facts (stack, commands, conventions)

### 0.5.2 Spawn 5 Update-Aware Subagents (PARALLEL)
Same 5 agents as default mode, but each gets additional context:
- The **existing** CLAUDE.md section relevant to their domain
- The **existing** .claude/rules/ file relevant to their domain (if any)
- Instruction: "Compare what the file says vs what the repo actually has. Report ONLY discrepancies."

Each agent returns:
```markdown
## Staleness Report: <Domain>

### Stale (needs update)
- [existing line] → [should be: updated line] (evidence: [what changed])

### Missing (should add)
- [new line to add] (evidence: [why it matters now])

### Obsolete (should remove)
- [line to remove] (evidence: [no longer true because...])

### Current (no change needed)
- [count] lines are still accurate
```

### 0.5.3 Synthesize Update Diff
- Collect all staleness reports
- Apply friction filter (same as Phase 2.2)
- Generate a targeted patch — not a full rewrite
- Show as annotated diff:
  ```
  CLAUDE.md Update Summary:
  - 3 lines updated (stale references)
  - 2 lines added (new commands, new convention)
  - 1 line removed (deprecated pattern)
  - 45 lines unchanged

  Changes:
  @@ ## Commands @@
  - pnpm test   # jest
  + pnpm test   # vitest (migrated from jest)
  + pnpm e2e    # playwright

  @@ ## Rules @@
  + **IMPORTANT:** All API routes must use the new middleware pattern (see lib/middleware.ts)
  ```

### 0.5.4 Present Update and Write
- Show the annotated diff
- Show any new .claude/rules/ files or updates to existing ones
- Ask: "Apply updates / Edit first / Full regeneration instead / Cancel?"
- **Apply updates**: Patch the existing files
- **Full regeneration**: Fall through to default mode (Phase 1)

After 0.5.4, skip to Phase 5 for writing.

## Phase 1: Spawn 5 Subagents (PARALLEL)

Spawn ALL 5 subagents simultaneously using the Agent tool. Each subagent gets:
- Its prompt file from `references/agents/<name>.md`
- The `repo_fingerprint` JSON
- The target repo path
- Instructions to return structured markdown findings

### Subagent Assignments

| Agent | Prompt File | Analyzes | Model |
|-------|------------|----------|-------|
| stack-agent | `references/agents/stack-agent.md` | Tech stack, dependencies, versions, package manager | sonnet |
| architecture-agent | `references/agents/architecture-agent.md` | Directory structure, key entry points, patterns | sonnet |
| conventions-agent | `references/agents/conventions-agent.md` | Code style, naming, exports, error handling patterns | sonnet |
| workflow-agent | `references/agents/workflow-agent.md` | Commands, scripts, build/test/deploy workflows | sonnet |
| rules-agent | `references/agents/rules-agent.md` | Gotchas, non-obvious constraints, security rules, env handling | sonnet |

**Agent spawn template:**
For each agent, use the Agent tool with:
- `subagent_type`: "general-purpose"
- `model`: "sonnet"
- `prompt`: Combine the agent's prompt file content + repo fingerprint + target path. Instruct the agent to:
  1. Read ONLY files within the target repository path
  2. Analyze its assigned domain based solely on what it finds there
  3. Return structured markdown with findings
  4. NOT copy or reference conventions, schemas, or rules from any parent directory CLAUDE.md or sibling repositories
- `description`: "<agent-name> analysis"

**IMPORTANT**: Read each agent prompt file from `references/agents/` using the Read tool, then pass the content as part of the prompt string. Do NOT tell agents to read their own prompt files.

**ISOLATION**: Subagents must treat the target repo as a standalone project. Schemas, database tables, auth patterns, or conventions from a parent workspace CLAUDE.md belong to a different project and must be ignored.

### Parsing Agent Output
Each agent returns markdown with this structure:
```markdown
## <Section Name>

### For CLAUDE.md (high-signal, keep lean)
- Line 1 to include
- Line 2 to include

### For .claude/rules/ (detailed, move here if CLAUDE.md gets long)
- Detailed convention 1
- Detailed convention 2

### Evidence
- What files were checked
- What patterns were found
- Confidence level (high/medium/low)
```

## Phase 2: Synthesis

### 2.1 Collect All Findings
Gather all 5 subagent outputs into a unified findings set.

### 2.2 Apply the Friction Filter
For each proposed line, ask:
- "Would removing this cause Claude to make mistakes?" → Keep
- "Can Claude infer this from reading the code?" → Cut
- "Is this a linter/formatter concern?" → Move to hooks recommendation
- "Is this generic advice any developer knows?" → Cut

### 2.3 Prioritize by Signal Value
Rank remaining lines by:
1. **Gotchas & non-obvious constraints** (highest value — prevents real errors)
2. **Non-default conventions** (high value — contradicts what code might suggest)
3. **Commands with special flags** (high value — Claude won't guess these)
4. **Architecture decisions** (medium value — only include WHY, not WHAT)
5. **Stack declaration** (low value — Claude reads package.json anyway, keep minimal)

### 2.4 Line Budget Check
- Target: 60-80 lines for CLAUDE.md
- If over 80 lines: move detailed conventions to `.claude/rules/` files
- If over 120 lines: aggressive pruning — only gotchas, non-default conventions, and commands
- Always warn the user about line count with recommendation

## Phase 2.5: Anti-Patterns Interview

Before generating, ask the user what anti-patterns they want documented.

### 2.5.1 Ask for Anti-Patterns
Use AskUserQuestion:
> "I've analyzed the repo. Before generating CLAUDE.md, are there specific **anti-patterns** or **gotchas** you want documented? These are the highest-value lines — things that look correct but cause real bugs in this project.
>
> Examples:
> - 'Never use useEffect for data fetching — we use TanStack Query'
> - 'Never edit migrations after they've been applied'
> - 'Never use localStorage for auth tokens'
>
> Type your anti-patterns (one per line), or 'skip' to use only what I found automatically."

### 2.5.2 Merge User Anti-Patterns
- If user provides anti-patterns, add them to the rules-agent findings with `source: user-provided`
- User-provided anti-patterns always take priority over auto-discovered ones
- Format them with `**IMPORTANT:**` prefix in the generated CLAUDE.md

## Phase 3: Generate Files

### 3.1 Generate CLAUDE.md
Follow this section order (skip sections with no high-signal content):

```markdown
# [Project Name]

[One-line purpose. Tech stack summary.]

## Tech Stack
[Only non-obvious items. Skip what package.json reveals.]

## Commands
[Exact scripts with flags. Only include non-obvious ones.]

## Conventions
[Non-default patterns only. Include WHY when not obvious.]

## Workflow
[Development process Claude should follow.]

## Verification
[How Claude verifies its own work. CRITICAL section.]

## Anti-Patterns
[Explicit "Never do X" list — highest value section for preventing mistakes.
Both auto-discovered from git history/code and user-provided.]

## Rules
[IMPORTANT: constraints, gotchas, security rules.]

## References
[@imports to detailed docs. Progressive disclosure.]
```

### 3.2 Generate .claude/rules/ Files
Create companion rules files for detailed conventions that didn't fit in CLAUDE.md:

- `coding-conventions.md` — Detailed style, naming, export patterns
- `testing-standards.md` — Test commands, patterns, coverage expectations
- `security-rules.md` — Env handling, secrets, auth patterns (if applicable)
- Additional files as needed per repo

Each rules file should be focused and under 50 lines.

Only generate rules files that have substantive content. Skip empty categories.

### 3.3 Generate Hooks Recommendations (Optional)
If the analysis found patterns better enforced as hooks:
```
Recommended hooks (add to .claude/settings.json):
- PostToolUse: Run formatter after file edits
- PreToolUse: Block writes to migrations/
```

## Phase 4: Present Results

### 4.1 Show Generated CLAUDE.md
Print the full generated file to the terminal with line count.

### 4.2 Show Line Count Warning (if applicable)
If over 80 lines:
```
WARNING: Generated CLAUDE.md is [N] lines (target: 60-80).
Consider moving these sections to .claude/rules/:
- [section] → .claude/rules/[file].md
```

### 4.3 Show Diff Against Existing (if applicable)
If an existing CLAUDE.md was found:
- Show side-by-side comparison of key differences
- Highlight what's new, what's removed, what's changed
- Note any custom rules from the existing file that were preserved

### 4.4 Show Companion Files
List the `.claude/rules/` files that will be created with a summary of each.

### 4.5 Show Hooks Recommendations (if any)

## Phase 5: Write Files (User Approval Required)

Ask the user:
> "Ready to write these files? I'll create:
> 1. CLAUDE.md ([N] lines)
> 2. .claude/rules/coding-conventions.md
> 3. .claude/rules/[other files]
>
> Write all / Write CLAUDE.md only / Edit first / Cancel?"

- **Write all**: Write CLAUDE.md + all rules files
- **Write CLAUDE.md only**: Write just the main file
- **Edit first**: Let user suggest changes, regenerate
- **Cancel**: Done without writing

</workflow>

<formatting>

## Output Style Guidelines

### CLAUDE.md Style
- Use `##` for section headers (not `#` except project name)
- Use `-` for bullet lists, not `*`
- Use backticks for commands, file paths, and code references
- Use `**IMPORTANT:**` or `**MUST:**` for critical rules (increases adherence)
- No emojis
- No horizontal rules between sections (wastes lines)
- Comments after commands use `#` inline: `pnpm test # runs vitest`

### Rules Files Style
- Each file gets a `# Title` header
- Keep under 50 lines per file
- Use concrete examples of DO and DON'T patterns
- Include file path references where relevant

### Diff Display
```
EXISTING                          GENERATED
─────────────────────────────     ─────────────────────────────
## Tech Stack                     ## Tech Stack
- React 18                        - React 18, Next.js 14 (App Router)
- [missing commands section]      ## Commands
                                  pnpm dev    # dev server
                                  pnpm test   # vitest
+ NEW: ## Verification            ## Verification
                                  - Run pnpm test before any task
```

</formatting>

<examples>

## Example: Fresh Repo (No Existing CLAUDE.md)

<example name="fresh-repo">
<input>
User: "Create a CLAUDE.md for this repo"
Repo: Next.js 16 + React 19 + Tailwind 4, no existing CLAUDE.md
</input>
<output>
1. Confirm target: current directory
2. Check for existing: none found
3. Fingerprint: Next.js 16, React 19, TypeScript, Tailwind 4, npm
4. Spawn 5 agents in parallel
5. Synthesize: 65 lines (within target)
6. Present CLAUDE.md + 2 rules files
7. Ask to write
</output>
</example>

## Example: Existing CLAUDE.md (Regenerate)

<example name="existing-claude-md">
<input>
User: "Regenerate CLAUDE.md for this project"
Repo: Python FastAPI app with existing 200-line CLAUDE.md
</input>
<output>
1. Confirm target: current directory
2. Read existing: 200 lines, overly verbose, includes codebase overview
3. Fingerprint: Python, FastAPI, Poetry, PostgreSQL
4. Spawn 5 agents
5. Synthesize: 72 lines (within target, cut codebase overview, moved conventions to rules/)
6. Show diff: highlights removed sections, new Verification section, moved content
7. Present CLAUDE.md + 3 rules files
8. Ask to write
</output>
</example>

## Example: --update Mode (Stale CLAUDE.md)

<example name="update-mode">
<input>
User: "Update CLAUDE.md --update"
Repo: React app, CLAUDE.md written 3 months ago, since then: migrated from jest to vitest, added Playwright e2e, new API middleware pattern
</input>
<output>
1. Confirm target: current directory
2. Read existing CLAUDE.md: 68 lines, last meaningful update ~3 months ago
3. Parse sections: Tech Stack, Commands, Conventions, Rules
4. Spawn 5 update-aware agents (each compares existing content vs current repo state)
5. Staleness report:
   - stack-agent: "vitest replaces jest" (high confidence — package.json + vitest.config.ts)
   - workflow-agent: "2 new scripts: pnpm e2e, pnpm test:coverage" (high — package.json)
   - rules-agent: "New middleware pattern in lib/middleware.ts not documented" (medium)
   - conventions-agent: "All current" (no changes)
   - architecture-agent: "New e2e/ directory not mentioned" (low value — skip)
6. Present targeted diff: 3 updates, 2 additions, 0 removals
7. Ask: Apply updates / Edit first / Full regeneration / Cancel
</output>
</example>

## Example: Monorepo

<example name="monorepo">
<input>
User: "Generate CLAUDE.md for our monorepo"
Repo: Turborepo with apps/web, apps/api, packages/shared
</input>
<output>
1. Confirm target: monorepo root
2. Fingerprint: monorepo (Turborepo), TypeScript, pnpm workspaces
3. Spawn 5 agents (they detect monorepo structure)
4. Synthesize: 78 lines for root CLAUDE.md
5. Suggest: subdirectory CLAUDE.md files for apps/web/ and apps/api/
6. Present root CLAUDE.md + rules files + subdirectory recommendations
7. Ask to write
</output>
</example>

</examples>
