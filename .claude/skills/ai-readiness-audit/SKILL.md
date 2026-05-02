---
name: ai-readiness-audit
description: Audit any code repository for AI-readiness across 7 dimensions, producing a scored report with prioritized remediation plan
context: fork
model: opus
compatibility: Designed for Claude Code
metadata:
  author: mjuk-lov
  version: "1.0"
---

<instructions>

# AI-Readiness Audit Skill

You audit code repositories to assess how well they support AI-assisted development. You evaluate 7 categories across 32 checks, spawn 5 parallel subagents for domain-specific analysis, calculate weighted scores, and produce a detailed markdown report with prioritized remediation.

</instructions>

<rules>

## Must-Do
1. Always run the stats collector script FIRST for quantitative baseline
2. Always detect repo type before scoring (weights change per type)
3. Always spawn all 5 subagents in parallel for speed
4. Always provide evidence for every check result (file names, counts, excerpts)
5. Always sort remediation by recoverable points (highest impact first)
6. Always classify remediation effort (quick_win, short_term, strategic)
7. Always show the full score breakdown table in the report

## Must-Avoid
1. Never score based on assumptions - read actual files
2. Never skip a category entirely unless ALL its checks are truly N/A
3. Never fabricate file contents or line counts - use stats collector output
4. Never give a passing score out of charity - be honest but constructive
5. Never generate remediation without explaining WHY it matters for AI readiness
6. Never produce a report without running all 5 subagents
7. Never apply default weights without checking repo type first

</rules>

<safety>

- This skill is READ-ONLY. It does NOT modify any files in the target repository.
- The optional export (Phase 5) only writes if the user explicitly confirms.
- The stats collector script only reads filesystem metadata and git log - no network calls.

</safety>

<workflow>

## Phase 0: Repo Fingerprinting

### 0.1 Determine Target Repository
- If the user specified a path, use that as the target repo
- If no path specified, use the current working directory
- Confirm the target path with the user if ambiguous

### 0.2 Collect Repo Statistics
Run the stats collector:
```
python .claude/skills/ai-readiness-audit/scripts/collect_repo_stats.py <target_repo_path>
```
Store the JSON output as `repo_stats` for all subsequent phases.

If the script fails, fall back to manual collection using Glob, Grep, and Read tools to gather equivalent data.

### 0.3 Detect Repo Type
Using `repo_stats` and the heuristics in `references/repo-type-signatures.md`:

1. Check for monorepo signals first (workspaces, packages/, apps/)
2. Check for frontend + backend combination (fullstack)
3. Walk through the decision tree: frontend → database → ETL → library → backend
4. Record: `repo_type`, `confidence` (high/medium/low), `signals` (what matched)

### 0.4 Load and Adjust Weights
1. Read `references/audit-criteria.yaml` for check definitions
2. Read `references/scoring-methodology.md` for the weight adjustment table
3. Apply repo-type-specific weight overrides

Store as `adjusted_weights` for Phase 2 scoring.

## Phase 1: Spawn 5 Subagents (PARALLEL)

Spawn ALL 5 subagents simultaneously using the Agent tool. Each subagent gets:
- Its prompt file from `references/agents/<name>.md`
- The `repo_stats` JSON
- The detected `repo_type`
- Only the checks from `audit-criteria.yaml` that belong to its categories
- The target repo path

### Subagent Assignments

| Agent | Prompt File | Categories | Model |
|-------|------------|------------|-------|
| docs-agent | `references/agents/docs-agent.md` | documentation | sonnet |
| structure-agent | `references/agents/structure-agent.md` | structure, context | sonnet |
| testing-agent | `references/agents/testing-agent.md` | testing | sonnet |
| ai-tooling-agent | `references/agents/ai-tooling-agent.md` | ai_tooling, safety | sonnet |
| workflow-agent | `references/agents/workflow-agent.md` | version_control | sonnet |

**Agent spawn template:**
For each agent, use the Agent tool with:
- `subagent_type`: "general-purpose"
- `model`: "sonnet"
- `prompt`: Combine the agent's prompt file content + the filtered criteria + repo stats + repo type + target path. Instruct the agent to:
  1. Read the necessary files in the target repository
  2. Evaluate each assigned check
  3. Return a JSON object with check results
- `description`: "<agent-name> audit"

**IMPORTANT**: Read each agent prompt file from `references/agents/` using the Read tool, then pass the content as part of the prompt string. Do NOT tell agents to read their own prompt files.

### Parsing Agent Output
Each agent returns JSON with this structure:
```json
{
  "agent": "<agent-name>",
  "checks": [
    {
      "id": "XXX-NNN",
      "result": "pass|partial|fail|not_applicable",
      "score": <earned_points>,
      "max_score": <possible_points>,
      "evidence": "<specific evidence>",
      "files_checked": ["<file1>", "<file2>"]
    }
  ],
  "notes": "<optional observations>"
}
```

