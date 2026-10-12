# RouteWise

**Intelligent Emergency Route and Resource Optimization System**

RouteWise is an academic software-engineering prototype that connects emergency requests, explainable resource selection, algorithmic route optimization, live tracking, and hospital coordination in one platform.

> **Academic prototype disclaimer.** RouteWise is a demonstration built for coursework/portfolio purposes. It is **not** certified for real-world emergency medical deployment, does **not** contact real emergency services, and uses only fictional/synthetic demo data (GPS positions, traffic conditions, hospital capacity, emergency records). Anywhere GPS movement is simulated, the UI labels it **DEMO SIMULATION MODE**.

---

## Problem statement

Emergency dispatch delay costs lives, and the nearest ambulance is not always the fastest to respond — static, distance-only dispatch ignores traffic conditions, vehicle status, and how urgent the call actually is.

## Solution

RouteWise scores every available ambulance on distance, estimated travel time, simulated traffic, and emergency priority (never "just nearest"), routes it using Dijkstra or A* over a road-network graph, and coordinates with the best-matched hospital — showing its reasoning at every step.

---

## Features

- **Four role-based dashboards**: Citizen, Driver, Hospital, Admin (Emergency Control Room).
- **Explainable resource ranking** — every ambulance assignment carries a human-readable reason, not a black-box score.
- **Dijkstra & A\*** shortest-path algorithms, implemented from scratch, unit-tested, and comparable side-by-side in the admin UI.
- **Hospital ranking** by ETA, capability, ICU availability, and open beds.
- **Live tracking** over WebSocket/STOMP, including a clearly-labelled GPS simulation mode for demos.
- **Full audit trail** — every dispatch/route/hospital/status decision is logged with its reasoning.
- **JWT auth + RBAC**, BCrypt password hashing, consistent error handling, input validation.
- **Dockerized** end-to-end (MySQL + Spring Boot + React/Nginx).

## Architecture

```
React (TS/Vite)  --REST + WebSocket-->  Spring Boot 3 (Java 21)  --JPA-->  MySQL 8
```
Full breakdown: [`docs/architecture.md`](docs/architecture.md).

## Technology stack

**Backend:** Java 21, Spring Boot 3, Maven, Spring Web/Data JPA/Security, JWT, BCrypt, Bean Validation, Lombok, WebSocket/STOMP, Flyway, MySQL 8.
**Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router, Axios, TanStack Query, Recharts, Leaflet/React-Leaflet, STOMP/SockJS.
**Dev/Ops:** Git, Postman, Docker, Docker Compose.

## Modules

Auth · Users · Emergencies · Ambulances · Drivers · Hospitals · Routes (Dijkstra/A*) · Dispatch (ranking/assignment) · Dashboard/Analytics · Notifications · Audit Logs · GPS Simulation.

## Algorithms

Resource ranking (multi-factor, explainable), hospital ranking, Dijkstra, A* with an admissible haversine-based heuristic. Full writeup: [`docs/algorithms.md`](docs/algorithms.md).

## Database

MySQL 8, 11 Flyway migrations (`backend/src/main/resources/db/migration`), 13 tables. Full schema: [`docs/database.md`](docs/database.md).

## API

Full endpoint reference: [`docs/api.md`](docs/api.md). Importable collection: [`docs/RouteWise.postman_collection.json`](docs/RouteWise.postman_collection.json).

---

## Installation

### Option A — Docker (recommended, fastest)

```bash
git clone <your-fork-url> routewise
cd routewise
cp .env.example .env   # edit if you want non-default ports/secrets
docker compose up --build
```

- Frontend: `http://localhost:8081`
- Backend API: `http://localhost:8080/api`
- MySQL: `localhost:3306`

### Option B — Run locally

**Prerequisites:** Java 21, Maven 3.9+, Node.js 20+, MySQL 8+.

```bash
git clone <your-fork-url> routewise
cd routewise
cp .env.example .env   # then either `export $(cat .env | xargs)` or configure your shell
```

Set up the database — see [`database/README.md`](database/README.md).

**Backend:**
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

