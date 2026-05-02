<!-- Scout Header
Purpose: Domain-specific prompts for codebase discovery subagents (Component Inventory, Utility & Hook Scanner, API & Data Scanner, Pattern Mapper)
When to use: Orchestrating parallel pre-planning codebase discovery — load to spawn domain subagents
Size: ~400 lines
-->

# Codebase Discovery Subagent Prompts

> These prompts are loaded by the Codebase Discovery skill orchestrator and passed to
> domain-specific subagents spawned via the Agent tool. Each subagent runs in its own
> context window with focused search scope.

---

## How Subagents Are Invoked

The orchestrator spawns each subagent via the Agent tool with `subagent_type="Explore"` (for access to Glob, Grep, Read tools).

Each subagent receives:
1. Its domain-specific prompt (the relevant section from this file)
2. The search targets extracted from the user's request
3. The static context summary (tech stack, key directories, installed packages)

---

## 1. Component Inventory Subagent

### Role

Find existing UI components, pages, and layouts that are relevant to the requested feature. The goal is to prevent building components that already exist and to identify components that can be extended.

### Input Context

You receive:
- **Search Targets:** Feature keywords, domain area, affected entities
- **Static Context:** Framework, UI library, key directories

### Search Strategy

**Budget:** Max 8 Glob, 6 Grep, 4 Read calls.

#### Step 1: Find Components by Name

Search for components matching the feature keywords:

```
Glob: src/components/**/*{keyword}*.tsx
Glob: src/components/**/*{keyword}*.ts
Glob: src/app/**/components/*{keyword}*.tsx
```

Also search with common variations:
- Singular/plural (e.g., "filter" → "filters", "Filter", "FilterPanel")
- Compound names (e.g., "date picker" → "DatePicker", "date-picker", "DateRange")

#### Step 2: Find Pages in the Affected Area

```
Glob: src/app/**/{domain-area}/**/page.tsx
Glob: src/pages/**/{domain-area}*.tsx
```

If domain area is found, list all components in that directory:

```
Glob: src/app/**/{domain-area}/components/*.tsx
```

#### Step 3: Scan UI Primitives

Search the UI component library for relevant primitives:

```
Glob: src/components/ui/*{keyword}*.tsx
```

For each found component, read the first 30 lines to understand:
- What props it accepts
- Where it's exported from
- Brief description of what it does

#### Step 4: Count Usage

For each discovered component, count how many files import it:

```
Grep: import.*{ComponentName}  (count mode)
```

This helps assess: is this a core component (50+ imports) or a one-off (1-2 imports)?

### Output Format

```
COMPONENT_INVENTORY:

HIGH_RELEVANCE:
- name: DatePicker
  path: src/components/ui/date-picker.tsx
  usage_count: 12
  props: [value, onChange, range?, minDate?, maxDate?]
  note: "Existing date picker used across forms. Supports range mode."

- name: FilterPanel
  path: src/app/(dashboard)/explore/components/FilterPanel.tsx
  usage_count: 1
  props: [filters, onFilterChange]
  note: "Explore page filter container. Currently has text and select filters."

MEDIUM_RELEVANCE:
- name: DataTable
  path: src/components/ui/data-table.tsx
  usage_count: 8
  note: "Generic table with sorting/pagination. Could wrap export functionality."

LOW_RELEVANCE:
[Components that are tangentially related]

NOT_FOUND:
- "No CSV export component found anywhere in codebase"
- "No notification/toast component found (but sonner is in package.json)"
```

### Rules

- Only report components you actually found via Glob/Grep — never guess paths
- Read component files to understand props/API, don't just list paths
- Count usage to help the planner assess reusability
- "NOT_FOUND" is valuable output — report what you searched for but didn't find
- Don't read entire component files — first 30-50 lines for structure, grep for key props

---

## 2. Utility & Hook Scanner Subagent

### Role

Find existing utility functions, custom hooks, and helper modules that solve part of the requested feature. Prevents reinventing utilities that already exist in the codebase.

### Input Context

You receive:
- **Search Targets:** Feature keywords, technical concepts, affected entities
- **Static Context:** State management approach, data fetching library, utility directories

### Search Strategy

**Budget:** Max 4 Glob, 10 Grep, 4 Read calls.

#### Step 1: Scan Utility Directories

```
Glob: src/lib/**/*.ts
Glob: src/utils/**/*.ts
Glob: src/helpers/**/*.ts
```

List all utility files to understand what's available.

#### Step 2: Search for Keyword-Matching Functions

For each feature keyword, search across the codebase:

```
Grep: export (function|const) .*{keyword}  (across src/)
Grep: function {keyword}  (across src/)
```

Search variations: camelCase, PascalCase, kebab-case versions of keywords.

#### Step 3: Search for Hooks

```
Glob: src/hooks/**/*.ts
Grep: export (function|const) use{Keyword}  (across src/)
```

For each found hook, read to understand:
- What parameters it takes
- What it returns
- Which TanStack Query keys it uses (if applicable)

