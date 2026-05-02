<!-- Scout Header
Purpose: JSON output schemas for each design transplant subagent (Discovery, Analyst, Wiring, Security, Verification)
When to use: When spawning subagents — pass relevant schema section as output format requirement
Size: ~412 lines
-->

# Design Transplant Output Schemas

> Structured JSON schemas for each sub-agent's output. The orchestrator uses these
> to coordinate phases and synthesize the final report.

---

## Transplant Map (Discovery Agent)

The foundational artifact. All subsequent phases reference this.

```json
{
  "schema_version": "1.0",
  "source": {
    "repo_path": "/absolute/path/to/source",
    "page_component": "src/components/dashboard/CapitalFlows.tsx",
    "sub_components": ["src/components/dashboard/capital/FlowChart.tsx"],
    "colors_used": [
      { "value": "text-green-500", "type": "tailwind", "context": "positive indicator" },
      { "value": "#4A90D9", "type": "hex", "context": "chart bar color" }
    ],
    "imports": ["react", "recharts", "lucide-react"]
  },
  "target": {
    "repo_path": "/absolute/path/to/target",
    "page_component": "src/components/dashboard/CapitalFlows.tsx",
    "page_wrapper": "src/pages/CapitalFlowsPage.tsx",
    "sub_components": ["src/components/dashboard/capital/FlowChart.tsx"]
  },
  "design_system": {
    "tailwind_config": "tailwind.config.ts",
    "css_file": "src/index.css",
    "custom_colors": {
      "status-positive": "hsl(var(--status-positive))",
      "status-negative": "hsl(var(--status-negative))",
      "chart-1": "hsl(var(--chart-1))"
    },
    "chart_color_hook": "src/hooks/useChartColors.ts",
    "dark_mode": true,
    "ui_primitives": ["Button", "Card", "Table", "Skeleton", "Badge"]
  },
  "token_mapping": [
    {
      "source": "text-green-500",
      "target": "text-status-positive",
      "confidence": "high",
      "context": "positive/growth indicators"
    },
    {
      "source": "#4A90D9",
      "target": "useChartColors().palette[0]",
      "confidence": "medium",
      "context": "chart color — verify index"
    }
  ],
  "component_mapping": [
    {
      "source_element": "<table>",
      "target_equivalent": "<Table> from @/components/ui/table",
      "action": "replace"
    },
    {
      "source_element": "CustomTooltip",
      "target_equivalent": null,
      "action": "create_new"
    }
  ],
  "frozen_files": [
    { "pattern": "src/contexts/Auth*", "category": "auth" },
    { "pattern": "src/lib/*-client*", "category": "infra" },
    { "pattern": "src/services/*.ts", "category": "services" },
    { "pattern": "src/hooks/data/*.ts", "category": "data-hooks" },
    { "pattern": "src/components/error-boundary/*", "category": "error-handling" },
    { "pattern": "src/config/*", "category": "config" }
  ],
  "data_access": {
    "primary_surface": "dashboard",
    "allowed_surfaces": ["dashboard"],
    "forbidden_surfaces": ["core", "admin", "web", "auth"],
    "data_access_hierarchy": "Component → Hook → Service → primary data surface",
    "discovered_patterns": [
      "<data-client>.from('v_kpi_*')",
      "<data-client>.from('v_chart_*')"
    ],
    "access_control_notes": "Document the data layer's access-control model (e.g., row-level policies, scoped RPC, per-tenant filters)."
  },
  "quality_commands": {
    "typecheck": "npm run typecheck",
    "lint": "npm run lint",
    "test": "npm run test:run",
    "build": "npm run build"
  },
  "manual_review": [
    {
      "item": "#F5A623 hex color",
      "reason": "No matching semantic token found in target",
      "suggestion": "Add to tailwind.config.ts or use closest match"
    }
  ]
}
```

### Field Definitions

| Field | Required | Notes |
|-------|----------|-------|
| `schema_version` | YES | Always `"1.0"` |
| `source` | YES | Source repo metadata and component info |
| `target` | YES | Target repo metadata and component info |
| `design_system` | YES | Target's design system discovery results |
| `token_mapping` | YES | Color conversion rules (empty array if none needed) |
| `component_mapping` | YES | Element substitution rules |
| `frozen_files` | YES | Auto-detected files that must not be modified |
| `schema_access` | YES | Database access patterns (set `primary_schema: null` if no DB) |
| `quality_commands` | YES | Commands to run for verification |
| `manual_review` | YES | Items needing human judgment (empty array if none) |

---

## Structural Comparison (Design Analyst)

```json
{
  "schema_version": "1.0",
  "agent": "design-analyst",
  "layout_changes": {
    "source_layout": "2-column grid with sidebar",
    "target_layout": "single column stack",
    "change_type": "major"
  },
  "new_elements": [
    {
      "element": "StatsSummaryCard",
      "location": "div > Grid > first child",
      "description": "New KPI summary card at top of page",
      "action_needed": "Create new component in target"
    }
  ],
  "removed_elements": [
    {
      "element": "LegacyFilters",
      "location": "div > header > FilterBar",
      "description": "Old filter bar replaced with inline filters",
      "conflict_warning": false
    }
  ],
  "reorganized_elements": [
    {
      "element": "MainChart",
      "from": "full-width section",
      "to": "left column of 2-col grid",
      "description": "Chart moved into grid layout"
    }
  ],
  "conflict_warnings": [
    {
      "element": "LoadingOverlay",
      "issue": "Source removes the container that wraps loading state in target",
      "target_line": 45,
      "recommendation": "Preserve loading wrapper, update inner content only"
    }
  ]
}
```

---

## Backend Wiring Inventory (Backend Wiring Agent)

