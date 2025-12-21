# Git Worktrees for Parallel Work

## Overview

Use git worktrees to work on multiple issues in parallel. Each worktree is an independent checkout with its own branch.

## Worktree Location

Store worktrees in `~/.worktrees/<repo>/<issue-number>/`:

```bash
REPO_NAME=$(basename $(git rev-parse --show-toplevel))
WORKTREE_PATH=~/.worktrees/$REPO_NAME/$ISSUE
```

## Lifecycle

### 1. Create Worktree

```bash
ISSUE=5
REPO_NAME=$(basename $(git rev-parse --show-toplevel))
WORKTREE_PATH=~/.worktrees/$REPO_NAME/$ISSUE

git fetch origin main
git worktree add "$WORKTREE_PATH" -b "issue-$ISSUE" origin/main
```

### 2. Work in Worktree

Sub-agent runs with working directory set to the worktree path.

### 3. Create PR

```bash
cd "$WORKTREE_PATH"
git push -u origin "issue-$ISSUE"
gh pr create --title "..." --body "Closes #$ISSUE"
```

### 4. Cleanup (After PR Merged)

```bash
git worktree remove "$WORKTREE_PATH"
git branch -d "issue-$ISSUE"
```

## Cleanup Strategy

Cleanup is **lazy** - only run when explicitly requested via `/project cleanup`.

### `/project cleanup`

```bash
REPO_NAME=$(basename $(git rev-parse --show-toplevel))
git worktree list | grep "$REPO_NAME" | while read path _ branch; do
  ISSUE=$(echo "$branch" | sed 's/.*issue-//')
  if gh issue view "$ISSUE" --json state --jq '.state' | grep -q CLOSED; then
    git worktree remove "$path"
  fi
done
git worktree prune
```

## Conventions

- **Branch naming**: `issue-<number>` (e.g., `issue-5`)
- **Worktree path**: `~/.worktrees/<repo>/<issue-number>/`
- **One issue per worktree**: Don't mix concerns
- **PR links issue**: Include "Closes #N" in PR body
- **Lazy cleanup**: Run `/project cleanup` periodically
