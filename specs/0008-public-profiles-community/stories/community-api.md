# User Story: Community API for Browsing and Following Profiles

## Summary

**As an** authenticated user,
**I want** API endpoints to browse public profiles, search by keyword, and follow/unfollow profiles,
**So that** the client can power the Community page and follow management features.

## Description

Introduce a new route group at `/api/community` with endpoints for listing public profiles (with optional keyword search and pagination), following a public profile, unfollowing a profile, and retrieving the list of profiles the current user follows. All endpoints require authentication.

## Acceptance Criteria

- [ ] Given `GET /api/community/profiles`, when called by an authenticated user, then it returns a paginated list of public profiles excluding the caller's own profiles.
- [ ] Given `GET /api/community/profiles?keyword=cooking`, when called, then only profiles that have a `ProfileKeyword` matching "cooking" are returned.
- [ ] Given `GET /api/community/profiles?page=2&limit=20`, when called, then the response is paginated with the correct offset.
- [ ] Given each profile in the community listing, then the response includes `id`, `name`, `isPublic`, `user.name`, `user.avatarUrl`, and `_count.followers`.
- [ ] Given each profile in the community listing, then the response includes an `isFollowing` boolean indicating whether the current user follows that profile.
- [ ] Given `POST /api/community/profiles/:profileId/follow`, when the profile is public and not owned by the caller, then a `ProfileFollow` record is created and 201 is returned.
- [ ] Given `POST /api/community/profiles/:profileId/follow`, when the profile does not exist or is not public, then 404 is returned.
- [ ] Given `POST /api/community/profiles/:profileId/follow`, when the user already follows the profile, then 409 is returned.
- [ ] Given `POST /api/community/profiles/:profileId/follow`, when the user tries to follow their own profile, then 400 is returned.
- [ ] Given `DELETE /api/community/profiles/:profileId/follow`, when the user follows the profile, then the `ProfileFollow` record is deleted and 204 is returned.
- [ ] Given `DELETE /api/community/profiles/:profileId/follow`, when the user does not follow the profile, then 404 is returned.
- [ ] Given `GET /api/community/following`, when called, then it returns all profiles the current user follows with owner info and profile details.
- [ ] Given an unauthenticated request to any community endpoint, then 401 is returned.

## Tasks

- [ ] Create `server/src/routes/community.ts` with the Express router and `authenticateJwt` middleware
- [ ] Implement `GET /profiles` endpoint with Prisma query for public profiles, excluding the current user's profiles, including user info and follower count
- [ ] Add `isFollowing` computed field to each profile in the listing by checking `ProfileFollow` for the current user
- [ ] Implement keyword search filter using `where: { keywords: { some: { keyword: { contains: searchTerm } } } }`
- [ ] Implement offset-based pagination with `page` and `limit` query parameters (default: page=1, limit=20)
- [ ] Return total count in response for client-side pagination UI
- [ ] Implement `POST /profiles/:profileId/follow` with validation: profile exists, is public, not owned by caller, not already followed
- [ ] Implement `DELETE /profiles/:profileId/follow` with validation: follow record exists
- [ ] Implement `GET /following` to return followed profiles with owner info
- [ ] Import and mount `communityRouter` at `/api/community` in `server/src/index.ts`
- [ ] Create `server/src/services/community.service.ts` for business logic (keeping routes thin)
- [ ] Add server-side tests for all community endpoints

## Dependencies

- Depends on: [schema-migration.md](schema-migration.md) — `ProfileFollow` model and `isPublic` field must exist

## Out of Scope

- Client-side UI for the Community page (separate story)
- Feed access for followed profiles (separate story)
- Sorting by popularity/trending (may be added later)

## Notes

- The keyword search is case-insensitive and matches against `ProfileKeyword.keyword` values on the profile.
- The `isFollowing` field requires a subquery or join per profile. For performance, this can be done with a single query using Prisma's `followers` relation filtered by the current user.
- Pagination response shape: `{ profiles: [...], total: number, page: number, limit: number }`.
