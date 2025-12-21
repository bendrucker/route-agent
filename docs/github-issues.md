# GitHub Issues Structure

This document defines the issue hierarchy for the Route Agent project. It's structured for automated creation via the GitHub API.

## Milestones

```yaml
milestones:
  - title: "M0: Foundation"
    description: "Basic agent skeleton running in Claude Code"

  - title: "M1: Strava Integration"
    description: "Agent understands cycling history and preferences"

  - title: "M2: GraphHopper Integration"
    description: "Cycling-optimized routing between waypoints"

  - title: "M3: Route Synthesis"
    description: "Combine Strava history + GraphHopper routing into a plan"

  - title: "M4: Place Search"
    description: "Find cafes, stores, and stops along routes"

  - title: "M5: Water Stops"
    description: "Dedicated water stop planning for hot weather"

  - title: "M6: Climb Integration"
    description: "Deep knowledge of climbs via PJAMM"

  - title: "M7: Weather Integration"
    description: "Hyperlocal weather along routes via WeatherKit"

  - title: "M8: Narrative Research"
    description: "Enrich routes with local intel from multiple sources"

  - title: "M9: Research Quality"
    description: "Expert-level multi-source research"

  - title: "M10: Route Refinement"
    description: "Interactive fine-tuning of routes"

  - title: "M11: Evaluation Framework"
    description: "Systematic quality measurement with test fixtures"
```

## Labels

```yaml
labels:
  - name: "tool"
    color: "0052CC"
    description: "External API/MCP integration"

  - name: "skill"
    color: "5319E7"
    description: "Agent skill implementation"

  - name: "infrastructure"
    color: "006B75"
    description: "Project setup, tooling, CI"

  - name: "spike"
    color: "FBCA04"
    description: "Research/investigation task"

  - name: "blocked"
    color: "B60205"
    description: "Waiting on external dependency"

  - name: "user-input-needed"
    color: "D93F0B"
    description: "Requires input from user"

  - name: "critical-path"
    color: "C2E0C6"
    description: "Blocks other work"
```

---

## Issues by Milestone

### M0: Foundation

#### Issue: Set up Claude Agent SDK project structure
- **Labels**: infrastructure, critical-path
- **Milestone**: M0: Foundation
- **Description**:
  ```
  Set up the basic project structure for the Route Agent.

  Acceptance Criteria:
  - [ ] Package.json / project configuration
  - [ ] Agent entry point
  - [ ] Basic agent can receive a query and respond
  - [ ] Logging infrastructure
  ```

#### Issue: Implement checkpoint system with AskUserQuestion
- **Labels**: infrastructure
- **Milestone**: M0: Foundation
- **Description**:
  ```
  Implement the checkpoint flow for user confirmations.

  Checkpoints needed:
  - [ ] Confirm Intent
  - [ ] Present Findings
  - [ ] Select Route
  - [ ] Refine Route
  - [ ] Present Final

  Use AskUserQuestion for prototyping in Claude Code.
  ```

---

### M1: Strava Integration

#### Issue: Integrate Strava MCP
- **Labels**: tool, critical-path
- **Milestone**: M1: Strava Integration
- **Description**:
  ```
  Integrate the existing open-source Strava MCP.

  Acceptance Criteria:
  - [ ] MCP integrated and authenticated
  - [ ] Can query activities by location
  - [ ] Can query activities by date range
  - [ ] Can query routes (planned) and activities (actual)
  ```

#### Issue: Implement History Analysis skill
- **Labels**: skill
- **Milestone**: M1: Strava Integration
- **Depends on**: Integrate Strava MCP
- **Description**:
  ```
  Skill to analyze user's cycling history.

  Capabilities:
  - [ ] Find past rides in target area
  - [ ] Extract segments used before
  - [ ] Identify new vs. familiar roads
  - [ ] Present activity summaries

  Should handle casual location references:
  - "Golden Gate Bridge"
  - "Conservatory of Flowers"
  ```

---

### M2: GraphHopper Integration

