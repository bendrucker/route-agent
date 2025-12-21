# Evaluation Framework

Test-driven development for the route agent using structured evaluations.

## Framework Choice: Promptfoo

[Promptfoo](https://github.com/promptfoo/promptfoo) is a TypeScript-native evaluation framework that fits our needs:

- **TypeScript-first**: Native support, works with Claude Agent SDK
- **Declarative configs**: YAML-based test cases, easy to maintain
- **Local execution**: Run evals locally during development
- **Provider agnostic**: Works with Anthropic/Claude
- **Assertions**: Built-in validation for pass/fail grading

## Directory Structure

Evals are organized as siblings of the code they test:

```
route-agent/
├── src/
│   ├── agents/
│   │   └── nutrition-facts/
│   │       ├── index.ts
│   │       └── evals/
│   │           ├── promptfooconfig.yaml
│   │           └── cases/
│   │               ├── commercial-products.yaml
│   │               └── generic-items.yaml
│   ├── skills/
│   │   ├── nutrition-planning/
│   │   │   ├── index.ts
│   │   │   └── evals/
│   │   │       ├── promptfooconfig.yaml
│   │   │       └── cases/
│   │   └── clothing-planning/
│   │       ├── index.ts
│   │       └── evals/
│   │           ├── promptfooconfig.yaml
│   │           └── cases/
│   └── orchestrator/
│       ├── index.ts
│       └── evals/
│           ├── promptfooconfig.yaml
│           └── cases/
│               └── e2e/
└── evals/                    # Shared eval utilities
    ├── scorers/              # Custom scoring functions
    ├── fixtures/             # Shared test data
    └── run-all.ts            # Script to run all evals
```

Evals are colocated with code for discoverability and maintenance.

## Eval Categories

### 1. Sub-agent Evals (Narrow, Focused)

Test focused lookup agents with specific inputs and expected outputs.

**Nutrition Facts Agent:**
```yaml
# src/agents/nutrition-facts/evals/promptfooconfig.yaml
prompts:
  - file://../../prompt.txt

providers:
  - anthropic:messages:claude-sonnet-4-5-20250929

tests:
  # Commercial products - exact values
  - vars:
      product: "Clif Bar Chocolate Chip"
    assert:
      - type: contains-json
      - type: javascript
        value: output.calories === 250 && output.confidence === 'exact'

  # Generic items - estimated values
  - vars:
      product: "chocolate chip cookie"
    assert:
      - type: contains-json
      - type: javascript
        value: output.calories > 100 && output.calories < 200
      - type: javascript
        value: output.confidence === 'estimated'
```

**Start here**: Sub-agents have narrow scope, making them ideal for learning evals.

### 2. Skill Evals (Medium Scope)

Test skills with route context, validating reasoning and outputs.

**Clothing Planning Skill:**
```yaml
# src/skills/clothing-planning/evals/promptfooconfig.yaml
prompts:
  - file://../../prompt.txt

providers:
  - anthropic:messages:claude-sonnet-4-5-20250929

tests:
  - vars:
      start_temp_f: 45
      end_temp_f: 72
      elevation_gain_ft: 4000
      duration_hours: 5
    assert:
      - type: llm-rubric
        value: |
          The response should:
          - Recommend arm warmers or removable sleeves
          - Mention storage for removed layers
          - Consider warmth from climbing effort

  - vars:
      start_temp_f: 65
      end_temp_f: 65
      elevation_gain_ft: 500
      duration_hours: 2
    assert:
      - type: llm-rubric
        value: |
          The response should:
          - Recommend minimal layers
          - Not suggest bringing a bag for storage
```

### 3. End-to-End Evals (Full System)

Test complete route planning with user-provided gold standard cases.

**Full Route Planning:**
```yaml
# src/orchestrator/evals/cases/e2e/promptfooconfig.yaml
prompts:
  - file://../../prompt.txt

providers:
  - anthropic:messages:claude-sonnet-4-5-20250929

tests:
  # Gold standard case from user
  - vars:
      query: "Route from Conservatory of Flowers to Tunitas Creek, ~90 miles"
      start_location: "Conservatory of Flowers, San Francisco"
    assert:
      - type: llm-rubric
        value: |
          The response should:
          - Include a route to Tunitas Creek
          - Suggest climbs along the way
          - Recommend food stops at appropriate intervals
          - Generate valid GPX output
```

## Assertion Types

Promptfoo supports several assertion types useful for our evals:

| Type | Use Case |
|------|----------|
| `contains-json` | Validate structured output |
| `javascript` | Custom validation logic |
| `llm-rubric` | LLM-as-judge for subjective quality |
| `similar` | Semantic similarity check |
| `cost` | Ensure cost stays under threshold |
| `latency` | Performance requirements |

### Custom Scorers

For domain-specific validation, create custom scorers:

```typescript
// evals/scorers/nutrition.ts
export function validateCalorieEstimate(
  output: NutritionOutput,
  expected: { min: number; max: number }
): number {
  if (output.calories >= expected.min && output.calories <= expected.max) {
    return 1.0;
  }
  // Partial credit for close estimates
  const distance = Math.min(
    Math.abs(output.calories - expected.min),
    Math.abs(output.calories - expected.max)
  );
  return Math.max(0, 1 - distance / 100);
}
```

## Running Evals

### Single Component

```bash
# Run evals for a specific sub-agent
cd src/agents/nutrition-facts/evals
npx promptfoo eval

# Run evals for a skill
cd src/skills/clothing-planning/evals
npx promptfoo eval
```

### All Evals

```bash
# Run all evals
npm run evals

# Run with filtering
npm run evals -- --filter "nutrition"
```

### View Results

```bash
# Open web UI to view results
npx promptfoo view
```

## Gold Standard Test Cases

Gold standard cases come from the user - real route queries with expected reasoning.

### Format

```yaml
# evals/fixtures/gold-standard/tunitas-creek.yaml
name: Tunitas Creek via Pescadero
query: "Route from Conservatory of Flowers to Tunitas Creek, ~90 miles"

context:
  start_location: "Conservatory of Flowers, San Francisco"
  distance_target_mi: 90
  date: "2024-07-15"
  start_time: "7:00 AM"

expected:
  skills_invoked:
    - History Analysis
    - Route Optimization
    - Climb Planning
    - Food Stop Planning
    - Weather Planning

  key_decisions:
    - "Should route via Pescadero for coastal approach"
    - "Tunitas Creek climb is the main objective"
    - "Need food stop before the climb"

  output_characteristics:
    - "GPX file with waypoints"
    - "Climb profile for Tunitas"
    - "Weather warnings if applicable"
```

### User Dependency

Gold standard cases are blocked on user input:

| Case | Status | Notes |
|------|--------|-------|
| Tunitas Creek route | **Needed** | Climb-focused, coastal |
| Mt. Tam loop | **Needed** | Multi-climb, Marin |
| South Bay flat | **Needed** | Speed-focused, minimal climbing |

## Metrics to Track

| Metric | Target | Notes |
|--------|--------|-------|
| Pass rate | > 90% | For gold standard cases |
| Latency | < 30s | For skill evals |
| Cost per eval | < $0.10 | For development iteration |
| Regression rate | 0% | No degradation on changes |

## References

- [Promptfoo Documentation](https://www.promptfoo.dev/docs/)
- [Promptfoo GitHub](https://github.com/promptfoo/promptfoo)
- [Braintrust AutoEvals](https://github.com/braintrustdata/autoevals) (alternative)
