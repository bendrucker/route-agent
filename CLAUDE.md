# Route Agent - Development Context

## Project Overview

This is a deep research agent for cycling route planning. It integrates 5-10+ data sources to do the kind of multi-source research an expert cyclist would do manually.

## Key Design Decisions

### User Interaction Model
- **Not autonomous**: User stays in control with frequent confirmations
- **Research assistant**: Surfaces options and information, doesn't just produce final routes
- **Prototype in Claude Code**: Use AskUserQuestion for early iteration before building UI

### Technology Stack
- **Claude Agent SDK**: Core agent framework
- **MCP Tools**: Each data source wrapped as an MCP server
- **GPX Output**: Final format (no Strava upload API available)

### Data Sources (Priority Order)
1. **Strava MCP** (existing open source) - Activity history, segments
2. **Google Maps MCP** (grounding light) - Places, Street View, routing
3. **OpenStreetMap** - Water fountains, bike infrastructure
4. **PJAMCYCLING** - Climb data and profiles
5. Additional sources TBD

## Architecture Notes

See `docs/architecture.md` for full design. Key concepts:

- **Research Engine**: Orchestrates parallel data gathering from multiple MCPs
- **Route Synthesis**: Combines gathered data into route candidates
- **Checkpoint System**: Structured moments where agent pauses for user input

## Development Approach

This agent optimizes for **quality over speed**. It's acceptable to spend 10-20 minutes on deep research to produce an excellent route plan. The goal is to encode expert route-building knowledge.

## Testing Philosophy

Routes will be evaluated against real trips the maintainer has in mind. These become fixtures for regression testing as the agent improves.
