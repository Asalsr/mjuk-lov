<!-- Scout Header
Purpose: Weight tables and scoring adjustments per repo type for AI readiness audits
When to use: During scoring phase of AI readiness audit — adjusts weights by repo type
Size: ~69 lines
-->

# Scoring Methodology

## Weight Tables by Repo Type

Default weights are defined in `audit-criteria.yaml`. The following adjustments apply per detected repo type:

| Category | Default | fullstack | frontend | backend | database | library | monorepo | etl |
|----------|---------|-----------|----------|---------|----------|---------|----------|-----|
| Documentation | 20 | 20 | 20 | 20 | 20 | 25 | 20 | 20 |
| Structure | 20 | 20 | 20 | 20 | 15 | 20 | 25 | 15 |
| Testing | 15 | 15 | 15 | 20 | 10 | 20 | 15 | 10 |
| Context Efficiency | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 |
| AI Tooling | 15 | 15 | 15 | 15 | 15 | 10 | 15 | 15 |
| Version Control | 10 | 10 | 10 | 10 | 15 | 10 | 10 | 15 |
| Safety | 10 | 10 | 10 | 5 | 15 | 5 | 5 | 15 |

**Rationale for adjustments:**
- **database**: Safety/VCS higher (migrations are dangerous), testing lower (harder to unit test)
- **library**: Documentation/testing higher (public API needs both), safety lower (typically no secrets)
- **monorepo**: Structure higher (organization is critical), safety lower (usually has strong CI)
- **etl**: VCS/safety higher (data pipeline errors are costly), structure lower (often script-based)
- **backend**: Testing higher (API contracts matter), safety lower than database

## Score Calculation

### Per-Check Scoring
- **pass**: Full points
- **partial**: Half points (rounded up)
- **fail**: 0 points
- **not_applicable**: Excluded from both earned and possible totals

### Per-Category Score
```
category_score = (earned_points / possible_points) * 100
```
If all checks in a category are N/A, the category weight is redistributed proportionally.

### Overall Score
```
overall_score = sum(category_score * category_weight) / sum(active_weights)
```
Where `active_weights` excludes categories where all checks were N/A.

## Grade Bands

| Grade | Score Range | Label | Description |
|-------|------------|-------|-------------|
| A | 90-100 | AI-Native | Repo is optimized for AI-assisted development |
| B | 75-89 | AI-Ready | Good foundation, minor improvements possible |
| C | 60-74 | AI-Assisted | Works with AI but significant friction exists |
| D | 40-59 | AI-Resistant | Major gaps prevent effective AI collaboration |
| F | 0-39 | AI-Hostile | Fundamental changes needed for AI compatibility |

## Remediation Classification

| Effort | Time Estimate | Criteria |
|--------|--------------|----------|
| quick_win | <1 hour | Config files, .gitignore additions, simple documentation |
| short_term | <1 day | Test commands, CI setup, splitting large files, ADRs |
| strategic | >1 day | Large refactors, test coverage, architectural changes |

## Priority Ranking

Remediation items are sorted by **recoverable points** (descending):
```
recoverable_points = check.points * category_weight_multiplier
```

The top 5 items by recoverable points become "Priority Actions" in the report.
