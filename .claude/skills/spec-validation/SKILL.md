---
name: spec-validation
description: Validates completed implementation against the original PRD/spec to ensure all requirements were met
context: fork
compatibility: Designed for Claude Code
metadata:
  author: mjuk-lov
  version: "1.0"
---

# Spec Validation

## Overview

The spec-validation skill ensures the completed implementation matches the original PRD/spec requirements. It catches gaps, deviations, and missing functionality before code review.

**Core principle:** Verify what was planned matches what was built.

## When to Use

<rules>
- Automatically in `/execute` after implementation (Phase 6.5)
- Before code review and PR creation
- **Only for work with specs** (Features, Bugs with investigation plans, Chores with plans)
- **Not for Quick Fixes** (no spec to validate against)
</rules>

## The Problem This Solves

Without spec validation, common failures include:
- Missing functional requirements
- Incomplete features shipped
- Deviations from architectural decisions
- Open questions left unresolved
- Misalignment between plan and implementation

## Validation Process

<workflow>
### Phase 1: Read the Spec

1. Locate the spec file in `specs/YYMMDD-TYPE-[name]/`
2. Read the complete spec/PRD/plan
3. Extract key requirements:
   - Functional requirements
   - Architectural decisions
   - Technical considerations
   - Success criteria
   - Open questions (if any)

**Note:** If the spec contains a "Staff Engineer Review" section (added by the plan-review skill), treat it as advisory context only. Do NOT validate implementation against its findings — only validate against the plan's own functional requirements, architectural decisions, and technical considerations.

### Phase 2: Compare Implementation

For each requirement category, check implementation:

#### 1. Functional Requirements Check

**For Features (PRD):**
- Read "Functional Requirements" section
- For each requirement, verify implementation exists
- Check file paths, component names, functionality

**For Bugs (Investigation Plan):**
- Read "Expected Fix" section
- Verify bug is resolved
- Check regression prevention measures

**For Chores (Plan):**
- Read "Tasks" or "Changes" section
- Verify each planned change completed
- Check cleanup/refactoring objectives met

#### 2. Architectural Decisions Check

- Read "Architectural Decisions" section
- Verify decisions were followed:
  - Correct components reused
  - Correct libraries used
  - Patterns followed as specified
  - No deviations without reason

#### 3. Technical Considerations Check

- Read "Technical Considerations" section
- Verify considerations addressed:
  - Security requirements met
  - Performance considerations addressed
  - Accessibility guidelines followed
  - Integration points implemented

#### 4. File/Component Check

- Compare planned files vs created files
- Verify key components exist
- Check database changes (if specified)
- Verify API endpoints (if specified)

#### 5. Open Questions Resolution

- Read "Open Questions" section (if exists)
- Verify questions were resolved
- Check how they were addressed
- Ensure no critical questions left unanswered

### Phase 3: Report Findings

Generate structured report with:
- Requirements coverage summary
- Gaps/deviations found
- Severity assessment
- Recommendations
</workflow>

## Validation Checklist

<checklist>
Use this checklist during validation:

```
[ ] All functional requirements implemented?
[ ] Non-goals properly excluded (nothing out-of-scope added)?
[ ] Architectural decisions followed?
[ ] Patterns and components used as specified?
[ ] Libraries adopted as decided?
[ ] Technical considerations addressed?
[ ] All planned files/components created?
[ ] Database changes match spec (if applicable)?
[ ] API endpoints implemented as planned (if applicable)?
[ ] Open questions resolved?
[ ] Success metrics addressable?
```
</checklist>

## Output Format

<formatting>
### Complete Validation Report Template

