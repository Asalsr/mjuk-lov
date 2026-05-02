---
name: duplicate-work-detector
description: Use at the start of any development request to check whether the requested work has already been completed in a merged PR. Searches closed PRs and recent commits using keyword extraction. Stops the workflow and surfaces the PR reference if a strong match is found (score ≥ 70). Silently continues when no match is found. Prevents duplicate implementation effort.
compatibility: Designed for Claude Code
metadata:
  author: mjuk-lov
  version: "1.1"
---

# Duplicate Work Detector

## Overview

Checks whether an incoming ticket or request has already been completed by searching merged PRs and optionally recent commits. When a strong match is found the workflow stops and the user is shown the existing PR. When no match is found the check is invisible and the workflow continues.

**Core principle:** Check before you build. Never duplicate completed work.

## When to Use

- At the very start of `/start` (Phase 0), before Explore and Triage
- When a user pastes a ticket or describes a feature/fix
- Whenever the request might overlap with recent work

## Detection Algorithm

<workflow>

### Step 1: Extract Intent Keywords

From the ticket/request, extract:
- **Nouns**: feature names, component names, page names, entity names
- **Verb phrases**: the action being requested ("add filter", "fix login", "export CSV")
- **Issue references**: any `#NNN` numbers mentioned
- **File/area hints**: specific paths, modules, or domains mentioned

**Minimum threshold:** If fewer than 3 meaningful keywords can be extracted (e.g. request is "fix it" or "make it better"), skip the check entirely and continue silently.

**Compound keyword quoting:** When a keyword is a multi-word phrase (e.g. "CSV export", "county filter"), wrap it in quotes in the `--search` argument to avoid overly broad matches. Use the most specific 1–2 phrases rather than individual common words.

### Step 2: Search Merged PRs

```bash
# Search merged PRs — quote compound phrases to avoid overly broad matches
gh pr list --state merged --limit 50 --json number,title,body,url \
  --search "\"<compound phrase>\" <single-keyword>"

# Also search by issue reference if present
gh pr list --state merged --limit 20 --json number,title,body,url \
  --search "closes #NNN"
```

**Note:** `gh pr list` defaults to the current repository's remote. This is correct in almost all cases. If the user is working from a fork and needs to search the upstream repo, add `--repo owner/repo` explicitly.

If `gh` is unavailable or returns an auth error, skip the check silently and continue.

### Step 3: Search Recent Commits (Supplemental)

Commit history is **optional supplemental evidence only** — it adds +10 to an existing PR's score but is never a reason to skip or abort the check.

```bash
# Search recent commits for matching keywords (supplemental signal)
git log --oneline -100 | grep -i "<keyword>"
```

If `git log` returns no results or errors, ignore and continue scoring based on PR results alone.

### Step 4: Score Each Candidate

For each PR found, calculate a match score (0–100):

| Signal | Points |
|--------|--------|
| PR title contains 2+ keywords | +40 |
| PR body/description contains keywords | +30 |
| Linked issue number matches | +20 |
| Commit message for this PR contains keywords | +10 |

**Threshold:**
- Score ≥ 70 → **match found** → stop workflow
- Score < 70 → **no match** → continue silently

If multiple candidates score ≥ 70, use the highest-scoring one.

</workflow>

## Output Formats

<formatting>

### Match Found (Score ≥ 70)

```
⚠️  This work may already be completed.

Found matching PR: #[number] — "[title]"
URL: [github URL]
Match confidence: [score]%
Matched on: [list of matching keywords]

Please review the PR above. If it covers your request, no further work is needed.

To proceed anyway (e.g. the PR is incomplete or partially addresses this), reply "continue".
```

**Workflow stops here.** Claude waits for explicit "continue" before proceeding to Phase 0.5 (Explore).

### No Match Found (Score < 70)

- Output nothing to the user.
- Continue to Phase 0.5 (Explore if needed) silently.

### Check Skipped

Silently continue in these cases:
- Fewer than 3 meaningful keywords extracted from the request
- `gh` CLI not available
- Repository authentication error

**Note:** `git log` returning no results is NOT a skip condition — PR search continues independently.

</formatting>

## Integration with /start

<workflow>

The duplicate-work-detector runs as **Phase 0** in `/start`, before Explore and Triage. It is fully independent — it requires no prior classification or confidence scoring:

