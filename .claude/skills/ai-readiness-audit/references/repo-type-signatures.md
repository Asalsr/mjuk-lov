<!-- Scout Header
Purpose: Heuristics for detecting repository types (monorepo, frontend, backend, etc.) via file signatures
When to use: When ai-readiness-audit needs to classify a repository before selecting audit checks
Size: ~66 lines
-->

# Repo Type Detection Heuristics

## Decision Tree

Apply rules in order. First match wins.

### 1. Monorepo
**Match if ANY:**
- `package.json` has `workspaces` field
- Directories named `packages/`, `apps/`, or `libs/` exist at root
- `lerna.json`, `pnpm-workspace.yaml`, or `turbo.json` exists
- Multiple `package.json` files in subdirectories

### 2. Fullstack
**Match if ALL:**
- Has frontend framework (React, Vue, Svelte, Angular, Next.js, Nuxt, SvelteKit)
- Has server-side code (API routes, Express, Fastify, Django, Flask, Rails)
- OR has both frontend components AND database/migration files

**Frontend signals:** `.tsx`/`.vue`/`.svelte` files, `react`/`vue`/`svelte`/`angular` in dependencies
**Server signals:** `express`/`fastify`/`hono` in deps, `api/` directory, `server.ts`/`app.py`

### 3. Frontend
**Match if ANY:**
- `react`, `vue`, `svelte`, `angular`, `next`, `nuxt`, `gatsby` in dependencies
- Majority of source files are `.tsx`, `.jsx`, `.vue`, `.svelte`
- Has `src/components/` or `src/pages/` directory

### 4. Database
**Match if ANY:**
- Has `migrations/` directory or `supabase/` directory
- Majority of source files are `.sql`
- Has `prisma/`, `drizzle/`, or `knex` configuration
- Repo name contains "database", "db", or "supabase"

### 5. ETL
**Match if ANY:**
- Has `airflow`, `dbt`, `dagster`, `prefect`, `luigi` in dependencies or config
- Has `dags/`, `models/` (dbt-style), `pipelines/` directories
- Has files matching `*pipeline*`, `*etl*`, `*transform*` patterns
- Repo name contains "etl", "pipeline", or "data"

### 6. Library
**Match if ANY:**
- Has `setup.py`, `setup.cfg`, or `pyproject.toml` with `[project]` section
- Has `Cargo.toml` with `[lib]` section
- Has `go.mod` without web framework dependencies
- `package.json` has `main`/`module`/`exports` fields but no web framework deps
- Repo name contains "lib", "sdk", "client", or "utils"

### 7. Backend
**Match if ANY:**
- Has server framework (`express`, `fastify`, `django`, `flask`, `spring`, `gin`) in deps
- Has `api/` or `routes/` directory
- Majority of code files are `.py`, `.go`, `.java`, `.rs` without frontend files

### 8. Fallback
If no match: classify as **backend** (most conservative default).

## Confidence Levels

- **High**: Multiple signals match for the detected type
- **Medium**: Single strong signal (e.g., only framework dep detected)
- **Low**: Fallback classification used

Report the confidence level alongside the detected type.
