# User Story: Migrate SQLite to Azure SQL

## Summary

**As a** developer,
**I want** the application database migrated from SQLite to Azure SQL Database (free tier),
**So that** the app can run reliably in Azure where SQLite on an ephemeral filesystem is not suitable for production.

## Description

The current Prisma schema uses `provider = "sqlite"` and stores data in a local `.db` file. This works for development but is incompatible with Azure App Service's non-persistent filesystem. Azure SQL Database offers a free serverless tier (100K vCore-sec/month, 32 GB) that is fully managed, always available, and costs nothing within the free quota.

Since all database access in the codebase goes through Prisma ORM with no raw SQL, the migration is low-risk: it requires only schema provider changes, deletion of the SQLite-dialect migration files, and regeneration of migrations for SQL Server.

The existing SQLite migration in `server/src/prisma/migrations/20260405030114_init/` uses SQLite-specific SQL types (`TEXT`, `DATETIME`, `BOOLEAN`) that are not compatible with SQL Server. Prisma will auto-generate the correct T-SQL when the provider is changed.

## Acceptance Criteria

- [ ] Given the Prisma schema has `provider = "sqlserver"`, when `prisma migrate dev` is run against a SQL Server instance, then a valid T-SQL migration is generated and applied successfully.
- [ ] Given the app is configured with an Azure SQL connection string as `DATABASE_URL`, when all API endpoints are exercised (auth, profile CRUD, subscriptions, feed), then all operations complete without database errors.
- [ ] Given a fresh database (no tables), when `prisma migrate deploy` is run on startup, then all tables are created and the app starts correctly.
- [ ] Given the `.env.example` file, when a developer opens it, then the `DATABASE_URL` value shows the correct Azure SQL `sqlserver://` format with all required parameters documented.
- [ ] Given the old SQLite migration files are removed, when `prisma migrate deploy` is run, then only the new SQL Server migration is applied.

## Tasks

- [ ] Change `provider = "sqlite"` to `provider = "sqlserver"` in `server/src/prisma/schema.prisma`
- [ ] Review all field types in `schema.prisma` for SQL Server compatibility (e.g., `String` → `NVARCHAR`, `DateTime` → `DATETIME2` — Prisma handles these automatically but verify)
- [ ] Delete `server/src/prisma/migrations/` directory contents (old SQLite migrations)
- [ ] Update `migration_lock.toml` provider value from `sqlite` to `sqlserver` (or delete and let Prisma regenerate)
- [ ] Pull SQL Server Docker image (`mcr.microsoft.com/mssql/server:2022-latest`) for local testing
- [ ] Run `npx prisma migrate dev --name init` against the local SQL Server to generate the new T-SQL migration
- [ ] Verify generated migration SQL is valid T-SQL (check data types, constraints, foreign keys)
- [ ] Update `DATABASE_URL` default in `server/src/utils/config.ts` — remove the `file:./prisma/dev.db` default; require env var in production
- [ ] Update `.env.example` with the Azure SQL connection string format: `sqlserver://<server>.database.windows.net:1433;database=<db>;user=<user>;password=<password>;encrypt=true;trustServerCertificate=false;`
- [ ] Update local `.env` (gitignored) to point to the local SQL Server Docker instance for development
- [ ] Run all app features locally against SQL Server to verify: user login/upsert, profile create/update/delete, channel add/remove, keyword add/remove, feed loading
- [ ] Confirm `prisma generate` runs successfully after provider change (`postinstall` script)

## Dependencies

> List any other stories, services, or preconditions that must be in place before this story can start or complete.

- No dependencies on other stories — this is the foundational database change that all other stories depend on.
- Docker Desktop must be installed locally to run SQL Server for migration testing.

## Out of Scope

- Setting up the actual Azure SQL resource in Azure (covered in the Infrastructure as Code story).
- Data migration from existing local SQLite database (no production data exists yet; fresh start).
- Connection pooling configuration (default Prisma connection pooling is sufficient for hobby scale).

## Notes

- Azure SQL `DATABASE_URL` format for Prisma: `sqlserver://<server>.database.windows.net:1433;database=<dbname>;user=<user>@<server>;password=<password>;encrypt=true;trustServerCertificate=false;hostNameInCertificate=*.database.windows.net;loginTimeout=30`
- `trustServerCertificate=false` is correct for Azure SQL (it uses a trusted CA certificate).
- The `ENCRYPTION_KEY`, `JWT_SECRET`, and `JWT_REFRESH_SECRET` are not stored in the database — they are env vars used in-memory. No changes needed for those.
- Prisma `sqlserver` provider is part of the standard Prisma package; no additional dependency needed.