```
/start
  ├─ Phase 0: DUPLICATE WORK DETECTOR (this skill)
  │     ├─ Extract keywords from request
  │     ├─ Search merged PRs (+ optional commit supplemental)
  │     ├─ Score candidates
  │     ├─ Score ≥ 70 → STOP, show PR reference, await "continue"
  │     └─ Score < 70 → silently continue
  │
  ├─ Phase 0.5: EXPLORE (if initial analysis confidence < 70%)
  │
  ├─ Phase 1: TRIAGE
  │     └─ Classify: Quick Fix / Bug / Chore / Feature
  │
  └─ ... rest of workflow
```

</workflow>

## Rules

<rules>

- **Never block a user permanently.** The skill surfaces matches but always allows the user to override with "continue".
- **Never false-stop.** If confidence in the match is below 70, continue silently. A false stop is worse than a missed duplicate.
- **Never alert on open PRs.** Only merged/closed completed PRs are relevant. Work in progress is not duplicate.
- **Keep it invisible on no-match.** The check should add zero noise to the normal workflow when nothing is found.
- **Skip gracefully.** If `gh` fails or is unavailable, skip the check without error messages. Do NOT skip because `git log` is empty.
- **Commit evidence is supplemental.** A PR can score 90 (title+body+issue) with zero commit hits. Never let missing commit results reduce a valid PR match score.

</rules>

## Examples

<examples>

<example name="clear-match-found">
<input>
User: "Add CSV export to the startup explore page, closes #142"
</input>
<output>
Keywords extracted: ["CSV export", "startup explore", "#142"]

gh search: `--search "\"CSV export\" explore`
Finds: PR #87 — "feat: add CSV export for explore page"
Score: title match (+40) + body match (+30) + issue ref #142 (+20) = 90

⚠️  This work may already be completed.

Found matching PR: #87 — "feat: add CSV export for explore page"
URL: https://github.com/org/repo/pull/87
Match confidence: 90%
Matched on: "CSV export", "explore page", "#142"

Please review the PR above. If it covers your request, no further work is needed.

To proceed anyway, reply "continue".
</output>
</example>

<example name="no-match-silent-continue">
<input>
User: "Add a county-level heatmap to the map view"
</input>
<output>
Keywords extracted: ["county-level heatmap", "map view"]

gh search: `--search "\"county-level heatmap\" map"`
Returns no PRs scoring ≥ 70.

git log returns nothing for "heatmap" — ignored, PR search is sufficient.

[No output to user — workflow continues silently to Phase 0.5]
</output>
</example>

<example name="ambiguous-request-skipped">
<input>
User: "Fix it"
</input>
<output>
Keywords extracted: [] (fewer than 3 meaningful keywords)

[Skip check silently — workflow continues to Phase 0.5 Explore due to low initial confidence]
</output>
</example>

<example name="gh-unavailable-skipped">
<input>
User: "Add notification emails when a startup is approved"
</input>
<output>
Keywords extracted: ["notification emails", "startup approved", "notifications"]

gh pr list → error: "gh: command not found"

[Skip check silently — workflow continues to Phase 0.5]
</output>
</example>

<example name="git-log-empty-does-not-skip">
<input>
User: "Add county filter to explore page"
</input>
<output>
Keywords extracted: ["county filter", "explore page"]

gh search finds: PR #44 — "feat: add county filter"
Score so far: title match (+40) + body match (+30) = 70

git log -100 | grep "county" → no results
Commit evidence: +0 (supplemental, absence does not reduce score)

Final score: 70 → match found

⚠️  This work may already be completed.

Found matching PR: #44 — "feat: add county filter"
Match confidence: 70%
Matched on: "county filter", "explore page"

To proceed anyway, reply "continue".
</output>
</example>

<example name="user-overrides-match">
<input>
User types "continue" after seeing the match warning
</input>
<output>
Understood. The existing PR was noted but you've chosen to proceed.

Continuing to Phase 0.5 (Explore if needed)...
[Workflow resumes normally]
</output>
</example>

</examples>

## Common Mistakes to Avoid

<rules>

| Mistake | Correct Approach |
|---------|-----------------|
| Searching open PRs | Only search `--state merged` |
| Stopping on score < 70 | Only stop at ≥ 70 — prefer false negatives over false positives |
| Skipping because `git log` is empty | Only skip for `gh` errors or < 3 keywords |
| Using unquoted compound phrases in `--search` | Quote multi-word phrases: `"\"CSV export\""` |
| Showing "no duplicates found" message | Stay silent on no-match — zero noise |
| Hard-blocking the user | Always accept "continue" to override |
| Crashing when `gh` is unavailable | Catch errors and skip silently |

</rules>