#### Step 4: Check for Common Patterns

Search for commonly-needed utilities that the feature might require:

```
Grep: export.*format(Date|Number|Currency|Percent)  (across src/)
Grep: export.*cn\(   (class name utility)
Grep: queryKeys   (TanStack Query key factory)
Grep: export.*fetch|export.*api   (API utilities)
```

### Output Format

```
UTILITY_HOOK_INVENTORY:

HOOKS:
- name: useStartups
  path: src/hooks/useStartups.ts
  params: [filters?: StartupFilters]
  returns: { data, isLoading, error } (TanStack Query)
  query_key: queryKeys.startups.list(filters)
  note: "Main hook for startup data. Supports filter params."

- name: useQueryParams
  path: src/hooks/useQueryParams.ts
  params: [schema: ZodSchema]
  returns: [params, setParams]
  note: "URL query param sync with Zod validation."

UTILITIES:
- name: cn
  path: src/lib/utils.ts
  signature: cn(...inputs: ClassValue[]): string
  usage_count: 150+
  note: "Tailwind class merger. Use everywhere for conditional classes."

- name: formatDate
  path: src/lib/format.ts
  signature: formatDate(date: Date, format?: string): string
  note: "Uses date-fns under the hood."

QUERY_KEY_PATTERNS:
- factory: src/lib/queryKeys.ts
  pattern: "queryKeys.{entity}.{operation}(params)"
  entities: [startups, users, investments, ...]
  note: "All new queries MUST use this factory."

NOT_FOUND:
- "No CSV/export utility found"
- "No debounce/throttle utility (may need to install or create)"
```

### Rules

- Grep for function signatures, not just file names — names can be misleading
- Read hooks to understand their return types (critical for reuse decisions)
- Always check for query key factories — new queries must follow existing patterns
- Report the query key pattern explicitly so the PRD can specify correct keys
- Don't scan node_modules — only project source code
- "NOT_FOUND" is valuable — report utilities you expected but didn't find

---

## 3. API & Data Scanner Subagent

### Role

Find existing API endpoints, data fetching patterns, database schema references, and service layers relevant to the requested feature. Ensures the plan doesn't create duplicate endpoints or miss existing data sources.

### Input Context

You receive:
- **Search Targets:** Feature keywords, affected entities, technical concepts
- **Static Context:** Data fetching approach, API structure, database setup

### Search Strategy

**Budget:** Max 4 Glob, 8 Grep, 6 Read calls.

#### Step 1: Find Service/API Files

```
Glob: src/services/**/*.ts
Glob: src/api/**/*.ts
Glob: src/app/api/**/*.ts
Glob: app/api/**/*.ts                # Next.js App Router route handlers
# If a Supabase Edge Functions directory is present, also:
Glob: supabase/functions/**/*.ts
```

#### Step 2: Search for Entity-Related Endpoints

For each affected entity, run the patterns relevant to the project's data layer (detect first, then apply):

```
Grep: {entity}                       (across src/services/ and src/api/)
Grep: from.*{entity}                 (generic SQL query patterns)
# If a Supabase client is in use:
Grep: \.from\('{entity}'             (Supabase client queries)
# If Prisma is in use:
Grep: prisma\.{entity}\.             (Prisma client queries)
```

For each found service file, read to understand:
- What CRUD operations exist
- What filters/parameters are supported
- What data shape is returned

#### Step 3: Find Schema/Type Definitions

```
Grep: (type|interface) {Entity}     (across src/)
Glob: src/types/**/*{entity}*.ts
# If Supabase generated types are in use:
Grep: Tables\['{entity}'\]
# If Prisma types are in use:
Grep: Prisma\.{Entity}
```

#### Step 4: Check for Existing Views/Queries

```
# If a SQL migration directory is present (Supabase, Drizzle, Knex, etc.):
Grep: create.*view.*{entity}        (across migrations/)
Grep: rpc\('{entity}                (Supabase RPC calls — skip if no Supabase client)
```

#### Step 5: Map Data Flow

For the primary entity, trace one data flow path:
1. Where is data fetched? (service layer)
2. How is it consumed? (hook)
3. Where is it displayed? (component)

This gives the planner a "follow this pattern" reference.

### Output Format

```
API_DATA_INVENTORY:

SERVICES:
- name: itemService
  path: src/services/itemService.ts
  operations: [getItems, getItemById, createItem, updateItem]
  filters: [category, region, status, search]
  note: "Main data-layer query module for items."

ENDPOINTS:
- route: /api/items
  method: GET
  params: [page, limit, category, region]
  path: src/app/api/items/route.ts

TYPES:
- name: Item
  path: src/types/item.ts
  key_fields: [id, name, category, region, status, created_at]
  note: "Matches the generated types from the project's data layer"

DATA_FLOW_EXAMPLE:
  service: itemService.getItems(filters)
  → hook: useItems(filters)
  → component: ItemTable receives data via hook
  → pattern: "Service → Hook → Component (follow this for new features)"

SCHEMA_REFERENCES:
- table: startups (from migration files)
- views: web.startups_view (read-only, for anon access)
- rls: "Users can read all, write own" (from migration)

NOT_FOUND:
- "No export/download endpoint exists for startups"
- "No notification-related tables or services found"
```

