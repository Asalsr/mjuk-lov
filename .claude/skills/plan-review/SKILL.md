---
name: plan-review
description: Use before finalizing any spec (PRD, bug plan, chore plan) to run a skeptical staff engineer review — checks edge cases, assumptions, simpler alternatives, performance, security, error handling, pre-mortem failure analysis, and repo rules compliance. Verifies plan claims against the codebase. Scales review depth proportionally to plan complexity. Triggers automatically in /start Phase 4.5. Also use when user says "review my plan", "check this spec", "find weaknesses in this PRD", "devil's advocate this plan", or "stress test this spec".
context: fork
compatibility: Designed for Claude Code
metadata:
  author: mjuk-lov
  version: "1.1"
---

# Plan Review Skill

## Overview

A skeptical staff engineer review of implementation plans before the user sees them. Catches weaknesses, verifies claims against the codebase, and validates compliance with repo-specific rules.

**Core principle:** Review adversarially, fix critical issues, note the rest, never block.

## When to Use

- Automatically in `/start` Phase 4.5 (after spec creation, before user review)
- Standalone: invoke on any spec for a fresh adversarial review
- Optionally in `/execute` for re-validation after spec changes

## Adversarial Framing

<instructions>
You are NOT a supportive collaborator reviewing this plan. You are a skeptical staff engineer whose job is to find problems before they reach production. For each major decision in the plan, actively argue against it:

- "Why NOT do it this way?"
- "What's the strongest argument against this choice?"
- "If this plan fails, what was the most likely cause?"

Then assess whether the argument holds. If it does, flag it. If the plan's approach survives your challenge, move on.

Do NOT be obstructionist — genuine concerns only. No nitpicking. Act like a busy senior engineer who has 10 minutes, not a pedantic reviewer who has all day.

**Calibration check:** Before finalizing any finding, ask yourself: "Would a pragmatic staff engineer actually block or push back on this in a real review?" If the answer is "probably not," downgrade or drop the finding.
</instructions>

## Step 1: Determine Review Depth

<workflow>
Read the spec's frontmatter and content to determine proportional review depth:

| Plan Type | Complexity | Lenses Applied | Depth |
|-----------|------------|----------------|-------|
| Bug investigation | Simple | Assumptions, Edge Cases, Repo Rules | Quick scan |
| Chore plan | Simple-Medium | Assumptions, Simpler Alternatives, Repo Rules | Standard |
| Feature PRD | Medium | All 8 lenses | Full review |
| Feature PRD | Complex | All 8 lenses + deep codebase verification | Thorough review |

Detect plan type from:
- Folder name pattern: `YYMMDD-BUG-*`, `YYMMDD-CHORE-*`, `YYMMDD-FEATURE-*`
- Frontmatter `complexity:` field (simple, medium, complex)

**Important:** For Quick scan and Standard reviews, apply a lighter touch. These are simple plans — your job is to catch genuine oversights, not to speculate about unlikely scenarios. See Severity Calibration below.
</workflow>

## Step 2: Load Repo Rules

<workflow>
Before reviewing, read these files to build the repo-specific ruleset for the compliance lens. If any file doesn't exist, skip it gracefully.

1. **CLAUDE.md** / **AGENTS.md** (repo root) — project conventions, tech stack, path rules
2. **docs/TEST_STANDARDS.md** — testing coverage requirements by risk level and layer (if present)
3. **package.json** — existing dependencies (to verify library claims)

After reading each file, write a brief internal summary of the key rules extracted (e.g., "all routes use App Router conventions", "no client components without `'use client'`", "tests required for business logic"). Use this summary as your checklist for the Repo Rules Compliance lens.
</workflow>

## Step 2.5: Acknowledge Plan Quality

<workflow>
Before diving into findings, briefly assess the overall quality of the plan:

- Is the plan well-structured and clearly written?
- Does the root cause analysis (for bugs) or problem statement (for features) make sense?
- Is the proposed approach reasonable for the scope?

**Start the Staff Engineer Review with a one-sentence overall assessment.** Examples:
- "Well-structured bug plan with clear root cause analysis."
- "Solid feature PRD with good scope boundaries."
- "Plan has good coverage but some assumptions need validation."

This grounds the review — findings are improvements on top of a baseline assessment, not a list of everything wrong.
</workflow>

## Step 3: Verify Plan Claims (CRITIC-Inspired Grounded Critique)

<workflow>
Scan the plan for factual claims about the codebase and verify each one:

