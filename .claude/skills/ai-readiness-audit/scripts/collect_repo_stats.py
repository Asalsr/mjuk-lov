#!/usr/bin/env python
"""
Collect repository statistics for AI-Readiness Audit.
Outputs JSON with quantitative data about the repo structure.
No LLM needed - purely deterministic analysis.
"""

import json
import os
import re
import subprocess
import sys
from collections import Counter, defaultdict
from pathlib import Path


def run_cmd(cmd, cwd=None):
    """Run shell command and return stdout, or empty string on failure."""
    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, cwd=cwd, timeout=30,
            shell=isinstance(cmd, str)
        )
        return result.stdout.strip()
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return ""


def count_lines(filepath):
    """Count lines in a file, handling encoding errors."""
    try:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            return sum(1 for _ in f)
    except (OSError, IOError):
        return 0


def collect_stats(repo_path):
    repo = Path(repo_path).resolve()
    stats = {
        "repo_path": str(repo),
        "repo_name": repo.name,
    }

    # --- Git info ---
    is_git = (repo / ".git").exists()
    stats["is_git_repo"] = is_git

    if is_git:
        stats["default_branch"] = run_cmd(
            "git rev-parse --abbrev-ref HEAD", cwd=str(repo)
        )
        # Recent commit count (last 30 days)
        stats["commits_last_30d"] = int(
            run_cmd('git rev-list --count --since="30 days ago" HEAD', cwd=str(repo)) or "0"
        )
        # Recent commit messages (last 10)
        log_output = run_cmd(
            'git log --oneline -10 --format="%s"', cwd=str(repo)
        )
        stats["recent_commits"] = log_output.splitlines() if log_output else []
        # Contributors count
        contributors = run_cmd(
            "git shortlog -sn --all", cwd=str(repo)
        )
        stats["contributor_count"] = len(contributors.splitlines()) if contributors else 0
    else:
        stats["default_branch"] = None
        stats["commits_last_30d"] = 0
        stats["recent_commits"] = []
        stats["contributor_count"] = 0

    # --- File inventory ---
    IGNORE_DIRS = {
        ".git", "node_modules", "__pycache__", ".next", "dist", "build",
        ".venv", "venv", "vendor", ".tox", "coverage", ".nyc_output",
        ".turbo", ".cache", "target", "bin", "obj",
    }
    IGNORE_EXTENSIONS = {".lock", ".min.js", ".min.css", ".map", ".png", ".jpg", ".ico", ".svg", ".woff", ".woff2", ".ttf", ".eot"}

    all_files = []
    extension_counter = Counter()
    dir_counter = Counter()
    file_sizes = []  # (path, line_count)

    for root, dirs, files in os.walk(repo):
        # Prune ignored directories
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS and not d.startswith(".")]
        rel_root = os.path.relpath(root, repo)

        for fname in files:
            ext = os.path.splitext(fname)[1].lower()
            if ext in IGNORE_EXTENSIONS:
                continue

            rel_path = os.path.normpath(os.path.join(rel_root, fname))
            all_files.append(rel_path)
            extension_counter[ext if ext else "(no ext)"] += 1

            top_dir = rel_path.split(os.sep)[0] if os.sep in rel_path else "."
            dir_counter[top_dir] += 1

            full_path = os.path.join(root, fname)
            lines = count_lines(full_path)
            file_sizes.append((rel_path, lines))

    stats["total_files"] = len(all_files)
    stats["extensions"] = dict(extension_counter.most_common(20))
    stats["top_level_dirs"] = dict(dir_counter.most_common(20))
    root_files = {os.path.basename(f) for f in all_files if os.sep not in f}

    # File size distribution
    line_counts = [s[1] for s in file_sizes if s[1] > 0]
    if line_counts:
        stats["file_size_stats"] = {
            "avg_lines": round(sum(line_counts) / len(line_counts), 1),
            "max_lines": max(line_counts),
            "files_over_300": sum(1 for c in line_counts if c > 300),
            "files_over_500": sum(1 for c in line_counts if c > 500),
        }
        # Top 10 largest files
        file_sizes.sort(key=lambda x: x[1], reverse=True)
        stats["largest_files"] = [
            {"path": p, "lines": l} for p, l in file_sizes[:10]
        ]
    else:
        stats["file_size_stats"] = {"avg_lines": 0, "max_lines": 0, "files_over_300": 0, "files_over_500": 0}
        stats["largest_files"] = []

    # Duplicate filenames (same name, different dirs)
    name_to_paths = defaultdict(list)
    for f in all_files:
        name_to_paths[os.path.basename(f)].append(f)
    stats["duplicate_filenames"] = {
        name: paths for name, paths in name_to_paths.items()
        if len(paths) > 1 and not name.startswith(".")
        and name not in ("index.ts", "index.js", "index.tsx", "README.md", "package.json", "__init__.py")
    }
    # Limit to top 10 duplicates
    if len(stats["duplicate_filenames"]) > 10:
        stats["duplicate_filenames"] = dict(list(stats["duplicate_filenames"].items())[:10])

    # --- Config file detection ---
    # Use Path.exists() for files in hidden dirs (excluded from all_files walk)
    config_files = {
        "claude_md": (repo / "CLAUDE.md").exists(),
        "agents_md": (repo / "AGENTS.md").exists(),
        "cursorrules": (repo / ".cursorrules").exists() or (repo / ".cursor" / "rules").exists(),
        "github_copilot": (repo / ".github" / "copilot-instructions.md").exists(),
        "claude_skills": (repo / ".claude" / "skills").exists(),
        "claude_commands": (repo / ".claude" / "commands").exists(),
        "mcp_config": (repo / ".claude" / "settings.local.json").exists() or (repo / ".claude" / "settings.json").exists(),
        "editorconfig": (repo / ".editorconfig").exists(),
        "prettier": any(f.startswith(".prettier") or "prettier" in f for f in root_files),
        "eslint": any("eslint" in f.lower() for f in root_files),
        "tsconfig": (repo / "tsconfig.json").exists(),
        "dockerfile": any("Dockerfile" in f for f in all_files),
        "ci_cd": (repo / ".github" / "workflows").exists(),
        "pre_commit": (repo / ".pre-commit-config.yaml").exists(),
        "husky": (repo / ".husky").exists(),
        "env_example": (repo / ".env.example").exists() or (repo / ".env.sample").exists(),
        "gitignore": (repo / ".gitignore").exists(),
        "pr_template": (repo / ".github" / "pull_request_template.md").exists() or (repo / ".github" / "PULL_REQUEST_TEMPLATE").exists(),
        "adr_folder": any("adr" in Path(f).parts for f in all_files),
    }
    stats["config_files"] = config_files

    # --- Dependency detection ---
    deps = {}
    pkg_json = repo / "package.json"
    if pkg_json.exists():
        try:
            with open(pkg_json, "r", encoding="utf-8") as f:
                pkg = json.load(f)
            deps["package_json"] = {
                "dependencies": list(pkg.get("dependencies", {}).keys()),
                "devDependencies": list(pkg.get("devDependencies", {}).keys()),
                "scripts": list(pkg.get("scripts", {}).keys()),
                "workspaces": pkg.get("workspaces", None),
            }
        except (json.JSONDecodeError, OSError):
            pass

    requirements = repo / "requirements.txt"
    if requirements.exists():
        try:
            with open(requirements, "r", encoding="utf-8") as f:
                deps["requirements_txt"] = [
                    line.strip().split("==")[0].split(">=")[0]
                    for line in f if line.strip() and not line.startswith("#")
                ][:30]
        except OSError:
            pass

    for cargo_file in ["Cargo.toml", "go.mod", "setup.py", "pyproject.toml"]:
        if (repo / cargo_file).exists():
            deps[cargo_file] = True

    stats["dependencies"] = deps

    # --- Testing indicators ---
    test_files = [f for f in all_files if re.search(
        r"(test|spec|__test__|_test\.|\.test\.|\.spec\.)", f, re.IGNORECASE
    )]
    stats["testing"] = {
        "test_file_count": len(test_files),
        "test_dirs": list(set(
            f.split(os.sep)[0] for f in test_files if os.sep in f
        ))[:10],
        "has_jest_config": any("jest" in f.lower() for f in root_files),
        "has_vitest_config": any("vitest" in f.lower() for f in root_files),
        "has_pytest": any("pytest" in f.lower() or "conftest" in f.lower() for f in all_files),
    }

    # --- Function size sampling ---
    # Sample up to 20 code files and count function sizes
    code_extensions = {".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs", ".java"}
    code_files = [f for f in all_files if os.path.splitext(f)[1].lower() in code_extensions]
    function_lengths = []

    for cf in code_files[:20]:
        full_path = repo / cf
        try:
            with open(full_path, "r", encoding="utf-8", errors="ignore") as fh:
                lines = fh.readlines()
        except OSError:
            continue

        in_function = False
        func_start = 0
        brace_depth = 0

        for i, line in enumerate(lines):
            stripped = line.strip()
            # Detect function starts (simplified)
            if re.match(r"(export\s+)?(async\s+)?function\s+|const\s+\w+\s*=\s*(async\s+)?\(|def\s+\w+\s*\(|func\s+\w+\s*\(|fn\s+\w+\s*\(", stripped):
                if not in_function:
                    in_function = True
                    func_start = i
                    brace_depth = 0

            if in_function:
                brace_depth += stripped.count("{") - stripped.count("}")
                # Also handle Python (indent-based) - simplified
                if (brace_depth <= 0 and i > func_start and "{" in "".join(lines[func_start:i])):
                    func_len = i - func_start + 1
                    if func_len > 3:
                        function_lengths.append(func_len)
                    in_function = False

    if function_lengths:
        stats["function_sizes"] = {
            "sample_count": len(function_lengths),
            "avg_lines": round(sum(function_lengths) / len(function_lengths), 1),
            "max_lines": max(function_lengths),
            "over_50_lines": sum(1 for fl in function_lengths if fl > 50),
            "over_100_lines": sum(1 for fl in function_lengths if fl > 100),
        }
    else:
        stats["function_sizes"] = {"sample_count": 0, "avg_lines": 0, "max_lines": 0, "over_50_lines": 0, "over_100_lines": 0}

    return stats


def main():
    repo_path = sys.argv[1] if len(sys.argv) > 1 else "."
    stats = collect_stats(repo_path)
    print(json.dumps(stats, indent=2))


if __name__ == "__main__":
    main()
