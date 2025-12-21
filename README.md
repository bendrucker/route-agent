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

## Data Sources

The agent integrates multiple specialized sources:

| Source | Purpose |
|--------|---------|
| Strava | Activity history, segments, past routes |
| Google Maps | Places (cafes, grocery stores), Street View, general routing |
| OpenStreetMap | Water fountains, bike infrastructure, trail data |
| PJAMCYCLING | Climb profiles and ratings |
| (more TBD) | Weather, road conditions, etc. |

## Architecture

See [docs/architecture.md](docs/architecture.md) for detailed design.

```
┌─────────────────────────────────────────────────────────────┐
│                     User (Claude Code)                       │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Route Planning Agent                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Query     │  │  Research   │  │  Route Synthesis    │  │
│  │ Understanding│─▶│   Engine    │─▶│  & GPX Generation   │  │
│  └─────────────┘  └──────┬──────┘  └─────────────────────┘  │
└──────────────────────────┼──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
   ┌─────────┐       ┌──────────┐       ┌──────────┐
   │ Strava  │       │ Google   │       │   OSM    │
   │  MCP    │       │ Maps MCP │       │  Tools   │
   └─────────┘       └──────────┘       └──────────┘
```

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
