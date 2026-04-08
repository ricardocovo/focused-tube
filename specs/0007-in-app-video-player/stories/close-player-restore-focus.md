# User Story: Close Player and Restore Focus

## Summary

**As a** keyboard or assistive-technology user,
**I want** to close the video player with a button or keyboard shortcut and have focus return to the card I clicked,
**So that** I can continue navigating the feed from the point where I opened the video without losing my place.

## Description

The `VideoPlayer` component must provide a close mechanism that is accessible to all users (mouse, keyboard, touch). When dismissed, the player is unmounted from the DOM and keyboard focus is returned to the `VideoCard` button that triggered playback. `Escape` is also supported as a shortcut to close.

## Acceptance Criteria

- [ ] Given the player is open, then a visible close button is rendered in the top-right corner of the player panel with `aria-label="Close video player"`.
- [ ] Given the player mounts, then keyboard focus is moved to the close button automatically (via `useEffect` and `closeButtonRef.current?.focus()`).
- [ ] Given the player is open, when the user activates the close button (click, Enter, or Space), then the player unmounts and focus returns to the `VideoCard` button that was last activated.
- [ ] Given the player is open, when the user presses `Escape`, then the player closes with equivalent behaviour to the close button (focus returns to triggering card).
- [ ] Given the player is closed, then no player DOM nodes remain in the document.
- [ ] Given a mouse user dismisses the player, then focus is not visibly disruptive (no flash or unexpected jump).

## Tasks

- [ ] Add `closeButtonRef = useRef<HTMLButtonElement>(null)` in `VideoPlayer.tsx`
- [ ] In `VideoPlayer.tsx`, add a `useEffect` that calls `closeButtonRef.current?.focus()` on mount
- [ ] In `VideoPlayer.tsx`, add a `useEffect` that attaches a `keydown` listener on `document` for `Escape` and calls `onClose()` when fired; clean up on unmount
- [ ] Render a `<button ref={closeButtonRef} aria-label="Close video player" className="video-player-close" onClick={onClose}>` in the top-right of the player
- [ ] In `Dashboard.tsx`, store the triggering element in `lastFocusRef` before setting `selectedVideo`: `lastFocusRef.current = document.activeElement as HTMLElement`
- [ ] In `Dashboard.tsx`, define `handleClose` which sets `selectedVideo` to `null` and then calls `lastFocusRef.current?.focus()`
- [ ] Pass `handleClose` as `onClose` to `<VideoPlayer>`
- [ ] Add `video-player-close` styles in `VideoPlayer.css`: absolutely positioned top-right, clear visible focus ring using `var(--ft-focus)`

## Dependencies

- Depends on: [stories/play-video-in-app.md](play-video-in-app.md) — player component must be scaffolded first
- Depends on: VideoCard being a `<button>` element (not an `<a>`) so it can receive programmatic focus

## Out of Scope

- Focus trap within the player (the iframe content is YouTube's responsibility; we only trap/manage focus at the container boundary)
- Closing the player when the user navigates to a different route

## Notes

- `document.activeElement` at the moment of click will be the VideoCard button — capture it before React state update triggers the player mount
- The `Escape` handler must be cleaned up in the `useEffect` return function to avoid memory leaks or duplicate handlers
- Visible focus style on the close button must meet 3:1 contrast ratio against adjacent colors (WCAG 2.2 SC 1.4.11)
