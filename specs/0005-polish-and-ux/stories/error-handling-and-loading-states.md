# User Story: Error Handling & Loading States

## Summary

**As an** end user,
**I want** to see clear loading indicators while data is being fetched and friendly, actionable messages when something goes wrong,
**So that** I always understand the state of the application and can recover from failures without confusion or frustration.

## Description

Currently the application makes several async API calls (fetch profiles, fetch feed, fetch subscriptions, mutate profile channels/keywords) without providing the user any visual feedback during loading or a consistent recovery path when calls fail. This story introduces a cohesive feedback layer:

- **Skeleton loaders** replace blank/empty states during initial data fetches so the UI never feels broken.
- **A toast notification system** surfaces transient success and error messages at the edge of the screen without blocking the user.
- **React error boundaries** catch unexpected runtime errors and display a fallback UI rather than a blank white page.
- **Retry logic** on API calls (with exponential back-off for network errors and a manual "Try Again" button for user-triggered retries) reduces permanent failures due to transient issues.

This story covers both the infrastructure (toast provider, error boundary component, retry utility) and the per-component integration across `<VideoFeed>`, `<VideoCard>`, `<ProfileSwitcher>`, `<ProfileEditor>`, and `<SubscriptionPicker>`.

## Acceptance Criteria

- [ ] Given the video feed is loading, when the page first renders, then skeleton card placeholders matching the grid layout are shown instead of an empty grid.
- [ ] Given the profile list is loading, when `<ProfileSwitcher>` mounts, then a skeleton dropdown placeholder is shown until profiles arrive.
- [ ] Given the subscription list is loading, when `<SubscriptionPicker>` mounts, then skeleton list-item placeholders are shown.
- [ ] Given an API call fails (network error or non-2xx response), when the error occurs, then a toast notification appears with a human-readable message and does not block the UI.
- [ ] Given a toast is displayed, when 5 seconds pass without user interaction, then it auto-dismisses.
- [ ] Given a toast is displayed, when the user clicks the dismiss (×) button, then it disappears immediately.
- [ ] Given a transient network failure on the feed or subscriptions endpoint, when the first call fails, then the client automatically retries up to 3 times with exponential back-off before surfacing an error toast.
- [ ] Given all retries are exhausted, when the component enters an error state, then an inline error message with a "Try Again" button is shown in place of the content area.
- [ ] Given the user clicks "Try Again", when the retry fires, then the loading skeleton reappears and the request is re-attempted.
- [ ] Given an uncaught React runtime error inside a major UI section, when the error boundary catches it, then a friendly fallback UI is shown (error message + reload option) rather than a blank page.
- [ ] Given a profile mutation (add channel, remove keyword, etc.) succeeds, when the response resolves, then a success toast ("Channel added", "Keyword removed", etc.) is shown.
- [ ] Given a profile mutation fails, when the response rejects, then an error toast with the reason is shown and the optimistic UI change (if any) is rolled back.

## Tasks

### Infrastructure

- [ ] Install and configure a toast library (e.g. `react-hot-toast` or `sonner`) in `client/` — add `<Toaster>` to `App.tsx` with position `bottom-right` and accessible ARIA roles.
- [ ] Create a `client/src/lib/toast.ts` wrapper that exports typed `toast.success(msg)`, `toast.error(msg)`, `toast.info(msg)` helpers so call sites don't import the library directly.
- [ ] Create a `client/src/lib/apiClient.ts` (or extend the existing services layer) with a generic `fetchWithRetry(url, options, retries = 3)` utility that retries on network errors and 5xx responses with exponential back-off (100 ms × 2^attempt jitter).
- [ ] Create a reusable `<ErrorBoundary>` component (`client/src/components/ui/ErrorBoundary.tsx`) as a React class component that accepts a `fallback` prop and wraps children; default fallback shows an error icon, descriptive message, and a "Reload page" button.
- [ ] Wrap the `<VideoFeed>` section, `<ProfileEditor>` page, and `<SubscriptionPicker>` page each in their own `<ErrorBoundary>` inside `App.tsx` / the relevant page component.

### Skeleton Loader Components

- [ ] Create a base `<Skeleton>` primitive (`client/src/components/ui/Skeleton.tsx`) that renders an animated shimmer placeholder; accept `className` for sizing.
- [ ] Create a `<VideoCardSkeleton>` component (`client/src/components/feed/VideoCardSkeleton.tsx`) that mirrors the `<VideoCard>` layout (16:9 thumbnail block, two text lines, channel avatar circle) using `<Skeleton>` primitives.
- [ ] Create a `<SubscriptionItemSkeleton>` component (`client/src/components/subscriptions/SubscriptionItemSkeleton.tsx`) that mirrors a subscription row (avatar circle + two text lines).
- [ ] Create a `<ProfileSwitcherSkeleton>` component (`client/src/components/profile/ProfileSwitcherSkeleton.tsx`) that renders a rounded rectangle placeholder matching the dropdown width/height.

