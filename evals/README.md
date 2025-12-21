# Evaluation Framework

This directory contains the Promptfoo evaluation framework configuration and test cases.

## Quick Start

```bash
# Install dependencies (first time only)
npm install

# Run all evaluations
npm run evals

# View results in web UI
npm run evals:view
```

## Directory Structure

```
evals/
├── examples/          # Example evaluations
│   └── basic.yaml    # Simple setup verification
├── scorers/          # Custom scoring functions (future)
├── fixtures/         # Shared test data (future)
└── results/          # Test results (gitignored)
```

## Creating New Evaluations

See `evals/examples/basic.yaml` for a simple example.

According to the architecture in `docs/evals.md`, evaluations should be colocated with the code they test:

```
src/
├── agents/
│   └── nutrition-facts/
│       ├── index.ts
│       └── evals/
│           ├── promptfooconfig.yaml
│           └── cases/
```

## Configuration

The root `promptfooconfig.yaml` contains default settings for all evaluations:
- Provider: Claude Sonnet 4.5
- Temperature: 0.0 for consistency
- Max concurrency: 4

## Learn More

- [Promptfoo Documentation](https://www.promptfoo.dev/docs/)
- [Project eval strategy](../docs/evals.md)

