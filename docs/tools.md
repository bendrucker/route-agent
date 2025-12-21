# Tools

Tools abstract access to external data sources. Each tool provides a consistent interface to an API or data service.

## Tool Categories

```mermaid
graph LR
    subgraph Core["Core Tools (Required)"]
        T1[Activity History]
        T2[Routing Engine]
        T3[Place Search]
    end

    subgraph Research["Research Tools"]
        T4[Climb Data]
        T5[Weather]
        T6[Water/Infrastructure]
    end

    subgraph Quality["Quality Assessment"]
        T7[Street Imagery]
        T8[Road Surface]
        T9[Traffic/Safety]
    end
```

## Tool Criticality

| Type | Behavior on Failure | Examples |
|------|---------------------|----------|
| **Critical** | Block - cannot proceed | Routing (GraphHopper), Activity History (Strava) |
| **Enhancing** | Degrade gracefully | PJAMM narratives, Web search, Weather details |

---

## 1. Activity History (Strava)

**Purpose**: Access personal cycling history, past routes, segments

**Implementation**: Strava MCP (open source)

**Capabilities**:
- Search activities by geographic area
- Filter by date, distance, elevation
- Get route geometry from past rides
- Access segment data (popular climbs, PRs)
- Query both routes (planned) and activities (actual rides)

---

## 2. Routing Engine (GraphHopper)

**Purpose**: Generate turn-by-turn routes between waypoints

**Decision**: GraphHopper selected as primary routing engine.

### Why GraphHopper

- Same backend as RideWithGPS, Komoot, and Sherpa Map
- Cycling-specific profiles built-in
- Open source (can self-host for unlimited use)
- Free API tier available for prototyping (500 credits/day)

### API Details

| Tier | Credits/Day | Rate Limit | Cost |
|------|-------------|------------|------|
| Free | 500 | Limited | $0 (non-commercial) |
| Basic | More | 1 req/sec | $59/mo |
| Self-hosted | Unlimited | Your hardware | $0 |

**APIs Available**:
- Routing API (turn-by-turn with elevation)
- Geocoding API
- Map Matching API (snap GPS to roads)
- Route Optimization API

**Not in Free Tier**: Isochrone, Matrix APIs

### Integration Path

1. Start with free API for prototyping
2. Self-host for production (unlimited, no cost)
3. GraphHopper uses OSM data, updates weekly

### Backup Options

| Option | Type | Notes |
|--------|------|-------|
| Google Maps MCP | MCP | Better place integration, less cycling-aware |
| OSRM | Self-host | Faster, less feature-rich |
| Brouter | Self-host | Most cycling-specific, steeper learning curve |

---

## 3. Place Search (Google Maps)

**Purpose**: Find cafes, grocery stores, bike shops, points of interest

**Implementation**: Google Maps MCP

**Capabilities**:
- Search by type within radius
- Search along a route corridor
- Get hours, ratings, photos
- Filter by currently open

---

## 4. Climb Data (PJAMM)

**Purpose**: Detailed climb profiles, difficulty ratings, local intel

### PJAMM/Sherpa Integration

PJAMM has merged with [Sherpa Map](https://sherpa-map.com/):

| Feature | Source |
|---------|--------|
| Climb narratives, photos, rankings | PJAMM |
| AI surface classification (gravel) | Sherpa |
| 28 routing profiles | Sherpa (GraphHopper backend) |
| Weather integration | Sherpa |

**User has paid PJAMM account** - will reverse-engineer mobile API.

### PJAMM Unique Value

Not replicable from open data:
- Narrative reports with firsthand local intel
- Photos of key sections
- Difficulty rankings calibrated across climbs

### Fallback: climb-analyzer

For areas PJAMM doesn't cover:
- OSM Overpass + OpenTopoData to discover climbs
- Provides metrics but no narrative/local intel
- Reference: [stevehollx/climb-analyzer](https://github.com/stevehollx/climb-analyzer)

---

## 5. Weather (Apple WeatherKit)

**Purpose**: Hyperlocal weather data for route timing and safety

**Decision**: Apple WeatherKit selected.

### Why WeatherKit

- Built by Dark Sky team (gold standard for hyperlocal forecasts)
- Same backend as Epic Ride Weather (proven for cycling)
- 500K calls/month included with existing Apple Developer account
- Minute-by-minute precipitation, hourly forecasts up to 10 days
- REST API available

### API Details

| Tier | Calls/Month | Cost |
|------|-------------|------|
| Free (with Apple Developer) | 500,000 | $0 (already paying $99/yr) |
| 1M calls | 1,000,000 | $49.99/mo |

**500K calls/month = ~16,000/day** - more than enough.

### Integration Pattern

1. Take route geometry from GraphHopper
2. Sample points every 10 minutes of estimated ride time
3. Call WeatherKit for each sample point
4. Return per-segment forecast (temp, wind, precipitation)

Example: 100-mile ride at 15mph = 6.7 hours = 40 sample points = 40 API calls

### Authentication

WeatherKit requires JWT tokens signed with Apple Developer credentials.

### Fallback Options

| Option | Type | Notes |
|--------|------|-------|
| Weather.gov | REST | Free, US only, 2.5km grid |
| Pirate Weather | REST | 20K/month free, Dark Sky compatible |

---

## 6. Water & Infrastructure (OSM)

**Purpose**: Cycling-specific infrastructure not in commercial maps

**Implementation**: OSM Overpass API

**Capabilities**:
- Find drinking water fountains (amenity=drinking_water)
- Locate bike repair stations
- Identify restroom facilities
- Query surface type (paved, gravel)

---

## 7. Elevation

**Purpose**: Detailed elevation profiles for arbitrary paths

**Note**: GraphHopper routing responses include elevation data, so this may not need a separate tool.

| Option | Type | Notes |
|--------|------|-------|
| GraphHopper (included) | Via routing | Comes with route response |
| Open-Elevation | REST/Self-host | Open source, good fallback |
| SRTM data direct | Local | Free, 30m resolution |

---

## 8. Street Imagery (P3 - Deferred)

**Purpose**: Visual assessment of road conditions, scenery

| Option | Type | Notes |
|--------|------|-------|
| Google Street View API | REST | Best coverage |
| Mapillary | REST | Open source, cyclist contributed |

---

## 9. Road Surface (P3 - Deferred)

**Purpose**: Determine pavement condition, surface type

| Option | Type | Notes |
|--------|------|-------|
| OSM surface tags | Via Overpass | Inconsistent but free |
| Strava heatmap analysis | Derived | Popular = probably rideable |

---

## 10. Traffic & Safety (P3 - Deferred)

**Purpose**: Avoid dangerous roads, construction

| Option | Type | Notes |
|--------|------|-------|
| Google Traffic | Via Directions | Real-time, car-focused |
| Local DOT feeds | Varies | Construction, closures |

---

## Development Priority

```mermaid
graph TD
    subgraph P0["P0: MVP"]
        Strava[Strava MCP]
        GraphHopper[GraphHopper]
    end

    subgraph P1["P1: Core Research"]
        Weather[WeatherKit]
        Climb[PJAMM]
        OSM[OSM/Water]
        Places[Google Places]
    end

    subgraph P3["P3: Deferred"]
        StreetView[Street View]
        Traffic[Traffic]
        Surface[Surface Quality]
    end

    P0 --> P1 --> P3
```
