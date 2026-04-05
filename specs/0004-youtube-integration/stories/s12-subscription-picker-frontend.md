# User Story: S12 — Subscription Picker Frontend

## Summary

**As a** Focused Tube end user,
**I want** a searchable UI that lists all my YouTube subscriptions and lets me add channels to my active profile with one click,
**So that** I can quickly populate my profiles with channels I already follow on YouTube without having to type channel IDs manually.

## Description

The Subscription Picker is a dedicated page (or full-screen modal) accessible from the Profile Editor. It calls `GET /api/subscriptions` to load the user's YouTube subscriptions, renders them as a browsable list with thumbnails, and provides a client-side search input to filter by channel name. Each channel row has an "Add to Profile" action button; channels already present in the active profile are shown in a "Added ✓" disabled state. Adding a channel calls the existing `POST /api/profiles/:id/channels` endpoint from Phase 3 and optimistically updates the local state.

## Acceptance Criteria

- [ ] Given the user navigates to the Subscription Picker, when the component mounts, then it fetches subscriptions from `GET /api/subscriptions` and renders a list of channel items, each showing the channel thumbnail, name, and an "Add" button.
- [ ] Given subscriptions are loading, when the API call is in flight, then a loading skeleton (placeholder rows) is displayed and the search input is disabled.
- [ ] Given the API call fails, when the Subscription Picker is open, then a user-friendly error message is shown (distinct message for quota exhaustion vs generic error) and a "Retry" button is available.
- [ ] Given subscriptions have loaded, when the user types in the search input, then the visible channel list is filtered client-side to only show channels whose name contains the search string (case-insensitive), in real time.
- [ ] Given a channel is not yet in the active profile, when the user clicks "Add to Profile", then `POST /api/profiles/:id/channels` is called, the button changes to "Added ✓" and becomes disabled optimistically before the request completes, and the channel appears in the Profile Editor's channel list.
- [ ] Given a channel is already in the active profile, when the Subscription Picker renders, then that channel's button is shown as "Added ✓" and disabled from the initial render.
- [ ] Given the "Add to Profile" API call fails, when an error response is received, then the button reverts to "Add to Profile" and an inline error toast is shown.
- [ ] Given the user has zero subscriptions, when the picker loads, then an empty state message is shown: "No YouTube subscriptions found."
- [ ] Given the picker is open as a page, when the user clicks a "Back" or "Close" button, then they are returned to the Profile Editor without losing any changes.

## Tasks

- [ ] Create `client/src/services/api.ts` function `fetchSubscriptions(): Promise<SubscriptionChannel[]>` (or add to existing API client) that calls `GET /api/subscriptions` and returns typed data
- [ ] Create `client/src/types/youtube.ts` with the `SubscriptionChannel` interface (`youtubeChannelId`, `title`, `description`, `thumbnailUrl`) matching the server's response shape
- [ ] Implement `client/src/hooks/useSubscriptions.ts` — a custom hook that calls `fetchSubscriptions()`, manages `data`, `isLoading`, and `error` state, and exposes a `refetch` function
- [ ] Create `client/src/components/subscriptions/SubscriptionPicker.tsx` — the top-level page/modal component that uses `useSubscriptions`, renders the search bar, the channel list, and loading/error/empty states
- [ ] Create `client/src/components/subscriptions/SubscriptionChannelRow.tsx` — a single row component accepting `channel: SubscriptionChannel`, `isAdded: boolean`, and `onAdd: () => void` props; renders thumbnail, title, and the Add/Added button
- [ ] Implement client-side search/filter logic in `SubscriptionPicker` using `useMemo` to derive the filtered list from the full subscriptions array and the current search query string
- [ ] Implement the "Add to Profile" action in `SubscriptionPicker`: call `addChannelToProfile(profileId, channel)` from the API client (Phase 3 endpoint), handle optimistic state update with a local `addedChannelIds` set, revert on error
- [ ] Pre-populate `addedChannelIds` on mount from the active profile's existing `channels` array (sourced from the profile context or a prop) to correctly show "Added ✓" state for already-added channels
- [ ] Add skeleton loader component (or reuse existing UI skeleton) for the loading state — display 8–10 placeholder rows matching the channel row height
- [ ] Add distinct error messages: check for `error.code === 'youtube_quota_exceeded'` from the API response and display "YouTube API quota reached. Please try again tomorrow." for that case vs a generic retry message
- [ ] Add the Subscription Picker route to the React Router config (e.g. `/profiles/:profileId/subscriptions`) and link to it from the Profile Editor page (a "Browse Subscriptions" button)
- [ ] Add a "Back to Profile" navigation button/link at the top of the Subscription Picker page
- [ ] Write component tests for `SubscriptionChannelRow` covering: not-added state renders "Add" button, added state renders "Added ✓" disabled, onAdd callback fires on click
- [ ] Write component tests for `SubscriptionPicker` covering: loading skeleton shown, channel list rendered after fetch, search filter works, empty state shown when no results

## Dependencies

- Depends on: S11 (YouTube Subscriptions Endpoint) — `GET /api/subscriptions` must be implemented and returning data
- Depends on: Phase 3 (S8) — `POST /api/profiles/:id/channels` endpoint for adding a channel to a profile
- Depends on: Phase 3 (S9/S10) — Profile Editor page and profile context must exist to link to and from the Subscription Picker, and to provide the active `profileId`

## Out of Scope

- Server-side search or filtering of subscriptions
- Bulk-select and add multiple channels at once (could be a future UX enhancement)
- Removing channels from the picker UI (that lives in the Profile Editor)
- Displaying subscriber counts, video counts, or other extended channel metadata

## Notes

- The `useSubscriptions` hook should only fetch once per picker mount and cache results in local state for the lifetime of the component — no need to refetch on every render.
- The search input should be debounced (e.g. 150 ms) if the subscription list is very large, though client-side filtering should be fast enough at ≤500 channels.
- Thumbnail `<img>` elements must include a meaningful `alt` attribute (the channel title) for accessibility.
- The "Added ✓" disabled state must meet WCAG 2.1 contrast requirements — use a visually distinct but accessible colour for the disabled state.