| Claim Type | Verification Method |
|------------|-------------------|
| "Reuse component X" | `Glob` for X — does it exist? |
| "Extend endpoint Y" | `Glob` + `Read` — does Y exist? What's its signature? |
| "Follow pattern from Z" | `Read` Z — does it actually use that pattern? |
| "Use library L" | Check `package.json` — is L a dependency? |
| "File at path P" | `Glob` for P — does it exist? |

Flag any claim that cannot be verified as an **ASSUMPTION** finding (severity: MEDIUM).
Only do targeted reads — do NOT do broad codebase exploration (that's architectural-review's job).
</workflow>

## Step 4: Run Review Lenses

Apply the lenses determined by review depth. Each lens produces findings classified by severity.

### Lens 1: Edge Cases

<checklist>
What scenarios does the plan not address?
  [] Empty states (no data, first-time user)
  [] Error states (API down, invalid data, permission denied)
  [] Concurrent access (race conditions, stale data)
  [] Data limits (large datasets, pagination needed?)
  [] Offline/network failures (timeout, retry, partial failure)
  [] Boundary values (min/max, zero, negative, very long strings)
</checklist>

### Lens 2: Assumptions

<checklist>
What does the plan assume that might not hold?
  [] Data availability (API always returns expected shape?)
  [] API reliability (what if the service is slow or down?)
  [] User behavior (what if users do something unexpected?)
  [] Browser/device support (what about mobile, older browsers?)
  [] Permissions (what if user doesn't have access?)
  [] Existing code stability (what if referenced code changes?)
</checklist>

### Lens 3: Simpler Alternatives

<checklist>
Is there a less complex way to achieve the same goals?
  [] Fewer components needed? (can existing ones be extended?)
  [] Existing patterns that already solve this? (don't reinvent)
  [] Built-in platform features instead of custom code?
  [] Simpler state management? (useState before useReducer before Zustand)
  [] Fewer API calls? (can data be combined or cached?)
  [] Proportional complexity? (is the solution complexity justified by the problem complexity?)
</checklist>

<instructions>
**Severity calibration for this lens:** Over-engineering and unnecessary complexity findings from this lens are always **MEDIUM at most, never CRITICAL**. Over-engineering is a design/judgement concern — the plan still works, it just has unnecessary complexity. Even extreme over-engineering (e.g., Strategy pattern + caching + feature flags for a simple formatting change) is MEDIUM. CRITICAL is reserved for plans that will *fail*, not plans that are *excessive*.
</instructions>

### Lens 4: Performance

<checklist>
Will this approach scale?
  [] Large datasets (100+ items, 1000+ items?)
  [] Frequent re-renders (is memoization needed and justified?)
  [] Expensive queries (N+1? Missing indexes? Unbounded?)
  [] Bundle size impact (new dependency weight?)
  [] Client vs server (is this computation on the right side?)
</checklist>

### Lens 5: Security

<checklist>
Are there security risks?
  [] Auth/authorization gaps (can unauthorized users access this?)
  [] Input validation at system boundaries (injection, XSS?)
  [] Data exposure (are we leaking sensitive data in responses?)
  [] CSRF/CORS considerations?
  [] RLS policies (if database access is involved)?
  [] Role/privilege escalation (can untrusted input control role assignments or permission levels?)
  [] Predictable identifiers (does the plan use serial/sequential/incrementing IDs where UUIDs are needed for security-sensitive resources?)
  [] Input trust boundaries (which fields come from the request body and could be manipulated by the caller?)
</checklist>

<instructions>
**Subtle security patterns to watch for:**

Beyond obvious issues like "missing auth" or "no RLS", actively look for these commonly-missed patterns:

1. **Role escalation via request body:** If an API accepts a `role`, `permission`, or `access_level` field from the request body, check whether the caller is authorized to assign that role. A non-admin user should not be able to invite someone as admin or escalate their own privileges by controlling untrusted input. Flag any design where role assignment comes from the request body without explicit validation that the caller has permission to grant that role.

2. **Predictable/enumerable identifiers:** If the plan uses `serial`, `integer`, or `incrementing` primary keys for security-sensitive resources (invitations, tokens, access grants, API keys), flag that these are enumerable — an attacker can iterate through sequential IDs to discover or access resources. Recommend UUIDs instead.

3. **Overly permissive access policies:** If an RLS policy or access check uses a broad condition (e.g., "any team member can manage invitations"), check whether the operation actually requires elevated privileges. Operations like inviting with a specific role, deleting resources, or changing settings often need stricter checks than basic membership.
</instructions>

### Lens 6: Error Handling

<checklist>
What happens when things go wrong?
  [] API failures (network error, 500, 404?)
  [] Invalid/unexpected data (null, undefined, wrong type?)
  [] Timeouts (what if an operation takes too long?)
  [] Partial failures (what if step 2 of 3 fails?)
  [] User-facing error messages (are they helpful?)
</checklist>

### Lens 7: Pre-Mortem

<instructions>
This lens uses a fundamentally different cognitive approach. Do NOT analyze what could go wrong — instead, imagine the plan has already failed in production. Work backward:

1. "It's 3 months from now. This feature shipped and it's been a disaster. What happened?"
2. For each imagined failure scenario, ask: "Is anything in this plan preventing this?"
3. If the plan doesn't address the failure mode, flag it.

Pre-mortems surface risks that forward-looking analysis misses because they bypass optimism bias.
</instructions>

<examples>
<example>
<input>
Plan: "Add real-time notifications using WebSocket connection"
</input>
<output>
PRE-MORTEM FINDING (MEDIUM):
"It's 3 months later. Notifications work fine with 10 users but the WebSocket server is overwhelmed with 500 concurrent connections. The plan doesn't address connection limits, reconnection strategy, or graceful degradation to polling."
</output>
</example>
</examples>

### Lens 8: Repo Rules Compliance

<instructions>
Compare the plan against the rules extracted in Step 2. The table below contains **generic example checks** — but the actual rules come from the files you read in Step 2. If the repo has different conventions, use those instead.

**Example checks (adapt to what you found in Step 2):**

| If the plan... | Check that it... |
|----------------|-----------------|
| Adds a new database table | Mentions whatever access-control mechanism the repo uses |
| Touches auth/security | Plans for adequate test coverage per repo standards |
| Adds frontend data access | Uses the repo's designated data-access pattern |
| Adds state management | Justifies why simpler state (useState/useContext) isn't sufficient |
| Proposes a new library | Justifies why existing dependencies don't cover it |
| Adds business logic | Plans for test coverage per repo's TEST_STANDARDS.md |
| Uses data fetching hooks | Follows the repo's established patterns (e.g., query key factories if used) |
| Adds any code | Doesn't plan defensive coding, over-engineering, or backwards-compat hacks |

**If Step 2 found no rules files:** Skip this lens entirely and note "Rules files not available — skipped" in the report.

A repo rule violation in auth/RLS/security areas is automatically CRITICAL severity.
Other rule violations are MEDIUM severity.
</instructions>

## Step 5: Classify and Report Findings

<rules>
### Severity Classification

- **CRITICAL**: Plan will fail or cause serious issues if not addressed. Reserved for:
  - Missing RLS policies on new tables
  - Auth/security gaps (missing authentication, public endpoints without protection)
  - Role/privilege escalation (untrusted input can control role assignments, e.g., request body sets admin role without authorization check)
  - Predictable identifiers on security-sensitive resources (serial IDs on tokens, invitations, or access grants that enable enumeration attacks)
  - Verified false claims (component doesn't exist, library not installed, referenced code is wrong)
  - Architectural contradictions that would cause the plan to fail at implementation time
  - **NOT over-engineering** — excessive complexity, unnecessary patterns, or solving non-existent problems are MEDIUM (see Calibration Rule 6)

- **MEDIUM**: Plan works but has notable weaknesses
  - Over-engineering or unnecessary complexity (excessive abstraction, gratuitous design patterns, solving non-existent problems — regardless of how extreme)
  - Unverified assumptions about codebase
  - Missing error handling for likely failure modes
  - Performance concerns for realistic data volumes
  - Repo rule violations (non-security)
  - Pre-mortem failure modes not addressed

- **LOW**: Minor concern or nice-to-have improvement
  - Edge cases for unlikely scenarios
  - Minor simplification opportunities
  - Style/convention suggestions

### Severity Calibration Rules

**These rules are mandatory and override individual lens outputs:**

1. **CRITICAL requires concrete evidence.** A finding is CRITICAL only if you can point to a specific, verifiable problem — not a speculative "what if" scenario. Ask: "Can I prove this will fail, or am I speculating?" If speculating, it is MEDIUM at most.

2. **Quick scan reviews should rarely produce CRITICAL findings.** Simple bug plans and chores have limited blast radius. The only valid CRITICAL findings for quick-scan plans are:
   - Verified security vulnerabilities (missing auth, RLS, injection)
   - Verified false claims about the codebase (file doesn't exist, wrong API signature)
   - The plan contradicts itself (steps are logically incompatible)

3. **Speculative edge cases are never CRITICAL.** "What if the user does X?" or "What if this other scenario happens?" are MEDIUM at most, LOW if unlikely. The plan author chose a reasonable scope — respect it.

4. **Root cause disagreements are MEDIUM, not CRITICAL.** If you think the plan's root cause analysis might be incomplete but the proposed fix still addresses the stated problem, that is a MEDIUM finding ("consider also checking X"), not a CRITICAL one.

5. **Do not fabricate problems.** If a plan is well-structured and addresses its stated scope competently, it is acceptable to have zero CRITICAL findings. Not every plan has critical issues. Forcing findings where none exist is worse than missing a minor concern.

6. **Over-engineering is never CRITICAL.** Over-engineering, unnecessary complexity, excessive abstraction, gratuitous design patterns (Strategy, Factory, etc.), unnecessary caching (LRU cache for trivial operations), unnecessary infrastructure (feature flags, React Context, codemods for simple changes) — all of these are **MEDIUM at most**. The test for CRITICAL is "will this plan fail or cause serious harm?" Over-engineering does not cause failure — it causes unnecessary complexity and maintenance burden, which is a MEDIUM concern. This rule applies regardless of how extreme the over-engineering is.
</rules>

## Step 6: Apply Fixes and Append Review

<workflow>
### For CRITICAL findings:
1. Suggest specific plan amendments
2. Apply the amendments directly to the spec file (edit the relevant sections)
3. Note what was changed in the review section

### For MEDIUM/LOW findings:
1. Note in the "Staff Engineer Review" section
2. Do NOT modify the plan body

### Always:
1. Append the review section to the end of the spec file
2. Add `plan_review: completed` to the spec's YAML frontmatter
</workflow>

## Output Format

<formatting>
Append this section to the end of the spec file:

```markdown
## Staff Engineer Review

**Reviewer:** Plan Review Skill v1.1
**Review depth:** [Quick scan | Standard | Full | Thorough]
**Lenses applied:** [comma-separated list of lenses used]
**Overall assessment:** [One-sentence quality assessment from Step 2.5]
**Findings:** X total (Y critical, Z medium, W low)

### Critical Findings
[If any — describe the issue, what was amended in the plan, and why]

[If none: "None found."]

### Repo Rules Compliance
[Results of rules check — list violations found, or "All checked rules respected."]
[If rules files not found: "Rules files not available — skipped."]

### Verified Claims
[List of factual claims in the plan that were verified against the codebase]
- "Reuse component X at path/to/X" — ✅ Confirmed exists
- "Use library Y" — ❌ Not found in package.json (MEDIUM finding raised)

[If no verifiable claims: "No verifiable codebase claims found in plan."]

### Medium Findings
[Numbered list of medium-severity concerns]

[If none: "None found."]

### Low Findings
[Numbered list of low-severity notes]

[If none: "None found."]
```
</formatting>

## Auto-Fix Behavior

<rules>
### CRITICAL findings → Fix and note
- Amend the plan directly (edit the spec sections that need changes)
- Document what was changed and why in the Critical Findings section
- Follow the task-validator pattern: "fix and proceed, ask only when uncertain"

### MEDIUM findings → Note only
- Record in the Medium Findings section
- Do NOT modify the plan body
- User decides whether to address them

### LOW findings → Note only
- Record in the Low Findings section
- Do NOT modify the plan body

### When uncertain about a CRITICAL fix:
Use AskUserQuestion:
```
I found a critical issue in the plan:
[Describe issue]

Suggested fix: [Fix]

Should I apply this fix to the spec? [Yes] [No] [Discuss]
```

### Never block the workflow
- Always proceed after review, even if findings exist
- The user will see all findings in the appended review section
- User decides which MEDIUM/LOW items to address
</rules>

## Integration with /start

<workflow>
Plan review runs as Phase 4.5 of `/start`:

```
/start
  ├─ Phase 0: Duplicate check
  ├─ Phase 0.5: Explore (if needed)
  ├─ Phase 1: Triage
  ├─ Phase 2: Route
  ├─ Phase 3: Architectural review (features)
  ├─ Phase 4: Create spec/PRD
  │
  ├─ Phase 4.5: PLAN REVIEW (this skill)
  │     ├─ Determine review depth
  │     ├─ Load repo rules
  │     ├─ Assess overall plan quality
  │     ├─ Verify plan claims
  │     ├─ Run applicable lenses
  │     ├─ Calibrate severity (apply Severity Calibration Rules)
  │     ├─ Fix CRITICAL issues
  │     └─ Append review section
  │
  └─ Phase 5: STOP for user review
```
</workflow>

## Examples

<examples>
### Example 1: Feature PRD — Critical Finding Fixed

<example>
<input>
PRD says: "Add a new API route POST /api/notifications that creates a notification record"
Plan does not mention authentication or authorization checks on the route.
Repo CLAUDE.md says: "All mutating API routes must verify the caller's session before performing any side effect."
</input>
<output>
CRITICAL FINDING:
Plan adds a new mutating API route but does not mention authentication or authorization.

Per repo rules (CLAUDE.md): "All mutating API routes must verify the caller's session before performing any side effect."

AUTO-FIX APPLIED:
Added to Phase 1 of the plan: "Verify the request's session at the top of POST /api/notifications and reject unauthenticated requests with a 401 before any record is created."
</output>
</example>

### Example 2: Bug Plan — Quick Scan, Clean

<example>
<input>
Bug plan for "Mobile nav menu doesn't close on navigation"
Complexity: simple
Root cause: useEffect depends on pathname but not hash changes
Fix: add onClick handler to close menu on link click
</input>
<output>
## Staff Engineer Review

**Reviewer:** Plan Review Skill v1.1
**Review depth:** Quick scan
**Lenses applied:** Assumptions, Edge Cases, Repo Rules
**Overall assessment:** Well-structured bug plan with clear root cause analysis and a straightforward fix.
**Findings:** 0 total (0 critical, 0 medium, 0 low)

### Critical Findings
None found.

### Repo Rules Compliance
All checked rules respected.

### Verified Claims
No verifiable codebase claims found in plan.

### Medium Findings
None found.

### Low Findings
None found.
</output>
</example>

### Example 3: Feature PRD — Unverified Claim

<example>
<input>
PRD says: "Reuse the existing ChartContainer component at src/components/charts/ChartContainer.tsx"
Glob search: No file found at that path.
</input>
<output>
VERIFIED CLAIMS:
- "Reuse ChartContainer at src/components/charts/ChartContainer.tsx" — ❌ NOT FOUND

MEDIUM FINDING:
Plan references `ChartContainer` component but it does not exist at the specified path. Searched with Glob — no matches. This may be a hallucinated reference. The plan should specify creating this component or identify the actual existing component to reuse.
</output>
</example>

### Example 4: Pre-Mortem Finding

<example>
<input>
Feature PRD for "Real-time collaborative editing"
Plan proposes WebSocket connections for each user editing a document.
</input>
<output>
PRE-MORTEM (MEDIUM):
"It's 3 months later. Two users edited the same paragraph simultaneously and their changes were silently lost. The plan doesn't address conflict resolution — it assumes users won't edit the same content at the same time."

Suggested consideration: Add conflict resolution strategy (OT, CRDT, or last-write-wins with warning).
</output>
</example>

### Example 5: Role Escalation via Request Body

<example>
<input>
Feature PRD for "Team Invitation System"
API endpoint accepts `{ team_id, email, role }` from request body.
RLS policy allows any team member to insert invitations.
</input>
<output>
CRITICAL FINDING — Role Escalation via Untrusted Input:
The send-invitation API accepts `role` from the request body, and the RLS policy allows any team member to manage invitations. This means a non-admin team member can invite someone with `role: 'admin'`, escalating privileges. The role parameter from the request body must be validated against the caller's own permission level — only admins should be able to invite with admin role.

MEDIUM FINDING — Predictable Identifiers:
The invitations table uses `id serial PRIMARY KEY`. Serial IDs are sequential and enumerable, allowing attackers to iterate through invitation IDs to discover or access invitations. Use UUID primary keys for security-sensitive resources like invitations.
</output>
</example>
</examples>

## The Bottom Line

**Review adversarially, verify factually, fix critically, note the rest, never block.**

The goal is to catch genuine plan weaknesses — not to nitpick or block progress. Most plans are mostly right. Find the parts that aren't and make them better before the user reviews. **A clean plan with zero findings is a good outcome, not a missed opportunity.**
