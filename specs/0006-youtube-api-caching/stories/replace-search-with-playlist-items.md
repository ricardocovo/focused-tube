# User Story: Replace search.list with playlistItems.list for Channel Feeds

## Summary

**As a** end user,
**I want** my feed to load channel videos using a quota-efficient YouTube API endpoint,
**So that** the application doesn't exhaust its daily API quota after just a few page views.

## Description

The current implementation uses `youtube.search.list` (100 quota units per call) to fetch recent uploads from each channel in a profile. The YouTube Data API v3 offers `youtube.playlistItems.list` (1 quota unit per call) which achieves the same result — listing a channel's recent uploads — at 1/100th the cost. Every YouTube channel has an "uploads" playlist whose ID can be derived by replacing the `UC` prefix of the channel ID with `UU`. This story replaces the channel-video fetching logic in the YouTube service layer.

## Acceptance Criteria

- [ ] Given a profile with subscribed channels, when the feed is loaded, then channel videos are fetched using `youtube.playlistItems.list` instead of `youtube.search.list`.
- [ ] Given a channel ID starting with `UC`, when the uploads playlist ID is derived, then it correctly uses the `UU` prefix convention (e.g., `UCxyz` → `UUxyz`).
- [ ] Given a channel ID that does not follow the `UC` convention, when the uploads playlist ID is needed, then the system falls back to `youtube.channels.list` to resolve the `contentDetails.relatedPlaylists.uploads` value.
- [ ] Given a successful `playlistItems.list` response, when results are returned, then each video is mapped to the existing `Video` interface with correct `videoId`, `title`, `description`, `channelId`, `channelTitle`, `thumbnailUrl`, `publishedAt`, and `source: 'subscription'`.
- [ ] Given the new implementation, when a feed is loaded for a profile with 15 channels, then the total quota cost for channel videos is ≤15 units (was 1,500).
- [ ] Given the new implementation, when pagination is used, then `nextPageToken` from `playlistItems.list` is correctly forwarded to subsequent requests.
- [ ] Given the existing keyword search functionality, when keywords are searched, then keyword searches continue to use `youtube.search.list` (unchanged).

## Tasks

- [ ] Add a `getChannelUploadsPlaylistId(channelId: string)` utility function in `youtube.service.ts` that derives the uploads playlist ID using the `UC` → `UU` convention
- [ ] Add a `channels.list` fallback in the utility function for channel IDs that don't start with `UC`, caching the resolved playlist ID in a long-lived in-memory map
- [ ] Create a new `getChannelVideos(userId: string, params: { channelId: string; maxResults?: number; pageToken?: string; publishedAfter?: string })` function in `youtube.service.ts` that uses `youtube.playlistItems.list` with the uploads playlist ID
- [ ] Map the `playlistItems.list` response shape (`snippet.resourceId.videoId`, `snippet.title`, etc.) to the existing `Video` interface
- [ ] Update the feed route in `server/src/routes/feed.ts` to call the new `getChannelVideos()` function instead of `searchVideos()` for channel-based feeds (lines 57–68)
- [ ] Preserve the existing `searchVideos()` function for keyword-based searches (lines 71–82) — no changes needed there
- [ ] Handle `publishedAfter` filtering client-side (since `playlistItems.list` doesn't support `publishedAfter` directly) by filtering results after fetching
- [ ] Update TypeScript types if any new response fields are introduced
- [ ] Verify that the existing deduplication logic in the feed route still works correctly with videos from `playlistItems.list`
- [ ] Test with channels of various sizes (0 videos, few videos, many videos) to confirm pagination works

## Dependencies

- Depends on: None (this is a standalone refactor of the existing service layer)

## Out of Scope

- Caching of `playlistItems.list` responses (handled in a separate story)
- Changes to keyword search logic
- Changes to the client-side feed display

## Notes

- `playlistItems.list` returns videos in reverse-chronological order by default, which matches the current `search.list` behavior with `order: 'date'`.
- The `playlistItems.list` response includes `snippet.resourceId.videoId` rather than `id.videoId` — the mapping must account for this.
- Some channels may have their uploads playlist set to private; handle this gracefully by returning an empty array for that channel rather than failing the entire feed.