### Rules

- Read service files to understand actual query patterns (not just that they exist)
- Trace at least one data flow path for the primary entity
- Check for both data-client queries AND API routes — repos may use either or both (detect which patterns apply)
- Report any access-control patterns found (RLS, scoped RPC, route-level checks) — critical for security-sensitive features
- If neither a `database/` directory nor a database client package is present, skip database checks silently
- Report schema views separately from tables when applicable — views indicate access patterns

---

## 4. Pattern Mapper Subagent

### Role

Identify the structural patterns used in the area of the codebase where the new feature will live. Read sibling files to understand conventions — file organization, naming, export patterns, state management, and component composition. Ensures the new feature fits naturally into the existing codebase.

### Input Context

You receive:
- **Search Targets:** Domain area, feature keywords
- **Static Context:** Framework, key directories, routing pattern

### Search Strategy

**Budget:** Max 4 Glob, 4 Grep, 8 Read calls. This subagent reads MORE and searches LESS.

#### Step 1: Identify the Target Directory

Based on the domain area, find where the new feature will likely live:

```
Glob: src/app/**/{domain-area}/
Glob: src/pages/**/{domain-area}*
Glob: src/components/**/{domain-area}*
```

If no exact match, find the closest sibling feature directory.

#### Step 2: Read Sibling Page/Feature Structure

Pick 1-2 existing feature directories that are structurally similar to what's being requested. Read their key files:

```
Read: src/app/(dashboard)/{sibling}/page.tsx  (first 50 lines)
Read: src/app/(dashboard)/{sibling}/components/ (list contents)
Read: src/app/(dashboard)/{sibling}/columns.tsx (if exists — table pattern)
```

Document the pattern:
- How is the page structured? (layout → data fetch → render)
- What sub-components exist? (FilterPanel, DataTable, Charts, etc.)
- How is state managed? (URL params, context, local state)
- How is data loaded? (hook, server component, loader)

#### Step 3: Read a Sibling Component

Pick one component that's similar to what the new feature needs. Read it fully to extract:
- Import pattern
- Props interface pattern
- Component structure (hooks → derived state → render)
- Export pattern (default vs named)

#### Step 4: Check Naming and File Conventions

From the sibling analysis, document:
- File naming: kebab-case, PascalCase, or camelCase?
- Directory structure: flat or nested?
- Index files: barrel exports or direct imports?
- Test file location: co-located or separate `__tests__/` dir?

### Output Format

```
PATTERN_MAP:

TARGET_DIRECTORY:
  path: src/app/(dashboard)/explore/
  note: "New feature will likely live here or in a sibling directory"

SIBLING_PATTERNS:
  analyzed: src/app/(dashboard)/explore/
  structure:
    page.tsx: "Server component wrapper → client component with data"
    components/:
      - FilterPanel.tsx (filter UI, receives callbacks)
      - StartupTable.tsx (data table with columns)
      - ExploreCharts.tsx (chart container)
    columns.tsx: "TanStack Table column definitions"
    hooks/:
      - useExploreFilters.ts (URL param sync)

PAGE_PATTERN:
  data_loading: "TanStack Query via custom hook in client component"
  state_management: "URL params for filters, TanStack Query cache for data"
  composition: "Page → Layout → FilterPanel + DataDisplay"
  error_handling: "Error boundary at page level, loading skeleton per section"

COMPONENT_PATTERN:
  example: src/app/(dashboard)/explore/components/FilterPanel.tsx
  structure: |
    imports (React, hooks, UI components)
    → Props interface
    → Component function
    → Hook calls (useFilters, useQueryParams)
    → Derived state / memoization
    → Return JSX
    → Named export
  naming: PascalCase files, camelCase hooks, kebab-case for UI primitives
  exports: named (not default)

FILE_CONVENTIONS:
  naming: PascalCase for components, camelCase for hooks/utils
  directories: feature-based grouping under (dashboard)/
  barrel_exports: false (direct imports)
  test_location: "__tests__/ co-located" | "no tests found in this area"

RECOMMENDATIONS:
- "Follow the explore/ page pattern for new data-heavy pages"
- "Use columns.tsx pattern for any new data table"
- "Filter state belongs in URL params (useQueryParams pattern)"
- "Named exports, not default exports"
```

### Rules

- **Read over search** — this subagent's value is understanding structure, not finding files
- Read sibling files in the target area, not random files across the codebase
- Pick the MOST SIMILAR sibling to the requested feature (data table page for a data table feature, etc.)
- Document the pattern concretely (with file names and structure), not abstractly
- If no clear target directory exists, note this as a gap — "No existing pattern for this type of feature"
- Don't report every convention — focus on conventions relevant to the requested feature
- Read at most 50 lines per file (structure, not implementation details)
