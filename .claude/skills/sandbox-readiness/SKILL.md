---
name: sandbox-readiness
description: Use before transferring a plan, PRD, or ongoing work from Claude Code CLI to the Claude.ai web sandbox. Audits plans, specs, CLAUDE.md, scripts, and task lists for CLI-specific dependencies that won't survive the sandbox environment. Checks env vars, filesystem scope, MCP transport types, network endpoints, git operations, and incompatible tools (docker, watchman). Produces a PASS/WARN/FAIL report with actionable fixes. Triggers on "can I run this in the web sandbox", "transfer to cloud", "sandbox check", "is this sandbox-ready", "cloud sandbox readiness", or before handing off any plan/spec to Claude.ai.
context: fork
compatibility: Designed for Claude Code
metadata:
  author: mjuk-lov
  version: "1.0"
---

# Sandbox Readiness Skill

## Overview

Before transferring a plan, PRD, or active task to the Claude.ai web sandbox, this skill audits all CLI-specific dependencies that the sandbox cannot satisfy. The web sandbox is a remote ephemeral VM — it does not have your local environment, shell secrets, sibling directories, stdio MCP servers, or Docker.

**Output:** A structured readiness report with a PASS / WARN / FAIL verdict per category, plus a prioritized fix list.

## When to Use

- Before copying a plan or spec to run on Claude.ai
- Before handing off an in-progress task from CLI to the web UI
- When someone asks "will this work in the sandbox?"
- As a pre-flight check after authoring a complex spec

---

## The 6 Sandbox Constraints

<data>
| # | Constraint | What Breaks |
|---|-----------|-------------|
| 1 | No local env vars or secrets | `.env` files, `process.env.*`, `$SHELL_VAR` references in scripts |
| 2 | Filesystem scoped to repo only | `~/.config`, `/tmp` shared state, `--add-dir`, sibling repo paths |
| 3 | Network goes through proxy | Custom internal endpoints, third-party project URLs (Supabase, Firebase, etc.), self-hosted APIs |
| 4 | Git auth is proxied, single-branch only | Multi-branch ops, GPG signing, SSH keys, `~/.gitconfig` |
| 5 | No stdio MCP servers | `--command npx ...` MCPs, any stdio-transport server |
| 6 | Incompatible tools | `docker`, `watchman`, `jest` without `--no-watchman` |
</data>

---

## Audit Workflow

<workflow>

### Step 1 — Identify Scope

Determine what you are auditing. Accept any of:
- A file path (spec, PRD, CLAUDE.md, script, task list)
- A directory (scan all `.md`, `.sh`, `.json`, `.yaml`, `.env*` files)
- The current conversation context ("check this plan")
- No argument — audit the current repo's CLAUDE.md + any active spec

Read all identified files before proceeding.

### Step 2 — Run 6-Category Audit

For each category below, search the identified content and produce a finding.

#### Category 1: Environment Variables & Secrets

<checklist>
- Search for `process.env.`, `import.meta.env.`, `$VAR`, `${VAR}` patterns in scripts and config
- Search for `.env` file references or `dotenv` imports
- Check CLAUDE.md for any commands that assume env vars are pre-loaded
- Check task steps for `export`, `source ~/.bashrc`, or shell profile assumptions
- Check for hardcoded API keys or connection strings that should be secrets
</checklist>

**FAIL if:** Secrets or env vars are required with no sandbox injection path
**WARN if:** Env vars are referenced but may be injectable via the web UI's secret manager
**PASS if:** No env var dependencies, or all are injected via repo-committed config

#### Category 2: Filesystem Scope

