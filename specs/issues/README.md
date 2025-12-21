# GitHub Issues

Individual issue files for automated creation via GitHub API.

## Structure

- `config.yaml` - Milestones and labels to create first
- `m{N}-{NN}-{name}.yaml` - Individual issues, sorted by milestone

## File Format

```yaml
title: Issue title
milestone: "M0: Foundation"
labels:
  - tool
  - critical-path
depends_on:  # optional
  - Other issue title
body: |
  Markdown body content
```

## Creation Order

1. Create milestones from `config.yaml`
2. Create labels from `config.yaml`
3. Create issues in filename order (respects dependencies)

## Issues by Milestone

| Milestone | Issues |
|-----------|--------|
| M0: Foundation | 2 |
| M1: Strava Integration | 2 |
| M2: GraphHopper Integration | 2 |
| M3: Route Synthesis | 2 |
| M4: Place Search | 2 |
| M5: Water Stops | 2 |
| M6: Climb Integration | 4 |
| M7: Weather Integration | 2 |
| M8: Narrative Research | 2 |
| M11: Evaluation Framework | 1 |

M9 and M10 issues to be defined after core functionality is validated.