#### Issue: Integrate GraphHopper API
- **Labels**: tool, critical-path
- **Milestone**: M2: GraphHopper Integration
- **Description**:
  ```
  Integrate GraphHopper for cycling-optimized routing.

  Acceptance Criteria:
  - [ ] API client with free tier auth
  - [ ] Cycling-specific routing profiles
  - [ ] Multi-waypoint routes
  - [ ] Elevation profiles in response
  - [ ] On-disk caching for dev (preserve free quota)
  ```

#### Issue: Implement GPX generation
- **Labels**: infrastructure
- **Milestone**: M2: GraphHopper Integration
- **Depends on**: Integrate GraphHopper API
- **Description**:
  ```
  Generate valid GPX files from route data.

  Acceptance Criteria:
  - [ ] Valid GPX 1.1 format
  - [ ] Track points from route
  - [ ] Waypoints for stops
  - [ ] Metadata (name, description, stats)
  - [ ] Compatible with Wahoo/Garmin devices
  ```

---

### M3: Route Synthesis

#### Issue: Implement query parser
- **Labels**: skill
- **Milestone**: M3: Route Synthesis
- **Description**:
  ```
  Parse user queries into structured route requests.

  Should extract:
  - [ ] Origin location
  - [ ] Destination(s)
  - [ ] Waypoints
  - [ ] Distance constraints
  - [ ] Skill triggers (climbing, weather, stops)
  ```

#### Issue: Implement Route Optimization skill
- **Labels**: skill, critical-path
- **Milestone**: M3: Route Synthesis
- **Depends on**: Integrate GraphHopper API, History Analysis skill
- **Description**:
  ```
  Synthesize routes using history + routing.

  Capabilities:
  - [ ] Use Strava history to inform preferences
  - [ ] Generate route through waypoints
  - [ ] Incorporate familiar segments
  - [ ] Produce GPX output
  ```

---

### M4: Place Search

#### Issue: Integrate Google Maps MCP
- **Labels**: tool
- **Milestone**: M4: Place Search
- **Description**:
  ```
  Integrate Google Maps MCP for place search.

  Acceptance Criteria:
  - [ ] Search cafes/stores along corridor
  - [ ] Get hours, ratings, photos
  - [ ] Filter by currently open
  ```

#### Issue: Implement Food Stop Planning skill
- **Labels**: skill
- **Milestone**: M4: Place Search
- **Depends on**: Integrate Google Maps MCP
- **Description**:
  ```
  Find and optimize food stops along routes.

  Capabilities:
  - [ ] Find cafes/restaurants along route
  - [ ] Check hours (critical for early/late rides)
  - [ ] Optimize placement timing
  - [ ] Cyclist-friendly assessment
  ```

---

### M5: Water Stops

#### Issue: Implement OSM Overpass wrapper
- **Labels**: tool
- **Milestone**: M5: Water Stops
- **Description**:
  ```
  Wrapper for OpenStreetMap Overpass API.

  Queries needed:
  - [ ] amenity=drinking_water
  - [ ] Parks with water facilities
  - [ ] Surface type data (bonus)
  ```

#### Issue: Implement Water Stop Planning skill
- **Labels**: skill
- **Milestone**: M5: Water Stops
- **Depends on**: Implement OSM Overpass wrapper
- **Description**:
  ```
  Dedicated water stop planning for hot weather.

  Capabilities:
  - [ ] Find water fountains along route
  - [ ] Identify reliable vs. seasonal sources
  - [ ] Plan for summer heat (more frequent)
  - [ ] Skip in winter when not needed
  ```

---

### M6: Climb Integration

#### Issue: [SPIKE] Reverse-engineer PJAMM mobile API
- **Labels**: spike, user-input-needed
- **Milestone**: M6: Climb Integration
- **Description**:
  ```
  Investigate PJAMM mobile app API.

  Steps:
  - [ ] Set up proxy (Charles/mitmproxy)
  - [ ] Capture traffic from PJAMM app
  - [ ] Document API endpoints
  - [ ] Document auth mechanism
  - [ ] Test API access with paid account

  User has paid PJAMM account.
  ```

