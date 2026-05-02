---
name: checkpoint-manager
description: Use during complex feature implementation to manage checkpoint pauses, parallel test agent spawning, and phase transitions for features with 10+ tasks or distinct phases. Triggers on "checkpoint", "pause between phases", "break this into stages", "too many tasks", or when a feature has 10+ tasks in its breakdown.
context: fork
compatibility: Designed for Claude Code
metadata:
  author: mjuk-lov
  version: "1.0"
---

# Checkpoint Manager

## Overview

The checkpoint manager skill determines when implementation checkpoints are needed, manages the checkpoint flow, and handles parallel test agent spawning during complex feature development.

**Core principle:** Checkpoints for complex work, continuous flow for simple work.

## When to Use Checkpoints

<rules>
### Use Checkpoints When:

1. **Features with 10+ tasks**
   - Large scope benefits from phase reviews
   - Allows catching issues early

2. **Features with distinct phases**
   - UI → Logic → Integration
   - Data layer → API → Frontend
   - Setup → Core → Polish

3. **Cross-cutting changes**
   - Affects multiple systems
   - Touches shared components
   - Impacts multiple pages/routes

### Don't Use Checkpoints When:

1. **Simple features (<10 tasks)**
   - Overhead exceeds benefit
   - Run to completion

2. **Single-phase implementations**
   - No natural break points
   - Continuous flow is better

3. **Bug fixes and chores**
   - Generally focused work
   - No phase transitions
</rules>

## Checkpoint Decision Logic

<workflow>
```
START: Review task list
   │
   ├─ Count tasks
   │     └─ < 10 tasks → NO CHECKPOINTS
   │
   ├─ Identify phases
   │     └─ Single phase → NO CHECKPOINTS
   │
   ├─ Check scope
   │     └─ Single system → NO CHECKPOINTS
   │
   └─ Multiple phases OR 10+ tasks OR cross-cutting
         └─ USE CHECKPOINTS
```
</workflow>

## Defining Checkpoints

<formatting>
### Task File Format

In the task file, mark checkpoints:

```yaml
---
feature_date: YYMMDD
checkpoints:
  - name: "UI Layout"
    after_task: 5
  - name: "Core Logic"
    after_task: 10
  - name: "Integration"
    after_task: 14
---
```

### Checkpoint Naming

Use descriptive names that indicate what was completed:

| Good Name | Bad Name |
|-----------|----------|
| "UI Layout Complete" | "Checkpoint 1" |
| "Data Layer Ready" | "Halfway point" |
| "API Integration Done" | "Phase 2" |
</formatting>

## Checkpoint Flow

<workflow>
### 1. Approaching Checkpoint

When nearing a checkpoint:

```
[Completing task 5...]

Task 5 complete. This is the end of Phase 1: UI Layout.

Preparing checkpoint summary...
```

### 2. Checkpoint Summary

Present summary of completed phase:

```
## Checkpoint: UI Layout Complete

### Tasks Completed (1-5)
✅ Task 1: Create page layout
✅ Task 2: Add header component
✅ Task 3: Build sidebar navigation
✅ Task 4: Implement card grid
✅ Task 5: Add responsive styles

### Files Changed
- src/pages/Dashboard.tsx (new)
- src/components/Sidebar.tsx (new)
- src/components/CardGrid.tsx (new)
- src/styles/dashboard.css (new)

### Quick Validation
- TypeScript: ✅ No errors
- Lint: ✅ Clean

### Phase Summary
UI foundation is complete. Components render correctly.
No business logic implemented yet.
```

### 3. User Decision Point

Present options:

```
### Next Steps

Phase 2 (Core Logic) is ready to begin.

Options:
[A] Add tests for this phase (runs in parallel)
[B] Continue to Phase 2 (skip tests for now)
[C] Review changes before continuing
```

### 4. Handle User Choice

**Option A: Add Tests (Parallel)**

```
Launching test agent in parallel...
Tests will be written while Phase 2 progresses.

Continuing to Phase 2: Core Logic...
```

**Option B: Continue**

```
Skipping tests for Phase 1.
(Can add later or rely on TEST_PLAN.md)

Continuing to Phase 2: Core Logic...
```

**Option C: Review**

```
Here are the changes for review:

[Show git diff or file summaries]

When ready:
[A] Add tests for this phase
[B] Continue to Phase 2
[R] Request specific changes
```
</workflow>

## Parallel Test Agent

<instructions>
### Spawning Test Agent

When user requests tests:

```javascript
// Use Agent tool with qa-tester skill context
Agent({
  subagent_type: "general-purpose",
  description: "Write tests for Phase 1: UI Layout",
  prompt: `
    Read .claude/skills/qa-tester/SKILL.md for testing guidelines.
    Write tests for the UI components created in Phase 1.

    Files to test:
    - src/pages/Dashboard.tsx
    - src/components/Sidebar.tsx
    - src/components/CardGrid.tsx

    Test scope:
    - Component renders without errors
    - Props are handled correctly
    - Responsive behavior works

    Use existing test patterns from the codebase.
    Create tests in __tests__ folders next to components.
  `
})
```

### Non-Blocking Execution

