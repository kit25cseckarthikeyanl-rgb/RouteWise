# RouteWise Backend

Java 21 + Spring Boot 3 + MySQL 8 + Flyway + Spring Security (JWT) + WebSocket/STOMP.

## Prerequisites

- Java 21 (JDK)
- Maven 3.9+
- MySQL 8+ running locally (or use the repo-root `docker-compose.yml`)

## Configuration

Copy `.env.example` from the repo root to `.env` (or export the variables directly) before running. Key variables: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `BACKEND_PORT`, `CORS_ALLOWED_ORIGINS`, `DEMO_PASSWORD`.

`application.yml` reads all of these with sane local-dev defaults, so the backend will also boot with zero configuration against a local MySQL using `routewise`/`routewise` — **change `JWT_SECRET` before anything resembling production use.**

## Run

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

The API is then available at `http://localhost:8080/api`, and the WebSocket endpoint at `ws://localhost:8080/ws`.

On first run against an empty database, Flyway creates the schema and `DemoDataSeeder` inserts fictional demo users, 5 ambulances/drivers, 3 hospitals, and 10 historical emergency records.

## Test

```bash
mvn test
```

Tests run against an in-memory H2 database (`src/test/resources/application-test.yml`, `@ActiveProfiles("test")`) — no external MySQL needed. Coverage includes:

- `algorithm/DijkstraAlgorithmTest`, `algorithm/AStarAlgorithmTest` — multi-path, same-source/destination, unreachable, empty-graph, invalid-node cases.
- `service/AuthServiceTest` — register/login happy path, duplicate email, wrong password.

## Build a jar

```bash
mvn clean package
java -jar target/routewise-backend.jar
```

## Project layout

```
src/main/java/com/routewise/
├── algorithm/      Graph model, Dijkstra, A*, synthetic road network
├── config/         Security, WebSocket, demo data seeder
├── controller/      REST endpoints
├── dto/             Request/response shapes
├── entity/          JPA entities + Enums
├── exception/        Centralized error handling
├── mapper/           (reserved for future entity<->DTO mapping extraction)
├── repository/        Spring Data JPA repositories
├── security/          JWT service + filter
├── service/           Business logic (dispatch workflow, ranking, routing, etc.)
└── websocket/          STOMP broadcast service + message DTOs
src/main/resources/
├── db/migration/       Flyway migrations V1–V11
└── application.yml
```

## Known limitations (see root README for the full list)

- The road network, traffic conditions, and GPS movement are simulated — there is no live map/traffic provider integration.
- Hospital-coordinator accounts are not yet scoped to a specific hospital row (the demo hospital dashboard manages the first hospital record); a production version would add a `hospital_id` column to `users` or a join table.
