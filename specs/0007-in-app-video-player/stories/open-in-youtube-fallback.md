# User Story: Open in YouTube Fallback

## Summary

**As a** user who prefers to watch on YouTube directly,
**I want** a visible link on each video card to open the video on YouTube in a new tab,
**So that** I am not forced into the in-app player and can still access YouTube's full feature set (comments, like, subscribe, etc.).

## Description

Converting the `VideoCard` from an `<a>` link to a `<button>` removes the native right-click / open-in-new-tab affordance. This story restores that workflow by adding a small secondary "Open in YouTube" icon link inside the card's metadata row. It opens YouTube in a new tab without triggering the in-app player.

## Acceptance Criteria

- [ ] Given a VideoCard is rendered, then a small "Open in YouTube" link is visible in the card's metadata row alongside the published time and source badge.
- [ ] Given the user clicks the "Open in YouTube" link, then `https://www.youtube.com/watch?v={videoId}` opens in a new tab and the in-app player does NOT open.
- [ ] Given the user activates the YouTube link via keyboard (Tab then Enter), then the same new-tab behaviour occurs without triggering `onSelect`.
- [ ] Given a screen reader reads the card, then the YouTube link has an accessible name that includes the video title (e.g., `aria-label="Open {video.title} on YouTube"`).
- [ ] Given the card is viewed at 320 px width, then the YouTube link does not overflow or push any other card content out of view.

## Tasks

- [ ] Add a `<a href={`https://www.youtube.com/watch?v=${video.videoId}`} target="_blank" rel="noopener noreferrer" aria-label={`Open ${video.title} on YouTube`} className="video-card-yt-link" onClick={e => e.stopPropagation()}` element inside `.video-card-meta` in `VideoCard.tsx`
- [ ] Add `e.stopPropagation()` on the link's `onClick` to prevent it from bubbling to the card `<button>` handler
- [ ] Style `.video-card-yt-link` in `VideoCard.css`: small icon button appearance, uses `currentColor` SVG or a YouTube icon character, contrasts against card background at ≥ 4.5:1
- [ ] Verify the link still receives independent Tab focus separate from the card button
- [ ] Ensure the link's visible label (icon) has at minimum a tooltip or visually-hidden text so keyboard users understand its purpose

## Dependencies

- Depends on: [stories/play-video-in-app.md](play-video-in-app.md) — the VideoCard must have been converted to a `<button>` first (this story adds the compensating link)

## Out of Scope

- Copying the video URL to clipboard
- Sharing or bookmarking functionality

## Notes

- `e.stopPropagation()` is required because the `<a>` is nested inside the `<button>` — without it, the click would bubble and also trigger `onSelect`
- Use an SVG YouTube play icon or a simple external-link icon — avoid emoji for icons (unreliable across platforms)
- The link does not need to be a `<button>` — it is a genuine navigation action to an external URL, so `<a>` is the semantically correct element
