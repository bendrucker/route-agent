---
name: project
description: |
  Assess route-agent project status and find next tasks. Use when starting work, checking progress, deciding what to work on, or asking "what's next?"
allowed-tools:
  - Bash(gh:*)
  - mcp__github
---

# Project Management

Assess project status and find ready tasks from GitHub issues.

## Quick Start

**Status check:**
```bash
gh api repos/bendrucker/route-agent/milestones --jq '.[] | "\(.title): \(.closed_issues)/\(.open_issues + .closed_issues)"'
```

**Find ready tasks:**
```bash
gh issue list --repo bendrucker/route-agent --state open --json number,title,milestone,body --limit 100
```

## Commands

| Command | Action |
|---------|--------|
| `/project` | Show milestone progress and ready tasks |
| `/project next` | Recommend single next task to work on |
| `/project <milestone>` | Show issues for specific milestone |

## Workflow

1. **Fetch state** - Get open issues and milestone progress
2. **Parse dependencies** - Check "Depends On" sections in issue bodies
3. **Find ready tasks** - Issues where all dependencies are closed
4. **Prioritize** - Earlier milestones first

## Dependency Resolution

Issues express dependencies in body text:
```markdown
## Depends On
- Issue title here
- Another issue title
```

**Ready**: No "Depends On" section, OR all listed issues are closed.

## Milestone Priority

1. Foundation
2. Eval Setup (parallel with Foundation)
3. Strava Integration
4. GraphHopper Integration
5. Route Synthesis
6. Place Search, Water Stops, Climb Integration, Weather Integration
7. Ride Preparation
8. Narrative Research
9. Research Quality
10. Route Refinement
11. Evaluation Framework

## Output Examples

**Status:**
```
## Project Status

### Foundation (1/2 complete)
- [x] #2 Claude Agent SDK project structure
- [ ] #3 Checkpoint system - READY

### Eval Setup (0/2 complete)
- [ ] #4 Promptfoo setup - READY
- [ ] #5 Eval directory structure - blocked by #4
```

**Next task:**
```
## Next Task: #3 Checkpoint system

**Milestone**: Foundation
**Status**: Ready (no blockers)

Integrate AskUserQuestion for structured checkpoints...
```
