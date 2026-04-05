# User Story: S11 — YouTube Subscriptions Endpoint

## Summary

**As a** Focused Tube end user,
**I want** the server to fetch my YouTube subscription list from the YouTube Data API v3,
**So that** I can see the channels I already follow on YouTube and choose which ones to add to my profiles.

## Description

The server needs a dedicated route (`GET /api/subscriptions`) that, when called by an authenticated user, uses their stored (and if necessary refreshed) Google OAuth access token to call the YouTube Data API v3 `subscriptions.list` resource. The route pages through all results automatically (following `nextPageToken`) up to a reasonable cap, then returns a clean, typed array of channel objects to the client.

This endpoint is a prerequisite for the Subscription Picker UI (S12) and acts as the first real exercise of the YouTube service layer that the feed endpoint (S13) will also rely on.

## Acceptance Criteria

- [ ] Given an authenticated request to `GET /api/subscriptions`, when the user has YouTube subscriptions, then the response is HTTP 200 with a JSON body `{ subscriptions: SubscriptionChannel[] }` where each item contains `youtubeChannelId`, `title`, `description`, and `thumbnailUrl`.
- [ ] Given an authenticated request, when the user's Google access token is expired, then the server transparently refreshes it using the stored refresh token, persists the new access token to the database, and completes the YouTube API call without returning an error to the client.
- [ ] Given an unauthenticated request (missing or invalid JWT), when `GET /api/subscriptions` is called, then the server returns HTTP 401.
- [ ] Given the user has more than 50 subscriptions (requiring multiple pages from the YouTube API), when the endpoint is called, then all pages are automatically fetched (following `nextPageToken`) up to a cap of 500 channels.
- [ ] Given the YouTube API returns a quota-exceeded error (HTTP 403, reason `quotaExceeded`), when the endpoint is called, then the server returns HTTP 503 with a structured error body `{ error: "youtube_quota_exceeded", message: "..." }`.
- [ ] Given a valid request, when the YouTube API call succeeds, then the response is returned within 5 seconds for up to 50 subscriptions.
- [ ] Given a valid request, when the user has zero subscriptions, then the response is HTTP 200 with `{ subscriptions: [] }`.

## Tasks

- [ ] Install the `googleapis` npm package in `server/` (`npm install googleapis`)
- [ ] Add TypeScript types for the YouTube subscription response shape in `server/src/types/youtube.ts` — define `SubscriptionChannel` interface with `youtubeChannelId`, `title`, `description`, `thumbnailUrl`
- [ ] Create `server/src/services/youtube.ts` with an exported `createYouTubeClient(accessToken: string, refreshToken: string)` helper that instantiates `google.youtube('v3')` with an `OAuth2Client` configured with the user's credentials
- [ ] Implement token-refresh logic in a shared utility `server/src/utils/googleAuth.ts` — export `getValidOAuthClient(userId: string): Promise<OAuth2Client>` that reads the user's tokens from DB, checks expiry, refreshes if needed via `oauth2Client.refreshAccessToken()`, persists new `accessToken` to DB, and returns a ready `OAuth2Client`
- [ ] Implement `getSubscriptions(userId: string): Promise<SubscriptionChannel[]>` in `server/src/services/youtube.ts` — call `youtube.subscriptions.list({ part: ['snippet'], mine: true, maxResults: 50 })`, follow `nextPageToken` in a loop up to 500 results, and map each item to the `SubscriptionChannel` shape
- [ ] Add quota-exhaustion detection in the YouTube service: catch `GaxiosError` where `error.response.data.error.errors[0].reason === 'quotaExceeded'` and throw a typed `YouTubeQuotaError`
- [ ] Create `server/src/routes/subscriptions.ts` with a `GET /` route that uses `requireAuth` middleware, calls `getSubscriptions(req.user.id)`, and returns the result; handle `YouTubeQuotaError` with HTTP 503
- [ ] Register the subscriptions router in `server/src/index.ts` at the `/api/subscriptions` path
- [ ] Write unit tests for `getSubscriptions` with a mocked `googleapis` client covering: success with single page, success with multi-page (nextPageToken), empty results, token refresh triggered, quota exhaustion error
- [ ] Write an integration/route test for `GET /api/subscriptions` covering: authenticated success, unauthenticated 401, quota-exceeded 503
- [ ] Manually test the endpoint end-to-end with a real Google account in the dev environment and confirm the correct subscription list is returned

## Dependencies

- Depends on: Phase 2 (S4, S5) — Google OAuth flow, `accessToken`/`refreshToken` stored on `User` model, `requireAuth` JWT middleware must be complete and working

## Out of Scope

- Caching of subscription results (future enhancement)
- Filtering or searching subscriptions server-side (client-side only, handled in S12)
- Returning video counts or other enriched channel metadata beyond `snippet`

## Notes

- `subscriptions.list` with `mine: true` counts as a **read** operation — no quota-sensitive `search.list` calls here, so cost is relatively low (1 unit per 50 items).
- The 500-channel cap should be documented in a code comment alongside the pagination loop.
- The `OAuth2Client` must be configured with `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` from environment variables — make sure `.env.example` is updated to document these if not already done by Phase 2.
- Consider storing token expiry (`expiresAt`) on the User model to avoid unnecessary refresh calls, but this is optional for MVP.
