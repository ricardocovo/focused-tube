# User Story: S8 — Profile Channels & Keywords Backend

## Summary

**As a** developer building Focused Tube,
**I want** REST endpoints for adding and removing YouTube channels and keywords on a profile,
**So that** the frontend can populate and edit the content of each profile through a well-defined, ownership-enforced API.

## Description

This story extends the profiles router (or adds a sub-router) with four additional endpoints that manage the `ProfileChannel` and `ProfileKeyword` join records. All endpoints are protected by `requireAuth` and enforce ownership by verifying the parent `Profile` belongs to `req.user.id` before any mutation.

Channels carry metadata (YouTube channel ID, title, optional thumbnail URL) because the frontend needs to display them without a separate YouTube API call. Keywords are simple strings. Both entities enforce uniqueness per profile at the database level.

Batch adds (an array of channels or keywords in a single request) are supported so the Subscription Picker (Phase 4) can bulk-add channels without multiple round trips.

## Acceptance Criteria

- [ ] Given an unauthenticated request to any channel/keyword endpoint, when the request is made, then the server responds with `401 Unauthorized`.
- [ ] Given an authenticated user who owns profile P, when they `POST /api/profiles/:id/channels` with a valid `{ youtubeChannelId, channelTitle, thumbnailUrl? }` body, then the channel is added to the profile and the response is `201 Created` with the created `ProfileChannel` record.
- [ ] Given an authenticated user, when they `POST /api/profiles/:id/channels` with a channel that already exists on the profile, then the server responds with `409 Conflict`.
- [ ] Given an authenticated user, when they `POST /api/profiles/:id/channels` targeting a profile they do not own (or that does not exist), then the server responds with `404 Not Found`.
- [ ] Given an authenticated user who owns profile P, when they `DELETE /api/profiles/:id/channels/:channelId`, then the channel is removed and the response is `204 No Content`.
- [ ] Given an authenticated user, when they `DELETE /api/profiles/:id/channels/:channelId` and the channel is not on the profile (or the profile is not owned by the user), then the server responds with `404 Not Found`.
- [ ] Given an authenticated user who owns profile P, when they `POST /api/profiles/:id/keywords` with `{ keyword: "javascript" }`, then the keyword is added to the profile and the response is `201 Created` with the created `ProfileKeyword` record.
- [ ] Given an authenticated user, when they `POST /api/profiles/:id/keywords` with a keyword that already exists on the profile, then the server responds with `409 Conflict`.
- [ ] Given an authenticated user, when they `POST /api/profiles/:id/keywords` with a missing or empty `keyword` field, then the server responds with `400 Bad Request`.
- [ ] Given an authenticated user who owns profile P, when they `DELETE /api/profiles/:id/keywords/:keywordId`, then the keyword is removed and the response is `204 No Content`.
- [ ] Given an authenticated user, when they `DELETE /api/profiles/:id/keywords/:keywordId` targeting a profile they do not own, then the server responds with `404 Not Found`.
- [ ] Given an authenticated user, when they `GET /api/profiles/:id`, then the response includes the full `channels` array and `keywords` array for that profile.

## Tasks

- [ ] Add `GET /api/profiles/:id` endpoint — fetch single profile by `{ id, userId }`, include full `channels` and `keywords` arrays, return `200` or `404`
- [ ] Implement `POST /api/profiles/:id/channels` — verify profile ownership, validate body (`youtubeChannelId` required, `channelTitle` required, `thumbnailUrl` optional), call `prisma.profileChannel.create`, handle `P2002` as `409`, return `201`
- [ ] Implement `DELETE /api/profiles/:id/channels/:channelId` — verify profile ownership (profile must belong to user), delete `ProfileChannel` where `{ id: channelId, profileId }`, return `204` or `404`
- [ ] Implement `POST /api/profiles/:id/keywords` — verify profile ownership, validate `keyword` (non-empty, trimmed string, max 100 chars), call `prisma.profileKeyword.create`, handle `P2002` as `409`, return `201`
- [ ] Implement `DELETE /api/profiles/:id/keywords/:keywordId` — verify profile ownership, delete `ProfileKeyword` where `{ id: keywordId, profileId }`, return `204` or `404`
- [ ] Extract a reusable `assertProfileOwnership(profileId, userId)` helper that throws a typed `NotFoundError` if the profile doesn't belong to the user — use it in all channel/keyword handlers
- [ ] Add keyword normalisation: trim whitespace and lowercase the keyword before storing, to prevent case-variant duplicates
- [ ] Write integration tests for: add channel (success, duplicate, wrong owner, missing fields), remove channel (success, not found, wrong owner), add keyword (success, duplicate, wrong owner, empty string), remove keyword (success, not found, wrong owner), get single profile with channels and keywords

## Dependencies

- Depends on: S7 (Profile CRUD backend — profiles router and ownership patterns must exist)
- Depends on: S5 (Auth middleware)
- Depends on: S2 (Prisma schema — `ProfileChannel` and `ProfileKeyword` models)

## Out of Scope

- Bulk-add of multiple channels in one request body (can be added in Phase 4 when the Subscription Picker is built)
- Fetching channel metadata from the YouTube API (the client supplies it when adding)
- Reordering channels or keywords within a profile

## Notes

- The `:channelId` and `:keywordId` URL params refer to the internal Prisma record IDs (`ProfileChannel.id` and `ProfileKeyword.id`), not the YouTube channel ID — make this clear in API docs and type definitions.
- The `assertProfileOwnership` helper should be placed in `server/src/services/profileService.ts` and shared with the S7 route handlers for consistency.
- Keyword normalisation (lowercase + trim) should happen before the DB insert and also before the uniqueness check so that "JavaScript" and "javascript" are treated as the same keyword.
