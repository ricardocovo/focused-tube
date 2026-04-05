# User Story: S5 — Auth Middleware

## Summary

**As a** developer building Focused Tube,
**I want** a reusable JWT verification middleware that protects Express routes by validating the `Authorization: Bearer` header and attaching the decoded user to the request object,
**So that** all protected API endpoints (profiles, feed, subscriptions) can reliably identify the requesting user and reject unauthenticated or tampered requests with a clear `401` response.

## Description

This story produces the thin but critical security layer that sits in front of every non-public Express route. The middleware reads the JWT from the `Authorization: Bearer <token>` header, verifies its signature and expiry using the `jwt.ts` utility from S4, then attaches the decoded payload (at minimum `{ id: string }`) to `req.user` so downstream handlers can reference the authenticated user without touching the database.

The middleware must be structured so it can be applied selectively (per-router or per-route) rather than globally, allowing public routes like `GET /api/auth/google` and `GET /api/auth/google/callback` to remain unauthenticated.

TypeScript typings must be extended so that `req.user` is recognised by the compiler on protected routes.

## Acceptance Criteria

- [ ] Given a request with a valid, non-expired `Authorization: Bearer <token>` header, when the middleware runs, then `req.user` is set to `{ id: string }` and `next()` is called.
- [ ] Given a request with no `Authorization` header, when the middleware runs, then it returns `401 Unauthorized` with body `{ error: 'Unauthorized' }` and does not call `next()`.
- [ ] Given a request with a malformed `Authorization` header (not `Bearer <token>` format), when the middleware runs, then it returns `401 Unauthorized`.
- [ ] Given a request with a JWT signed with the wrong secret, when the middleware runs, then it returns `401 Unauthorized`.
- [ ] Given a request with an expired JWT (past the 15-minute window), when the middleware runs, then it returns `401 Unauthorized` with body `{ error: 'Token expired' }`.
- [ ] Given a request with a JWT whose `sub` claim references a user ID that no longer exists in the database, when the middleware runs, then it returns `401 Unauthorized` (optional: this check can be deferred to individual route handlers if DB lookup is undesirable in middleware).
- [ ] Given the middleware is applied to the `/api/profiles` router, when an unauthenticated request reaches any profile route, then it is rejected before the route handler executes.
- [ ] Given the middleware is NOT applied to `/api/auth/*` routes, when an unauthenticated request hits `GET /api/auth/google`, then it proceeds normally (no interference from the middleware).
- [ ] Given TypeScript compiler checks, when a protected route handler references `req.user.id`, then the compiler does not report a type error.

## Tasks

- [ ] Extend Express `Request` type in `server/src/types/express.d.ts` (or a `global.d.ts`) to add `user?: { id: string }` to the `Request` interface
- [ ] Create `server/src/middleware/auth.ts` and implement the `authenticateJwt` middleware function that extracts the Bearer token, calls `verifyAccessToken` from `jwt.ts`, and sets `req.user = { id: payload.sub }`
- [ ] Handle the `TokenExpiredError` case from `jsonwebtoken` separately to return `{ error: 'Token expired' }` vs. a generic `{ error: 'Unauthorized' }` for other failures
- [ ] Export `authenticateJwt` as the default named export so it can be imported and applied per-router
- [ ] Apply `authenticateJwt` to the `GET /api/auth/me` route in `server/src/routes/auth.ts` (first protected route in Phase 2)
- [ ] Write unit tests for `authenticateJwt` covering: valid token, missing header, malformed header, wrong secret, expired token
- [ ] Verify TypeScript compiles without errors on a sample protected route handler that accesses `req.user.id`
- [ ] Add a comment in `server/src/routes/auth.ts` and the future profile/feed route files indicating where to apply `authenticateJwt` for consistency

## Dependencies

- Depends on: S4 — Google OAuth Backend (`server/src/utils/jwt.ts` with `verifyAccessToken` must exist; the `User` model and Prisma client must be available if a DB lookup is added to the middleware)
- Depends on: Phase 1 — S3 (Express app and route structure must be in place)

## Out of Scope

- Refresh token handling (handled by `POST /api/auth/refresh` in S4)
- Role-based access control or permission scopes beyond basic authentication
- API key or other non-JWT authentication schemes
- Rate limiting or brute-force protection on auth endpoints
- Middleware for WebSocket connections (not used in this app)

## Notes

- Keep the middleware stateless where possible — avoid a database lookup on every request. Trust the JWT signature and expiry for identity; only hit the DB if a specific route needs full user data (e.g. `GET /api/auth/me`).
- The `sub` claim in the JWT payload is the internal `User.id` (UUID), not the `googleId`. Route handlers should use `req.user.id` to query Prisma.
- Consider also exporting an `optionalAuth` variant (sets `req.user` if a valid token is present, otherwise continues without setting it) for any future public-but-auth-aware endpoints.
- TypeScript declaration merging for `Express.Request` must be placed in a `.d.ts` file that is included in the server's `tsconfig.json` `include` array.
