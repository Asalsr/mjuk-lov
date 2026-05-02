---
name: explore
description: Helps users clarify vague or early-stage ideas before triage can classify the request. Use when triage confidence is below 70%, when a request is too vague to classify as bug/chore/feature, or when the user says "help me figure out what I need", "I have an idea", or "exploring an idea". Uses AskUserQuestion extensively to gather context incrementally. Triggers on low-confidence triage, vague requests, unclear scope, or explicit exploration requests.
context: fork
compatibility: Designed for Claude Code
metadata:
  author: mjuk-lov
  version: "2.0"
---

# Explore

## Overview

The Explore skill helps users articulate vague or early-stage ideas into clear requirements before triage attempts classification. It prevents mis-classification and reduces back-and-forth by gathering necessary context upfront.

**Core principle:** Understand first, classify second.

## When to Use

<rules>
### Automatic Triggering
- When triage confidence score < 70%
- Request is too vague to classify accurately
- Unclear whether request is bug, chore, or feature
- Insufficient scope information

### Manual Invocation
- User explicitly states they're "exploring an idea"
- User asks "help me figure out what I need"
</rules>

## Exploration Process

<instructions>
<workflow>

### Phase 1: Problem Understanding

**Goal:** Understand what problem the user is trying to solve.

**CRITICAL: Use AskUserQuestion tool for all questions in this phase.**

Ask the user what they're trying to accomplish, with options like:
- Fixing something that's broken → focus on bug exploration
- Improving something that exists → focus on enhancement
- Adding something new → focus on feature exploration
- Removing or cleaning up something → focus on chore

Then ask about current state: existing functionality needing changes, completely new functionality, mix, or not sure.

### Phase 2: Scope Discovery

**Goal:** Define boundaries and understand what's in/out of scope.

**CRITICAL: Use AskUserQuestion tool for all questions.**

Key questions:
- **Impact Area:** Single component (isolated), multiple components, data/database layer, API/backend, multiple areas, or not sure
- **User Impact:** End users, internal team, administrators, background process, or multiple groups

### Phase 3: Requirements Clarification

**Goal:** Gather specific details needed for accurate classification.

**CRITICAL: Use AskUserQuestion tool for all questions.**

Key questions:
- **Success Criteria:** Can describe testable outcomes, has general idea, or needs help defining. If they can describe outcomes, ask for details. If unsure, help define through examples.
- **Priority/Urgency:** Critical (blocking), important (needed soon), nice to have, or exploratory

### Phase 4: Technical Context

**Goal:** Understand technical constraints and existing patterns.

**CRITICAL: Use AskUserQuestion tool for all questions.**

Key questions:
- **Similar Features:** Existing examples to follow? If yes, ask for pointers. If unsure, note for architectural review.
- **Constraints:** Mobile requirements, system integrations, performance needs, security considerations, deadlines

</workflow>
</instructions>

## Completion Criteria

<rules>
### When to Exit Explore and Return to Triage

Exit when ALL of these are true:

- Problem/goal is clearly articulated
- Scope boundaries are defined (in/out)
- User/stakeholder needs are understood
- Impact areas are identified
- Priority/urgency is known
- Request type is apparent (bug/chore/feature)
- Confidence for classification is now 70%+

If confidence < 70% after full exploration, continue asking questions until clarity is achieved.
</rules>

## Output Format

<formatting>
As you gather information, build a structured summary:

```markdown
## Exploration Summary

### Problem Statement
[What the user is trying to solve]

### Current State
[How things work now, if applicable]

### Desired Outcome
[What success looks like]

### Scope
- **In Scope:** [What's included]
- **Out of Scope:** [What's explicitly excluded]

### Impact Areas
- [System areas affected]

### Users/Stakeholders
- [Who benefits or is affected]

### Priority
[Critical/Important/Nice-to-have]

### Technical Context
- **Similar Features:** [Examples, if any]
- **Constraints:** [Technical limitations or requirements]

### Classification Hint
Based on exploration: [Likely Bug/Chore/Feature]
```
</formatting>

## Integration with /start Workflow

<workflow>
The Explore skill is Phase 0 in the `/start` command:

```
/start
  ├─ Phase 0: EXPLORE (this skill, if triage confidence < 70%)
  │     ├─ Problem understanding → Scope → Requirements → Technical context
  │     └─ Build confidence to 70%+
  │
  ├─ Phase 1: TRIAGE (re-run with enriched context)
  │     └─ Classify → Announce → Route
  │
  └─ Continue with appropriate workflow...
```
</workflow>

## Best Practices

<rules>
### DO
- Use AskUserQuestion tool for ALL questions (never ask inline)
- Ask one focused question at a time
- Build understanding incrementally
- Summarize what you've learned periodically
- Adapt questions based on answers
- Exit when confidence is high enough

### DON'T
- Ask questions inline (always use AskUserQuestion)
- Overwhelm user with too many questions at once
- Make assumptions when you can ask
- Exit exploration prematurely
- Force classification before confidence is sufficient
</rules>
