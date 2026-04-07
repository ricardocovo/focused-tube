# Feature: YouTube API Caching & Quota Optimization

## Overview

This feature addresses critical YouTube Data API v3 quota exhaustion by introducing a server-side caching layer, replacing the expensive `search.list` endpoint with the 100× cheaper `playlistItems.list` for channel uploads, and adding client-side feed caching to eliminate redundant refetches. Together, these changes reduce quota consumption from ~1,800 units per feed load to ~315 units, and from ~12,600 units per user session to ~315 units (a 97.5% reduction).

## Problem Statement

The application currently consumes its entire YouTube Data API v3 daily quota (10,000 units) within just a few page views by a single user. Three compounding issues cause this: (1) every channel in a profile triggers a separate `search.list` call at 100 quota units each; (2) channel upload fetching uses the expensive `search.list` endpoint when the 1-unit `playlistItems.list` would suffice; and (3) there is zero caching at any layer, so every feed load, tab switch, profile switch, and infinite-scroll event repeats the full fan-out of YouTube API calls from scratch. Additionally, `prompt: 'consent'` in the OAuth flow forces unnecessary re-grants on every login.

## Goals

- [ ] Replace `youtube.search.list` with `youtube.playlistItems.list` for fetching recent channel uploads (100× quota reduction per channel)
- [ ] Implement a server-side in-memory TTL cache for YouTube API responses
- [ ] Add client-side feed caching to prevent redundant refetches on tab/profile switches
- [ ] Add `publishedAfter` time-bounding to subscription queries to reduce noise and pagination depth
- [ ] Fix OAuth `prompt: 'consent'` to be conditional, avoiding unnecessary re-grants for returning users
- [ ] Add server-side quota tracking and guardrails to prevent exhaustion

## Non-Goals

- Redis or external distributed cache (in-memory is sufficient for current single-server deployment)
- Offline/service-worker caching of video data on the client
- Full-text search index for cached videos
- Changing the feed deduplication or sorting logic
- Adding a user-visible quota usage dashboard
- Replacing keyword `search.list` calls (these genuinely require the search endpoint)

## Target Users / Personas

| Persona | Description |
|---|---|
| End User | A YouTube viewer who expects the feed to load quickly and reliably without hitting quota errors, even with large profiles (20+ channels, multiple keywords) |
| Power User | A user with multiple profiles and many channels/keywords who switches between them frequently during a session |
| Developer | The engineer(s) maintaining Focused Tube who need a clean, extensible caching layer that can be swapped for Redis later without changing route or controller code |

## Functional Requirements

1. The system shall fetch recent channel uploads using `youtube.playlistItems.list` with the channel's uploads playlist ID instead of `youtube.search.list` with a `channelId` filter.
2. The system shall derive the uploads playlist ID from the channel ID (replacing the `UC` prefix with `UU`) without an additional API call when possible, and fall back to `youtube.channels.list` to resolve the playlist ID when the convention does not apply.
3. The system shall maintain a server-side in-memory cache keyed by request parameters (channel ID + page token, or keyword + page token) with a configurable TTL (default 10 minutes).
4. The system shall serve cached responses for feed requests when a valid (non-expired) cache entry exists, bypassing the YouTube API entirely.
5. The system shall cache channel upload results and keyword search results independently, with separate TTLs if needed.
6. The client shall cache the last-fetched feed results per `(profileId, source)` combination in React state so that switching source tabs does not trigger a new server request if the data was fetched within the last 5 minutes.
7. The system shall include a `publishedAfter` parameter (default: 14 days ago) when fetching subscription channel uploads to reduce irrelevant old results.
8. The system shall use `prompt: 'consent'` only when no valid refresh token exists for the user, and omit the prompt parameter (or use `prompt: 'none'`) for returning users who already have a stored refresh token.
9. The system shall track cumulative YouTube API quota usage in memory per UTC day and reject feed requests with a 429 response when a configurable quota threshold (default: 9,000 units) is reached, reserving headroom for essential operations.
10. The system shall log each YouTube API call with its endpoint name and quota cost for observability.

## Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Cached feed responses must be served in under 50 ms (no YouTube API round-trip). |
| Quota Efficiency | A medium profile (15 channels, 3 keywords) must consume no more than 350 quota units per uncached feed load. |
| Memory | The in-memory cache must not exceed 50 MB under normal usage. Implement an LRU or max-entries eviction policy. |
| Scalability | The caching layer must be implemented behind an interface/abstraction so it can be replaced with Redis or another store without changing route or service code. |
| Security | Cached data must be scoped per-user to prevent cross-user data leakage. Cache keys must include the user ID. |
| Reliability | Cache misses must fall back gracefully to live YouTube API calls with no user-visible error. |
| Observability | Each cache hit, miss, and eviction should be logged at debug level. Quota usage should be logged at info level. |

## UX / Design Considerations

- **No visible UI changes for caching**: The caching layer is transparent to the user. Feed loads will simply be faster on repeated views.
- **Source tab switching**: Currently triggers a full refetch. After this feature, switching between All/Subscriptions/Search tabs should feel instant when cached data is available.
- **Quota exhaustion message**: The existing "YouTube API daily quota exceeded" error message (HTTP 429) should continue to display, but the threshold should be hit far less frequently.
- **Stale data indicator (optional stretch)**: A subtle "Last updated X minutes ago" timestamp on the feed could signal to the user that data is cached, with a manual refresh button.

