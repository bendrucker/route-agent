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
    │ Strava  │        │  Climb   │        │ Weather  │
    │  MCP    │        │   Data   │        │   API    │
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
| Stop Planning | Find cafes, water, grocery stops | Routes > 40mi |
| Safety Assessment | Evaluate road conditions | Unfamiliar roads |

## Tools

The agent integrates 10+ external data sources via MCP and custom tools:

| Category | Examples | Status |
|----------|----------|--------|
| Activity History | Strava MCP | Available |
| Routing | Google Maps MCP | Available |
| Places | Google Places, Yelp | Available |
| Weather | OpenWeatherMap, Tomorrow.io | To select |
| Climb Data | PJAMM Cycling | API access TBD |
| Infrastructure | OpenStreetMap (Overpass) | To build |
| Elevation | Google Elevation, Open-Elevation | To select |

See [docs/tools-and-skills.md](docs/tools-and-skills.md) for full catalog.

## Development Status

**Phase: Planning & Architecture**

This project is in early design phase. See [docs/milestones.md](docs/milestones.md) for roadmap.

## Running

(Not yet implemented)

```bash
# Future: Run as Claude Code extension
claude --agent route-agent

# Future: Run standalone
npm start
```

## License

MIT
