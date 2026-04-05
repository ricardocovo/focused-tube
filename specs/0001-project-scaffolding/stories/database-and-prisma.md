# User Story: S2 — Database & Prisma

## Summary

**As a** developer,
**I want** Prisma ORM configured with SQLite and a fully defined schema covering all four core models,
**So that** I have a type-safe database client and a versioned initial migration that every subsequent phase can build data features on top of.

## Description

> This story installs and configures Prisma within the `server/` workspace, writes the complete `schema.prisma` file with the `User`, `Profile`, `ProfileChannel`, and `ProfileKeyword` models exactly as specified in the implementation plan, generates the Prisma client, and runs the initial database migration. The `DATABASE_URL` is read from the `.env` file. After this story is complete, the server can import `PrismaClient` and execute type-safe queries against a real SQLite database.

## Acceptance Criteria

- [ ] Given the `server/` workspace, when `npx prisma validate` is run, then it reports the schema is valid with no errors.
- [ ] Given the `server/` workspace, when `npx prisma migrate status` is run, then it reports the initial migration as applied with no pending migrations.
- [ ] Given the generated Prisma client, when TypeScript code imports `PrismaClient` and accesses `prisma.user`, `prisma.profile`, `prisma.profileChannel`, and `prisma.profileKeyword`, then all four models are present and fully typed without TypeScript errors.
- [ ] Given the schema, when the `User` model is inspected, then it contains fields: `id` (UUID, PK), `googleId` (unique), `email` (unique), `name`, `avatarUrl` (optional), `accessToken`, `refreshToken`, `profiles` (relation), `createdAt`, `updatedAt`.
- [ ] Given the schema, when the `Profile` model is inspected, then it contains a `@@unique([userId, name])` constraint and cascading delete from `User`.
- [ ] Given the schema, when the `ProfileChannel` model is inspected, then it contains a `@@unique([profileId, youtubeChannelId])` constraint and cascading delete from `Profile`.
- [ ] Given the schema, when the `ProfileKeyword` model is inspected, then it contains a `@@unique([profileId, keyword])` constraint and cascading delete from `Profile`.
- [ ] Given the `.env.example`, when it is opened, then it contains a `DATABASE_URL` entry with an example SQLite path (e.g. `file:./prisma/dev.db`).
- [ ] Given a server TypeScript file that instantiates `new PrismaClient()`, when `tsc` compiles it, then it compiles without errors.

## Tasks

- [ ] Install Prisma CLI and client in the `server/` workspace: `npm install prisma --save-dev` and `npm install @prisma/client` inside `server/`
- [ ] Run `npx prisma init --datasource-provider sqlite` inside `server/` to generate the initial `prisma/` directory and `.env` stub (or create manually if `prisma init` places files in the wrong location)
- [ ] Move `schema.prisma` to `server/src/prisma/schema.prisma` and update the `prisma` config block in `package.json` (or `prisma` field) to point to the correct schema path: `"prisma": { "schema": "src/prisma/schema.prisma" }`
- [ ] Set the Prisma `output` in the `generator client` block to `"../../../node_modules/.prisma/client"` (or the appropriate relative path) to ensure the generated client is importable from server source files
- [ ] Define the `datasource db` block in `schema.prisma` with `provider = "sqlite"` and `url = env("DATABASE_URL")`
- [ ] Add the `User` model to `schema.prisma` with all specified fields: `id String @id @default(uuid())`, `googleId String @unique`, `email String @unique`, `name String`, `avatarUrl String?`, `accessToken String`, `refreshToken String`, `profiles Profile[]`, `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`
- [ ] Add the `Profile` model to `schema.prisma` with all specified fields and the `@@unique([userId, name])` constraint, including `onDelete: Cascade` on the `user` relation
- [ ] Add the `ProfileChannel` model to `schema.prisma` with all specified fields and the `@@unique([profileId, youtubeChannelId])` constraint, including `onDelete: Cascade` on the `profile` relation
- [ ] Add the `ProfileKeyword` model to `schema.prisma` with all specified fields and the `@@unique([profileId, keyword])` constraint, including `onDelete: Cascade` on the `profile` relation
- [ ] Add `DATABASE_URL="file:./prisma/dev.db"` to the server-level `.env` file (gitignored) and add the same key with the example value to the root `.env.example`
- [ ] Run `npx prisma generate` inside `server/` to produce the typed Prisma client
- [ ] Run `npx prisma migrate dev --name init` inside `server/` to create and apply the initial migration, producing the `prisma/migrations/` directory and `dev.db` SQLite file
- [ ] Add `server/prisma/dev.db` and `server/prisma/*.db` to `.gitignore` to prevent committing local database files
- [ ] Create `server/src/utils/prisma.ts` as a singleton module that instantiates and exports a single `PrismaClient` instance (prevents multiple instances during hot-reload)
- [ ] Verify the generated Prisma client is importable from `server/src/` by adding a temporary import in `server/src/index.ts` and confirming `tsc --noEmit` passes, then remove the temporary import if only used for verification
- [ ] Add `prisma generate` as a `postinstall` script in `server/package.json` so the client is regenerated automatically after `npm install`
- [ ] Document the migration and Prisma workflow (generate, migrate dev, migrate deploy) in the root `README.md` under a "Database" section

## Dependencies

> Depends on: S1 (Monorepo Setup) — the `server/` workspace with its `package.json` and `tsconfig.json` must exist before Prisma can be installed and configured.

## Out of Scope

- No seed scripts or test data insertion in this story
- No encryption of `accessToken` / `refreshToken` fields (noted as a future requirement for Phase 2)
- No Prisma Studio setup or database GUI configuration
- No production migration strategy (that is deferred to deployment phase)

## Notes

- Prisma's default `prisma init` places `schema.prisma` in a root `prisma/` directory. Since this project co-locates it under `server/src/prisma/`, the `prisma` field in `server/package.json` must explicitly reference the schema path, otherwise CLI commands will fail.
- The singleton pattern for `PrismaClient` in `server/src/utils/prisma.ts` is critical — `ts-node-dev` restarts the module but does not always clean up connections, and multiple `PrismaClient` instances can exhaust SQLite connection limits.
- In later phases, `accessToken` and `refreshToken` should be encrypted before storage. The schema stores them as plain `String` for now; a `TODO` comment should be left on both fields as a reminder.
- The `@@unique` constraints are business-critical: they prevent duplicate channels or keywords within a profile and prevent duplicate profile names per user.
