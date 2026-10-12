# RouteWise Database Schema

MySQL 8, managed with Flyway migrations in `backend/src/main/resources/db/migration`. Ten migrations (`V1`–`V10`) create tables in dependency order, then indexes.

## Tables

| Table | Purpose |
|---|---|
| `users` | All accounts (citizen/driver/hospital/admin), BCrypt-hashed passwords. |
| `drivers` | 1:1 extension of a `DRIVER` user; license number, current position, ambulance link. |
| `ambulances` | Vehicle fleet; position, status, current emergency. |
| `emergency_requests` | Citizen-submitted requests; type, priority, location, status, request number. |
| `emergency_assignments` | Which ambulance was assigned to which emergency, the score/ETA/distance/reason that justified the choice, and lifecycle status. |
| `hospitals` | Fictional demo hospitals; capability, ICU, beds, status. |
| `routes` / `route_points` | A calculated route (Dijkstra or A*) and its ordered waypoints. |
| `notifications` | Per-user notification feed. |
| `audit_logs` | Append-only log of significant system actions. |

## Relationships

```
users (1) ── (1) drivers ── (1) ambulances
users (1) ── (*) emergency_requests
emergency_requests (1) ── (*) emergency_assignments ── (1) ambulances
emergency_requests (1) ── (*) routes ── (*) route_points
users (1) ── (*) notifications
users (0..1) ── (*) audit_logs
```

## Key design notes

- **Request numbers** follow `RW-YYYY-NNNNNN` (e.g. `RW-2026-000001`), generated in `EmergencyService`.
- **Enums** are stored as native MySQL `ENUM` columns and mapped with `@Enumerated(EnumType.STRING)` so the database and the Java `Enums` class stay in lock-step; adding a new enum value requires a new Flyway migration to widen the column.
- **`notifications.read_flag`** — the `read` Java field is mapped to a `read_flag` column, since `READ` collides with reserved-word conventions in some SQL dialects.
- **Latitude/longitude** are validated at the DTO layer (`-90..90`, `-180..180`) before ever reaching the database.
- **Cascade deletes** are used for tightly-owned children (a user's driver profile, an emergency's assignments/routes) so demo data can be cleaned up without orphaned rows.
- **Indexes** (`V10`) cover the columns used for status filtering and foreign-key lookups on the hot paths: ambulance status, emergency status/priority/requester, assignment/route/route-point/notification/audit-log foreign keys.
