<!-- Scout Header
Purpose: Annotated example of Discovery Agent output — structural guide for transplant map creation
When to use: During Discovery phase — provides format template for the Discovery Agent
Size: ~219 lines
-->

# Transplant Map Template

> Annotated example of the Discovery Agent's output. Serves as both documentation
> and a structural guide for the Discovery Agent when building the map.
>
> Every field is explained with inline comments. The actual output should be valid JSON
> (without comments) — this template uses `//` annotations for documentation purposes only.

---

## Example Transplant Map

```jsonc
{
  "schema_version": "1.0",

  // ── Source Repository ────────────────────────────────────────────
  // The design prototype being transplanted FROM
  "source": {
    "repo_path": "/path/to/source-design-repo",
    "page_component": "src/components/dashboard/CapitalFlows.tsx",
    // All child components imported by the page component
    "sub_components": [
      "src/components/dashboard/capital/FlowSankey.tsx",
      "src/components/dashboard/capital/InvestorTable.tsx"
    ],
    // Every color found in the source component + sub-components
    "colors_used": [
      { "value": "text-green-500", "type": "tailwind", "context": "positive growth %" },
      { "value": "text-red-500", "type": "tailwind", "context": "negative decline %" },
      { "value": "bg-gray-50", "type": "tailwind", "context": "card background" },
      { "value": "#4A90D9", "type": "hex", "context": "primary chart bar" },
      { "value": "#7B61FF", "type": "hex", "context": "secondary chart bar" },
      { "value": "rgb(59, 130, 246)", "type": "rgb", "context": "inline style accent" }
    ],
    // npm packages used by source that might not exist in target
    "imports": ["react", "recharts", "lucide-react", "@tanstack/react-table"]
  },

  // ── Target Repository ────────────────────────────────────────────
  // The production app being transplanted INTO
  "target": {
    "repo_path": "/path/to/target-app-repo",
    "page_component": "src/components/dashboard/CapitalFlows.tsx",
    // Page-level wrapper (routing component)
    "page_wrapper": "src/pages/CapitalFlowsPage.tsx",
    "sub_components": [
      "src/components/dashboard/capital/FlowChart.tsx"
      // Note: source has FlowSankey + InvestorTable, target only has FlowChart
      // component_mapping below will address this
    ]
  },

  // ── Design System (auto-discovered from target) ──────────────────
  "design_system": {
    "tailwind_config": "tailwind.config.ts",   // relative to target root
    "css_file": "src/index.css",               // where CSS custom properties live
    "custom_colors": {
      // Discovered from tailwind.config.ts extend.colors
      "status-positive": "hsl(var(--status-positive))",
      "status-negative": "hsl(var(--status-negative))",
      "status-info": "hsl(var(--status-info))",
      "status-warning": "hsl(var(--status-warning))",
      // Discovered from CSS custom properties
      "background": "hsl(var(--background))",
      "foreground": "hsl(var(--foreground))",
      "muted": "hsl(var(--muted))",
      "muted-foreground": "hsl(var(--muted-foreground))",
      "border": "hsl(var(--border))",
      "card": "hsl(var(--card))",
      // Chart palette from CSS or tailwind
      "chart-1": "hsl(var(--chart-1))",
      "chart-2": "hsl(var(--chart-2))",
      "chart-3": "hsl(var(--chart-3))"
    },
    // Hook for programmatic chart color access (null if not found)
    "chart_color_hook": "src/hooks/useChartColors.ts",
    // Whether target supports dark mode
    "dark_mode": true,
    // shadcn/UI components available in target's src/components/ui/
    "ui_primitives": [
      "Button", "Card", "CardHeader", "CardContent", "CardTitle",
      "Table", "TableHeader", "TableRow", "TableCell",
      "Skeleton", "Badge", "Tooltip", "Select"
    ]
  },

  // ── Token Mapping (source color → target token) ──────────────────
  // This is the conversion table used during Phase 3
  "token_mapping": [
    {
      "source": "text-green-500",
      "target": "text-status-positive",
      "confidence": "high",        // high = exact semantic match
      "context": "positive/growth indicators"
    },
    {
      "source": "text-red-500",
      "target": "text-status-negative",
      "confidence": "high",
      "context": "negative/decline indicators"
    },
    {
      "source": "bg-gray-50",
      "target": "bg-muted",
      "confidence": "high",
      "context": "secondary/muted backgrounds"
    },
    {
      "source": "#4A90D9",
      "target": "useChartColors().palette[0]",
      "confidence": "medium",      // medium = likely match, verify index
      "context": "primary chart color — verify palette index in target"
    },
    {
      "source": "#7B61FF",
      "target": "useChartColors().palette[1]",
      "confidence": "medium",
      "context": "secondary chart color"
    },
    {
      "source": "rgb(59, 130, 246)",
      "target": "text-status-info",
      "confidence": "medium",
      "context": "blue accent — closest semantic match"
    }
  ],

  // ── Component Mapping (source element → target equivalent) ───────
  "component_mapping": [
    {
      "source_element": "<table>",
      "target_equivalent": "<Table> from @/components/ui/table",
      "action": "replace"          // replace source element with target's
    },
    {
      "source_element": "FlowSankey",
      "target_equivalent": null,
      "action": "create_new"       // no equivalent exists, create in target
    },
    {
      "source_element": "InvestorTable",
      "target_equivalent": null,
      "action": "create_new"
    }
  ],

  // ── Frozen Files (auto-detected by convention) ───────────────────
  // These files must NOT be modified during transplant
  "frozen_files": [
    { "pattern": "src/contexts/AuthContext.tsx", "category": "auth" },
    { "pattern": "src/auth/**", "category": "auth" },
    { "pattern": "src/lib/<data-client>.ts", "category": "infra" },
    { "pattern": "src/lib/sentry.ts", "category": "infra" },
    { "pattern": "src/lib/logger.ts", "category": "infra" },
    { "pattern": "src/lib/env-validation.ts", "category": "infra" },
    { "pattern": "src/lib/<data-types>.ts", "category": "infra" },
    { "pattern": "src/services/*.ts", "category": "services" },
    { "pattern": "src/hooks/data/*.ts", "category": "data-hooks" },
    { "pattern": "src/components/error-boundary/*", "category": "error-handling" },
    { "pattern": "src/config/*", "category": "config" }
  ],

  // ── Data Access (auto-detected from target services) ───────────
  // Adapt this block to whatever data layer the target repo uses.
  // Examples: a SQL data client with multiple schemas, a REST/GraphQL API,
  // a typed RPC client, etc.
  "data_access": {
    "primary_surface": "dashboard",
    "allowed_surfaces": ["dashboard"],
    "forbidden_surfaces": ["core", "admin", "web", "auth"],
    "data_access_hierarchy": "Component → Data Hook → Service Method → primary data surface",
    "discovered_patterns": [
      "<data-client>.from('v_kpi_*')",
      "<data-client>.from('v_chart_*')",
      "<data-client>.from('v_map_*')"
    ],
    "access_control_notes": "Document any access-control rules the data layer enforces (e.g., row-level policies, scoped RPC, per-tenant filters)."
  },

  // ── Quality Commands (from target's package.json) ────────────────
  "quality_commands": {
    "typecheck": "npm run typecheck",
    "lint": "npm run lint",
    "test": "npm run test:run",
    "build": "npm run build"
  },

  // ── Manual Review Items ──────────────────────────────────────────
  // Items the Discovery Agent couldn't auto-resolve
  "manual_review": [
    {
      "item": "#F5A623 hex color in FlowSankey",
      "reason": "No semantic token match found in target's design system",
      "suggestion": "Consider adding a status-orange token or use chart palette"
    },
    {
      "item": "@tanstack/react-table dependency",
      "reason": "Package exists in source but not in target's package.json",
      "suggestion": "Install if InvestorTable is needed, or replace with shadcn Table"
    }
  ]
}
```

---

## Confidence Levels

| Level | Meaning | Action |
|-------|---------|--------|
| `high` | Exact semantic match between source color and target token | Apply automatically |
| `medium` | Likely match but needs verification (e.g., chart palette index) | Apply but flag for review |
| `low` | Best guess, no clear semantic match | Add to `manual_review` |

## Component Actions

| Action | Meaning |
|--------|---------|
| `replace` | Source element has a direct target equivalent — substitute during transplant |
| `create_new` | No equivalent in target — create new component following target conventions |
| `skip` | Source element is prototype-only (mock data, placeholder) — do not transplant |
