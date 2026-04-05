# User Story: S7 — Profile CRUD Backend

## Summary

**As a** developer building Focused Tube,
**I want** a set of authenticated REST endpoints for creating, reading, updating, and deleting profiles,
**So that** the frontend and future API consumers have a reliable, ownership-enforced contract for profile management.

## Description

This story implements the four core profile lifecycle endpoints on the Express server. Every endpoint sits behind the `requireAuth` middleware from Phase 2 so that only authenticated users can interact with their own profiles. Ownership is enforced at the database query level (filtering by `userId`) — not just by checking the token. The Prisma `Profile` model is already defined in the schema; this story wires up the route handlers, validation, and error responses.

Key behaviours:
- A user can only see and mutate their own profiles.
- Profile names must be unique per user; attempting to create or rename to a duplicate name returns `409 Conflict`.
- Only one profile per user may have `isDefault: true`; setting a new default clears the old one atomically.
- Deleting a profile cascades to its `ProfileChannel` and `ProfileKeyword` rows automatically (Prisma `onDelete: Cascade`).

## Acceptance Criteria

- [ ] Given an unauthenticated request to any `/api/profiles` endpoint, when the request is made, then the server responds with `401 Unauthorized`.
- [ ] Given an authenticated user, when they `GET /api/profiles`, then the response is `200 OK` with a JSON array of their profiles (including channel and keyword counts), and no other user's profiles are included.
- [ ] Given an authenticated user, when they `POST /api/profiles` with a valid unique name, then the response is `201 Created` with the new profile object.
- [ ] Given an authenticated user, when they `POST /api/profiles` with a name that already exists for that user, then the response is `409 Conflict` with a descriptive error message.
- [ ] Given an authenticated user, when they `POST /api/profiles` with a missing or empty name, then the response is `400 Bad Request`.
- [ ] Given an authenticated user who owns profile X, when they `PUT /api/profiles/:id` with a new valid name, then the response is `200 OK` with the updated profile.
- [ ] Given an authenticated user, when they `PUT /api/profiles/:id` with `isDefault: true`, then the target profile's `isDefault` becomes `true` and all other profiles for that user have `isDefault` set to `false` (atomic update).
- [ ] Given an authenticated user, when they `PUT /api/profiles/:id` targeting a profile they do not own, then the response is `404 Not Found`.
- [ ] Given an authenticated user who owns profile X, when they `DELETE /api/profiles/:id`, then the response is `204 No Content` and the profile (plus its channels and keywords) is removed from the database.
- [ ] Given an authenticated user, when they `DELETE /api/profiles/:id` targeting a profile they do not own, then the response is `404 Not Found`.

## Tasks

- [ ] Create `server/src/routes/profiles.ts` and register it in the Express app under `/api/profiles`
- [ ] Apply `requireAuth` middleware to all routes in the profiles router
- [ ] Implement `GET /api/profiles` — query `Profile` where `userId = req.user.id`, include `_count` of channels and keywords, return `200` with array
- [ ] Implement `POST /api/profiles` — validate `name` (non-empty string), call `prisma.profile.create`, handle Prisma `P2002` unique constraint error as `409 Conflict`, return `201` with created profile
- [ ] Implement `PUT /api/profiles/:id` — look up profile by `{ id, userId }`, validate request body fields (`name`, `isDefault`), update in DB; if `isDefault: true` is set, wrap in a Prisma transaction that first sets all user's profiles to `isDefault: false` then sets the target to `true`; return `200` with updated profile
- [ ] Implement `DELETE /api/profiles/:id` — look up profile by `{ id, userId }` (return `404` if not found), call `prisma.profile.delete`, return `204 No Content`
- [ ] Add a reusable `notFound` helper (or use existing error-handler) for ownership-check 404 responses
- [ ] Add input validation middleware or inline validation for `name` length (e.g., 1–100 characters)
- [ ] Write integration tests covering: list profiles, create profile (success + duplicate + missing name), update profile (success + wrong owner + set default), delete profile (success + wrong owner)
- [ ] Confirm Prisma migration has been run so `Profile`, `ProfileChannel`, and `ProfileKeyword` tables exist in the SQLite database

## Dependencies

- Depends on: S1 (monorepo & Express server scaffolding)
- Depends on: S2 (Prisma schema with `Profile`, `ProfileChannel`, `ProfileKeyword` models and migration applied)
- Depends on: S3 (Express app foundation — JSON middleware, error handler)
- Depends on: S5 (Auth middleware — `requireAuth` must be implemented and attach `req.user`)

## Out of Scope

- Adding or removing channels/keywords (covered in S8)
- Returning full channel/keyword lists in the profile list response (counts are sufficient here; S8 adds the detail endpoints)
- Any rate limiting or quota enforcement

## Notes

- Use Prisma error code `P2002` to detect unique constraint violations and map them to `409 Conflict`.
- The ownership pattern `prisma.profile.findUnique({ where: { id, userId: req.user.id } })` is the canonical way to enforce ownership — never look up by `id` alone and then check `userId` separately (TOCTOU risk).
- Route file location: `server/src/routes/profiles.ts`; register in `server/src/index.ts` as `app.use('/api/profiles', profilesRouter)`.
- TypeScript request type augmentation for `req.user` should already exist from S5; import and reuse it.
