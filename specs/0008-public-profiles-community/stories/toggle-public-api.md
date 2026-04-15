# User Story: Toggle Profile Public Visibility via API

## Summary

**As a** profile owner,
**I want** to toggle my profile between public and private via the API,
**So that** I can control whether my profile is visible on the Community page.

## Description

Extend the existing profile update endpoint (`PUT /api/profiles/:id`) to accept an `isPublic` boolean field. When a profile is made public, it becomes discoverable on the Community page. When made private again, it is hidden and existing followers lose access (cascade handled at the data layer). The profile detail and list responses are also updated to include `isPublic` and the follower count.

## Acceptance Criteria

- [ ] Given an authenticated user who owns a profile, when they send `PUT /api/profiles/:id` with `{ "isPublic": true }`, then the profile's `isPublic` field is set to `true`.
- [ ] Given an authenticated user who owns a profile, when they send `PUT /api/profiles/:id` with `{ "isPublic": false }`, then the profile's `isPublic` field is set to `false`.
- [ ] Given a profile update request with `isPublic` not present, when processed, then the `isPublic` field remains unchanged.
- [ ] Given `GET /api/profiles` (list), when called, then each profile in the response includes the `isPublic` field.
- [ ] Given `GET /api/profiles/:id` (detail), when called for an owned profile, then the response includes `isPublic` and `_count.followers`.
- [ ] Given a non-owner attempts to update `isPublic` on another user's profile, when processed, then a 404 is returned (existing ownership check).

## Tasks

- [ ] Update the `PUT /:id` handler in `server/src/routes/profiles.ts` to read `isPublic` from `req.body` and include it in the Prisma update data
- [ ] Validate that `isPublic` is a boolean when provided; return 400 if not
- [ ] Update the `GET /` handler to include `isPublic` in the response (already included by default from Prisma, verify)
- [ ] Update the `GET /:id` handler to include `_count: { select: { followers: true } }` in the Prisma query
- [ ] Update the `GET /` handler to include `_count: { select: { channels: true, keywords: true, followers: true } }` in the Prisma query
- [ ] Add server-side tests for the updated PUT endpoint with `isPublic` toggling

## Dependencies

- Depends on: [schema-migration.md](schema-migration.md) — the `isPublic` field and `ProfileFollow` model must exist

## Out of Scope

- Community page listing of public profiles (separate story)
- Client-side UI for the toggle (separate story)

## Notes

- The `isPublic` field is a simple boolean — no approval workflow is needed.
- When a profile is made private, the `ProfileFollow` records are NOT automatically deleted. The cascade only applies when the profile itself is deleted. However, the Community API and feed auth will check `isPublic` at query time, effectively hiding the profile from followers.
