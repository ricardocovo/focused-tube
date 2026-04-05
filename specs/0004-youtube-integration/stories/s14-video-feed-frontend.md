# User Story: S14 — Video Feed Frontend

## Summary

**As a** Focused Tube end user,
**I want** the Dashboard to show a scrollable grid of video cards sourced from my active profile's channels and keywords,
**So that** I can browse, discover, and watch curated videos without leaving the app.

## Description

The video feed is the primary content surface of Focused Tube. When a user selects a profile on the Dashboard, the `<VideoFeed>` component fetches the first page of videos from `GET /api/feed/:profileId`, renders them as a responsive grid of `<VideoCard>` tiles, and automatically loads more as the user scrolls to the bottom (infinite scroll via `IntersectionObserver`). Each card displays a thumbnail, title, channel name, relative publish date, and a coloured source badge. Clicking a card opens the video on YouTube. An empty state is shown when the profile has no channels or keywords, and meaningful loading and error states are provided throughout.

## Acceptance Criteria

- [ ] Given the user is on the Dashboard with an active profile selected, when the page loads, then `GET /api/feed/:profileId` is called and the resulting videos are rendered as a grid of `<VideoCard>` components.
- [ ] Given the feed is loading, when the API call is in flight, then a skeleton grid of placeholder cards is displayed matching the layout of real cards.
- [ ] Given the feed has loaded, when the user scrolls to within 200 px of the bottom of the feed, then the next page of results is automatically fetched (using the `nextPageToken` from the previous response) and appended to the grid without a full reload.
- [ ] Given there are no more pages (no `nextPageToken` in the last response), when the user scrolls to the bottom, then no additional fetch is triggered and a "You're all caught up!" message appears at the bottom.
- [ ] Given a video in the feed has `source: "subscription"`, when the `<VideoCard>` renders, then a blue "From Subscription" badge is visible on the card.
- [ ] Given a video in the feed has `source: "search"`, when the `<VideoCard>` renders, then a purple "From Search" badge is visible on the card.
- [ ] Given the user clicks a video card, when the click event fires, then `https://www.youtube.com/watch?v={videoId}` opens in a new browser tab.
- [ ] Given the active profile has no channels and no keywords, when the feed loads (with an empty response), then an empty-state illustration and the message "Add channels or keywords to your profile to see videos here." is displayed, with a CTA button linking to the Profile Editor.
- [ ] Given the feed API call returns an error, when the error state is active, then a descriptive error message is shown along with a "Retry" button that re-fetches the current page.
- [ ] Given the user switches the active profile using the `<ProfileSwitcher>`, when the new profile is selected, then the feed is cleared and a fresh fetch begins for the new `profileId`.
- [ ] Given the `?source` filter tab is toggled to "Subscriptions" or "Search", when the tab is active, then the feed is re-fetched with the corresponding `?source` query parameter.

## Tasks