### VideoFeed Integration

- [ ] Update `<VideoFeed>` to accept `isLoading` and `error` props (or derive from a hook) and render a grid of `<VideoCardSkeleton>` (e.g. 8 cards) when `isLoading` is true.
- [ ] Replace raw `fetch` calls in `useFeed` hook with `fetchWithRetry`; propagate the error state to `<VideoFeed>`.
- [ ] Render an inline error state in `<VideoFeed>` when `error` is set and retries are exhausted: show an error illustration/icon, a message ("Couldn't load videos"), and a "Try Again" button that re-triggers the fetch.
- [ ] Show a skeleton for the next page during infinite-scroll pagination (append skeletons at the bottom of the list while fetching the next page).

### ProfileSwitcher Integration

- [ ] Update `<ProfileSwitcher>` to render `<ProfileSwitcherSkeleton>` while `isLoading` is true.
- [ ] On profile fetch error, show a small inline error message ("Couldn't load profiles") with a retry icon/button.

### ProfileEditor Integration

- [ ] Show a full-page loading skeleton in `<ProfileEditor>` while the profile detail is being fetched (channel list + keyword list skeletons).
- [ ] Wrap each mutation (add channel, remove channel, add keyword, remove keyword) with try/catch; on success fire `toast.success(...)`, on failure fire `toast.error(...)` and revert optimistic state if applicable.
- [ ] Replace raw `fetch` calls in the profile service with `fetchWithRetry`.

### SubscriptionPicker Integration

- [ ] Render a list of `<SubscriptionItemSkeleton>` (10–15 rows) while subscriptions are loading.
- [ ] On subscription fetch failure (after retries), show an inline error state with a "Try Again" button.
- [ ] When adding a channel to a profile succeeds/fails, fire the appropriate toast.

### Error Boundary Wiring

- [ ] Wrap `<Dashboard>` (video feed + profile switcher area) in an `<ErrorBoundary>` with a descriptive fallback.
- [ ] Wrap `<ProfileEditorPage>` in an `<ErrorBoundary>` with a descriptive fallback.
- [ ] Wrap `<SubscriptionPickerPage>` in an `<ErrorBoundary>` with a descriptive fallback.
- [ ] Verify error boundaries render correctly by intentionally throwing inside a component in development (remove after testing).

### Testing & Verification

- [ ] Write unit tests for `fetchWithRetry` — verify retry count, back-off delays (mock timers), and that it resolves on eventual success.
- [ ] Write unit tests for `<ErrorBoundary>` — verify fallback renders when a child throws.
- [ ] Write unit tests for `<VideoCardSkeleton>` and `<Skeleton>` — verify shimmer class is applied.
- [ ] Manually test: throttle the network in browser devtools to "Slow 3G" and verify all skeletons appear, then verify toasts appear when endpoints are set to return 500 errors.

## Dependencies

- Depends on: S14 (Video feed frontend) — `<VideoFeed>`, `<VideoCard>`, `useFeed` hook must exist.
- Depends on: S12 (Subscription picker frontend) — `<SubscriptionPicker>` must exist.
- Depends on: S9/S10 (Profile management frontend + switcher) — `<ProfileEditor>`, `<ProfileSwitcher>` must exist.
- Depends on: S13 (Feed endpoint) — feed API must be operational for end-to-end testing.

## Out of Scope

- Persistent error logging / remote crash reporting (e.g. Sentry) — future enhancement.
- Offline / service-worker support — future enhancement.
- Animated toast stacking (multiple toasts queued) — basic single-toast implementation is sufficient.
- Back-end retry logic — server-side retries to the YouTube API are a separate concern.

## Notes

- Use CSS `@keyframes` shimmer animation for the `<Skeleton>` primitive (background gradient sweep) — no additional animation library needed.
- `fetchWithRetry` should NOT retry on 4xx responses (client errors) — those are deterministic failures that retrying will not fix. Only retry on network errors and 5xx.
- For optimistic updates on profile mutations, keep a local copy of the pre-mutation state and restore it on error before firing the error toast.
- The `<ErrorBoundary>` component must be a class component because React's `componentDidCatch` / `getDerivedStateFromError` APIs are not yet available as hooks.