```markdown
## Spec Validation Report

### Spec Location
`specs/YYMMDD-TYPE-[name]/[filename]`

### Requirements Coverage

| Requirement | Status | Implementation | Notes |
|-------------|--------|----------------|-------|
| FR-1: [Description] | Implemented | File: [path] | [Any notes] |
| FR-2: [Description] | Partial | File: [path] | [What's missing] |
| FR-3: [Description] | Missing | - | [Explanation] |

**Summary:** X/Y requirements fully implemented (Z% coverage)

### Architectural Decisions

| Decision | Status | Notes |
|----------|--------|-------|
| [Decision 1] | Followed | [Evidence] |
| [Decision 2] | Deviation | [What/Why] |

**Summary:** Mostly aligned / Minor deviations / Significant deviations

### Technical Considerations

| Consideration | Status | Notes |
|---------------|--------|-------|
| [Item 1] | Addressed | [How] |
| [Item 2] | Partial | [What's missing] |

### File/Component Check

**Planned Files:**
- `src/components/Feature.tsx` - Created
- `src/hooks/useFeature.ts` - Created
- `src/utils/featureHelper.ts` - Not created (inline logic instead)

**Database Changes:**
- New table created as specified
- Indexes added
- Migration script missing

### Open Questions Resolution

| Question | Resolution | Notes |
|----------|------------|-------|
| [Question 1] | Resolved | [How resolved] |
| [Question 2] | Unresolved | [Impact] |

### Gaps/Deviations Found

#### Critical Issues (must fix)
1. **[Issue 1]:** Description and impact

#### Minor Issues (suggest fixing)
1. **[Issue 1]:** Description
2. **[Issue 2]:** Description

#### Acceptable Deviations
1. **[Deviation 1]:** Why acceptable

### Severity Assessment

**Overall: LOW / MEDIUM / HIGH**

- **LOW:** All critical requirements met, minor deviations acceptable
- **MEDIUM:** Some important requirements missing or significant deviations
- **HIGH:** Critical requirements missing or major deviations

### Recommendation

**[Proceed / Fix Required / User Decision Needed]**

- If PROCEED: Minor issues noted, acceptable to create PR
- If FIX REQUIRED: Critical gaps must be addressed first
- If USER DECISION: Present issues and ask whether to fix or proceed

**IMPORTANT: If user decision is needed, use AskUserQuestion tool.**
```
</formatting>

## Severity Levels

<rules>
### LOW Severity

All of these are true:
- All critical functional requirements implemented
- Architectural decisions followed (minor deviations acceptable)
- No missing core functionality
- May have minor suggestions or optional improvements

**Action:** Proceed to next phase, note suggestions

### MEDIUM Severity

Any of these are true:
- Some functional requirements missing (but not critical)
- Significant deviation from architectural decisions
- Important technical considerations not addressed
- Some files/components missing

**Action:** Present to user for decision (use AskUserQuestion)

### HIGH Severity

Any of these are true:
- Critical functional requirements missing
- Major deviation from spec without justification
- Security/risk requirements not met
- Core functionality incomplete

**Action:** Must fix before proceeding to PR
</rules>

## Integration with /execute

<workflow>
Spec validation runs in Phase 6.5 of `/execute`:

```
/execute
  |-- Phase 4: Implementation
  |-- Phase 5: Quality Gate
  |-- Phase 6: Code Review
  |-- Phase 6.5: SPEC VALIDATION (this skill)
  |     |-- Read spec
  |     |-- Compare implementation
  |     |-- Report gaps/deviations
  |     +-- Assess severity
  |-- Phase 7: Post-Implementation Review
  +-- Phase 9: PR Creation
```
</workflow>

## Best Practices

<rules>
### DO

- Read the complete spec carefully
- Check every functional requirement
- Verify architectural decisions were followed
- Be objective (report facts, not opinions)
- Distinguish critical vs nice-to-have items
- Use AskUserQuestion if user decision needed
- Document acceptable deviations with reasoning

### DON'T

