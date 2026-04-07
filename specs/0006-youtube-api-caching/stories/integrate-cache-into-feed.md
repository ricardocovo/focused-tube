# User Story: Integrate Cache into Feed Endpoint

## Summary

**As a** end user,
**I want** repeated feed loads to be served from cache instead of making fresh YouTube API calls,
**So that** the feed loads faster and the application doesn't waste API quota on duplicate requests.

## Description

This story wires the `CacheProvider` (from the server-side cache layer story) into the YouTube service functions and feed route. When a feed request comes in, the system checks the cache for each channel/keyword lookup before calling the YouTube API. On a cache miss, the API response is stored in the cache with a TTL. Cache keys include the user ID to prevent cross-user data leakage. Channel upload results use a longer TTL (10 minutes) than keyword search results (5 minutes) since uploads change less frequently.

## Acceptance Criteria

- [ ] Given a feed request for a profile, when all channel/keyword results are cached, then zero YouTube API calls are made and the response is served from cache.
- [ ] Given a feed request for a profile, when some results are cached and others are not, then only the uncached results trigger YouTube API calls.
- [ ] Given a cache miss, when the YouTube API returns a response, then the response is stored in cache with the appropriate TTL (10 minutes for channel uploads, 5 minutes for keyword searches).
- [ ] Given the cache key structure, when two different users request the same channel's videos, then they get separate cache entries (user-scoped keys).
- [ ] Given a cached response has expired (past TTL), when the same feed is requested, then the system makes a fresh YouTube API call and updates the cache.
- [ ] Given the cache integration, when a cache read or write fails, then the system falls back gracefully to live YouTube API calls with no user-visible error.
- [ ] Given the cache integration, when a cached feed is served, then the response format (video structure, deduplication, sorting) is identical to an uncached response.

## Tasks

- [ ] Define cache key generation functions: `channelCacheKey(userId, channelId, pageToken?)` and `keywordCacheKey(userId, keyword, pageToken?)` in the YouTube service or a shared utility
- [ ] Wrap the `getChannelVideos()` function (from the playlistItems story) with cache-check-first logic: check cache → return if hit → call API on miss → store result → return
- [ ] Wrap the `searchVideos()` function with the same cache-check-first pattern for keyword searches
- [ ] Set default TTL for channel uploads to 600 seconds (10 minutes) and keyword searches to 300 seconds (5 minutes)
- [ ] Make TTL values configurable via environment variables (`CACHE_TTL_CHANNEL_SECONDS`, `CACHE_TTL_KEYWORD_SECONDS`)
- [ ] Add debug-level logging when serving from cache vs. making a live API call (include the cache key)
- [ ] Ensure the feed route's `Promise.allSettled` pattern works correctly when some promises resolve from cache and others from live calls
- [ ] Verify that pagination tokens from cached responses work correctly for subsequent page requests
- [ ] Test that the feed response (deduplication, sorting, source tagging) is identical whether served from cache or live

## Dependencies

- Depends on: Server-Side In-Memory Cache Layer (for the `CacheProvider` and `InMemoryCacheProvider`)
- Depends on: Replace search.list with playlistItems.list for Channel Feeds (for the `getChannelVideos()` function)

## Out of Scope

- Client-side caching (handled in a separate story)
- Cache invalidation beyond TTL expiry
- Cache warming or preloading

## Notes

- The cache-check-first pattern can be implemented as a generic wrapper/decorator function (e.g., `withCache(cacheKey, ttl, fetchFn)`) to avoid duplicating the logic for channels and keywords.
- When the cache is cold (server just restarted), the first few requests will be slow as normal, but subsequent requests within the TTL window will be fast.
- Cache keys must include the `pageToken` to support correct pagination caching.
