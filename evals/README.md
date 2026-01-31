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

## Gold Standard Cases

Real trip examples used as regression fixtures. These are blocked on user input — see [#26](https://github.com/bendrucker/route-agent/issues/26).

Template: `fixtures/gold-standard/example.yaml`

## Learn More

- [Project eval strategy](../docs/evals.md)
- [Promptfoo documentation](https://www.promptfoo.dev/docs/)
