# User Story: S13 — Feed Endpoint

## Summary

**As a** Focused Tube end user,
**I want** the server to combine recent videos from my profile's channels and keyword searches into a single, deduplicated, date-sorted feed,
**So that** I get one unified stream of relevant content without manually checking each channel or search.

## Description

The `GET /api/feed/:profileId` endpoint is the core data endpoint of the application. It loads the profile's channels and keywords from the database, fans out parallel YouTube Data API `search.list` calls for each channel (recent uploads) and each keyword (video search), merges the results, deduplicates by `videoId`, sorts by `publishedAt` descending, and returns a paginated response. Each video item carries a `source` field so the UI can visually distinguish subscription-based from search-based results. The endpoint also supports `?source=subscriptions` and `?source=search` query parameters to filter to one source type, and cursor-based pagination via `?pageToken`.

## Acceptance Criteria

- [ ] Given an authenticated request to `GET /api/feed/:profileId` for a profile the user owns that has at least one channel and one keyword, when the request is made, then the response is HTTP 200 with `{ videos: FeedVideo[], nextPageToken?: string }` where each `FeedVideo` has `videoId`, `title`, `channelId`, `channelTitle`, `thumbnailUrl`, `publishedAt`, and `source`.
- [ ] Given the profile has channels in it, when the feed is fetched, then videos from those channels appear with `source: "subscription"`.
- [ ] Given the profile has keywords in it, when the feed is fetched, then videos matching those keywords appear with `source: "search"`.
- [ ] Given a video appears in both the subscription feed and the keyword search results, when the feed is assembled, then it appears exactly once with `source: "subscription"`.
- [ ] Given the `?source=subscriptions` query parameter is passed, when the endpoint responds, then only subscription-sourced videos are returned.
- [ ] Given the `?source=search` query parameter is passed, when the endpoint responds, then only keyword-search-sourced videos are returned.
- [ ] Given an unauthenticated request, when `GET /api/feed/:profileId` is called, then HTTP 401 is returned.
- [ ] Given an authenticated request where the profile does not belong to the requesting user, when the endpoint is called, then HTTP 403 is returned.
- [ ] Given a `profileId` that does not exist, when the endpoint is called, then HTTP 404 is returned.
- [ ] Given a profile with no channels and no keywords, when the feed is fetched, then the response is HTTP 200 with `{ videos: [] }`.
- [ ] Given the YouTube API returns a quota-exceeded error for any sub-call, when the endpoint is called, then HTTP 503 is returned with `{ error: "youtube_quota_exceeded" }`.
- [ ] Given a `?pageToken` query parameter is included, when the endpoint is called, then the next page of results is returned using that page token.

## Tasks

- [ ] Define the `FeedVideo` TypeScript interface in `server/src/types/youtube.ts` with fields: `videoId`, `title`, `channelId`, `channelTitle`, `thumbnailUrl`, `publishedAt` (ISO string), `source: 'subscription' | 'search'`
- [ ] Implement `getChannelFeed(channelId: string, oauthClient: OAuth2Client, pageToken?: string): Promise<FeedVideo[]>` in `server/src/services/youtube.ts` — calls `youtube.search.list({ part: ['snippet'], channelId, order: 'date', type: ['video'], maxResults: 20 })`, maps results to `FeedVideo` with `source: 'subscription'`
- [ ] Implement `getKeywordFeed(keyword: string, oauthClient: OAuth2Client, pageToken?: string): Promise<FeedVideo[]>` in `server/src/services/youtube.ts` — calls `youtube.search.list({ part: ['snippet'], q: keyword, type: ['video'], maxResults: 20 })`, maps results to `FeedVideo` with `source: 'search'`
- [ ] Implement `getFeedForProfile(profileId: string, userId: string, source?: 'subscriptions' | 'search', pageToken?: string): Promise<{ videos: FeedVideo[], nextPageToken?: string }>` in `server/src/services/youtube.ts` — load profile with channels and keywords from Prisma, validate ownership (throw typed `ForbiddenError` if mismatch), fan out parallel `Promise.all` calls to `getChannelFeed` and `getKeywordFeed` filtered by `source` param, deduplicate using a `Map<videoId, FeedVideo>` (subscription wins on conflict), sort by `publishedAt` descending, return result
- [ ] Add ownership validation in `getFeedForProfile`: query the profile by ID, if not found throw `NotFoundError`, if `profile.userId !== userId` throw `ForbiddenError`
- [ ] Add quota-exhaustion error propagation: catch `YouTubeQuotaError` thrown by `getChannelFeed`/`getKeywordFeed` and re-throw so the route handler can respond with HTTP 503
- [ ] Create `server/src/routes/feed.ts` with a `GET /:profileId` route that uses `requireAuth` middleware, reads `source` and `pageToken` from query params (validate `source` is one of the allowed values), calls `getFeedForProfile`, and returns the result; handle `NotFoundError` (404), `ForbiddenError` (403), `YouTubeQuotaError` (503)
- [ ] Register the feed router in `server/src/index.ts` at the `/api/feed` path
- [ ] Ensure all YouTube API calls in `getFeedForProfile` are made using the user's valid OAuth client (using `getValidOAuthClient` from S11) so token refresh is handled automatically
- [ ] Write unit tests for `getFeedForProfile` with mocked YouTube service functions covering: combined feed with deduplication (subscription wins), source=subscriptions filter, source=search filter, empty profile, ownership validation (403), not found (404), quota error propagation
- [ ] Write unit tests for `getChannelFeed` and `getKeywordFeed` with mocked `googleapis` client covering: successful response mapping, empty results, quota error
- [ ] Write route integration tests for `GET /api/feed/:profileId` covering: authenticated success, unauthenticated 401, wrong user 403, profile not found 404, quota exceeded 503, source filter query params
- [ ] Document the quota cost per call in a comment above `getChannelFeed` and `getKeywordFeed` (100 units per `search.list` call) as a reminder for future caching work

## Dependencies

- Depends on: S11 (YouTube Subscriptions Endpoint) — `createYouTubeClient`, `getValidOAuthClient`, and `YouTubeQuotaError` utilities created in S11 are reused here
- Depends on: Phase 3 (S7, S8) — `Profile`, `ProfileChannel`, and `ProfileKeyword` Prisma models and their relationships must exist in the database

## Out of Scope

- Cross-page global deduplication (deduplication is per-response only)
- Caching of `search.list` responses
- Client-side keyword filtering of subscription results
- Enriching video items with additional metadata (duration, view count) — only `snippet` is used to minimise quota cost

## Notes

- Each `search.list` call costs **100 quota units**. A profile with 5 channels and 3 keywords will cost 800 units per feed load — roughly 12 full loads before hitting the 10 000 unit daily cap. This is acceptable for MVP but must be addressed with caching in Phase 5/future.
- The service function `getFeedForProfile` must be the *only* place that assembles the merged feed — the route handler should contain no business logic beyond parsing query params and returning HTTP responses.
- The `nextPageToken` in the response is a simple passthrough from the first YouTube sub-call that returns one — full cross-source pagination is complex and out of scope for this story; returning the token from the subscription calls is sufficient for MVP.
- Consider adding a `?limit` query param in a future story — for now default to 20 items per source per call.