## Technical Considerations

- **`playlistItems.list` migration**: Every YouTube channel has an "uploads" playlist. For channels with IDs starting with `UC`, the uploads playlist ID is `UU` + the remaining characters. This convention covers >99% of channels. A `channels.list` fallback (1 unit) handles edge cases.
- **Cache key design**: Keys should be structured as `feed:${userId}:channel:${channelId}:${pageToken || 'page1'}` and `feed:${userId}:keyword:${keyword}:${pageToken || 'page1'}` to ensure per-user isolation and correct pagination.
- **Cache invalidation**: TTL-based expiry is sufficient for YouTube data (videos don't change after publishing). No explicit invalidation is needed.
- **Cache abstraction**: Define a `CacheProvider` interface with `get(key)`, `set(key, value, ttl)`, `delete(key)`, and `clear()` methods. Implement `InMemoryCacheProvider` first; Redis can be added later behind the same interface.
- **Client-side caching**: Store fetched feed results in the `useFeed` hook's parent context or a lightweight cache map, keyed by `(profileId, source)`, with a timestamp. If the cached entry is less than 5 minutes old, return it immediately instead of fetching.
- **Quota tracking**: A simple in-memory counter per UTC day, incremented by the quota cost of each API call. Reset at midnight UTC. This is best-effort (resets on server restart) but sufficient for single-server deployment.
- **OAuth conditional consent**: Check whether the user record in the database already has a non-empty refresh token. If yes, redirect to Google OAuth without `prompt: 'consent'`. If no (first login), include `prompt: 'consent'` and `accessType: 'offline'`.

## Dependencies

| Dependency | Type | Notes |
|---|---|---|
| Phase 4: YouTube Integration | Internal | The existing `searchVideos()` function, feed route, and `useFeed` hook are the code being modified |
| `youtube.playlistItems.list` API | External | Must be enabled in the Google Cloud project (usually enabled alongside the YouTube Data API v3) |
| `youtube.channels.list` API | External | Used as fallback to resolve uploads playlist ID when the UC→UU convention doesn't apply |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `UU` prefix convention doesn't work for some channels | Low | Med | Implement a `channels.list` fallback (1 unit) to resolve the correct uploads playlist ID; cache the resolved playlist ID indefinitely |
| In-memory cache causes high memory usage for many concurrent users | Low | Med | Set max cache entries (e.g., 10,000) with LRU eviction; monitor memory usage |
| Stale cached data frustrates users who expect real-time results | Med | Low | 10-minute TTL is reasonable for YouTube content; add a manual refresh button as a stretch goal |
| Server restart clears cache, causing a burst of API calls | Med | Low | Cache warms up organically; quota tracking resets but the daily quota also resets on the YouTube side at midnight PT |
| `playlistItems.list` returns different data shape than `search.list` | Certain | Low | Map the `playlistItems` response to the existing `Video` interface in the service layer; handle field differences (e.g., `snippet.resourceId.videoId` vs `id.videoId`) |
| Conditional OAuth prompt breaks token refresh for returning users | Low | High | Test thoroughly; fall back to `prompt: 'consent'` if `prompt: 'none'` results in an error |

## Success Metrics

- Metric 1: A medium profile (15 channels, 3 keywords) consumes ≤350 quota units per uncached feed load (down from 1,800).
- Metric 2: Cached feed loads return in under 100 ms (no YouTube API round-trip).
- Metric 3: Switching source tabs on a previously-loaded feed shows results instantly (no loading spinner).
- Metric 4: A single user's typical session (7 feed interactions) consumes fewer than 500 total quota units.
- Metric 5: The application can support 20+ active daily users without hitting the 10,000-unit quota ceiling.
- Metric 6: Zero regressions — existing feed deduplication, sorting, source tagging, and infinite scroll continue to work correctly.

## Open Questions

- [ ] Should the cache TTL be different for channel uploads (longer, since upload frequency is low) vs. keyword searches (shorter, since search results change more dynamically)?
- [ ] Should we add a manual "Refresh Feed" button so users can force a cache-busting reload?
- [ ] Should the quota guardrail threshold (default 9,000) be configurable via environment variable or hardcoded?
- [ ] Should we batch `channels.list` calls to resolve multiple upload playlist IDs in a single API call (supports up to 50 IDs)?
- [ ] Is a `publishedAfter` default of 14 days appropriate, or should it be configurable per profile or user preference?

## User Stories

| Story | File |
|---|---|
| Replace search.list with playlistItems.list for Channel Feeds | [stories/replace-search-with-playlist-items.md](stories/replace-search-with-playlist-items.md) |
| Server-Side In-Memory Cache Layer | [stories/server-side-cache-layer.md](stories/server-side-cache-layer.md) |
| Integrate Cache into Feed Endpoint | [stories/integrate-cache-into-feed.md](stories/integrate-cache-into-feed.md) |
| Client-Side Feed Result Caching | [stories/client-side-feed-caching.md](stories/client-side-feed-caching.md) |
| Add publishedAfter Filter to Subscription Queries | [stories/add-published-after-filter.md](stories/add-published-after-filter.md) |
| Conditional OAuth Consent Prompt | [stories/conditional-oauth-consent.md](stories/conditional-oauth-consent.md) |
| Server-Side Quota Tracking and Guardrails | [stories/quota-tracking-and-guardrails.md](stories/quota-tracking-and-guardrails.md) |