#### Issue: Implement PJAMM client
- **Labels**: tool
- **Milestone**: M6: Climb Integration
- **Depends on**: [SPIKE] Reverse-engineer PJAMM mobile API
- **Description**:
  ```
  Client for PJAMM API.

  Capabilities:
  - [ ] Search climbs by area
  - [ ] Get climb profiles
  - [ ] Get narrative reports
  - [ ] Get photos
  - [ ] Handle auth with user's account
  ```

#### Issue: Implement Climb Planning skill
- **Labels**: skill
- **Milestone**: M6: Climb Integration
- **Depends on**: Implement PJAMM client
- **Description**:
  ```
  Research and select climbs for routes.

  Capabilities:
  - [ ] Discover climbs in target area
  - [ ] Analyze climb profiles
  - [ ] Compare difficulty ratings
  - [ ] Suggest sequencing
  - [ ] Identify new climbs not yet done
  - [ ] Fallback to climb-analyzer if PJAMM unavailable
  ```

---

### M7: Weather Integration

#### Issue: Implement WeatherKit client
- **Labels**: tool
- **Milestone**: M7: Weather Integration
- **Description**:
  ```
  Client for Apple WeatherKit API.

  Requirements:
  - [ ] JWT authentication with Apple Developer credentials
  - [ ] Query weather at arbitrary coordinates
  - [ ] Hourly forecasts
  - [ ] Wind speed and direction
  - [ ] Precipitation probability
  - [ ] On-disk caching
  ```

#### Issue: Implement Weather Planning skill
- **Labels**: skill
- **Milestone**: M7: Weather Integration
- **Depends on**: Implement WeatherKit client
- **Description**:
  ```
  Hyperlocal weather along routes.

  Pattern (Epic Ride Weather approach):
  - [ ] Sample route every 10 min of ride time
  - [ ] Call WeatherKit for each sample point
  - [ ] Wind analysis (headwind/tailwind)
  - [ ] Recommend start times
  - [ ] Weather warnings
  ```

---

### M8: Narrative Research

#### Issue: Implement web search for ride reports
- **Labels**: tool
- **Milestone**: M8: Narrative Research
- **Description**:
  ```
  Search for forum posts and ride reports.

  Sources to consider:
  - [ ] General web search
  - [ ] Cycling forums
  - [ ] Reddit cycling communities
  ```

#### Issue: Implement Narrative Research skill
- **Labels**: skill
- **Milestone**: M8: Narrative Research
- **Description**:
  ```
  Enrich routes with local intel.

  Capabilities:
  - [ ] Aggregate PJAMM narratives (if available)
  - [ ] Search for ride reports
  - [ ] Synthesize into route notes
  - [ ] Graceful degradation if sources unavailable
  ```

---

### M9-M11: Later Milestones

Issues for M9 (Research Quality), M10 (Route Refinement), and M11 (Evaluation Framework) to be defined after core functionality is validated.

---

## User Dependencies (Pre-requisites)

#### Issue: [USER] Provide test fixture examples
- **Labels**: user-input-needed, blocked
- **Milestone**: M11: Evaluation Framework
- **Description**:
  ```
  Need 2-3 example route queries with expected reasoning.

  Format:
  - Query: "Route from X to Y via Z, ~N miles"
  - Expected skills invoked
  - Key decisions agent should make
  - Expected output characteristics
  ```

#### Issue: [USER] PJAMM API investigation
- **Labels**: user-input-needed, spike
- **Milestone**: M6: Climb Integration
- **Description**:
  ```
  User to proxy PJAMM mobile app and document API.

  Deliverables:
  - API endpoint patterns
  - Auth mechanism
  - Example responses
  ```

---

## Dependency Graph

```
M0 ──┬── M1 (Strava) ────┐
     │                   │
     └── M2 (GraphHopper)┼── M3 (Synthesis) ──┬── M4 (Places)
                         │                    ├── M5 (Water)
                         │                    ├── M6 (Climbs) ← [USER: PJAMM]
                         │                    └── M7 (Weather)
                         │                              │
                         │                              ▼
                         │                         M8 (Narrative)
                         │                              │
                         │                              ▼
                         │                         M9 (Quality)
                         │                              │
                         │                              ▼
                         │                         M10 (Refinement)
                         │                              │
                         │                              ▼
                         └────────────────────────M11 (Evaluation) ← [USER: Fixtures]
```