**Frontend** (in a second terminal):
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173`.

## Environment configuration

See [`.env.example`](.env.example) at the repo root for every variable (`DB_*`, `JWT_SECRET`, ports, CORS origins, `DEMO_PASSWORD`). RouteWise runs entirely on its built-in simulated road network — **no paid map/traffic API key is required.** If you later want to wire in a real provider, add its key as an additional optional env var and keep the simulated path as a fallback (see `docs/algorithms.md`'s academic-honesty note).

## Demo credentials

All fictional, seeded automatically by `DemoDataSeeder` on first backend startup. Password = your `DEMO_PASSWORD` (default `Demo@1234`).

| Role | Email | Notes |
|---|---|---|
| Admin | `admin@routewise.demo` | Emergency Control Room & City Command |
| Citizen | `citizen@routewise.demo` | Live GPS / manual emergency request portal |
| Ambulance Driver | `driver1@routewise.demo` … `driver5@routewise.demo` | Units `AMB-101` to `AMB-105` |
| Police Unit | `police1@routewise.demo` … `police2@routewise.demo` | Units `POL-101` to `POL-102` |
| Fire & Rescue | `fire1@routewise.demo` … `fire2@routewise.demo` | Units `FIRE-101` to `FIRE-102` |
| Hospital Coordinator | `hospital1@routewise.demo` | Bed & ICU management |

**Never use these credentials for production.**

## Live GPS, Repeating Audio Alerts & Reassignment

- **Browser GPS**: Citizen and responder portals use the HTML5 Geolocation API (`navigator.geolocation.getCurrentPosition` & `watchPosition`). Real device coordinates (latitude, longitude, accuracy in metres, and timestamp) are used.
- **Manual Location**: When GPS permission is denied or unavailable, users can manually enter coordinates or choose Demo Mode.
- **10-Second Repeating Alert Sound**: Responder portals play an audio alert siren repeating every 10 seconds while an offer is pending, with explicit browser autoplay permission handling ("Enable Audio Alerts").
- **Automatic Server-Side Reassignment**: Offers have a time-bounded window (default 30s). When declined or timed out, the Spring Boot backend atomically excludes the unit and reassigns the emergency to the next best available responder.
- **Race Prevention**: Atomic Spring transactions prevent simultaneous acceptance races and duplicate assignments.

## Demo workflow

Full walkthrough script: [`docs/demo.md`](docs/demo.md).

## Testing & Verification

```bash
# Backend (22 JUnit 5 + Mockito + Spring Boot Integration Tests passing)
cd backend
mvn test

# Frontend (6 Vitest unit tests passing)
cd frontend
npm.cmd run test

# Frontend Production Build (TypeScript tsc -b + Vite production bundle clean build)
cd frontend
npm.cmd run build
```

## Docker

```bash
docker compose up --build     # start everything
docker compose down           # stop
docker compose down -v        # stop and wipe the MySQL volume
```

## Project structure

```
routewise/
├── backend/          Spring Boot API (see backend/README.md)
├── frontend/         React SPA (see frontend/README.md)
├── database/          MySQL setup notes (see database/README.md)
├── docs/               architecture.md, database.md, algorithms.md, api.md, demo.md,
│                       RouteWise.postman_collection.json
├── docker-compose.yml
├── .env.example
└── .gitignore
```

## GitHub setup

```bash
git init
git add .
git commit -m "Initial RouteWise project"
git remote add origin <your-repo-url>
git push -u origin main
```

Suggested incremental commit sequence (if building/reviewing history module-by-module): initial project → backend foundation → database schema → authentication → emergency management → ambulance management → resource ranking → Dijkstra → A* → hospital coordination → WebSocket tracking → React frontend → citizen dashboard → driver dashboard → hospital dashboard → admin control room → map integration → analytics → testing → Docker → documentation.

## Known limitations

- **Simulated environment, by design.** Road network, traffic, and GPS movement are synthetic — RouteWise does not integrate a live map/traffic/routing provider. See the academic-honesty note in `docs/algorithms.md`.
- **Hospital-coordinator scoping.** In this prototype, any `HOSPITAL`-role account manages the first hospital record rather than a specifically-linked one; a production system would add a `hospital_id` FK on `users`.
- **Synchronous dispatch.** Ranking/assignment runs inline on emergency creation for demo simplicity rather than via an async job queue.
- **Single-region demo data.** Seeded coordinates cluster around one fictional city center; useful for a coherent demo map but not representative of a real multi-city deployment.
- **Build verification.** Both the frontend and backend are fully verified and tested in this environment. The frontend is type-checked (`tsc -b`), production-built (`vite build`), and tested (`vitest run` — 6 tests passed). The backend is fully compiled with Java 21, Spring Boot 3.3.4, and Maven (`mvn test` — all 22 unit & integration tests passed).

## Future enhancements

- Real map/traffic provider integration behind the existing simulated-graph fallback.
- Async dispatch queue with retry/backoff for high-volume scenarios.
- Hospital-to-user linkage and multi-tenant hospital administration.
- Push notifications (web push / mobile) in addition to the in-app notification center.
- Role-based hospital/ambulance fleet management UI for onboarding new resources without direct API calls.
- CI pipeline (GitHub Actions) running backend + frontend test suites and a Docker build on every PR.
