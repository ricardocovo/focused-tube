# Feature: YouTube Integration & Video Feed

## Overview

Phase 4 of Focused Tube connects the application to the YouTube Data API v3, enabling users to browse their YouTube subscriptions and import channels directly into their curated profiles. It also delivers the core video consumption experience: a combined feed endpoint that merges subscription-based uploads and keyword-search results into a single deduplicated, date-sorted stream, surfaced in the frontend as an infinite-scroll video grid with source badges.

## Problem Statement

Focused Tube's profiles are only useful if they can be populated with real YouTube channels and can actually surface videos. Without this phase, users have no way to discover which channels they already subscribe to on YouTube, no mechanism to pull that data into a profile, and no video feed to consume. Phase 4 is the bridge between the data model built in Phase 3 and the end-user value proposition of the whole product.

## Goals

- [ ] Expose a backend endpoint that fetches the authenticated user's YouTube subscriptions via the YouTube Data API v3
- [ ] Build a searchable subscription picker UI where users can browse subscriptions and add channels to the active profile
- [ ] Implement a combined feed endpoint that merges per-channel recent-upload results and per-keyword search results, deduplicates by video ID, and sorts by publish date
- [ ] Deliver a video feed frontend with an infinite-scroll grid, source badges, `<VideoCard>` components, and click-to-watch behaviour
- [ ] Keep YouTube API quota consumption as low as possible through batching and forward-compatible service-layer design

## Non-Goals

- Redis or in-memory caching of YouTube API responses (flagged as a future enhancement in the plan)
- Inline video player / embed (future phase)
- Client-side filtering of subscription feed by keywords (optional stretch; not required)
- Push notifications or new-video alerts
- Profile sharing
- Pagination UI for the subscriptions list beyond client-side search/filter

## Target Users / Personas

| Persona | Description |
|---|---|
| End User | A YouTube viewer who wants to browse their existing subscriptions, add channels to a focused profile, and consume a curated combined video feed tailored to their interests |
| Developer | The engineer(s) building and maintaining Focused Tube who need clean, well-typed service and route layers that are easy to extend with caching later |

## Functional Requirements

1. The system shall provide a `GET /api/subscriptions` endpoint, protected by JWT auth middleware, that calls the YouTube Data API v3 subscriptions resource using the authenticated user's (potentially refreshed) Google access token and returns an array of channels with `youtubeChannelId`, `title`, `description`, and `thumbnailUrl`.
2. The system shall handle Google access token expiry transparently — refreshing via the stored refresh token before calling the YouTube API.
3. The system shall provide a `GET /api/feed/:profileId` endpoint that fetches recent videos for every channel stored on the profile and for every keyword stored on the profile, then merges, deduplicates by `videoId`, and sorts the combined list by `publishedAt` descending.
4. The feed endpoint shall support an optional `?source=subscriptions` query parameter to return only channel-based results, and `?source=search` to return only keyword-based results.
5. Each video item in the feed response shall include a `source` field with value `"subscription"` or `"search"`.
6. The feed endpoint shall validate that the requesting user owns the requested `profileId` and return 403 if they do not.
7. The system shall provide a `<SubscriptionPicker>` React component that loads the user's YouTube subscriptions, supports client-side text search/filter, and allows adding individual channels to the currently active profile via the `POST /api/profiles/:id/channels` endpoint (Phase 3).
8. The system shall provide a `<VideoFeed>` React component that fetches the feed for the active profile and renders videos in a responsive grid with infinite scroll (load-more on scroll-to-bottom).
9. The system shall provide a `<VideoCard>` component rendering video thumbnail, title, channel name, relative publish date, and a coloured source badge labelled "From Subscription" or "From Search".
10. Clicking a video card shall open the video on YouTube in a new tab (using `https://www.youtube.com/watch?v={videoId}`).
11. The subscription picker shall visually indicate channels already added to the active profile (e.g. a disabled or checked state on the add button).
12. The frontend shall expose a `useFeed` custom hook encapsulating feed-fetch logic, pagination state, and loading/error states.
13. The frontend shall expose a `useSubscriptions` custom hook encapsulating subscriptions-fetch logic and loading/error states.

## Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Subscription list must load within 3 s on a standard broadband connection. Feed initial page must render within 4 s. |
| Quota Awareness | Each `search.list` call costs 100 YouTube API quota units. The feed endpoint must not issue more calls than `(channels.length + keywords.length)` per request. Avoid redundant calls on re-renders. |
| Security | `GET /api/subscriptions` and `GET /api/feed/:profileId` must reject unauthenticated requests with HTTP 401. Feed endpoint must enforce profile ownership (HTTP 403 on mismatch). |
| Scalability | The YouTube service layer must be structured to allow a caching decorator to be dropped in without changing route or controller code. |
| Type Safety | All YouTube API response shapes, internal DTOs, and React component props must be fully typed in TypeScript (no `any`). |
| Accessibility | Source badges must include `aria-label` text. Video card thumbnails must include descriptive `alt` text. Infinite scroll must support keyboard-triggered load-more as a fallback. |
| Error Handling | API quota exhaustion (HTTP 403 from YouTube with `quotaExceeded` reason) must surface a user-friendly message, not a generic error. |

## UX / Design Considerations

- **Subscription Picker page**: Full-page or modal view accessed from the Profile Editor. Displays a grid/list of subscription channel cards (thumbnail + title). A search input at the top filters the list client-side. Each card has an "Add to Profile" button; if already added the button becomes "Added ✓" and is disabled. A back/close action returns to the Profile Editor.
- **Dashboard feed**: Below the `<ProfileSwitcher>`, a masonry or fixed-column responsive grid of `<VideoCard>` tiles loads on profile selection. A loading skeleton is shown while fetching. When the user scrolls near the bottom, the next page of results is appended seamlessly.
- **VideoCard**: Fixed-ratio (16:9) thumbnail image, video title (2-line clamp), channel name, time-ago relative date (e.g. "3 days ago"), and a coloured pill badge — blue for "From Subscription", purple for "From Search".
- **Source filter tabs**: Optional tab/toggle on the Dashboard to show All / Subscriptions / Search results (maps to the `?source` query parameter).
- **Empty state**: When a profile has no channels and no keywords, the feed area shows an illustration and a CTA: "Add channels or keywords to your profile to see videos here."

## Technical Considerations

- **`googleapis` npm package**: Use `google.youtube('v3')` from the `googleapis` package on the server. The YouTube client is instantiated with an `OAuth2Client` whose credentials are set from the user's stored (decrypted) `accessToken` / `refreshToken` before each call.
- **Token refresh**: Call `oauth2Client.refreshAccessToken()` when the access token is expired (catch 401 from YouTube API). Persist the new `accessToken` back to the DB.
- **YouTube service layer** (`server/src/services/youtube.ts`): Export pure async functions `getSubscriptions(userId)` and `getFeedForProfile(profileId, source?)` that the route handlers call. This isolates the API-call logic and makes it easy to add caching.
- **Pagination for subscriptions**: The YouTube subscriptions API returns up to 50 items per page. Implement automatic page-through (follow `nextPageToken`) to retrieve all subscriptions, up to a reasonable cap (e.g. 500 channels).
- **Feed pagination**: Use `pageToken` from YouTube `search.list` to support cursor-based pagination on the feed endpoint. The client sends `?pageToken=<token>` on subsequent requests.
- **Deduplication**: Use a `Map<videoId, VideoItem>` during feed assembly; if a video appears in both subscription and search results, keep `source: "subscription"` as the canonical value.
- **Parallel fetching**: Use `Promise.all` to fan out `search.list` calls for channels and keywords simultaneously, then merge results.
- **Frontend API client** (`client/src/services/api.ts`): Add `fetchSubscriptions()` and `fetchFeed(profileId, params)` functions that call the backend and return typed responses.
- **Infinite scroll**: Use an `IntersectionObserver` on a sentinel `<div>` at the bottom of the feed grid to trigger the next page fetch.
- **React Query / SWR (optional)**: If the project already uses a data-fetching library, use it for caching and deduplication of feed requests. Otherwise implement with `useEffect` + `useState` in the custom hooks.

