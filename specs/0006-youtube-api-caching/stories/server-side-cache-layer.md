# User Story: Server-Side In-Memory Cache Layer

## Summary

**As a** developer,
**I want** a reusable, abstracted in-memory cache layer on the server,
**So that** YouTube API responses can be cached and served without repeated API calls, and the cache backend can be swapped for Redis later without changing consuming code.

## Description

There is currently no caching at any layer in the server. Every feed request triggers fresh YouTube API calls regardless of how recently the same data was fetched. This story introduces a cache abstraction (`CacheProvider` interface) and an in-memory implementation (`InMemoryCacheProvider`) with TTL-based expiry and LRU eviction. The cache is designed to be injected into the YouTube service layer in a subsequent story.

## Acceptance Criteria

- [ ] Given the cache abstraction, when a developer looks at the code, then there is a `CacheProvider` interface with `get<T>(key: string): Promise<T | undefined>`, `set<T>(key: string, value: T, ttlSeconds: number): Promise<void>`, `delete(key: string): Promise<void>`, and `clear(): Promise<void>` methods.
- [ ] Given the `InMemoryCacheProvider`, when `set(key, value, 600)` is called, then `get(key)` returns the value for 600 seconds and returns `undefined` after that.
- [ ] Given the cache has reached its max entries limit (configurable, default 5,000), when a new entry is added, then the least-recently-used entry is evicted.
- [ ] Given the cache, when entries are stored, then total memory usage stays under 50 MB under normal usage patterns (up to 5,000 entries of typical YouTube API response size).
- [ ] Given the `InMemoryCacheProvider`, when `clear()` is called, then all entries are removed.
- [ ] Given the cache, when `get(key)` is called for a non-existent key, then it returns `undefined` without throwing.
- [ ] Given the cache module, when imported, then it exports a singleton instance that can be used across the application.

## Tasks

- [ ] Create `server/src/utils/cache.ts` with the `CacheProvider` interface definition
- [ ] Implement `InMemoryCacheProvider` class in the same file, using a `Map` with entry timestamps for TTL tracking
- [ ] Implement LRU eviction by tracking access order; evict the oldest entry when max entries are exceeded
- [ ] Add a periodic cleanup mechanism (e.g., lazy cleanup on `get`/`set`, or a setInterval sweep every 60 seconds) to remove expired entries
- [ ] Export a singleton `cache` instance of `InMemoryCacheProvider` with sensible defaults (max 5,000 entries)
- [ ] Make the max entries limit configurable via environment variable (`CACHE_MAX_ENTRIES`)
- [ ] Add debug-level logging for cache hits, misses, and evictions
- [ ] Write unit tests for the `InMemoryCacheProvider` covering: set/get, TTL expiry, LRU eviction, clear, and concurrent access patterns

## Dependencies

- Depends on: None (this is an independent infrastructure component)

## Out of Scope

- Redis implementation of `CacheProvider` (future enhancement)
- Integration with the feed endpoint (handled in a separate story)
- Cache warming strategies

## Notes

- The `CacheProvider` interface is intentionally async (`Promise`-based) so that a Redis or external cache implementation can be dropped in without changing the contract.
- For the in-memory implementation, the `Promise` wrapper is trivial but maintains interface consistency.
- Consider using a `Map` over a plain object for better performance with frequent additions/deletions.
