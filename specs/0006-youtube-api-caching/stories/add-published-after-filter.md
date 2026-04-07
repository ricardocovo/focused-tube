# User Story: Add publishedAfter Filter to Subscription Queries

## Summary

**As a** end user,
**I want** my subscription feed to show only recent videos (last 14 days by default),
**So that** I see relevant, timely content without wading through old uploads or triggering unnecessary pagination.

## Description

The current feed endpoint fetches channel videos without any time-bounding, meaning results can include videos from months or years ago. This leads to irrelevant content appearing in the feed and encourages users to paginate deeper (triggering more API calls). Since `playlistItems.list` doesn't natively support a `publishedAfter` parameter, this story adds post-fetch filtering to exclude videos older than a configurable threshold. For keyword searches (which use `search.list`), the `publishedAfter` parameter is passed directly to the API call to reduce result noise and improve relevance.

## Acceptance Criteria

- [ ] Given a subscription feed request, when channel videos are fetched, then only videos published within the last 14 days are included in the response.
- [ ] Given a keyword search request, when `searchVideos()` is called, then the `publishedAfter` parameter is set to 14 days ago in ISO 8601 format.
- [ ] Given the `publishedAfter` filtering, when a channel has no videos in the last 14 days, then that channel contributes zero videos to the feed (no error).
- [ ] Given the `publishedAfter` default of 14 days, when the environment variable `FEED_PUBLISHED_AFTER_DAYS` is set to a different value, then that value is used instead.
- [ ] Given the existing feed deduplication and sorting logic, when `publishedAfter` filtering is applied, then deduplication and sorting still work correctly on the filtered results.

## Tasks

- [ ] Add a `FEED_PUBLISHED_AFTER_DAYS` environment variable (default: `14`) to the server config
- [ ] Compute the `publishedAfter` ISO 8601 timestamp as `new Date(Date.now() - days * 86400000).toISOString()` at the start of each feed request
- [ ] Pass the `publishedAfter` parameter to `searchVideos()` calls for keyword searches (the `search.list` endpoint supports it natively)
- [ ] Add post-fetch filtering to the `getChannelVideos()` function: filter out videos where `publishedAt` is older than the `publishedAfter` threshold
- [ ] Update the feed route to compute and pass the `publishedAfter` value to both channel and keyword fetching functions
- [ ] Ensure pagination still works correctly — if all results on a page are filtered out, consider fetching the next page automatically (up to a reasonable limit)

## Dependencies

- Depends on: Replace search.list with playlistItems.list for Channel Feeds (since `playlistItems.list` requires post-fetch filtering rather than API-level `publishedAfter`)

## Out of Scope

- User-configurable `publishedAfter` via the UI
- Per-profile `publishedAfter` settings
- Date range filtering (start and end date)

## Notes

- The `search.list` endpoint supports `publishedAfter` natively as a query parameter, so keyword searches get this for free at the API level.
- For `playlistItems.list`, since the endpoint returns videos in reverse-chronological order, we can stop pagination early once we encounter a video older than the threshold (optimization opportunity).
- 14 days is a reasonable default that balances freshness with not missing occasional uploads from infrequent creators.
