# Sub-agents

Sub-agents are focused, stateless helpers that skills invoke for specific data retrieval tasks. Unlike skills, sub-agents don't need route planning context.

See [architecture.md](architecture.md#skills-vs-sub-agents) for when to use skills vs sub-agents.

## Skills vs Sub-agents

| Characteristic | Skill | Sub-agent |
|----------------|-------|-----------|
| Invoked by | Orchestrator | Skills |
| Context needs | Route, weather, etc. | Just the query |
| Reasoning | Complex domain logic | Simple lookup/estimation |
| Output | Affects route planning | Returns data to skill |

---

## Nutrition Facts Agent

**Used by**: [Nutrition Planning](skills.md#9-nutrition-planning) skill

**Purpose**: Look up nutritional information for food items. Handles both commercial products (exact values) and generic items (estimated values).

### Input/Output

**Input**: Product name or description

**Output**:
```typescript
{
  calories: number;
  carbs_g: number;
  protein_g: number;
  fat_g: number;
  serving_size: string;
  confidence: "exact" | "estimated";
}
```

### Data Sources

- USDA FoodData Central API (free)
- OpenFoodFacts (community database)
- Brand websites (for commercial products)
- Estimation logic for generic items

### Examples

| Input | Calories | Confidence |
|-------|----------|------------|
| Clif Bar Chocolate Chip | 250 | exact |
| GU Energy Gel | 100 | exact |
| chocolate chip cookie | ~150 | estimated |
| PB&J sandwich | ~400 | estimated |

### Implementation Notes

- Doesn't need route context - just takes product name, returns data
- For cycling-specific products (gels, bars, drink mixes), maintain a curated database of common items
- The Nutrition Planning skill handles reasoning about when/where to consume foods

---

## Future Sub-agents

These may be extracted as sub-agents during implementation:

| Candidate | Would be used by | Purpose |
|-----------|------------------|---------|
| Place Details | Food Stop Planning | Get hours, reviews, photos for a place |
| Climb Profile | Climb Planning | Fetch PJAMM data for a specific climb |
| Web Search | Narrative Research | Search forums/ride reports |
| Street View Analysis | Safety Assessment | Analyze imagery for road conditions |

Whether these become sub-agents or remain inline depends on:
- How much context they need
- How reusable they are across skills
- Whether they benefit from focused prompting
