# User Story: Play Video In App

## Summary

**As a** focus-first viewer,
**I want** to click a video card and have the video play inside the Focused Tube Dashboard,
**So that** I never leave the curated feed experience and get pulled into YouTube's recommendation engine.

## Description

Currently every `VideoCard` is an `<a>` tag that opens the full YouTube watch page in a new tab. This story replaces that behaviour: clicking a card mounts a `VideoPlayer` component at the top of the Dashboard that embeds the YouTube video via an `<iframe>`. The feed stays visible and interactive below the player.

## Acceptance Criteria

- [ ] Given a feed is loaded, when a user clicks a VideoCard, then a `<VideoPlayer>` component appears at the top of the Dashboard containing a YouTube embed for that video.
- [ ] Given the player is mounted, then the iframe uses the `youtube-nocookie.com` embed domain with `autoplay=1`.
- [ ] Given the player is mounted, then the iframe has a `title` attribute matching the video's title.
- [ ] Given a video is already playing, when the user clicks a different VideoCard, then the player swaps to the new video without a full remount of the player shell (only the iframe refreshes via `key` change).
- [ ] Given the player is mounted, the video title (`<h2>`) and channel name are displayed beneath the iframe inside the player panel.
- [ ] Given the viewport is 320 px wide, then the player iframe maintains a 16:9 aspect ratio with no horizontal overflow.

## Tasks

- [ ] Add `selectedVideo: FeedVideo | null` state to `Dashboard.tsx`
- [ ] Add `lastFocusRef = useRef<HTMLElement | null>(null)` to `Dashboard.tsx` for focus tracking
- [ ] Create `VideoPlayer.tsx` component in `client/src/components/feed/`
- [ ] Create `VideoPlayer.css` with aspect-ratio iframe wrapper, sticky positioning, and responsive styles
- [ ] Render `<VideoPlayer>` in `Dashboard.tsx` between `<AppHeader>` and `.page-container` when `selectedVideo` is set
- [ ] Extend `VideoFeedProps` in `VideoFeed.tsx` to accept `onVideoSelect?: (video: FeedVideo) => void`
- [ ] Pass `onVideoSelect` to each `<VideoCard>` in `VideoFeed.tsx`
- [ ] Add `onSelect?: (video: FeedVideo) => void` prop to `VideoCard.tsx`
- [ ] Convert the `VideoCard` outer `<a>` to a `<button>` element
- [ ] On button click in `VideoCard`, call `onSelect(video)` when prop is provided
- [ ] Apply button reset CSS in `VideoCard.css` (remove default button styles, set cursor pointer, match existing card visual)
- [ ] Use `key={selectedVideo.videoId}` on the iframe so React remounts it when the video changes

## Dependencies

- Depends on: existing `FeedVideo` type from `client/src/types/feed.ts`
- Depends on: `VideoFeed` and `VideoCard` component structure from the feed feature (0004-youtube-integration)
- Depends on: `.page-container` and `--ft-header-height` CSS tokens from 0005-polish-and-ux

## Out of Scope

- Custom playback controls (volume, seek, quality) — handled natively by the YouTube iframe
- Persisting the selected video across profile switches or reloads
- Error/fallback handling when the embed is blocked (covered in a separate hardening pass)

## Notes

- The `youtube-nocookie.com` domain reduces third-party tracking cookies without affecting playback
- The `allow` attribute on the `<iframe>` should include `autoplay; encrypted-media; picture-in-picture` and nothing else
- `autoplay=1` will only fire if the browser's autoplay policy allows it (most browsers require user gesture; since we trigger from a click this should work)
