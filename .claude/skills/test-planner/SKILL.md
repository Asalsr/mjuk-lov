---
name: test-planner
description: Use during task breakdown to create TEST_PLAN.md documenting what should be tested, priorities, and scope - without enforcing test creation
context: fork
compatibility: Designed for Claude Code
metadata:
  author: mjuk-lov
  version: "1.0"
---

# Test Planner

## Overview

The test planner skill creates comprehensive TEST_PLAN.md documentation during task breakdown. It documents what SHOULD be tested without enforcing that tests MUST be written, respecting an optional TDD philosophy.

**Core principle:** Document test needs, don't enforce test writing.

**Standards Reference:** See `docs/TEST_STANDARDS.md` for coverage requirements and testing patterns.
**Templates:** See `templates/testing/` for configuration templates.

## When to Use

- During task breakdown in `/execute`
- When creating implementation plans
- When user asks "what should be tested?"
- After implementation to assess coverage gaps

## What Test Planner Does

1. **Analyzes** the feature requirements
2. **Identifies** what should be tested
3. **Prioritizes** tests by importance
4. **Documents** in TEST_PLAN.md
5. **Does NOT** enforce test creation

## TEST_PLAN.md Structure

<formatting>
```markdown
# Test Plan: [Feature Name]

## Overview
Brief description of what's being tested.

## Test Scope

### High Priority (Should Test)
Tests for critical functionality that should be written.

### Medium Priority (Recommended)
Tests that add value but aren't critical.

### Low Priority (Nice to Have)
Tests that could be added for completeness.

## Test Categories

### Unit Tests
- [What to test]
- [What to test]

### Integration Tests
- [What to test]

### E2E Tests (if applicable)
- [What to test]

## Implementation Status
| Test | Priority | Status |
|------|----------|--------|
| ... | HIGH | ⬜ Not written |

## Notes
Any additional context or decisions.
```
</formatting>

## Test Scope Guidelines

<data>
### By Layer

| Layer | Test Scope | Priority |
|-------|------------|----------|
| Business Logic | Comprehensive coverage | HIGH |
| API Endpoints | All endpoints, error cases | HIGH |
| Forms | Validation, submission | MEDIUM |
| Frontend Pages | Page renders, key interactions | MEDIUM |
| Charts (multiple) | Sample ONE representative | LOW |
| Pure UI Components | Snapshot or skip | LOW |

### By Risk

| Risk Level | Test Approach |
|------------|---------------|
| Auth/Security | Full coverage, edge cases |
| Data mutations | Happy path + error cases |
| Calculations | All formulas, edge values |
| Display only | Render test sufficient |
| Static content | Skip or minimal |

### By Complexity

| Complexity | Test Approach |
|------------|---------------|
| Complex logic | Unit tests with many cases |
| Simple CRUD | Integration tests |
| Configuration | May not need tests |
| Styling only | Visual regression or skip |
</data>

## Identifying Test Needs

<rules>
### Step 1: List Components/Functions

For each feature, identify:
```
Components:
- [Component] - [What it does]
- [Component] - [What it does]

Functions:
- [Function] - [What it does]

APIs:
- [Endpoint] - [What it does]
```

### Step 2: Assess Criticality

For each item, ask:
- Does it handle money/auth/data? → HIGH
- Does it have business logic? → HIGH
- Is it user-facing interaction? → MEDIUM
- Is it display only? → LOW

### Step 3: Define Test Scope

For HIGH priority:
```
Test: [Name]
Type: Unit/Integration
Coverage:
  - Happy path
  - Error cases
  - Edge cases
  - Boundary values
```

For MEDIUM priority:
```
Test: [Name]
Type: Unit/Integration
Coverage:
  - Happy path
  - Main error case
```

For LOW priority:
```
Test: [Name]
Type: Render/Snapshot
Coverage:
  - Renders without error
```
</rules>

## TEST_PLAN.md Template

<formatting>
```markdown
# Test Plan: [Feature Name]

**Feature:** [YYMMDD-FEATURE-name]
**Created:** [Date]
**Status:** Planning

## Overview

[1-2 sentence description of what's being built and tested]

## Test Scope

### High Priority (Critical)

These tests cover critical functionality:

#### 1. [Test Area]
- **Type:** Unit/Integration
- **Location:** `src/__tests__/[file].test.ts`
- **What to test:**
  - [ ] [Specific test case]
  - [ ] [Specific test case]
  - [ ] [Error handling case]

#### 2. [Test Area]
- **Type:** Unit
- **Location:** `src/utils/__tests__/[file].test.ts`
- **What to test:**
  - [ ] [Calculation accuracy]
  - [ ] [Edge cases]
  - [ ] [Boundary values]

### Medium Priority (Recommended)

These tests add confidence but aren't critical:

#### 3. [Test Area]
- **Type:** Integration
- **What to test:**
  - [ ] [Happy path]
  - [ ] [Main error case]

### Low Priority (Optional)

Nice-to-have tests:

#### 4. [Test Area]
- **Type:** Render
- **What to test:**
  - [ ] Renders without error

## Test Implementation Status

| # | Test | Priority | Status | Notes |
|---|------|----------|--------|-------|
| 1 | [Name] | HIGH | ⬜ | |
| 2 | [Name] | HIGH | ⬜ | |
| 3 | [Name] | MEDIUM | ⬜ | |
| 4 | [Name] | LOW | ⬜ | Optional |

Status: ⬜ Not written | 🟡 In progress | ✅ Complete | ⏭️ Skipped

## Coverage Notes

### What's Covered
- [Area with good coverage]
- [Area with good coverage]

### What's Not Covered (and why)
- [Area] - [Reason: pure UI, too simple, etc.]

## Testing Decisions

### Why [X] is HIGH priority
[Explanation]

### Why [Y] is skipped
[Explanation]

---
*This plan documents recommended tests. Test implementation is optional per project TDD philosophy.*
```
</formatting>