## Dependencies

| Dependency | Type | Notes |
|---|---|---|
| Phase 2: Authentication | Internal | JWT auth middleware, Google OAuth tokens stored on User model, token refresh logic must be in place |
| Phase 3: Profile Management | Internal | `ProfileChannel` and `ProfileKeyword` records must exist; `POST /api/profiles/:id/channels` endpoint used by Subscription Picker |
| `googleapis` npm package | External | YouTube Data API v3 client for Node.js |
| YouTube Data API v3 | External | Requires a Google Cloud project with the API enabled and an API key / OAuth credentials |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| YouTube API quota exhaustion (10 000 units/day) during development or for power users | Med | High | Log quota-sensitive calls; add quota-exhaustion-specific error handling; design service layer for caching; document quota costs in code comments |
| Google access token expiry mid-request | High | Med | Wrap all YouTube API calls in a token-refresh retry handler; persist refreshed token to DB immediately |
| Users with very large subscription counts (500+) causing slow load | Low | Med | Cap subscription fetch at 500; show count indicator; document limit in UI |
| YouTube API shape changes breaking TypeScript types | Low | Med | Pin `googleapis` package version; use explicit typed wrappers rather than raw API response types |
| CORS / cookie issues when the frontend calls the new feed endpoints | Low | Med | Reuse existing CORS config from Phase 2; test end-to-end in dev early |
| Infinite scroll causing runaway API calls on fast scroll | Med | Med | Debounce / gate the `IntersectionObserver` callback with an `isFetching` flag |

## Success Metrics

- Metric 1: A user with >0 YouTube subscriptions can see their subscription list rendered in the Subscription Picker within 3 seconds of opening it.
- Metric 2: A user can add a channel from the Subscription Picker to a profile and immediately see it reflected in the Profile Editor without a full page reload.
- Metric 3: The `GET /api/feed/:profileId` endpoint returns a non-empty, correctly structured response for a profile with at least one channel and one keyword.
- Metric 4: The Dashboard video grid renders the first page of results and successfully loads additional pages on scroll without duplicate videos appearing.
- Metric 5: No TypeScript compiler errors (`tsc --noEmit`) across client and server after Phase 4 implementation.
- Metric 6: A profile with no channels and no keywords shows the empty-state CTA on the Dashboard instead of an error.

## Open Questions

- [ ] Should the feed endpoint return a fixed page size (e.g. 20 videos) or make that configurable via a `?limit` query param? Using a configurable limit is more flexible but adds implementation surface.
- [ ] Should the Subscription Picker be a dedicated page or a modal/drawer overlaying the Profile Editor? The plan mentions a page but a modal may be better UX.
- [ ] Should the feed deduplicate across pages (global seen-set) or only within a single page response? Cross-page deduplication requires server-side state or cursor tokens.
- [ ] Is there a maximum number of channels + keywords per profile we should enforce to keep feed-endpoint quota usage bounded?

## User Stories

| Story | File |
|---|---|
| S11: YouTube Subscriptions Endpoint | [stories/s11-youtube-subscriptions-endpoint.md](stories/s11-youtube-subscriptions-endpoint.md) |
| S12: Subscription Picker Frontend | [stories/s12-subscription-picker-frontend.md](stories/s12-subscription-picker-frontend.md) |
| S13: Feed Endpoint | [stories/s13-feed-endpoint.md](stories/s13-feed-endpoint.md) |
| S14: Video Feed Frontend | [stories/s14-video-feed-frontend.md](stories/s14-video-feed-frontend.md) |
