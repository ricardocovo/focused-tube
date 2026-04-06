# Feature: Project Scaffolding & Infrastructure

## Overview

> This feature establishes the complete monorepo foundation for Focused Tube — a web application that layers over YouTube to let users escape the recommendation algorithm through curated profiles. It provisions two workspaces (`client/` with React + TypeScript + Vite, and `server/` with Express + TypeScript), wires up SQLite via Prisma ORM with a fully defined schema, and delivers a running Express server with all core middleware in place. Once complete, every subsequent phase of development has a stable, reproducible base to build on.

## Problem Statement

> Before any product feature can be built, the project must have a coherent repository structure, dependency management strategy, shared TypeScript configuration, a running backend process, and a persisted data model. Without this scaffolding in place, individual contributors cannot work independently, tooling (linting, building, type-checking) cannot run consistently, and later phases (auth, profiles, feed) have no foundation to extend. This feature eliminates that blocker entirely.

## Goals

- [ ] Initialize a Node.js workspace monorepo with `client/` and `server/` packages
- [ ] Provide root-level scripts (`dev`, `build`) that orchestrate both workspaces
- [ ] Establish a shared `tsconfig.base.json` extended by both workspaces
- [ ] Define and migrate the full Prisma schema (User, Profile, ProfileChannel, ProfileKeyword)
- [ ] Deliver a running Express server with CORS, JSON body parsing, and error-handling middleware
- [ ] Expose a `/api/health` endpoint confirming the server is operational
- [ ] Provide `.env.example` documenting all required environment variables

## Non-Goals

> What this feature explicitly does NOT do. Helps prevent scope creep.

- Does not implement any authentication or Google OAuth flows (Phase 2)
- Does not implement any profile, channel, or keyword API routes (Phase 3)
- Does not implement any YouTube Data API integration (Phase 4)
- Does not build any React UI pages or components beyond a blank Vite scaffold
- Does not configure CI/CD pipelines or deployment infrastructure
- Does not set up a Redis or any caching layer

## Target Users / Personas

| Persona | Description |
|---|---|
| Developer | The engineer(s) building Focused Tube who need a well-structured, immediately runnable project foundation so they can begin implementing product features without configuration overhead. |

## Functional Requirements

1. The system shall organize source code as a Node.js workspaces monorepo with `client/` and `server/` sub-packages, each with their own `package.json`.
2. The system shall provide a root `package.json` with `dev` and `build` scripts that start/build both workspaces concurrently or sequentially.
3. The system shall have a `tsconfig.base.json` at the repo root defining shared compiler options, extended by `client/tsconfig.json` and `server/tsconfig.json`.
4. The system shall include a `.gitignore` covering `node_modules`, `dist`, `.env`, and SQLite database files.
5. The system shall scaffold the `client/` workspace with Vite, React 18, and TypeScript, producing a compilable SPA with the directory structure: `src/components/`, `src/hooks/`, `src/pages/`, `src/services/`, `src/types/`, `App.tsx`, `main.tsx`.
6. The system shall scaffold the `server/` workspace with Express and TypeScript, producing a compilable server with the directory structure: `src/routes/`, `src/middleware/`, `src/services/`, `src/prisma/`, `src/utils/`, `src/types/`, `src/index.ts`.
7. The system shall include a `prisma/schema.prisma` within the server workspace defining the `User`, `Profile`, `ProfileChannel`, and `ProfileKeyword` models exactly as specified in the data model.
8. The system shall generate the Prisma client and run the initial database migration, producing a working SQLite database file.
9. The system shall configure the Express server entry point (`server/src/index.ts`) with CORS middleware (allowing the Vite dev origin), JSON body-parsing middleware, and a centralized error-handling middleware.
10. The system shall expose a `GET /api/health` endpoint that returns `{ status: "ok" }` with HTTP 200.
11. The system shall load configuration from environment variables via a `.env` file, with a committed `.env.example` documenting every required variable and its purpose.
12. The system shall include a `README.md` at the repo root documenting prerequisites, setup steps, and how to run the development environment.

## Non-Functional Requirements

| Category | Requirement |
|---|---|
| Developer Experience | Both workspaces must start with a single command from the repo root (`npm run dev`) with no manual workspace-level steps required |
| Type Safety | `strict: true` must be enabled in `tsconfig.base.json`; both workspaces must compile without TypeScript errors |
| Reproducibility | A fresh `git clone` followed by `npm install` and `npm run dev` (with a valid `.env`) must produce a fully running development environment |
| Security | `.env` must be gitignored; no secrets may be committed; access and refresh token fields noted as requiring encryption at rest in later phases |
| Maintainability | Directory structure must match the file structure defined in the implementation plan exactly, so all future phases can add files without reorganization |