<checklist>
- Search for absolute paths outside the repo: `~/`, `/home/`, `/Users/`, `/tmp/`, `C:\Users\`
- Search for `--add-dir` arguments in Claude Code invocations
- Search for references to sibling directories (`../other-repo/`, `../../`)
- Search for shared temp state: `/tmp/shared-*`, `~/.cache/`, `~/.config/`
- Check scripts for `cd` to paths outside the project root
</checklist>

**FAIL if:** Plan requires accessing files outside the cloned repo
**WARN if:** Plan references paths that could be relocated inside the repo
**PASS if:** All file access stays within the repo root

#### Category 3: Network & External Endpoints

<checklist>
- Search for custom domain references: non-public URLs (internal API hosts, `localhost`, third-party project URLs like `*.supabase.co`, `*.firebaseio.com`, `*.vercel.app`)
- Search for project-scoped URLs in env vars (e.g., `SUPABASE_URL`, `FIREBASE_DATABASE_URL`, custom backend hosts) — flag them for proxy approval
- Check for references to internal services, self-hosted tools, or VPN-only endpoints
- Note: npm/PyPI/GitHub are approved by default; document any others
- Check if scripts call external APIs that require CORS allowlisting or proxy approval
</checklist>

**FAIL if:** Plan requires network access to hosts that are definitively blocked (VPN-only, internal)
**WARN if:** Plan hits external endpoints that will trigger a sandbox permission prompt on first run
**PASS if:** Only uses known-approved registries and GitHub

#### Category 4: Git Operations

<checklist>
- Search for multi-branch git operations: `git checkout -b`, `git merge`, branch matrix pushes
- Search for GPG/SSH signing: `git commit -S`, `gpg`, `ssh-keygen`
- Search for `~/.gitconfig` or `.ssh/` references
- Check if plan pushes to more than one branch or uses force-push
- Check for git tag + push tag combinations (may be blocked by proxy)
</checklist>

**FAIL if:** Plan requires multi-branch pushes, GPG signing, or SSH key auth
**WARN if:** Plan creates tags or does branch operations beyond single-branch feature work
**PASS if:** All git work targets a single branch and uses standard commits

#### Category 5: MCP Servers

<checklist>
- Run `/mcp` mentally or check `.claude/settings.json` / `~/.claude.json` for configured MCP servers
- Classify each server as **stdio** (has `command:` or `--command` key) vs **HTTP** (has `url:` key)
- Flag stdio servers the plan depends on: GitHub MCP (`@modelcontextprotocol/server-github`), database / backend MCPs, custom CLIs
- Identify which plan steps require MCP tools and which MCP provides them
- HTTP/SSE-based MCPs (remote URLs) are sandbox-compatible
</checklist>

**FAIL if:** Plan depends on stdio MCP tools with no HTTP alternative
**WARN if:** Plan uses MCP tools that have HTTP equivalents requiring reconfiguration
**PASS if:** No MCP dependencies, or all MCP servers used are HTTP-transport

#### Category 6: Incompatible Tools

<checklist>
- Search for `docker`, `docker-compose`, `docker build`, `docker run` in scripts and tasks
- Search for `watchman` references
- Search for `jest` without `--no-watchman` flag
- Search for any tool that requires host-level daemon processes
- Check for `brew install`, `apt-get`, system-level package installs mid-task
</checklist>

**FAIL if:** Plan requires docker or watchman with no workaround noted
**WARN if:** jest is used without `--no-watchman` (fixable)
**PASS if:** No incompatible tools used

### Step 3 — Determine Overall Verdict

<rules>
- **READY** — All 6 categories are PASS or WARN-only with low-effort fixes
- **NEEDS FIXES** — One or more WARN items require changes before sandbox transfer; provide fix list
- **NOT SANDBOX-COMPATIBLE** — One or more FAIL items that cannot be resolved without fundamentally changing the plan
</rules>

### Step 4 — Produce Report

Output the structured report (see Formatting section below).

</workflow>

---

## Formatting

<formatting>
Use this exact report structure:

```
## Sandbox Readiness Report

**Target:** [file/plan name or "current plan"]
**Verdict:** READY | NEEDS FIXES | NOT SANDBOX-COMPATIBLE

---

### Category Results

| # | Category | Status | Finding |
|---|---------|--------|---------|
| 1 | Env Vars & Secrets | ✅ PASS / ⚠️ WARN / ❌ FAIL | [one-line summary] |
| 2 | Filesystem Scope | ✅ PASS / ⚠️ WARN / ❌ FAIL | [one-line summary] |
| 3 | Network Endpoints | ✅ PASS / ⚠️ WARN / ❌ FAIL | [one-line summary] |
| 4 | Git Operations | ✅ PASS / ⚠️ WARN / ❌ FAIL | [one-line summary] |
| 5 | MCP Servers | ✅ PASS / ⚠️ WARN / ❌ FAIL | [one-line summary] |
| 6 | Incompatible Tools | ✅ PASS / ⚠️ WARN / ❌ FAIL | [one-line summary] |