```json
{
  "schema_version": "1.0",
  "agent": "backend-wiring",
  "hooks": [
    {
      "name": "useCapitalFlows",
      "type": "useQuery",
      "query_key": ["capital-flows", filters],
      "returns": ["data", "isLoading", "error"],
      "line": 12,
      "code": "const { data, isLoading, error } = useCapitalFlows(filters)"
    }
  ],
  "service_calls": [
    {
      "service": "capitalService",
      "method": "getFlows",
      "import_path": "@/services/capitalService",
      "line": 5
    }
  ],
  "auth_usage": [
    {
      "hook": "useAuth",
      "destructured": ["user", "role"],
      "conditional_renders": ["role === 'admin' && <AdminPanel />"],
      "line": 8
    }
  ],
  "i18n": {
    "hook": "useTranslation",
    "namespace": "capital",
    "keys": ["title", "subtitle", "no_data", "loading"],
    "line": 10
  },
  "loading_states": [
    {
      "condition": "isLoading",
      "component": "<CapitalFlowsSkeleton />",
      "line": 25,
      "code": "if (isLoading) return <CapitalFlowsSkeleton />"
    }
  ],
  "error_states": [
    {
      "condition": "error",
      "component": "<ChartEmptyState error={error} />",
      "line": 28,
      "code": "if (error) return <ChartEmptyState error={error} />"
    }
  ],
  "accessibility": [
    {
      "type": "aria-label",
      "element": "main chart container",
      "value": "aria-label={t('chart_label')}",
      "line": 35
    }
  ],
  "toast_usage": [
    {
      "hook": "useToast",
      "calls": ["toast({ title: t('export_success') })"],
      "line": 15
    }
  ]
}
```

---

## DB Security Findings (DB Security Agent)

```json
{
  "schema_version": "1.0",
  "agent": "db-security",
  "status": "clean",
  "allowed_schema": "dashboard",
  "data_access_hierarchy": "Component → Hook → Service → dashboard view",
  "findings": []
}
```

When violations are found:

```json
{
  "schema_version": "1.0",
  "agent": "db-security",
  "status": "violations_found",
  "allowed_schema": "dashboard",
  "data_access_hierarchy": "Component → Hook → Service → dashboard view",
  "findings": [
    {
      "severity": "blocker",
      "type": "schema_violation",
      "file": "src/components/dashboard/CapitalFlows.tsx",
      "line": 42,
      "violation": "<data-client>.from('core.organisations')",
      "expected": "Use the dashboard data surface via the service method",
      "recommendation": "Replace with capitalService.getOrganisations() which queries the dashboard surface"
    },
    {
      "severity": "warning",
      "type": "unfamiliar_pattern",
      "file": "src/components/dashboard/CapitalFlows.tsx",
      "line": 67,
      "violation": "<data-client>.rpc('custom_aggregation')",
      "expected": "Function not found in target's existing surface",
      "recommendation": "Verify this exists in the target's data layer and respects its access-control rules"
    }
  ]
}
```

### Status Values

| Status | Meaning |
|--------|---------|
| `clean` | No violations found |
| `violations_found` | One or more violations detected |
| `not_applicable` | No database access patterns in target (pure frontend) |

---

## Verification Findings (Verification Agent)

```json
{
  "schema_version": "1.0",
  "agent": "verification",
  "overall_status": "pass",
  "checks": {
    "frozen_files": {
      "status": "pass",
      "findings": []
    },
    "color_conversion": {
      "status": "pass",
      "findings": []
    },
    "backend_wiring": {
      "status": "pass",
      "inventory_available": true,
      "findings": []
    },
    "source_imports": {
      "status": "pass",
      "findings": []
    },
    "common_mistakes": {
      "status": "pass",
      "findings": []
    },
    "quality_commands": {
      "typecheck": "pass",
      "lint": "pass",
      "test": "pass",
      "output": ""
    }
  }
}
```

When issues are found:

```json
{
  "schema_version": "1.0",
  "agent": "verification",
  "overall_status": "fail",
  "checks": {
    "frozen_files": {
      "status": "fail",
      "findings": [
        {
          "severity": "blocker",
          "file": "src/services/capitalService.ts",
          "line": 0,
          "issue": "Frozen file modified — service files must not change during transplant",
          "fix": "Revert changes to this file"
        }
      ]
    },
    "color_conversion": {
      "status": "warning",
      "findings": [
        {
          "severity": "warning",
          "file": "src/components/dashboard/CapitalFlows.tsx",
          "line": 89,
          "issue": "Hardcoded color remaining: text-green-600",
          "fix": "Replace with text-status-positive per token mapping"
        }
      ]
    },
    "backend_wiring": {
      "status": "fail",
      "inventory_available": true,
      "findings": [
        {
          "severity": "blocker",
          "file": "src/components/dashboard/CapitalFlows.tsx",
          "line": 0,
          "issue": "Loading state removed — useCapitalFlows isLoading check no longer present",
          "fix": "Re-add: if (isLoading) return <CapitalFlowsSkeleton />"
        }
      ]
    },
    "source_imports": {
      "status": "pass",
      "findings": []
    },
    "common_mistakes": {
      "status": "warning",
      "findings": [
        {
          "severity": "warning",
          "file": "src/components/dashboard/CapitalFlows.tsx",
          "line": 112,
          "issue": "Dark mode class removed — source had bg-white, target needs bg-background for dark mode support",
          "fix": "Replace bg-white with bg-background"
        }
      ]
    },
    "quality_commands": {
      "typecheck": "pass",
      "lint": "warning",
      "test": "pass",
      "output": "2 lint warnings (unused import)"
    }
  }
}
```

### Overall Status Logic

- `pass`: All checks pass (warnings allowed)
- `fail`: Any check has a `blocker` finding
- `warning`: No blockers, but warnings exist