- Test agent runs in background
- Main implementation continues
- Tests complete asynchronously
- Report results at next checkpoint or end

### Handling Test Agent Results

When test agent completes:

```
## Test Agent Report (Phase 1)

Tests written:
- Dashboard.test.tsx (3 tests)
- Sidebar.test.tsx (4 tests)
- CardGrid.test.tsx (5 tests)

Test run results:
✅ 12/12 tests passing

Tests merged into implementation.
```
</instructions>

## Phase Transition

<workflow>
### Before Transition

<checklist>
Ensure:
- All tasks in phase complete
- Quick validation passed (typecheck, lint)
- Checkpoint summary presented
- User decision captured
</checklist>

### During Transition

```
### Phase Transition: UI Layout → Core Logic

Completed: 5/15 tasks
Remaining: 10 tasks
Test agent: [Running/Not started/Complete]

Starting Phase 2...
```

### After Transition

Continue with next phase tasks immediately.
</workflow>

## Handling Issues at Checkpoints

<instructions>
### Validation Failures

```
## Checkpoint: UI Layout Complete

### Quick Validation
- TypeScript: ❌ 2 errors
- Lint: ⚠️ 3 warnings

Issues found during checkpoint validation:
[List issues]

Options:
[A] Fix issues now (recommended)
[B] Continue anyway (will need fixing later)
```

### User Wants Changes

```
User: "The sidebar should be collapsible"

This is a change to Phase 1 requirements.

Options:
[A] Add collapsible sidebar task to Phase 2
[B] Add to Phase 1 and re-run (extends checkpoint)
[C] Note for future enhancement
```
</instructions>

## Full Example

<examples>
<example>
### Complex Feature with Checkpoints

```
/execute specs/260108-FEATURE-dashboard/

## Task Analysis

Tasks: 15
Phases identified:
- Phase 1: UI Layout (tasks 1-5)
- Phase 2: Data Integration (tasks 6-10)
- Phase 3: Interactivity (tasks 11-15)

Using checkpoints at: Task 5, Task 10, Task 15

Starting Phase 1: UI Layout...

[Tasks 1-5 execute]

─────────────────────────────────────────────
## CHECKPOINT: Phase 1 Complete

### Summary
- 5 tasks completed
- 4 new files created
- TypeScript: ✅ | Lint: ✅

### Next Phase Preview
Phase 2 will add:
- API integration
- Data fetching hooks
- State management

Options:
[A] Add tests (parallel)
[B] Continue
[C] Review
─────────────────────────────────────────────

User: A

Launching test agent for Phase 1...
Continuing to Phase 2: Data Integration...

[Tasks 6-10 execute while test agent runs]

─────────────────────────────────────────────
## CHECKPOINT: Phase 2 Complete

### Summary
- 5 tasks completed
- API hooks added
- Data fetching working

### Test Agent Status (Phase 1)
✅ Complete - 12 tests written, all passing

Options:
[A] Add tests for Phase 2 (parallel)
[B] Continue to Phase 3
[C] Review
─────────────────────────────────────────────

User: B

Continuing to Phase 3: Interactivity...

[Tasks 11-15 execute]

## All Phases Complete

Implementation finished.
Proceeding to Quality Gate...
```
</example>

<example>
## Simple Feature (No Checkpoints)

```
/execute specs/260108-FEATURE-tooltip/

## Task Analysis

Tasks: 4
Single phase: Add tooltip component

No checkpoints needed - running to completion.

[Tasks 1-4 execute continuously]

## Implementation Complete

Proceeding to Quality Gate...
```
</example>
</examples>

## Checkpoint Configuration

<formatting>
### In Task File

```markdown
---
feature_date: 260108
checkpoints:
  - name: "Database Setup"
    after_task: 3
    tests_recommended: true
  - name: "API Layer"
    after_task: 7
    tests_recommended: true
  - name: "Frontend Integration"
    after_task: 12
    tests_recommended: false
---
```

### Checkpoint Properties

<data>
| Property | Description |
|----------|-------------|
| name | Human-readable phase name |
| after_task | Task number after which to pause |
| tests_recommended | Whether to suggest testing |
</data>
</formatting>

## Integration with /execute

<workflow>
Checkpoint manager is part of Phase 4 (Implementation):

```
/execute
  ├─ Phase 1-3: Spec, breakdown, validation
  │
  ├─ Phase 4: Implementation
  │     ├─ Check if checkpoints needed
  │     ├─ If no: Run all tasks continuously
  │     ├─ If yes: CHECKPOINT MANAGER (this skill)
  │     │     ├─ Execute tasks in phase
  │     │     ├─ Pause at checkpoint
  │     │     ├─ Present summary + options
  │     │     ├─ Handle test agent if requested
  │     │     └─ Transition to next phase
  │     └─ Repeat until all phases complete
  │
  └─ Phase 5-8: Quality gate, review, PR
```
</workflow>

## The Bottom Line

**Checkpoints add value for complex work, overhead for simple work.**

Use checkpoints to:
- Give visibility into progress
- Allow course correction
- Enable parallel testing
- Break large work into reviewable chunks

Skip checkpoints when work is focused and straightforward.