---

### Issues Found

[For each WARN or FAIL, one block:]

#### ⚠️/❌ [Category Name] — [Issue Title]
**Location:** [file:line or "task step N" or "plan section"]
**Problem:** [what will break in the sandbox]
**Fix:** [exact change needed]
**Effort:** Low / Medium / High

---

### Transfer Instructions

[Only shown when verdict is READY or NEEDS FIXES after applying fixes]

1. [Step-by-step what to do before opening Claude.ai]
2. [Which secrets to inject via web UI if any]
3. [Which MCP servers to reconfigure if any]
4. [Branch to configure for push if relevant]
```
</formatting>

---

## Rules

<rules>
- Always read all referenced files before auditing — never assume from filenames alone
- WARN for fixable items; FAIL only for items that cannot work in a sandbox environment
- Provide specific file:line locations when flagging issues — vague findings are useless
- Do not flag theoretical issues; only flag patterns actually present in the scanned content
- If no issues are found in a category, say PASS — do not invent problems
- Be concise in findings; the user needs to act quickly, not read an essay
- If the user provides no target, scan CLAUDE.md + any `.claude/` specs in the current directory
</rules>

---

## Examples

<examples>
<example name="env-var-fail">
<input>
Check if this plan is sandbox-ready. The plan includes: "Run `vercel deploy --prod` — requires VERCEL_TOKEN from .env"
</input>
<output>
## Sandbox Readiness Report

**Target:** current plan
**Verdict:** NEEDS FIXES

| # | Category | Status | Finding |
|---|---------|--------|---------|
| 1 | Env Vars & Secrets | ⚠️ WARN | VERCEL_TOKEN needed; injectable via web UI secrets |
| 2 | Filesystem Scope | ✅ PASS | No out-of-repo paths found |
| 3 | Network Endpoints | ⚠️ WARN | api.vercel.com will trigger proxy permission prompt on first run |
| 4 | Git Operations | ✅ PASS | Single-branch push only |
| 5 | MCP Servers | ✅ PASS | No MCP dependencies |
| 6 | Incompatible Tools | ✅ PASS | No docker/watchman found |

#### ⚠️ Env Vars — Vercel credentials not in repo config
**Location:** plan step 3 ("Run vercel deploy --prod")
**Problem:** VERCEL_TOKEN is read from .env which is blocked in sandbox
**Fix:** Add it as a secret via the Claude.ai web UI secret manager before starting the task
**Effort:** Low

#### ⚠️ Network Endpoints — Vercel API needs proxy approval
**Location:** plan step 3
**Problem:** First call to `api.vercel.com` will trigger a sandbox permission prompt
**Fix:** Approve the Vercel domain when prompted; subsequent calls proceed automatically
**Effort:** Low

### Transfer Instructions
1. Open the plan in Claude.ai
2. Before starting, add `VERCEL_TOKEN` via the Secrets panel
3. When the task first calls the Vercel API, approve the domain at the permission prompt
</output>
</example>

<example name="stdio-mcp-fail">
<input>
Is my plan sandbox compatible? It uses the GitHub MCP server to create PRs.
</input>
<output>
## Sandbox Readiness Report

**Target:** current plan
**Verdict:** NOT SANDBOX-COMPATIBLE

| # | Category | Status | Finding |
|---|---------|--------|---------|
| 5 | MCP Servers | ❌ FAIL | GitHub MCP is stdio-transport; incompatible with sandbox |

#### ❌ MCP Servers — GitHub MCP uses stdio transport
**Location:** `.claude/settings.json` → `mcpServers.github` (command: "npx")
**Problem:** stdio MCPs cannot run inside the sandbox container — the process cannot spawn a subprocess across container boundaries
**Fix (Option A):** Replace GitHub MCP steps with equivalent `gh` CLI commands (e.g., `gh pr create`) — no MCP needed
**Fix (Option B):** Use the Claude.ai built-in GitHub integration if PR creation is the only requirement
**Effort:** Medium

### Transfer Instructions
Not applicable until the MCP dependency is resolved. Apply Option A or B above first.
</output>
</example>
</examples>
