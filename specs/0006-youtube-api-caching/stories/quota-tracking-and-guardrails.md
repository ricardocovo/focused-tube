# User Story: Server-Side Quota Tracking and Guardrails

## Summary

**As a** developer and application operator,
**I want** the server to track YouTube API quota consumption and enforce a safety threshold,
**So that** the application never fully exhausts its daily quota and I have visibility into consumption patterns.

## Description

The YouTube Data API v3 enforces a hard daily quota of 10,000 units. Currently, there is no tracking of how many units have been consumed, and the application only discovers quota exhaustion when YouTube returns a 403 error. This story adds a lightweight in-memory quota tracker that increments a counter for each API call (weighted by the endpoint's quota cost), resets daily, and rejects feed requests with a 429 response when a configurable safety threshold is approached. It also adds structured logging for each API call for observability.

## Acceptance Criteria

- [ ] Given the quota tracker, when a YouTube API call is made, then the tracker increments by the correct quota cost (1 unit for `playlistItems.list` and `channels.list`, 100 units for `search.list`).
- [ ] Given the quota tracker has reached the safety threshold (default: 9,000 units), when a new feed request arrives, then the server responds with HTTP 429 and a message: "YouTube API daily quota limit approaching. Please try again later."
- [ ] Given the quota tracker, when the UTC date changes (midnight UTC), then the counter resets to 0.
- [ ] Given the quota tracker, when the server restarts, then the counter resets to 0 (best-effort tracking, acceptable for single-server deployment).
- [ ] Given a YouTube API call, when it is executed, then a structured log entry is emitted at info level with: endpoint name, quota cost, cumulative daily usage, and user ID.
- [ ] Given the safety threshold, when the `QUOTA_DAILY_LIMIT` environment variable is set, then that value is used instead of the default 9,000.
- [ ] Given essential operations (e.g., subscription fetching, token refresh), when the quota threshold is reached, then these operations are still allowed (only feed requests are gated).

## Tasks

- [ ] Create `server/src/utils/quota.ts` with a `QuotaTracker` class that holds a counter, the current UTC date string, and the configured threshold
- [ ] Implement `QuotaTracker.record(endpointName: string, cost: number)` that increments the counter, resets if the date has changed, and logs the call
- [ ] Implement `QuotaTracker.canProceed(cost: number): boolean` that returns `false` if `currentUsage + cost` would exceed the threshold
- [ ] Implement `QuotaTracker.getUsage(): { used: number; limit: number; remaining: number }` for observability
- [ ] Export a singleton `quotaTracker` instance from the module
- [ ] Add a `QUOTA_DAILY_LIMIT` environment variable (default: `9000`) to the server config
- [ ] Integrate `quotaTracker.record()` into `getChannelVideos()` and `searchVideos()` in `youtube.service.ts` — call it after each successful YouTube API call
- [ ] Add a quota guard check at the top of the feed route handler: if `!quotaTracker.canProceed(estimatedCost)`, return HTTP 429 before making any API calls
- [ ] Estimate the cost of a feed request as `(channelCount × 1) + (keywordCount × 100)` for the guard check
- [ ] Add a `GET /api/health` enhancement: include `quotaUsage` in the health check response for operational monitoring
- [ ] Add structured logging using `console.log` with JSON format: `{ event: 'youtube_api_call', endpoint, cost, dailyUsage, userId, timestamp }`

## Dependencies

- Depends on: Replace search.list with playlistItems.list for Channel Feeds (to know the correct quota cost per endpoint)

## Out of Scope

- Persistent quota tracking across server restarts (would require database or Redis storage)
- Per-user quota allocation or rate limiting
- Automatic quota increase requests to Google
- Alerting or notification systems for quota warnings

## Notes

- The quota costs for YouTube Data API v3 endpoints are: `search.list` = 100 units, `playlistItems.list` = 1 unit, `channels.list` = 1 unit, `subscriptions.list` = 1 unit.
- The safety threshold of 9,000 (out of 10,000) leaves 1,000 units of headroom for subscription fetching and other non-feed operations.
- Since this is in-memory and best-effort, a server restart mid-day could allow more usage than intended. This is acceptable for the current single-server deployment.
- The guard check uses an estimated cost to avoid the overhead of per-call checking during the fan-out. The actual cost may differ slightly if some calls are served from cache.
