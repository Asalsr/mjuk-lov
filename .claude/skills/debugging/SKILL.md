---
name: debugging
description: Use for any debugging situation - provides systematic four-phase framework (root cause → pattern → hypothesis → implementation) that can be invoked standalone without workflow, ensures understanding before attempting solutions
context: fork
compatibility: Designed for Claude Code
metadata:
  author: mjuk-lov
  version: "1.0"
---

# Systematic Debugging

**Use this skill when:** You encounter any bug, test failure, unexpected behavior, or need to investigate an issue - even in ad-hoc situations outside of formal workflows.

## Overview

Random fixes waste time and create new bugs. Quick patches mask underlying issues.

**Core principle:** ALWAYS find root cause before attempting fixes. Symptom fixes are failure.

**This skill is standalone** - invoke it anytime you need debugging help, whether in `/bug`, `/implement`, `/chore`, or just exploring an issue.

## The Iron Law

<rules>
```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

If you haven't completed Phase 1, you cannot propose fixes.
</rules>

## When to Use This Skill

<rules>
**Invoke for ANY technical issue:**
- Test failures
- Bugs in production or development
- Unexpected behavior
- Performance problems
- Build failures
- Integration issues
- "Why is this happening?" questions
- Ad-hoc investigation requests

**Use this ESPECIALLY when:**
- Under time pressure (emergencies make guessing tempting)
- "Just one quick fix" seems obvious
- You've already tried multiple fixes
- Previous fix didn't work
- You don't fully understand the issue

**Don't skip when:**
- Issue seems simple (simple bugs have root causes too)
- You're in a hurry (systematic is faster than thrashing)
- It's an ad-hoc request (rigor prevents wasted time)
</rules>

## The Four Phases

<workflow>
You MUST complete each phase before proceeding to the next.

### Phase 1: Root Cause Investigation

**BEFORE attempting ANY fix:**

#### 1. Read Error Messages Carefully
- Don't skip past errors or warnings
- They often contain the exact solution
- Read stack traces completely
- Note line numbers, file paths, error codes

#### 2. Reproduce Consistently
- Can you trigger it reliably?
- What are the exact steps?
- Does it happen every time?
- If not reproducible → gather more data, don't guess

**Document reproduction steps:**
```markdown
Steps to reproduce:
1. [Step 1]
2. [Step 2]
3. [Step 3]
Result: [What happens]
Expected: [What should happen]
Frequency: [Every time / Sometimes / Rare]
```

#### 3. Check Recent Changes
- What changed that could cause this?
- Git diff, recent commits
- New dependencies, config changes
- Environmental differences

**Quick git check:**
```bash
git log --oneline --since="1 week ago" -- path/to/file
git diff HEAD~5 -- path/to/file
```

#### 4. Trace Data Flow
- Where does bad value originate?
- What called this with bad value?
- Keep tracing up until you find the source
- Fix at source, not at symptom

**For deep call stack errors:**
- Use the `root-cause-analysis` skill (companion to this skill)
- Trace backward through the call chain
- Find the original trigger, not just the manifestation

#### 5. Gather Evidence in Multi-Component Systems

**When system has multiple components (API → service → database, CI → build → deploy):**

Before proposing fixes, add diagnostic instrumentation:
```
For EACH component boundary:
  - Log what data enters component
  - Log what data exits component
  - Verify environment/config propagation
  - Check state at each layer

