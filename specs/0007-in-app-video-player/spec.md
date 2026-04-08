# Feature: In-App Video Player

## Overview

When a user clicks a video card in the feed, a YouTube iframe player embeds at the top of the Dashboard — sticky beneath the app header — while the feed remains scrollable beneath it. This keeps users inside the Focused Tube interface instead of jumping to YouTube, maintaining the curated, distraction-free experience the app is built around.

## Problem Statement

Currently every video card is a plain link that opens YouTube in a new tab. This immediately deposits users inside YouTube's recommendation engine — the very thing Focused Tube is designed to bypass. Embedding playback inline keeps the session contained, reduces context-switching, and reinforces the app's value proposition.

## Goals

- [ ] Clicking a video card plays it via an embedded YouTube iframe inside the Dashboard
- [ ] The player mounts sticky below the app header so it stays visible while the user scrolls the feed
- [ ] Users can dismiss the player at any time, returning focus to the card they clicked
- [ ] A secondary "Open in YouTube" link on each card preserves the ability to open YouTube directly
- [ ] The implementation is fully keyboard-accessible and meets WCAG 2.2 Level AA

## Non-Goals

- Custom video controls (volume, seek bar, quality selection) — delegated to the YouTube iframe player
- Persisting playback position across page reloads or profile switches
- Picture-in-picture or floating overlay modes
- Playing non-YouTube content

## Target Users / Personas

| Persona | Description |
|---|---|
| Focus-first viewer | Wants to watch content without being pulled into YouTube's homepage or recommendation sidebar |
| Power browser | Browses the feed quickly, wants to preview a video without losing their scroll position |

## Functional Requirements

1. The system shall replace the current outbound YouTube link behaviour on VideoCard with a button that triggers in-app playback.
2. The system shall render a YouTube iframe (`youtube.com/embed/{videoId}?autoplay=1`) in a player component at the top of the Dashboard when a video is selected.
3. The player shall be displayed sticky below the app header (`top: var(--ft-header-height)`) so it remains visible as the user scrolls the feed.
4. The player shall display the video title and channel name beneath the iframe.
5. The player shall include a clearly labelled close button that dismisses the player and returns keyboard focus to the card that was activated.
6. Each VideoCard shall retain a secondary "Open in YouTube" link (visible icon button) that opens the video on YouTube in a new tab without triggering the in-app player.
7. When no video is selected, no player is rendered and the feed occupies the full viewport below the header.
8. Selecting a different video card while the player is already open shall replace the currently playing video with the newly selected one.

## Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | The iframe must only be inserted into the DOM when a video is selected; no idle embed cost |
| Security | The `<iframe>` must use the `youtube-nocookie.com` embed domain to reduce tracking; `allow` attribute limited to required permissions only |
| Accessibility | Player close button receives focus on mount; focus returns to the triggering VideoCard on close; iframe has a meaningful `title` matching the video title; all interactive elements keyboard-operable with visible focus |
| Reflow | Player must remain functional and non-overflowing at 320 px viewport width using responsive aspect-ratio sizing |

## UX / Design Considerations

- **Player placement**: full-width within the `.page-container` max-width, centered, sitting flush against the bottom of the sticky app header
- **Player size**: 16:9 aspect ratio; on mobile stacks as a full-width block above the feed; on wider viewports the iframe is capped at ~896 px wide
- **Player sticky behaviour**: `position: sticky; top: var(--ft-header-height); z-index: 40` — sits beneath the header (`z-index: 50`) and above feed content
- **VideoCard CTA change**: the entire card becomes a `<button>` (not a link); a small "Open in YouTube ↗" icon link sits in the card metadata row
- **Transition**: the player panel slides in smoothly from above on first render
- **Close button**: absolutely positioned top-right of the player panel, clearly visible, with `aria-label="Close video player"`
- Key flow 1 — Select from feed: user scrolls feed → clicks card → player appears at top → feed stays visible below → user continues browsing
- Key flow 2 — Switch video: player is open → user clicks another card → iframe src swaps smoothly, no unmount/remount flash
- Key flow 3 — Dismiss: user clicks close or presses Escape → player disappears → focus returns to last-activated card

## Technical Considerations

- **State**: `selectedVideo: FeedVideo | null` lives in `Dashboard` (local state); no global store changes needed
- **Focus tracking**: `lastFocusRef = useRef<HTMLElement | null>(null)` in Dashboard stores the triggering button element; on close, `lastFocusRef.current?.focus()` is called
- **Escape key**: `useEffect` in `VideoPlayer` attaches a `keydown` listener for `Escape` to call `onClose`
- **iframe `key` prop**: when `selectedVideo` changes, the iframe must get a new `key` so React unmounts/remounts it (avoiding the stale video problem)
- **New files**:
  - `client/src/components/feed/VideoPlayer.tsx`
  - `client/src/components/feed/VideoPlayer.css`
- **Modified files**:
  - `client/src/pages/Dashboard.tsx` — add state, render VideoPlayer
  - `client/src/components/feed/VideoFeed.tsx` — thread `onVideoSelect` prop
  - `client/src/components/feed/VideoCard.tsx` — convert `<a>` → `<button>`, add secondary YouTube link
  - `client/src/components/feed/VideoCard.css` — button reset, secondary link styles

## Dependencies

| Dependency | Type | Notes |
|---|---|---|
| 0005-polish-and-ux | Internal | Design tokens, `.page-container`, `.app-header` layout already in place |
| YouTube Embed API | External | No API key required; uses public embed URL; subject to YouTube iframe API terms |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| YouTube blocks iframe embedding for some videos | Med | Med | Show a graceful fallback message in the player with a direct YouTube link when the embed fails (`onError` on iframe) |
| Sticky player takes up too much vertical space on small screens | Med | High | On viewports narrower than 480 px, cap the player at 240 px height and allow the feed to start immediately below |
| Converting VideoCard from `<a>` to `<button>` breaks right-click / open-in-new-tab | Low | Med | Secondary "Open in YouTube" link on every card fully restores that workflow |

## Success Metrics

- Metric 1: User can watch a video end-to-end without leaving the app
- Metric 2: Feed remains browsable while video is playing (no full-page takeover)
- Metric 3: Keyboard-only users can open, interact with, and close the player without losing their place in the feed

## Open Questions

- [ ] Should selecting a video auto-scroll the page back to the top so the player is in view, or trust the user to scroll up?
- [ ] Should the player persist its `selectedVideo` when the user switches between profile tabs, or always reset?

## User Stories

> List of all user stories for this feature (links will be added as files are created).

| Story | File |
|---|---|
| Play video in app | [stories/play-video-in-app.md](stories/play-video-in-app.md) |
| Sticky player while scrolling | [stories/sticky-player-while-scrolling.md](stories/sticky-player-while-scrolling.md) |
| Close player and restore focus | [stories/close-player-restore-focus.md](stories/close-player-restore-focus.md) |
| Open in YouTube fallback | [stories/open-in-youtube-fallback.md](stories/open-in-youtube-fallback.md) |
