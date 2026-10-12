# RouteWise Algorithms

All algorithm code lives in `backend/src/main/java/com/routewise/algorithm` and is plain Java (no Spring dependency besides `@Component` for DI), so it's fully unit-testable in isolation. See `backend/src/test/java/com/routewise/algorithm` for coverage.

## 1. Resource Ranking (`ResourceRankingService`)

**This is deliberately not "pick the nearest ambulance."** For every `AVAILABLE` ambulance, RouteWise computes:

- `normalizedDistance` — haversine distance (km) from ambulance to emergency.
- `normalizedTravelTime` — distance ÷ assumed city speed, multiplied by a simulated per-ambulance traffic factor (1.0–1.8×) and a priority multiplier (`CRITICAL` ×1.5 … `LOW` ×0.85), so urgent calls weight travel time more heavily.
- `trafficPenalty` — derived from the same simulated traffic factor.

```
score = distance * W_DISTANCE
      + travelTime * W_TRAVEL_TIME
      + trafficPenalty * W_TRAFFIC
```
(`W_DISTANCE = 0.35, W_TRAVEL_TIME = 0.45, W_TRAFFIC = 0.20` — configurable constants.)

Lower score wins. Every ranked ambulance carries a human-readable `selectionReason` string, and the winning assignment's score/ETA/distance/reason are persisted on `emergency_assignments` for auditability — this is what the citizen and admin UIs display instead of a black-box decision.

## 2. Hospital Selection (`HospitalSelectionService`)

Ranks all hospitals by simulated ETA from the pickup point, then applies penalties for: no emergency capability (+100), `FULL` status (+80), `OFFLINE` status (+200), `BUSY` status (+15), no ICU (+10), zero beds (+20). Hospitals are never silently dropped — even a `FULL`/`OFFLINE` hospital is scored and ranked (just pushed down), so the reasoning stays fully auditable.

## 3. Graph model (`Graph`, `GraphNode`, `GraphEdge`)

A simple weighted directed graph with adjacency lists. `SyntheticRoadNetworkProvider` builds a small graph (source → 4 interpolated intermediate nodes → destination) between any two GPS points, with per-segment distance/base-time/simulated-traffic-weight — standing in for a real road network without requiring a paid routing API.

## 4. Dijkstra (`DijkstraAlgorithm`)

Classic single-source shortest path using a `PriorityQueue` keyed on accumulated weighted travel time. Handles:

- Multiple candidate paths (picks the lowest-cost one).
- Same source/destination (trivial 1-node path, zero cost).
- Unreachable destination / disconnected node (`pathFound = false`).
- Empty graph or invalid node IDs (`pathFound = false`, no exception).

## 5. A* (`AStarAlgorithm`)

Same graph, but the priority queue is keyed on `f(n) = g(n) + h(n)`:

- `g(n)` — actual accumulated weighted travel-time cost, same as Dijkstra.
- `h(n)` — an **admissible** heuristic: the haversine straight-line distance to the destination, converted to an optimistic time estimate assuming free-flow speed (60 km/h). Because this can never overestimate the true remaining cost, A* still returns the optimal path — just typically exploring fewer nodes than Dijkstra.

`RouteResultDto` (returned by both `/api/routes/dijkstra` and `/api/routes/astar`, and compared side-by-side on the admin "Routes" page) reports `algorithm`, `distanceKm`, `estimatedTimeMinutes`, `nodesExplored`, and the ordered `routePoints` for map rendering.

## Explicit academic-honesty note

The road network, traffic weights, and GPS movement in DEMO SIMULATION MODE are all synthetic/simulated for this prototype. RouteWise does not call any live map, traffic, or routing provider — the algorithms are real and correctly implemented, but they run over a generated graph rather than live road data.