Run once to gather evidence showing WHERE it breaks
THEN analyze evidence to identify failing component
THEN investigate that specific component
```

**Example instrumentation:**
```typescript
console.error('DEBUG [ComponentName]:', {
  input: inputData,
  state: currentState,
  environment: process.env.NODE_ENV,
  timestamp: Date.now(),
  stack: new Error().stack,
});
```

**Critical:** Use `console.error()` in tests (not logger - may be suppressed)

---

### Phase 2: Pattern Analysis

**Find the pattern before fixing:**

#### 1. Find Working Examples
- Locate similar working code in same codebase
- What works that's similar to what's broken?
- Compare implementations side-by-side

**Quick search:**
```bash
# Find similar patterns
grep -r "similarPattern" src/
```

#### 2. Compare Against References
- If implementing a pattern, read reference implementation COMPLETELY
- Don't skim - read every line
- Understand the pattern fully before applying
- Check official documentation

#### 3. Identify Differences
- What's different between working and broken?
- List every difference, however small
- Don't assume "that can't matter"

**Create comparison table:**
```markdown
| Aspect | Working Version | Broken Version |
|--------|----------------|----------------|
| [...]  | [...]          | [...]          |
```

#### 4. Understand Dependencies
- What other components does this need?
- What settings, config, environment variables?
- What assumptions does it make?
- Are all dependencies satisfied?

---

### Phase 3: Hypothesis and Testing

**Scientific method:**

#### 1. Form Single Hypothesis
- State clearly: "I think X is the root cause because Y"
- Write it down explicitly
- Be specific, not vague
- Include your evidence

**Template:**
```markdown
## Hypothesis
I think [X is the root cause] because [evidence Y].

Evidence:
- [Observation 1]
- [Observation 2]
- [Comparison with working code]
```

#### 2. Test Minimally
- Make the SMALLEST possible change to test hypothesis
- One variable at a time
- Don't fix multiple things at once
- Can you test without changing code? (config, environment)

#### 3. Verify Before Continuing
- Did it work? Yes → Phase 4
- Didn't work? Form NEW hypothesis (return to Phase 1 with new info)
- DON'T add more fixes on top
- DON'T try random things

#### 4. When You Don't Know
- Say "I don't understand X"
- Don't pretend to know
- Research more
- Ask for help
- It's okay to investigate further

---

### Phase 4: Implementation & Testing

**Fix the root cause, not the symptom:**

#### 1. Create Test Case (If Appropriate)
- Simplest possible reproduction
- Automated test if appropriate
- Manual test script if no framework
- Consider regression test to prevent recurrence

**Not mandatory, but recommended:**
```typescript
it('should not exhibit the bug', () => {
  // Minimal test that would have caught the bug
  expect(buggyBehavior()).toBe(expectedBehavior());
});
```

#### 2. Implement Single Fix
- Address the root cause identified
- ONE change at a time
- No "while I'm here" improvements
- No bundled refactoring

#### 3. Verify Fix
- Test passes now?
- No other tests broken?
- Issue actually resolved?
- Run validation commands

<checklist>
**Validation checklist:**
```bash
npm run lint       # or your linter
npm run test:run   # or your test command
npm run build      # verify build succeeds
# Manual test: [specific reproduction steps]
```
</checklist>

#### 4. If Fix Doesn't Work
- STOP
- Count: How many fixes have you tried?
- If < 3: Return to Phase 1, re-analyze with new information
- **If >= 3: STOP and question the architecture** (see below)
- DON'T attempt Fix #4 without discussion

#### 5. If 3+ Fixes Failed: Question Architecture

**Pattern indicating architectural problem:**
- Each fix reveals new shared state/coupling in different place
- Fixes require "massive refactoring" to implement
- Each fix creates new symptoms elsewhere
- You keep finding "just one more thing"

**STOP and question fundamentals:**
- Is this pattern fundamentally sound?
- Are we "sticking with it through sheer inertia"?
- Should we refactor architecture vs. continue fixing symptoms?
- Is there a simpler way to accomplish the goal?

**Discuss with user before attempting more fixes**

This is NOT a failed hypothesis - this is a wrong architecture.
</workflow>

---

## Red Flags - STOP and Follow Process

<rules>
If you catch yourself thinking:
- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "Add multiple changes, run tests"
- "Skip the test, I'll manually verify"
- "It's probably X, let me fix that"
- "I don't fully understand but this might work"
- "Pattern says X but I'll adapt it differently"
- "Here are the main problems: [lists fixes without investigation]"
- Proposing solutions before tracing data flow
- **"One more fix attempt" (when already tried 2+)**
- **Each fix reveals new problem in different place**

**ALL of these mean: STOP. Return to Phase 1.**

**If 3+ fixes failed:** Question the architecture (see Phase 4.5)
</rules>

---

## Integration with Other Skills

<data>
**Use alongside this skill:**
- **root-cause-analysis** - CRITICAL when error is deep in call stack or data flow
- **condition-based-waiting** - Replace arbitrary timeouts identified in Phase 2
- **verification-before-completion** - Verify fix worked before claiming success

**When to switch skills:**
- If tracing backward through call stack → Use `root-cause-analysis` skill
</data>

---

## Quick Reference Card

<data>
| Phase | Key Question | Success Criteria |
|-------|-------------|------------------|
| **1. Root Cause** | WHY is this happening? | Understand WHAT and WHY, can reproduce |
| **2. Pattern** | What's different from working code? | Identified specific differences |
| **3. Hypothesis** | What do I think is the cause? | Testable hypothesis with evidence |
| **4. Implementation** | Does the fix work? | Bug resolved, tests pass, no regressions |

**If any phase fails:** Return to Phase 1 with new information.
</data>

---

## Output Format

<formatting>
When using this skill, structure your investigation:

```markdown
## Debugging Investigation