## UX / Design Considerations

> This phase is entirely developer-facing. There is no end-user UI beyond the blank Vite default scaffold.

- Key flow 1: Developer clones the repo, runs `npm install` at the root, copies `.env.example` to `.env`, then runs `npm run dev` — both the Vite dev server and Express server start without errors.
- Key flow 2: Developer runs `npm run build` at the root and both `client/` and `server/` compile to their respective `dist/` directories without TypeScript errors.
- Key flow 3: Developer hits `http://localhost:3001/api/health` and receives `{ "status": "ok" }` confirming the server is wired up correctly.

## Technical Considerations

- **Monorepo tooling**: Use native Node.js workspaces (`"workspaces": ["client", "server"]` in root `package.json`). No additional monorepo tooling (Turborepo, Nx) required for Phase 1.
- **Concurrent dev scripts**: Use the `concurrently` package at the root to run `vite` (client) and `ts-node-dev` / `nodemon` (server) in parallel from a single `npm run dev`.
- **TypeScript build**: Server uses `tsc` for production builds; `ts-node-dev` for development hot-reload. Client uses Vite's built-in TypeScript pipeline.
- **Prisma location**: `schema.prisma` lives at `server/src/prisma/schema.prisma`. The `DATABASE_URL` env var points to a SQLite file at `server/prisma/dev.db` (or similar local path).
- **CORS origin**: During development the allowed origin is `http://localhost:5173` (Vite default). This should be driven by the `CLIENT_ORIGIN` env variable.
- **Error handler**: The Express error-handling middleware must be the last `app.use()` call and must accept `(err, req, res, next)` signature to satisfy Express's error-handler detection.
- **Port configuration**: Server port defaults to `3001`, driven by `PORT` env variable. Client Vite dev server runs on default port `5173`.

## Dependencies

| Dependency | Type | Notes |
|---|---|---|
| Node.js ≥ 18 | External | Required for native workspace support and modern ESM compatibility |
| npm ≥ 8 | External | Required for `workspaces` field support in `package.json` |
| Prisma CLI | External (npm) | Used to generate client and run migrations (`prisma generate`, `prisma migrate dev`) |
| Vite | External (npm) | Client build tool and dev server |
| `concurrently` | External (npm) | Enables single-command dev startup from repo root |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| TypeScript version incompatibility between client and server | Low | Med | Pin TypeScript version in root `devDependencies` and reference it from both workspaces |
| Prisma migration conflicts in future phases if schema is defined incorrectly now | Med | High | Carefully define the full production schema in the initial migration rather than evolving it incrementally, matching the plan exactly |
| SQLite file path issues across operating systems | Low | Med | Use a path relative to the project root via `DATABASE_URL` in `.env`, documented in `.env.example` |
| CORS misconfiguration blocking client-server communication during development | Low | Med | Drive `CLIENT_ORIGIN` from env var and test the health endpoint from the browser during scaffolding |

## Success Metrics

- Metric 1: `npm install && npm run dev` from a clean clone starts both the Vite dev server and Express server with zero errors in the terminal.
- Metric 2: `npm run build` completes with zero TypeScript compilation errors across both workspaces.
- Metric 3: `GET /api/health` returns HTTP 200 `{ "status": "ok" }`.
- Metric 4: `npx prisma migrate status` inside `server/` reports the initial migration as applied with no pending changes.
- Metric 5: All four Prisma models (`User`, `Profile`, `ProfileChannel`, `ProfileKeyword`) are present and introspectable in the generated client.

## Open Questions

- [ ] Should `ts-node-dev` or `nodemon` + `ts-node` be used for server hot-reload? (Recommend `ts-node-dev` for simplicity.)
- [ ] Should the SQLite database file live inside `server/` or at the repo root? (Recommend `server/prisma/dev.db` to keep it co-located with the schema.)
- [ ] Should `concurrently` be a root `devDependency` or should each workspace have its own start command with a root orchestration script? (Recommend root `devDependency`.)

## User Stories

> List of all user stories for this feature.

| Story | File |
|---|---|
| S1: Monorepo Setup | [stories/monorepo-setup.md](stories/monorepo-setup.md) |
| S2: Database & Prisma | [stories/database-and-prisma.md](stories/database-and-prisma.md) |
| S3: Server Foundation | [stories/server-foundation.md](stories/server-foundation.md) |