- Skip requirements that "seem obvious"
- Assume missing items were intentional
- Report code style issues here (that's code review)
- Block on minor deviations that don't affect functionality
- Validate against external standards (only against the spec)
- Make decisions about whether to proceed without user input
</rules>

## Examples

<examples>
### Example 1: Feature with Complete Implementation

<example>
```markdown
## Spec Validation Report

### Spec Location
`specs/260114-FEATURE-county-filter/260114-prd-county-filter.md`

### Requirements Coverage

| Requirement | Status | Implementation | Notes |
|-------------|--------|----------------|-------|
| FR-1: Multi-select county filter | Implemented | `src/components/filters/CountyFilter.tsx` | Works as specified |
| FR-2: URL state persistence | Implemented | Using `useSearchParams` | Correct pattern |
| FR-3: Filter reset button | Implemented | In FilterBar component | Integrated well |
| FR-4: Display selected count | Implemented | In filter badge | Clear UX |

**Summary:** 4/4 requirements fully implemented (100% coverage)

### Architectural Decisions

| Decision | Status | Notes |
|----------|--------|-------|
| Reuse existing FilterBar component | Followed | CountyFilter integrated into FilterBar |
| Use multi-select pattern from RegionFilter | Followed | Same component library, consistent UX |
| TanStack Query for data fetching | Followed | `useCounties` hook created |

**Summary:** All decisions followed

### Severity Assessment

**Overall: LOW**

All requirements met, no deviations, excellent alignment with spec.

### Recommendation

**PROCEED** - Ready for post-implementation review and PR creation.
```
</example>

### Example 2: Feature with Missing Requirements

<example>
```markdown
## Spec Validation Report

### Spec Location
`specs/260114-FEATURE-export/260114-prd-export.md`

### Requirements Coverage

| Requirement | Status | Implementation | Notes |
|-------------|--------|----------------|-------|
| FR-1: Export to CSV | Implemented | `src/utils/exportCSV.ts` | Works correctly |
| FR-2: Export to Excel | Implemented | `src/utils/exportExcel.ts` | Works correctly |
| FR-3: Export filtered data only | Partial | Exports all data | Filtering not applied |
| FR-4: Progress indicator | Missing | - | No loading state |

**Summary:** 2/4 requirements fully implemented (50% coverage)

### Gaps/Deviations Found

#### Critical Issues
1. **FR-3 Partial:** Export always exports all data, ignoring active filters. Users expect filtered export.

#### Minor Issues
1. **FR-4 Missing:** No progress indicator for large exports. Could confuse users.

### Severity Assessment

**Overall: MEDIUM**

Core export functionality works, but critical requirement (filtered export) not fully implemented.

### Recommendation

**USER DECISION NEEDED**

Options:
A) Fix FR-3 and FR-4 before proceeding to PR
B) Create PR with FR-3 as known limitation (document in PR)
C) Fix only FR-3 (critical), defer FR-4 to follow-up

**IMPORTANT: Use AskUserQuestion tool to ask the user which option to proceed with.**
```
</example>

### Example 3: Bug Fix with Verification

<example>
```markdown
## Spec Validation Report

### Spec Location
`specs/260114-BUG-login-401/INVESTIGATION_PLAN.md`

### Bug Resolution

| Item | Status | Notes |
|------|--------|-------|
| Root cause identified | Yes | Token expiry not handled |
| Fix implemented | Yes | Added token refresh logic |
| Regression prevention | Yes | Unit tests added |
| Edge cases handled | Partial | Offline scenario not covered |

### Gaps Found

#### Minor Issues
1. **Offline scenario:** If user is offline during token refresh, error is unclear. Not critical but could improve UX.

### Severity Assessment

**Overall: LOW**

Bug is fixed, regression prevention in place. Minor edge case noted for potential follow-up.

### Recommendation

**PROCEED** - Bug resolved effectively. Note offline scenario for future improvement if needed.
```
</example>
</examples>

## Anti-Patterns to Avoid

<rules>
| Don't Do This | Do This Instead |
|---------------|-----------------|
| "Looks good" without checking each requirement | Systematically verify every item |
| Report code style issues | Focus on spec alignment only |
| Block on acceptable deviations | Distinguish critical vs nice-to-have |
| Assume intent without verification | Check implementation explicitly |
| Make proceed/block decisions alone | Use AskUserQuestion for user decision |
| Skip validation for "simple" features | Always validate when spec exists |
</rules>

## The Bottom Line

**Never skip spec validation when a spec exists.**

Spec validation ensures:
1. What was planned matches what was built
2. No requirements silently dropped
3. Architectural decisions were followed
4. User gets what they approved in the plan

The 5-10 minutes spent validating saves hours of rework and prevents incomplete features from shipping.