### Phase 1: Root Cause Investigation
- **Error/Symptom:** [description]
- **Reproduction:** [steps]
- **Recent Changes:** [git/config changes]
- **Data Flow Trace:** [what called what]
- **Evidence:** [logs, instrumentation output]

### Phase 2: Pattern Analysis
- **Working Examples:** [what works similarly]
- **Reference Implementation:** [if applicable]
- **Differences Identified:** [specific differences]
- **Dependencies:** [what this needs to work]

### Phase 3: Hypothesis
**Hypothesis:** I think [X] is the root cause because [Y].

**Evidence:**
- [Evidence point 1]
- [Evidence point 2]

**Test Plan:** [minimal change to test hypothesis]

### Phase 4: Implementation
- **Fix Applied:** [specific change]
- **Validation:** [test results]
- **Regressions Check:** [other tests status]
- **Conclusion:** [resolved / need new hypothesis]
```
</formatting>

---

## Real-World Impact

<data>
From debugging sessions:
- Systematic approach: 15-30 minutes to fix
- Random fixes approach: 2-3 hours of thrashing
- First-time fix rate: 95% vs 40%
- New bugs introduced: Near zero vs common

**The process saves time, even when it feels slow.**
</data>

---

## Ad-Hoc Usage Examples

<examples>
<example>
<input>
User: "Why is this function returning undefined?"
</input>
<output>
Assistant: "I'm using the debugging skill to investigate this systematically."

[Follows Phase 1-4, even for "simple" issue]
</output>
</example>

<example>
<input>
During /execute workflow:
[Unexpected behavior encountered]
</input>
<output>
Assistant: "I've encountered an unexpected behavior. Using the debugging skill
to investigate before continuing."

[Applies framework within larger workflow]
</output>
</example>

<example>
<input>
User: "Can you debug why the API call is failing?"
</input>
<output>
Assistant: "I'll use the debugging skill to systematically investigate this."

[Complete standalone debugging session]
</output>
</example>
</examples>

---

## Summary

<instructions>
**Starting any debugging task:**
1. Invoke this skill: "I'm using the debugging skill"
2. Follow all four phases in order
3. Don't skip to solutions
4. Document your investigation
5. Use companion skill `root-cause-analysis` if tracing deep call chains

**Remember:** NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST

**This skill works in:**
- `/execute` workflow (automatically integrated for bug plans)
- `/execute` workflow (when bugs arise during implementation)
- standalone ad-hoc debugging requests
- Standalone ad-hoc debugging requests
- Exploratory investigations
</instructions>

---

**Last Updated:** 2025-01-14
**Version:** 1.0
**Companion Skills:** root-cause-analysis, verification-before-completion
