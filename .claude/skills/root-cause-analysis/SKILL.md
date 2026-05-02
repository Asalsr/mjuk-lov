---
name: root-cause-analysis
description: Use when you need to trace a bug backward from symptom to source through a call stack or data flow. Unlike the debugging skill (broad 4-phase framework for any bug), this skill is specifically for backward tracing — when the symptom is clear but the origin is unknown and likely several layers deep. Triggers on "where does this value come from", "trace this back", "find the source", deep call stack errors, data appearing wrong at point B but correct at point A, or when debugging skill Phase 1 Step 4 needs deeper tracing.
context: fork
compatibility: Designed for Claude Code
metadata:
  author: mjuk-lov
  version: "2.0"
---

# Root Cause Analysis

## Overview

Bugs often manifest far from their source. This skill traces backward through call chains and data flows to find where invalid data originates, then fixes at the source — not the symptom.

**When to use this vs `debugging`:**
- **debugging** = broad 4-phase framework for any bug (reproduce → pattern → hypothesis → fix)
- **root-cause-analysis** = specific technique for backward tracing when you know *what's wrong* but not *where it started*

The debugging skill calls this skill in Phase 1 Step 4 when deep tracing is needed.

## When to Use

<rules>

**Invoke when:**
- Error happens deep in execution (not at entry point)
- Stack trace shows long call chain
- Data is correct at point A but wrong at point B
- "Where does this value come from?"
- Function receives wrong parameters
- File operation in wrong directory (who set the path?)
- Database query with invalid data (who created the record?)
- Debugging multi-layer systems (API → service → database)

</rules>

## The Tracing Process

<workflow>

### Step 1: Document the Symptom

```markdown
## Symptom
- **What:** [Description of the error/unexpected behavior]
- **Where:** [File and line number where it manifests]
- **When:** [Conditions that trigger it]
- **Impact:** [What breaks as a result]
```

### Step 2: Find Immediate Cause

What code directly causes this symptom? What value is wrong?

```markdown
## Immediate Cause
- **Code Location:** [file:line]
- **What Executed:** [function/operation]
- **Invalid Input:** [what value was wrong]
```

### Step 3: Trace Up the Call Chain

Ask "What called this?" at each level. Don't stop at the first caller — keep going.

```markdown
## Call Chain (Bottom to Top)
1. `gitInit(projectDir)` - executed with projectDir=''
2. `WorktreeManager.createSessionWorktree(projectDir, ...)` - passed ''
3. `Session.initializeWorkspace()` - passed ''
4. `Session.create()` - passed ''
5. [Keep tracing up...]
```

**Red flag values to watch for:**
- Empty strings (`''`), `undefined`, `null`
- Default values that shouldn't be defaults
- Hardcoded paths that should be dynamic
- Missing environment variables

### Step 4: Find the Original Trigger

Where does the invalid data actually originate? This is the root cause.

```markdown
## Root Cause
- **Original Source:** [Where bad value originates]
- **Why Invalid:** [Why the value is wrong at source]
- **How It Propagates:** [Path from source to symptom]
- **Fix Location:** [Where to fix - at source!]
```

### Step 5: Fix at Source, Add Defense

Fix at the origin, not the symptom. Then consider adding validation at intermediate layers so this class of bug becomes impossible.

</workflow>

## Advanced Techniques

For detailed patterns and examples, read `references/advanced-techniques.md`:
- **Stack trace instrumentation** — when manual tracing isn't enough
- **Multi-layer system tracing** — UI → API → Service → Database
- **Test pollution detection** — bisection to find which test creates artifacts
- **Tracing patterns** — data flow, configuration, and state mutation patterns
- **Defense in depth** — validation at each layer after fixing root cause

## Output Format

<formatting>

```markdown
## Root Cause Analysis

### Symptom
- What: [Description]
- Where: [Location in code]
- When: [Triggering conditions]

### Call Chain (Bottom to Top)
1. [Innermost call with symptom]
2. [Caller 1]
3. [...]
4. [Original trigger - ROOT CAUSE]

### Root Cause
- Source: [Where invalid data originates]
- Why: [Why it's invalid at source]
- Propagation: [How it travels to symptom]

### Fix Strategy
- Fix Location: [At source, not symptom]
- Change Required: [What to change]
- Defense in Depth: [Validation at intermediate layers]
```

</formatting>

## Quick Reference

<checklist>

1. **Observe** — What's the symptom?
2. **Immediate** — What code directly causes it?
3. **Trace Up** — What called that code? What called THAT?
4. **Keep Going** — Don't stop at first caller!
5. **Find Source** — Where does invalid data originate?
6. **Fix There** — Fix at source, not symptom
7. **Add Defense** — Validate at each layer

</checklist>

## Integration

- **debugging** — This skill is Phase 1, Step 4 of the debugging framework
- **verification-before-completion** — Verify the fix actually works
- **Standalone** — Can be invoked directly for any backward-tracing task
