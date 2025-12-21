# Sub-agents

Sub-agents are focused, stateless helpers that skills invoke for specific data retrieval tasks. Unlike skills, sub-agents:

- Don't need route planning context
- Return small, structured data
- Are invoked by skills, not the orchestrator
- Handle one focused lookup or computation

## Sub-agents vs Skills

| Characteristic | Skill | Sub-agent |
|----------------|-------|-----------|
| Invoked by | Orchestrator | Skills |
| Context needs | Route, weather, etc. | Just the query |
| Reasoning | Complex domain logic | Simple lookup/estimation |
| Output | Affects route planning | Returns data to skill |

## Known Sub-agents

| Sub-agent | Used by | Purpose |
|-----------|---------|---------|
| [Nutrition Facts](nutrition-facts.yaml) | Nutrition Planning | Look up macros for food items |

## Future Sub-agents (Candidates)

These may be extracted as sub-agents during implementation:

| Candidate | Would be used by | Purpose |
|-----------|------------------|---------|
| Place Details | Food Stop Planning | Get hours, reviews, photos for a place |
| Climb Profile | Climb Planning | Fetch PJAMM data for a specific climb |
| Web Search | Narrative Research | Search forums/ride reports |
| Street View Analysis | Safety Assessment | Analyze imagery for road conditions |

Whether these become sub-agents or remain inline in skills depends on:
- How much context they need
- How reusable they are across skills
- Whether they benefit from focused prompting
