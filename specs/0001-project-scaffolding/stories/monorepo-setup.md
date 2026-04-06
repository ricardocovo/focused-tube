# User Story: S1 — Monorepo Setup

## Summary

**As a** developer,
**I want** a fully configured monorepo with separate `client/` and `server/` workspaces, a shared TypeScript base config, and root-level dev/build scripts,
**So that** I can start building product features immediately from a single, reproducible repository without per-workspace setup friction.

## Description

> This story initializes the Focused Tube repository as a Node.js workspaces monorepo. It creates the root `package.json` with workspace declarations, installs all top-level and workspace-level dependencies, scaffolds the `client/` workspace with Vite + React 18 + TypeScript, scaffolds the `server/` workspace with Express + TypeScript, and establishes the shared `tsconfig.base.json`. The end result is a repository where `npm install` at the root installs everything, `npm run dev` starts both processes concurrently, and `npm run build` compiles both workspaces without errors.

## Acceptance Criteria

- [ ] Given a fresh clone of the repository, when `npm install` is run at the root, then all dependencies for both `client/` and `server/` are installed without errors.
- [ ] Given dependencies are installed, when `npm run dev` is run at the root, then both the Vite dev server (port 5173) and the Express server (port 3001) start concurrently and log their respective startup messages.
- [ ] Given dependencies are installed, when `npm run build` is run at the root, then both `client/dist/` and `server/dist/` are produced with zero TypeScript compilation errors.
- [ ] Given the repository, when TypeScript is invoked in either workspace, then it inherits `strict: true` and other shared options from `tsconfig.base.json`.
- [ ] Given the repository root, when the directory structure is inspected, then `client/`, `server/`, `tsconfig.base.json`, `.gitignore`, `.env.example`, and `README.md` are all present.
- [ ] Given the `client/src/` directory, when its contents are listed, then `components/`, `hooks/`, `pages/`, `services/`, `types/`, `App.tsx`, and `main.tsx` all exist.
- [ ] Given the `server/src/` directory, when its contents are listed, then `routes/`, `middleware/`, `services/`, `prisma/`, `utils/`, `types/`, and `index.ts` all exist.
- [ ] Given the `.gitignore`, when its contents are checked, then `node_modules`, `dist`, `.env`, and `*.db` are all covered.

## Tasks

- [ ] Create the root `package.json` with `"workspaces": ["client", "server"]`, `engines` field specifying Node ≥ 18, and placeholder `dev` and `build` scripts
- [ ] Add `concurrently` as a root `devDependency` and define `"dev"` script as `concurrently \"npm run dev --workspace=client\" \"npm run dev --workspace=server\"`
- [ ] Define root `"build"` script as `npm run build --workspace=client && npm run build --workspace=server`
- [ ] Create `tsconfig.base.json` at the repo root with `strict: true`, `target: "ES2022"`, `module: "ESNext"`, `moduleResolution: "bundler"`, `esModuleInterop: true`, `skipLibCheck: true`, and `forceConsistentCasingInFileNames: true`
- [ ] Scaffold the `client/` workspace using `npm create vite@latest client -- --template react-ts` (or equivalent manual setup)
- [ ] Update `client/tsconfig.json` to extend `../tsconfig.base.json` and remove any duplicate compiler options already covered by the base
- [ ] Configure `client/vite.config.ts` with a dev server proxy entry forwarding `/api` requests to `http://localhost:3001` to allow same-origin API calls during development
- [ ] Create `client/package.json` `"dev"` script as `vite` and `"build"` script as `tsc && vite build`
- [ ] Create the `server/` directory with `package.json` declaring `name: "server"` and listing `express`, `cors`, and `dotenv` as `dependencies`, and `typescript`, `@types/express`, `@types/cors`, `@types/node`, and `ts-node-dev` as `devDependencies`
- [ ] Define `server/package.json` `"dev"` script as `ts-node-dev --respawn --transpile-only src/index.ts` and `"build"` script as `tsc`
- [ ] Create `server/tsconfig.json` extending `../tsconfig.base.json` with `outDir: "dist"`, `rootDir: "src"`, and `module: "CommonJS"` override appropriate for Node
- [ ] Create all required `server/src/` subdirectories: `routes/`, `middleware/`, `services/`, `prisma/`, `utils/`, `types/`
- [ ] Create a stub `server/src/index.ts` that imports Express and logs a startup message (full middleware wiring is handled in S3)
- [ ] Create all required `client/src/` subdirectories: `components/`, `hooks/`, `pages/`, `services/`, `types/`
- [ ] Ensure `client/src/App.tsx` and `client/src/main.tsx` exist (from Vite scaffold or manually created stubs)
- [ ] Create `.gitignore` at the repo root covering `node_modules/`, `dist/`, `.env`, `*.db`, `.DS_Store`, and `*.js.map`
- [ ] Create `README.md` at the repo root documenting: prerequisites (Node ≥ 18, npm ≥ 8), clone and install steps, `.env` setup, `npm run dev` usage, and port reference table
- [ ] Run `npm install` from the repo root and verify it completes without errors
- [ ] Run `npm run build` and confirm both workspaces compile to `dist/` with zero TypeScript errors

## Dependencies

> Depends on: Nothing — this is the first story and has no prerequisites.

## Out of Scope

- No authentication, routing, or API logic is implemented in this story
- No Prisma or database setup (covered in S2)
- No Express middleware beyond a stub entry point (covered in S3)
- No production deployment configuration

## Notes

- The Vite proxy configuration in `client/vite.config.ts` is important for local development — without it, browser fetch calls to `/api/...` will fail due to CORS during dev.
- Use `"module": "CommonJS"` in `server/tsconfig.json` since Node.js (without ESM flag) expects CommonJS output from `tsc`. The base config's `"module": "ESNext"` is overridden at the server level.
- The `ts-node-dev --transpile-only` flag skips type-checking during dev restarts for speed; type checking should still be enforced via `tsc --noEmit` or the build script.
- Keep `server/src/index.ts` as a minimal stub in this story — just enough to confirm the TypeScript pipeline works. Full server wiring happens in S3.
