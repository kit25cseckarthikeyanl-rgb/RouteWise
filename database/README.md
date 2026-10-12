# RouteWise Database

RouteWise uses **MySQL 8+**, with schema management fully handled by **Flyway** — you do not need to create tables by hand.

## Quick start (Docker)

The `docker-compose.yml` at the repo root starts a MySQL 8.4 container automatically; skip to "Backend setup" in the root README.

## Manual setup (no Docker)

1. Install MySQL 8+ and start the server.
2. Create the database and a user:
   ```sql
   CREATE DATABASE routewise CHARACTER SET utf8mb4;
   CREATE USER 'routewise'@'%' IDENTIFIED BY 'routewise';
   GRANT ALL PRIVILEGES ON routewise.* TO 'routewise'@'%';
   FLUSH PRIVILEGES;
   ```
3. Set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD` in your `.env` (see `.env.example` at the repo root) to match.
4. Start the backend (`mvn spring-boot:run`) — Flyway runs migrations `V1`–`V11` automatically on startup, and `DemoDataSeeder` populates fictional demo data the first time the `users` table is empty.

## Schema

See `docs/database.md` for the full table/relationship breakdown. Migrations live in `backend/src/main/resources/db/migration/`.

## Resetting the database

```sql
DROP DATABASE routewise;
CREATE DATABASE routewise CHARACTER SET utf8mb4;
```
Then restart the backend — Flyway and the demo seeder will rebuild everything from scratch.