- [ ] Create `client/src/types/feed.ts` with the `FeedVideo` interface (`videoId`, `title`, `channelId`, `channelTitle`, `thumbnailUrl`, `publishedAt`, `source: 'subscription' | 'search'`) and `FeedResponse` interface (`videos: FeedVideo[]`, `nextPageToken?: string`)
- [ ] Add `fetchFeed(profileId: string, params?: { source?: string, pageToken?: string }): Promise<FeedResponse>` to the API client (`client/src/services/api.ts`)
- [ ] Implement `client/src/hooks/useFeed.ts` — a custom hook that accepts `profileId` and optional `source` filter, manages `videos: FeedVideo[]`, `isLoading`, `isFetchingMore`, `error`, and `nextPageToken` state, exposes `loadMore()` and `reset()` functions, and appends new pages to the `videos` array without duplication
- [ ] Ensure `useFeed` resets its state and re-fetches when `profileId` or `source` changes (use `useEffect` with appropriate dependencies)
- [ ] Create `client/src/components/feed/VideoCard.tsx` — accepts a `FeedVideo` prop, renders a 16:9 thumbnail `<img>` (with `alt={title}`), 2-line-clamped title, channel name, relative time (e.g. "3 days ago" using `date-fns` or a lightweight alternative), and source badge; wraps in an `<a>` tag pointing to the YouTube URL with `target="_blank" rel="noopener noreferrer"`
- [ ] Create source badge sub-component (or inline style) in `VideoCard` — blue pill for `"subscription"` with `aria-label="From Subscription"`, purple pill for `"search"` with `aria-label="From Search"`
- [ ] Create `client/src/components/feed/VideoCardSkeleton.tsx` — a placeholder card matching the visual dimensions of `VideoCard`, using a shimmer/pulse animation for the loading state
- [ ] Create `client/src/components/feed/VideoFeed.tsx` — the container component that uses `useFeed`, renders the responsive CSS grid of `VideoCard` components, inserts `VideoCardSkeleton` tiles during initial load and appended-page loads, renders the empty state when `videos.length === 0 && !isLoading`, and renders the "You're all caught up!" footer when there is no `nextPageToken`
- [ ] Implement `IntersectionObserver` in `VideoFeed` to watch a sentinel `<div>` rendered after the last card; when it enters the viewport and `!isFetchingMore && nextPageToken` is truthy, call `loadMore()`
- [ ] Add a guard in the `IntersectionObserver` callback to prevent duplicate fetches: check `isFetchingMore` state before calling `loadMore()`
- [ ] Create `client/src/components/feed/FeedSourceTabs.tsx` — a tab/toggle component with options "All", "Subscriptions", "Search" that calls a parent `onSourceChange(source?: string)` callback; highlight the active tab
- [ ] Integrate `FeedSourceTabs` and `VideoFeed` into the Dashboard page (`client/src/pages/Dashboard.tsx`), passing the active profile ID and selected source filter down; re-fetch when either changes
- [ ] Add the empty-state component (inline or separate) to `VideoFeed` with an illustration placeholder (SVG or emoji) and a "Go to Profile Editor" `<Link>` using React Router
- [ ] Add error state to `VideoFeed` with a descriptive message and a "Retry" button that calls `reset()` from `useFeed` followed by re-mount / re-fetch
- [ ] Install `date-fns` (or verify it is already a dependency) and use `formatDistanceToNow` for relative timestamps on `VideoCard`
- [ ] Make the video grid responsive: use CSS Grid with `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))` or equivalent Tailwind classes so it adapts from 1 column on mobile to 4 columns on wide screens
- [ ] Write component tests for `VideoCard` covering: renders thumbnail with correct alt, renders title, renders channel name, renders correct badge colour and aria-label for each source value, href points to correct YouTube URL
- [ ] Write component tests for `VideoFeed` covering: skeleton shown during loading, cards rendered after load, empty state shown when videos array is empty, "all caught up" footer shown when no nextPageToken
- [ ] Write hook tests for `useFeed` covering: initial fetch called on mount, `loadMore` appends videos, reset clears state and re-fetches, source change triggers reset and re-fetch

## Dependencies

- Depends on: S13 (Feed Endpoint) — `GET /api/feed/:profileId` must be implemented and returning correctly structured data
- Depends on: Phase 3 (S10) — `<ProfileSwitcher>` and active profile context must exist on the Dashboard so `profileId` can be passed to `VideoFeed`
- Depends on: Phase 2 (S6) — Auth context must be in place so the API client sends the JWT with requests

## Out of Scope

- Inline video player / embed (future phase)
- Saving or bookmarking videos
- Like / dislike / comment actions
- Notifications for new videos
- Advanced filtering beyond source type (e.g. filter by channel within the feed)

## Notes

- `date-fns` is preferred over `moment.js` for its tree-shaking and smaller bundle size. If the project has neither, add `date-fns`.
- The `IntersectionObserver` sentinel element should have a small `height` (e.g. `1px`) and be positioned after the last card row to ensure it only triggers when the user has truly scrolled to the bottom.
- Thumbnail images should use `loading="lazy"` to avoid loading off-screen images on initial render.
- The "You're all caught up!" message should only appear after at least one successful page load — not on the initial loading state — to avoid a flash of the message before data arrives.
- Consider memoising `VideoCard` with `React.memo` to prevent unnecessary re-renders when the parent `VideoFeed` state updates during `loadMore`.
