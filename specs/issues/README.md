# GitHub Issues

Individual issue files for automated creation via GitHub API.

## Structure

- `config.yaml` - Milestones and labels to create first
- `{name}.yaml` - Individual issues with descriptive names

## File Format

```yaml
title: Issue title
milestone: Foundation
labels:
  - tool
  - critical-path
depends_on:  # optional, references other issue titles
  - Other issue title
body: |
  Markdown body content
```

## Creation Order

1. Create milestones from `config.yaml`
2. Create labels from `config.yaml`
3. Create issues (use `depends_on` to link after creation)

## Dependency Graph

Relationships are expressed via `depends_on` fields, not ordering.

```
project-structure
checkpoint-system

strava-mcp ──► history-analysis-skill ─┐
                                       │
graphhopper-api ──► gpx-generation     ├──► route-optimization-skill
                │                      │
                └──────────────────────┘

google-maps-mcp ──► food-stop-planning-skill

osm-overpass-wrapper ──► water-stop-planning-skill

pjamm-api-spike ──► pjamm-client ──► climb-planning-skill

weatherkit-client ──► weather-planning-skill ──┐
                                              │
route-optimization-skill ─────────────────────┼──► nutrition-planning-skill ──► nutrition-facts-agent
                                              │
                                              └──► clothing-planning-skill

web-search-ride-reports
narrative-research-skill

test-fixtures (user dependency)

# Evals (parallel track)
promptfoo-setup ──► eval-directory-structure ──┬──► nutrition-facts-evals
                                               ├──► clothing-planning-evals
                                               └──► custom-scorers
```
