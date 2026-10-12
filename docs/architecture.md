# RouteWise Architecture

## Overview

RouteWise is a three-tier academic prototype:

```
React (TypeScript, Vite)  --REST + WebSocket/STOMP-->  Spring Boot 3 (Java 21)  --Spring Data JPA-->  MySQL 8
```

## Frontend

- **Vite + React + TypeScript** SPA, styled with Tailwind CSS.
- **React Router** handles role-scoped routing (`/citizen/*`, `/driver/*`, `/hospital/*`, `/admin/*`), gated by `ProtectedRoute`.
- **TanStack Query** manages server-state caching, polling (short intervals on live views), and retry/error states.
- **Axios** with a request interceptor (attaches the JWT) and a response interceptor (handles 401 by clearing the session and redirecting to `/login`).
- **Leaflet / React-Leaflet** render emergency, ambulance, and hospital markers plus route polylines on OpenStreetMap tiles — no paid map API key required.
- **Recharts** power the admin analytics charts.
- **STOMP over SockJS** (`@stomp/stompjs`, `sockjs-client`) subscribes to live tracking topics for real-time ambulance position updates, including DEMO SIMULATION MODE broadcasts.

## Backend

Layered architecture under `com.routewise`:

- `controller` — REST endpoints, thin, delegate to services.
- `service` — business logic: dispatch workflow, ranking, route optimization, notifications, audit logging.
- `algorithm` — the graph model plus Dijkstra and A* implementations, decoupled from Spring so they're independently unit-testable.
- `repository` — Spring Data JPA repositories.
- `entity` — JPA entities mapped 1:1 to the schema below.
- `security` — JWT issuing/validation and the authentication filter.
- `websocket` — STOMP configuration and the broadcast service used by both real driver updates and GPS simulation mode.
- `config` — Spring Security config, WebSocket config, and the demo-data seeder.
- `dto` / `mapper` / `exception` — request/response shapes and centralized error handling (`GlobalExceptionHandler` returns a consistent JSON error envelope for 400/401/403/404/409/500).

## REST

All endpoints are versionless under `/api/**`, secured with a stateless JWT bearer token except `/api/auth/**`. Responses use a consistent envelope: `{ success, message, data, errorCode?, timestamp }`.

## WebSocket / STOMP

Endpoint: `/ws` (SockJS fallback enabled). Topics:

- `/topic/ambulance/{ambulanceId}` — position + status + ETA, sent on every real location update and every GPS-simulation tick.
- `/topic/emergency/{emergencyId}` — status/assignment changes for a specific emergency.
- `/topic/admin/dashboard` — control-room-relevant events.

## Data flow for the core workflow

1. Citizen submits an emergency → `EmergencyService.createEmergency` persists it and immediately calls `dispatch()`.
2. `ResourceRankingService` scores every `AVAILABLE` ambulance (distance, simulated traffic, priority-weighted travel time) and returns a ranked, explainable list.
3. The top-ranked ambulance is assigned; an `EmergencyAssignment` row stores the score, ETA, distance, and the human-readable selection reason.
4. When the driver accepts, `RouteOptimizationService` builds a synthetic road-network graph between ambulance and patient and runs Dijkstra to produce a route (persisted as `Route` + `RoutePoint` rows).
5. `HospitalSelectionService` ranks hospitals by ETA/capability/ICU/beds; the top hospital is notified.
6. Status transitions (`EN_ROUTE_TO_PATIENT` → ... → `COMPLETED`) are driven by the driver's dashboard actions and broadcast over WebSocket.
7. `GpsSimulationService` (DEMO SIMULATION MODE) walks the ambulance through the stored route points on a timer, broadcasting each tick — clearly labelled as simulated, never presented as real GPS.
8. Every meaningful state change is written to `audit_logs` via `AuditService`.
