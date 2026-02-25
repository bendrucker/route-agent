# Evaluation Framework

Promptfoo-based evaluations colocated with the code they test.

## Quick Start

```bash
# Run all colocated evals
bun run evals

# Run evals matching a filter
bun run evals -- checkpoint

# Run a single eval config directly
bunx promptfoo eval -c src/agents/nutrition-facts/evals/promptfooconfig.yaml

# View results in web UI
bun run evals:view
```

## Directory Structure

Evals live next to the code they test. Each component has an `evals/` directory with its own `promptfooconfig.yaml` and test cases:

```
src/
├── agents/
│   └── nutrition-facts/
│       ├── index.ts
│       └── evals/
│           ├── promptfooconfig.yaml
│           └── cases/
│               ├── commercial-products.yaml
│               └── generic-items.yaml
└── skills/
    └── clothing-planning/
        ├── index.ts
        └── evals/
            ├── promptfooconfig.yaml
            └── cases/
```

Shared utilities live in this directory:

```
evals/
├── run-all.ts             # Discovery script for bun run evals
├── scorers/               # Custom scoring functions
├── fixtures/              # Shared test data
│   └── gold-standard/     # Real trip regression fixtures
└── results/               # Output (gitignored)
```

## Creating Evals for a Component

Each colocated `promptfooconfig.yaml` is a standalone Promptfoo config. `run-all.ts` discovers configs matching `src/**/evals/promptfooconfig.yaml` and runs them in sequence.

A minimal config:

```yaml
description: "Nutrition facts agent"

prompts:
  - file://../../prompt.txt

providers:
  - anthropic:messages:claude-sonnet-4-5-20250929

defaultTest:
  options:
    provider:
      config:
        temperature: 0.0
        max_tokens: 4096

tests:
  - vars:
      product: "Clif Bar Chocolate Chip"
    assert:
      - type: contains-json
      - type: javascript
        value: output.calories === 250
```

For larger test suites, split cases into separate YAML files and reference them:

```yaml
tests:
  - file://cases/commercial-products.yaml
  - file://cases/generic-items.yaml
```

## Custom Scorers

Reusable scoring functions in `scorers/` for domain-specific eval assertions. Reference them from any colocated `promptfooconfig.yaml` using the `file://` prefix with a named export:

```yaml
assert:
  - type: javascript
    value: file://../../evals/scorers/nutrition.ts:calorieEstimate
    config:
      min: 200
      max: 300
```

The path is relative to the config file's location. Adjust the `../` depth to match.

### Available Scorers

**JSON** (`scorers/json.ts`)
- `hasKeys` — assert required keys exist in JSON output
- `numericRanges` — assert numeric fields fall within expected ranges

**Nutrition** (`scorers/nutrition.ts`)
- `completeNutrition` — validate all nutrition fields are present
- `calorieEstimate` — partial-credit scoring for calorie accuracy
- `macroConsistency` — check that macro grams are consistent with calorie count
- `confidenceLevel` — assert `confidence` matches expected value (`"exact"` or `"estimated"`)

**Route** (`scorers/route.ts`)
- `mentionsLocations` — assert output references specific geographic locations
- `invokesSkills` — assert output references expected skill names
- `distanceInRange` — validate route distance against a target with tolerance

**Cycling** (`scorers/cycling.ts`)
- `foodStopSpacing` — validate food stops are spaced within safe intervals
- `clothingForConditions` — assert clothing recommendations match temperature range
- `climbAwareness` — validate effort management and sequencing for climbs

### Scorer Return Values

Each scorer returns a `GradingResult` with `pass`, `score` (0-1), and `reason`. Many scorers award partial credit rather than binary pass/fail.

## Gold Standard Cases

Real trip examples used as regression fixtures. These are blocked on user input — see [#26](https://github.com/bendrucker/route-agent/issues/26).

Template: `fixtures/gold-standard/example.yaml`

## Learn More

- [Project eval strategy](../docs/evals.md)
- [Promptfoo documentation](https://www.promptfoo.dev/docs/)
