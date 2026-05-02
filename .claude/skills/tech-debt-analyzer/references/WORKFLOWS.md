<!-- Scout Header
Purpose: Detailed workflows and best practices for running tech debt analysis (scheduling, team involvement, reporting)
When to use: When planning or executing a tech debt analysis session and need process guidance
Size: ~125 lines
-->

# Tech Debt Analyzer - Detailed Workflows & Best Practices

## Best Practices

### Analysis Best Practices

1. **Run analysis regularly** (weekly or bi-weekly)
2. **Combine automated + manual review** for comprehensive coverage
3. **Focus on high-churn areas** first for maximum impact
4. **Involve the team** in debt identification
5. **Be objective** - all codebases have debt

### Documentation Best Practices

1. **Be specific** - include file names, line numbers, examples
2. **Explain impact** - why does this matter?
3. **Propose solutions** - don't just complain, suggest fixes
4. **Estimate effort** - helps with prioritization
5. **Track trends** - is debt increasing or decreasing?

### Remediation Best Practices

1. **Fix critical items immediately** - especially security
2. **Allocate consistent time** - 20% of sprint capacity
3. **Celebrate wins** - track and recognize debt reduction
4. **Don't let perfect be the enemy of good** - incremental improvement
5. **Prevent new debt** - easier than fixing old debt

### Communication Best Practices

1. **Make debt visible** - share metrics with stakeholders
2. **Educate on impact** - connect debt to business outcomes
3. **Get buy-in** - explain ROI of debt reduction
4. **Regular updates** - include in sprint reviews
5. **Avoid blame** - focus on improvement, not fault

---

## Example Workflow

Complete workflow from analysis to resolution:

### Week 1: Analysis

```bash
# Run automated analysis
python3 scripts/detect_code_smells.py src --output markdown > debt_analysis.md
python3 scripts/analyze_dependencies.py package.json >> debt_analysis.md

# Manual review of critical areas
# - Authentication logic
# - Payment processing
# - Data models
```

### Week 1-2: Documentation

```bash
# Create debt register from template
cp assets/DEBT_REGISTER_TEMPLATE.md TECHNICAL_DEBT.md

# Add findings to register with:
# - Category and severity
# - Impact assessment
# - Effort estimation
# - Priority assignment
```

### Week 2: Prioritization

```
# Team review session
# - Review all high/critical items
# - Discuss quick wins (high impact, low effort)
# - Allocate sprint capacity
# - Create tickets for top 5 items
```

### Weeks 3-6: Remediation

```
# Sprint work
# - Fix 2-3 debt items per sprint
# - Update debt register as items resolved
# - Create ADRs for major refactoring decisions
# - Monitor metrics
```

### Monthly: Review

```
# Trend analysis
# - Total debt (should decrease)
# - New debt rate (should be low)
# - Age of oldest items (should decrease)
# - Categories most affected

# Adjust strategy based on trends
```

---

## Success Metrics

Track these metrics to measure debt reduction effectiveness:

**Quantity Metrics:**
- Total debt items (trending down)
- Debt by severity (zero critical)
- Debt items per 1000 LOC

**Quality Metrics:**
- Test coverage (trending up)
- Cyclomatic complexity (trending down)
- Average file/function size (stable or decreasing)

**Velocity Metrics:**
- Debt items resolved per sprint
- New debt items per sprint (should be low)
- Time to resolve (should decrease)

**Business Metrics:**
- Bug rate (should decrease)
- Feature delivery speed (should increase)
- Developer satisfaction (should increase)
