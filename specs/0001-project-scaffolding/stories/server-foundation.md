# User Story: S3 — Server Foundation

## Summary

**As a** developer,
**I want** a properly configured Express server with CORS, JSON body parsing, centralized error handling, a health check endpoint, and environment variable management,
**So that** every future API route has a safe, consistent request/response pipeline to plug into and I can confirm the server is running correctly with a single HTTP request.

## Description

> This story wires up the Express application entry point (`server/src/index.ts`) with all foundational middleware and configuration. It sets up `dotenv` for environment variable loading, applies the CORS middleware with a configurable allowed origin, adds `express.json()` for request body parsing, registers the health check route, and attaches a centralized error-handling middleware as the final middleware in the chain. It also ensures the server reads its port from the `PORT` environment variable (defaulting to `3000`) and logs a clear startup message. The server should be fully startable with `npm run dev` from the `server/` workspace or from the repo root.

## Acceptance Criteria

- [ ] Given a valid `.env` file, when `npm run dev` is run from the repo root, then the Express server starts and logs a message indicating it is listening on the configured port.
- [ ] Given the running server, when `GET /api/health` is requested, then the response is HTTP 200 with body `{ "status": "ok" }` and `Content-Type: application/json`.
- [ ] Given the running server, when a request is made from `http://localhost:5173` (the Vite dev origin), then the response includes the correct CORS headers (`Access-Control-Allow-Origin`) and is not blocked.
- [ ] Given the running server, when a route handler throws an error and passes it to `next(err)`, then the centralized error handler returns a JSON error response (not an Express HTML error page) with an appropriate HTTP status code.
- [ ] Given the running server, when a `POST` request with a JSON body is sent to any route, then `req.body` is correctly parsed as a JavaScript object.
- [ ] Given no `.env` file, when the server starts, then it falls back to `PORT=3000` and does not crash on missing optional variables.
- [ ] Given the `.env.example` at the repo root, when it is opened, then it contains entries for `PORT`, `CLIENT_ORIGIN`, and `DATABASE_URL` with descriptive comments.
- [ ] Given `server/src/index.ts`, when it is compiled with `tsc --noEmit`, then it produces zero TypeScript errors.

## Tasks

- [ ] Install `dotenv` in `server/` dependencies if not already present: `npm install dotenv --workspace=server`
- [ ] Add the `dotenv` import and `dotenv.config()` call as the very first lines of `server/src/index.ts`, before any other imports that might read `process.env`
- [ ] Create `server/src/utils/config.ts` that reads and exports typed config values from `process.env`: `PORT` (number, default 3000), `CLIENT_ORIGIN` (string, default `"http://localhost:5173"`), and `DATABASE_URL` (string, required — throw on missing)
- [ ] Install `cors` and its types in the `server/` workspace: `npm install cors` and `npm install --save-dev @types/cors`
- [ ] Create `server/src/middleware/cors.ts` that exports a configured `cors()` middleware instance using `CLIENT_ORIGIN` from the config module, with `credentials: true` to support cookie-based auth in future phases
- [ ] Wire `express.json()` middleware in `server/src/index.ts` before any route registrations
- [ ] Wire the CORS middleware in `server/src/index.ts` before any route registrations
- [ ] Create `server/src/routes/health.ts` that exports an Express `Router` with a single `GET /` handler returning `res.json({ status: "ok" })`
- [ ] Register the health router in `server/src/index.ts` at the path `/api/health`
- [ ] Create `server/src/middleware/errorHandler.ts` that exports an Express error-handling middleware function with the signature `(err: Error, req: Request, res: Response, next: NextFunction) => void`
- [ ] Implement the error handler to log the error (using `console.error` for now), and return a JSON response with `{ "error": err.message }` and status `500` (or a status code from the error if available)
- [ ] Register the error-handling middleware as the last `app.use()` call in `server/src/index.ts`, after all route registrations
- [ ] Add a 404 catch-all middleware before the error handler that calls `next` with a 404 error for any unmatched routes
- [ ] Start the server with `app.listen(PORT, () => console.log(\`Server running on port ${PORT}\`))` in `server/src/index.ts`
- [ ] Add `PORT=3000` and `CLIENT_ORIGIN=http://localhost:5173` entries (with comments) to the root `.env.example`
- [ ] Create a local `.env` file at the repo root (or `server/.env`) with `PORT=3000`, `CLIENT_ORIGIN=http://localhost:5173`, and `DATABASE_URL=file:./prisma/dev.db` — confirm it is gitignored
- [ ] Manually test `GET http://localhost:3000/api/health` with `curl` or a browser and confirm `{ "status": "ok" }` is returned
- [ ] Manually test that an invalid route (e.g., `GET /api/nonexistent`) returns a JSON 404 response rather than an HTML Express error page
- [ ] Update the root `README.md` to document the health check endpoint and the list of environment variables with their descriptions

## Dependencies

> Depends on: S1 (Monorepo Setup) — the `server/` workspace must exist with its directory structure and `tsconfig.json` before this story can be implemented.
> S2 (Database & Prisma) should be complete or in progress — `server/src/utils/prisma.ts` is created in S2 and referenced here only for awareness; it is not directly required by the server foundation middleware.

## Out of Scope

- No authentication middleware or JWT verification (Phase 2 — S5)
- No route implementations beyond the health check endpoint
- No request validation middleware (e.g., Zod, Joi) — deferred to individual route stories
- No logging library integration (e.g., Winston, Morgan) — `console.error` is sufficient for Phase 1
- No HTTPS/TLS configuration — development runs over HTTP

## Notes

- The order of middleware registration in Express matters: CORS and body-parsing must come before route handlers, and the error handler must be last. A misplaced error handler will silently fail to catch errors from route handlers registered after it.
- The `credentials: true` option in the CORS config is required for future phases where the browser will send cookies (for httpOnly JWT refresh tokens). Setting it now prevents a hard-to-diagnose issue later.
- `dotenv.config()` must be called before importing `config.ts` or any module that reads `process.env`. Putting it at the very top of `index.ts` before other imports is the safest pattern.
- The `config.ts` utility provides a single source of truth for environment variables and makes it easy to add validation (e.g., throw on missing required vars) as the application grows.
- For the error handler, accepting an optional `status` property on the error object (via a custom `AppError` type or duck-typing) will make it easy to return correct HTTP status codes (400, 401, 403, 404) from route handlers in later phases.
