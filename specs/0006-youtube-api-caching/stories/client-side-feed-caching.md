# User Story: Client-Side Feed Result Caching

## Summary

**As a** end user,
**I want** switching between source tabs and returning to a previously-viewed feed to show results instantly,
**So that** I don't have to wait for a reload every time I switch tabs or navigate back to the dashboard.

## Description

Currently, changing the source filter (All / Subscriptions / Search) in `FeedSourceTabs` triggers a complete refetch via the `useFeed` hook, because the `source` parameter is in the hook's dependency array. Similarly, navigating away from the Dashboard and back re-mounts `VideoFeed`, discarding all previously loaded data. This story adds a lightweight client-side cache that stores fetched feed results keyed by `(profileId, source)` with a timestamp, allowing instant display of recently-fetched data without a server round-trip.

## Acceptance Criteria

- [ ] Given a feed that was loaded within the last 5 minutes, when the user switches to a different source tab and switches back, then the previously-loaded videos are displayed immediately without a loading spinner or server request.
- [ ] Given a cached feed result that is older than 5 minutes, when the user revisits that tab, then a fresh server request is made and the cache is updated.
- [ ] Given the client-side cache, when the user switches profiles via `ProfileSwitcher`, then the cache for the old profile is not used for the new profile (cache is profile-scoped).
- [ ] Given the client-side cache, when the user navigates away from the Dashboard and returns, then the cached feed is shown if it is within the TTL window.
- [ ] Given the client-side cache, when the user explicitly clicks a "Retry" or "Refresh" button, then the cache is bypassed and a fresh request is made.
- [ ] Given the client-side cache, when a profile's channels or keywords are edited, then the cache for that profile is invalidated.

## Tasks

- [ ] Create a `FeedCacheContext` (or add a cache map to the existing `useFeed` hook logic) that stores `{ videos, nextPageToken, timestamp }` keyed by `${profileId}:${source || 'all'}`
- [ ] Modify the `useFeed` hook to check the cache before calling `fetchFeed()` — if a cached entry exists and is less than 5 minutes old, set state from cache instead of fetching
- [ ] Ensure `fetchInitial()` bypasses the cache (forces a fresh fetch) when triggered by `reset()` or profile changes
- [ ] Invalidate cache entries for a profile when channels or keywords are added/removed (coordinate with `ProfileContext` or expose an invalidation function)
- [ ] Make the client-side cache TTL configurable (default 5 minutes, stored as a constant)
- [ ] Ensure the "load more" (infinite scroll) function does NOT read from cache — it always fetches the next page from the server
- [ ] Verify that switching between source tabs with cached data shows the correct videos without flicker
- [ ] Test that navigating Dashboard → Profiles → Dashboard shows cached feed results

## Dependencies

- Depends on: None (independent of server-side caching, but the two complement each other)

## Out of Scope

- Caching subscription list data (the `useSubscriptions` hook)
- Persisting the cache to localStorage or sessionStorage
- Service worker / offline caching

## Notes

- A simple `Map<string, { videos: FeedVideo[]; nextPageToken?: string; timestamp: number }>` inside a React context or module-level variable is sufficient — no need for a full caching library.
- The 5-minute TTL aligns with the server-side keyword cache TTL, ensuring the client cache never serves data that is significantly older than what the server would serve.
- The `useFeed` hook currently uses `requestIdRef` to handle stale responses — this pattern should be preserved alongside the caching logic.
