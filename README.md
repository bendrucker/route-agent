# Route Agent

A deep research agent for planning ambitious cycling routes. Built with Claude Agent SDK.

## Vision

This agent encapsulates expert knowledge about route planning, integrating data from many sources that would otherwise require hours of manual research. It's designed for planning 80-100+ mile routes with specific goals: reaching new climbs, finding interesting destinations, and locating convenient stops along the way.

**This is not a simple routing tool.** Google Maps can give you turn-by-turn directions. This agent does the research a serious cyclist would do: analyzing past rides, finding climb data, locating water stops, identifying cafes near the route, and synthesizing all of this into a cohesive plan.

## Core Principles

1. **User in the driver's seat** - Frequent check-ins and confirmations, not autonomous black-box planning
2. **Deep research over quick answers** - Willing to spend 10-20 minutes aggregating data from many sources
3. **Expert knowledge encoded** - The agent should reason like an experienced route planner
4. **GPX output** - Final deliverable is a GPX file ready for bike computers

## Architecture

The agent uses a **skills-based architecture** where composable skills handle specific aspects of route planning. Skills are invoked conditionally based on route requirements, keeping context focused.

```
┌─────────────────────────────────────────────────────────────────┐
│                      User (Claude Code)                          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Route Planning Orchestrator                    │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────────┐  │
│  │    Query     │  │    Skill      │  │   Route Synthesis    │  │
│  │Understanding │─▶│   Invoker     │─▶│  & GPX Generation    │  │
│  └──────────────┘  └───────┬───────┘  └──────────────────────┘  │
└────────────────────────────┼────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ History Analysis│ │ Climb Planning  │ │ Weather Planning│
│     Skill       │ │     Skill       │ │     Skill       │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         ▼                   ▼                   ▼
    ┌─────────┐        ┌──────────┐        ┌──────────┐
    │ Strava  │        │  PJAMM   │        │WeatherKit│
    │  MCP    │        │   API    │        │   API    │
    └─────────┘        └──────────┘        └──────────┘
```

See [docs/architecture.md](docs/architecture.md) for detailed design.

## Skills

| Skill | Purpose | When Invoked |
|-------|---------|--------------|
| History Analysis | Analyze past rides in target area | Always |
| Route Optimization | Generate optimal route through waypoints | Always |
| Climb Planning | Research and select climbs | Climbing routes |
| Weather Planning | Hyperlocal weather along route | Adverse conditions, long routes |
| Food Stop Planning | Find cafes and restaurants | Routes > 40mi |
| Water Stop Planning | Find water fountains and stores | Hot weather, summer rides |
| Nutrition Planning | Plan calorie consumption and fueling | Long routes |
| Clothing Planning | Match clothing to weather conditions | Temperature swings |
| Narrative Research | Local intel from web/forums | New areas |
| Safety Assessment | Evaluate road conditions | Unfamiliar roads |

## Tools

| Category | Decision | Status |
|----------|----------|--------|
| Activity History | Strava MCP | Available |
| Routing | GraphHopper | Selected |
| Places | Google Maps MCP | Available |
| Weather | Apple WeatherKit | Selected |
| Climb Data | PJAMM | Selected (API investigation needed) |
| Water/Infrastructure | OSM Overpass | To build |

See [docs/tools.md](docs/tools.md) and [docs/skills.md](docs/skills.md) for details.

## Project Structure

```
route-agent/
├── docs/           # Permanent documentation
│   ├── architecture.md
│   ├── tools.md
│   └── skills.md
├── specs/          # Temporary planning → GitHub issues
│   ├── milestones.md
│   ├── issues/     # Individual issue files for GitHub API
│   │   ├── config.yaml
│   │   └── {name}.yaml
│   └── agents/     # Sub-agent specifications
│       └── {name}.yaml
└── CLAUDE.md       # Development context
```

## Development Status

**Phase: Planning & Architecture**

See [specs/milestones.md](specs/milestones.md) for roadmap.

## License

MIT
