# User Story: Feed Access for Followed Profiles

## Summary

**As a** user who follows a public profile,
**I want** to view the video feed of that profile,
**So that** I can discover videos curated by other users without building my own profile.

## Description

Update the feed route (`GET /api/feed/:profileId`) authorization logic to allow access when the requesting user has a `ProfileFollow` record for the target profile, in addition to the existing ownership check. When serving a followed profile's feed, the system uses the **profile owner's** YouTube credentials to make API calls, since the follower may not have the same subscriptions.

## Acceptance Criteria

- [ ] Given an authenticated user who owns the profile, when they request `GET /api/feed/:profileId`, then the feed is returned as before (no regression).
- [ ] Given an authenticated user who follows a public profile, when they request `GET /api/feed/:profileId`, then the feed is returned successfully.
- [ ] Given an authenticated user who neither owns nor follows the profile, when they request `GET /api/feed/:profileId`, then 403 Forbidden is returned.
- [ ] Given a followed profile whose owner has valid YouTube credentials, when the feed is fetched, then the profile owner's access/refresh tokens are used for YouTube API calls.
- [ ] Given a followed profile that has been made private (`isPublic = false`), when a follower requests the feed, then 403 Forbidden is returned.
- [ ] Given a followed profile where the owner's YouTube credentials are expired/invalid, when the feed is fetched, then an appropriate error is returned (existing error handling applies).

## Tasks

- [ ] Update the authorization check in `server/src/routes/feed.ts` to query `ProfileFollow` when `profile.userId !== req.user.id`
- [ ] Add a check that the profile is still public before allowing feed access for followers
- [ ] When serving a followed profile, resolve the profile owner's `userId` and pass it to YouTube service calls instead of `req.user.id`
- [ ] Add server-side tests for feed access with followed profiles (allowed, forbidden, private profile scenarios)
- [ ] Verify that existing feed behavior for owned profiles is unchanged (regression test)

## Dependencies

- Depends on: [schema-migration.md](schema-migration.md) — `ProfileFollow` model must exist
- Depends on: [community-api.md](community-api.md) — follow records must be creatable (for testing)

## Out of Scope

- Caching of feed results for popular followed profiles (covered by spec 0006)
- Rate limiting per profile owner for follower-initiated feed requests
- Notification to profile owner when their quota is used by followers

## Notes

- The YouTube service functions (`searchVideos`, `getChannelVideos`) accept a `userId` parameter to look up that user's credentials. Passing the profile owner's `userId` instead of the follower's is sufficient.
- This is the key security boundary: the feed endpoint must verify either ownership OR an active follow relationship on a public profile before returning data.
- Quota impact: feed requests for followed profiles consume the **profile owner's** YouTube API quota. This is by design but should be documented as a known trade-off.
