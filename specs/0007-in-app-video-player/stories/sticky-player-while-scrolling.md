# User Story: Sticky Player While Scrolling

## Summary

**As a** power browser,
**I want** the video player to stay visible at the top of the page as I scroll through the feed,
**So that** I can watch a video and browse the rest of the feed at the same time without losing the player.

## Description

Once a video is playing, the `VideoPlayer` component should remain pinned to the top of the viewport (just below the fixed app header) as the user scrolls down through the feed. This is achieved via CSS `position: sticky` on the player container. No JavaScript scroll listeners are needed.

## Acceptance Criteria

- [ ] Given a video is playing and the page is scrolled down, then the `VideoPlayer` remains visible at the top of the content area, directly below the app header.
- [ ] Given the app header is `56px` tall and sticky at `top: 0`, then the player is sticky at `top: var(--ft-header-height)` (56 px).
- [ ] Given the player is sticky, then it does not overlap or obscure the app header.
- [ ] Given the player is sticky, then the feed grid below the player remains fully scrollable and not obscured.
- [ ] Given the viewport is 320 px wide, then the sticky player does not cause horizontal overflow or two-dimensional scrolling.
- [ ] Given no video is selected, then no sticky player element exists in the DOM (it is not merely hidden).

## Tasks

- [ ] Set `position: sticky; top: var(--ft-header-height); z-index: 40` on the `.video-player` container in `VideoPlayer.css`
- [ ] Set `background: var(--ft-surface); border-bottom: 1px solid var(--ft-border)` on `.video-player` to visually separate it from the feed below
- [ ] Ensure the `.video-player` is placed as a direct sibling before `.page-container` in `Dashboard.tsx` so stacking context is correct
- [ ] Confirm the player width respects the `page-container` max-width (1400 px) or uses its own narrower cap (~896 px) with `margin: 0 auto`
- [ ] Add `overflow-x: hidden` or `max-width: 100%` guards on the player and iframe to prevent horizontal overflow at 320 px

## Dependencies

- Depends on: [stories/play-video-in-app.md](play-video-in-app.md) — VideoPlayer component must exist before sticky styles apply
- Depends on: `--ft-header-height` CSS variable defined in `client/src/index.css`
- Depends on: `.app-header` having `position: sticky; top: 0; z-index: 50` (already in place)

## Out of Scope

- JavaScript-based scroll listeners or IntersectionObserver for the player — pure CSS sticky is sufficient
- Collapse/expand toggle for the player while scrolling

## Notes

- `z-index: 40` places the player below the header (`z-index: 50`) but above the feed grid content
- Because the player is placed before `.page-container` in DOM order and `.page-container` is a normal-flow block, CSS sticky works without any wrapper changes
- On iOS Safari, `position: sticky` requires the scrolling ancestor to not have `overflow: hidden` — verify this doesn't conflict with any existing layout wrappers