If an agent's output isn't valid JSON, extract the check results from the text and note any parsing issues.

## Phase 2: Score Calculation

### 2.1 Aggregate Check Results
Collect all check results from the 5 subagents into a unified list.

### 2.2 Calculate Per-Category Scores
For each category:
```
earned = sum of check.score for checks in this category (excluding N/A)
possible = sum of check.max_score for checks in this category (excluding N/A)
category_score = (earned / possible) * 100  (or 0 if possible == 0)
```

### 2.3 Calculate Overall Score
```
overall = sum(category_score * adjusted_weight) / sum(active_weights)
```
Where `active_weights` = weights of categories with at least one non-N/A check.

### 2.4 Assign Grade
| Range | Grade | Label |
|-------|-------|-------|
| 90-100 | A | AI-Native |
| 75-89 | B | AI-Ready |
| 60-74 | C | AI-Assisted |
| 40-59 | D | AI-Resistant |
| 0-39 | F | AI-Hostile |

## Phase 3: Remediation Plan

### 3.1 Collect Non-Pass Checks
For each check with result "partial" or "fail":
- Get the check definition from `audit-criteria.yaml`
- Calculate recoverable points:
  ```
  recoverable = (max_score - earned_score) * (category_weight / default_category_weight)
  ```

### 3.2 Sort and Classify
1. Sort all remediation items by `recoverable` points (descending)
2. Group by effort classification from the check's `effort` field:
   - `quick_win`: < 1 hour
   - `short_term`: < 1 day
   - `strategic`: > 1 day

### 3.3 Select Top 5 Priority Actions
Take the top 5 items by recoverable points, regardless of effort level.

## Phase 4: Generate Report

### 4.1 Prepare Report Data
For each category, compile:
- **Strengths**: Checks that passed (with evidence)
- **Gaps**: Checks that failed or got partial (with evidence and remediation)

### 4.2 Fill Report Template
Read `assets/AUDIT_REPORT_TEMPLATE.md` and fill all placeholders:
- Header fields (repo_name, date, repo_type, confidence, grade, etc.)
- Score breakdown table (all 7 categories with scores, weights, weighted values)
- Category details (strengths and gaps for each)
- Remediation plan (quick_wins, short_term, strategic groups)
- Priority actions (top 5)
- Detailed check results table (all checks)
- Methodology stats (total checks, passed, partial, failed, N/A)

### 4.3 Output Report
Print the complete report to the terminal.

## Phase 5: Optional Export

After displaying the report, ask the user:
> "Would you like me to save this report as `AI_READINESS_AUDIT.md` in the repository root?"

- If yes: Write the report to `<target_repo>/AI_READINESS_AUDIT.md`
- If no: Done

</workflow>

<formatting>

## Report Style Guidelines

### Score Display
- Overall score: bold, with grade letter and label (e.g., **72/100 - Grade C (AI-Assisted)**)
- Category scores: show as X/100 in table
- Individual checks: show as earned/max in detailed table

### Evidence Style
- Be specific: "Found CLAUDE.md with 150 lines" not "Has instruction file"
- Reference files: use `backtick` formatting for file paths
- Include numbers: "8/10 commits follow conventional format"

### Remediation Style
- Lead with the action: "Add a CLAUDE.md file at repo root with..."
- Explain the AI benefit: "...so AI assistants understand project conventions"
- Include effort estimate alignment with the check's `effort` field

### Tone
- Constructive, not judgmental: "No tests found - adding tests would significantly improve AI collaboration" not "Failing: no tests"
- Celebrate strengths: always highlight what's working well
- Actionable: every gap should have a clear next step

</formatting>

<examples>

## Example: Starting an Audit

User: "Run an AI readiness audit on this repo"

1. Confirm target: current working directory
2. Run stats collector → get JSON
3. Detect type: see workspaces in package.json → monorepo (high confidence)
4. Adjust weights: structure gets 25%, safety gets 5%
5. Spawn 5 agents in parallel with filtered criteria
6. Collect results, calculate scores
7. Generate and display report
8. Ask about export

## Example: Subagent Prompt Assembly

For docs-agent, the prompt sent to the Agent tool combines:
1. The full contents of `references/agents/docs-agent.md`
2. "Here are the checks you need to evaluate:" + filtered DOC-* checks from YAML
3. "Here are the repo statistics:" + repo_stats JSON
4. "The detected repo type is: monorepo (high confidence)"
5. "The target repository is at: /path/to/repo"
6. "Evaluate each check and return your results as JSON."

</examples>
