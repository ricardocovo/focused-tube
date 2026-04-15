# User Story: Client Types and API Services for Community Features

## Summary

**As a** frontend developer,
**I want** updated TypeScript types and API service functions for public profiles and following,
**So that** the UI components can consume the new community endpoints with type safety.

## Description

Extend the client-side `Profile` type to include new fields (`isPublic`, `followerCount`, `owner`, `isFollowing`) and create a new `communityApi.ts` service module with functions for fetching community profiles, following/unfollowing, and listing followed profiles. Also update `profilesApi.ts` to support the `isPublic` field in profile updates.

## Acceptance Criteria

- [ ] Given the `Profile` interface, when updated, then it includes optional `isPublic`, `followerCount`, `owner`, and `isFollowing` fields.
- [ ] Given a new `CommunityProfile` type, when defined, then it includes all fields returned by the community listing endpoint.
- [ ] Given a new `CommunityProfilesResponse` type, when defined, then it includes `profiles`, `total`, `page`, and `limit`.
- [ ] Given `fetchCommunityProfiles()`, when called with optional keyword and page params, then it returns a typed `CommunityProfilesResponse`.
- [ ] Given `followProfile()`, when called with a profile ID, then it sends a POST to the follow endpoint.
- [ ] Given `unfollowProfile()`, when called with a profile ID, then it sends a DELETE to the unfollow endpoint.
- [ ] Given `fetchFollowedProfiles()`, when called, then it returns an array of followed profiles with owner info.
- [ ] Given `updateProfile()` in `profilesApi.ts`, when called with `isPublic`, then it sends the field in the request body.

## Tasks

- [ ] Add `isPublic?: boolean` to the `Profile` interface in `client/src/types/profile.ts`
- [ ] Add `followerCount?: number` to the `Profile` interface
- [ ] Add `owner?: { name: string; avatarUrl?: string }` to the `Profile` interface
- [ ] Add `isFollowing?: boolean` to the `Profile` interface
- [ ] Create `CommunityProfile` and `CommunityProfilesResponse` types in `client/src/types/profile.ts`
- [ ] Create `client/src/services/communityApi.ts` with `fetchCommunityProfiles`, `followProfile`, `unfollowProfile`, `fetchFollowedProfiles` functions
- [ ] Update `updateProfile` in `client/src/services/profilesApi.ts` to accept `isPublic` in the updates parameter type

## Dependencies

- Depends on: [toggle-public-api.md](toggle-public-api.md) — server must accept `isPublic` in profile updates
- Depends on: [community-api.md](community-api.md) — community endpoints must exist

## Out of Scope

- React hooks or context changes (separate story)
- UI components (separate stories)

## Notes

- The `owner` field is only populated for community-listed profiles and followed profiles, not for the user's own profiles.
- The `CommunityProfile` type can extend `Profile` or be a standalone interface — prefer a standalone interface for clarity since the response shape differs from owned profiles.
- All API functions use the existing `api` axios instance from `client/src/services/api.ts` which handles auth headers automatically.
