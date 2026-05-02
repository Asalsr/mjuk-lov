---
name: git
description: Use for git branch cleanup and repository status checks. Provides `/git clean` (prune stale local branches and worktrees) and `/git status` (comprehensive repo state summary with suggested next action). Also routes to conflict-resolver skill when merge/rebase conflicts occur. Triggers on "clean branches", "cleanup", "stale branches", "git status", "what's changed", or when conflicts are detected. Note — Claude Code has built-in commit, push, and PR creation, so this skill focuses on the operations Claude Code does NOT handle natively.
context: fork
compatibility: Designed for Claude Code
metadata:
  author: mjuk-lov
  version: "2.0"
---

# Git Skill

## Overview

Provides git operations that complement Claude Code's built-in capabilities. Claude Code natively handles commits, pushes, and PR creation — this skill adds branch cleanup, rich status summaries, and conflict resolution routing.

**Announce at start:** "I'm using the git skill to handle this."

## Available Subcommands

| Command | Description |
|---------|-------------|
| `/git clean` | Remove local branches deleted from remote + associated worktrees |
| `/git status` | Show repository state summary with suggested next action |
| `/git` | Show available subcommands |

---

## `/git clean`

Remove local branches that have been deleted from remote.

### Workflow

**Step 1: Fetch and Prune**
```bash
git fetch --prune origin
```

**Step 2: List Gone Branches**
```bash
git branch -vv | grep ': gone]' | awk '{print $1}'
```

**Step 3: Check for Worktrees**

For each gone branch, check if it has an associated worktree:
```bash
git worktree list
```

If worktree exists, remove it first:
```bash
git worktree remove <path> --force
```

**Step 4: Delete Branches**

For each gone branch:
```bash
git branch -D <branch-name>
```

**Step 5: Report Results**
```
Branch Cleanup Complete!

Removed branches:
- feature/old-feature (was tracking origin/feature/old-feature)
- bugfix/fixed-bug (was tracking origin/bugfix/fixed-bug)

Removed worktrees:
- /path/to/worktree

Total: 2 branches, 1 worktree removed
```

Or if nothing to clean:
```
No stale branches found. Repository is clean.
```

---

## `/git status`

Show comprehensive repository state summary.

### Workflow

**Step 1: Gather Information (Parallel)**
```bash
git branch --show-current
git status --porcelain
git log origin/$(git branch --show-current)..HEAD --oneline 2>/dev/null
git log HEAD..origin/$(git branch --show-current) --oneline 2>/dev/null
git log -3 --oneline
```

**Step 2: Display Summary**
```
Git Status Summary

Branch: feature/my-feature
Remote: origin/feature/my-feature

Sync Status:
- 2 commits ahead of remote
- 0 commits behind remote

Changes:
- 3 files modified (not staged)
- 1 file staged
- 2 untracked files

Recent Commits:
- abc1234 feat: Add new feature
- def5678 fix: Fix bug
- ghi9012 chore: Update deps

Suggested Action: Run `/git commit` to save your changes
```

**Suggested Actions Based on State:**
| State | Suggestion |
|-------|------------|
| Uncommitted changes | Commit your changes |
| Commits to push | Push to remote |
| Behind remote | Run `git pull --rebase` |
| Clean and synced | Ready for new work |

---

## Conflict Resolution

When conflicts occur during rebase or merge, invoke the **`conflict-resolver` skill**.

The conflict-resolver skill will:
1. Classify each conflicted file as **trivial** (import ordering, lockfiles), **structural** (whitespace-only, tsconfig.json, same block changed differently), or **logic** (business rules, API contracts)
2. **Auto-resolve trivial conflicts** without user input — lockfiles always accept theirs, import ordering is sorted
3. **Guide structural conflicts** with a suggested merged version requiring user confirmation
4. **Guide logic conflicts** by showing both sides and asking the user to decide
5. Run the **quality gate** (typecheck + lint) after all conflicts are resolved
6. Report a resolution summary table

To abort at any point:
```bash
git rebase --abort  # or git merge --abort
```

---

## Submodule Management (when `.gitmodules` exists)

These rules apply only in repos that have a `.gitmodules` file. Skip entirely otherwise.

### `/git status` Enhancement

When `.gitmodules` exists, also show:
- Submodule pointer state: `git submodule status`
- Whether the submodule has uncommitted changes
- Whether the submodule pointer differs from remote

### Pointer Hygiene

When a branch includes submodule pointer changes:
1. Verify the submodule diff only contains commits related to the current branch's work
2. If unrelated commits are included, warn and suggest:
   `cd <submodule-path> && git rebase --onto main <base> HEAD`
3. Before push, verify the submodule branch is pushed first

### Cross-Repo Merge Ordering

When pushing a branch that includes submodule changes, remind:
1. Push and merge the submodule PR first
2. Then merge this PR

---

## Safety Rules

<rules>

### Never Do
- Force push to `main` or `master` without explicit warning + confirmation
- Auto-resolve structural or logic conflicts without user input
- Delete branches without confirmation
- Skip pre-commit hooks without user consent
- Push secrets (.env, credentials.json, API keys)

### Always Do
- Fetch before push to detect divergence
- Use `--force-with-lease` instead of `--force`
- Show what will happen before destructive operations
- Preserve commit history (prefer rebase for local, merge for shared)
- Warn about large pushes (>10 commits)
- When submodules exist: push submodule changes before pushing parent repo
- Never force-push a submodule pointer without verifying the submodule branch is safe

</rules>

---

## Network Failure Handling

When git network operations fail (fetch, push, pull):

1. **Report error immediately** with clear message
2. **Provide troubleshooting tips:**
   - Check internet connection
   - Verify remote URL: `git remote -v`
   - Check SSH keys or credentials
3. **Offer manual retry:** "Would you like to retry? (y/n)"
4. **Do NOT auto-retry** - user stays in control