## Integration with /execute

Test planner runs in Phase 2 (Task Breakdown):

```
/execute
  ├─ Phase 1: Find spec
  │
  ├─ Phase 2: Task Breakdown
  │     ├─ Generate tasks
  │     ├─ TEST PLANNER (this skill)
  │     │     └─ Create TEST_PLAN.md
  │     └─ Organize tasks
  │
  ├─ Phase 3-4: Validation, Implementation
  │
  ├─ Phase 7: Test Coverage Warning
  │     └─ Reference TEST_PLAN.md
  │
  └─ Phase 8: PR (includes TEST_PLAN.md status)
```

## Coverage Warning Integration

After implementation, if no tests written:

```
## ⚠️ Test Coverage Warning

No tests were created for this feature.

TEST_PLAN.md documents what should be tested:
• 2 HIGH priority tests not written
• 3 MEDIUM priority tests not written
• 1 LOW priority test not written

Options:
[A] Add tests now
[B] Proceed without tests (plan remains for future)
[C] Mark specific tests as intentionally skipped
```

## Examples

<examples>
<example>
### Example 1: Data Export Feature

```markdown
# Test Plan: Data Export

**Feature:** 260108-FEATURE-data-export
**Created:** 2026-01-08

## Overview
Export startup data to CSV and Excel formats.

## Test Scope

### High Priority (Critical)

#### 1. Export Service
- **Type:** Unit
- **Location:** `src/services/__tests__/export.test.ts`
- **What to test:**
  - [ ] CSV generation with correct columns
  - [ ] Excel generation with formatting
  - [ ] Large dataset handling (1000+ rows)
  - [ ] Special characters escaped properly
  - [ ] Empty data handled gracefully

#### 2. Download Trigger
- **Type:** Integration
- **Location:** `src/components/__tests__/ExportButton.test.tsx`
- **What to test:**
  - [ ] Click triggers download
  - [ ] Correct filename generated
  - [ ] Loading state during export

### Medium Priority

#### 3. Export Options Form
- **Type:** Unit
- **What to test:**
  - [ ] Format selection works
  - [ ] Column selection works

### Low Priority

#### 4. Export Button UI
- **Type:** Render
- **What to test:**
  - [ ] Button renders with correct icon

## Test Status

| # | Test | Priority | Status |
|---|------|----------|--------|
| 1 | Export Service | HIGH | ⬜ |
| 2 | Download | HIGH | ⬜ |
| 3 | Options Form | MEDIUM | ⬜ |
| 4 | Button UI | LOW | ⬜ |
```
</example>

<example>
### Example 2: Simple Feature (Minimal Plan)

```markdown
# Test Plan: Tooltip Addition

**Feature:** 260108-FEATURE-tooltip
**Created:** 2026-01-08

## Overview
Add tooltips to dashboard cards.

## Test Scope

### Low Priority (Optional)

This feature is purely UI enhancement with no logic.

#### 1. Tooltip Render
- **Type:** Render
- **What to test:**
  - [ ] Tooltip appears on hover

## Test Status

| # | Test | Priority | Status |
|---|------|----------|--------|
| 1 | Tooltip Render | LOW | ⬜ |

## Notes
This is a simple UI addition using existing tooltip component.
No business logic to test. Render test is optional.
```
</example>
</examples>

## Philosophy Reminder

<rules>
The test planner:
- ✅ Documents what SHOULD be tested
- ✅ Prioritizes by importance
- ✅ Provides clear test specifications
- ❌ Does NOT enforce test writing
- ❌ Does NOT block progress without tests
- ❌ Does NOT judge skipped tests

**Test creation is the user's choice.** The plan ensures they know what they're choosing to test or skip.
</rules>

## The Bottom Line

**Plan comprehensively, enforce nothing.**

TEST_PLAN.md serves as:
1. A guide for what to test
2. Documentation of test decisions
3. A reference for future test additions
4. Context for PR reviewers

Whether tests get written is up to the user and their team's practices.
