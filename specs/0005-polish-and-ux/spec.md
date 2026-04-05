# Feature: Polish & UX

## Overview

Phase 5 of Focused Tube brings the application to production quality by adding comprehensive error handling, loading feedback, and a fully responsive layout. It ensures that every user — whether on a phone, tablet, or desktop — experiences clear visual feedback during data loading, graceful recovery from failures, and a comfortable, touch-friendly interface. This phase has no new backend endpoints; it is entirely focused on frontend polish and resilience.

## Problem Statement

The core features of Focused Tube (auth, profiles, feed, subscriptions) are functionally complete after Phases 1–4, but the user experience has gaps that would make the application feel unfinished or unreliable in production:

1. **No loading feedback** — API calls leave the UI blank or frozen while data is in flight, making the app appear broken.
2. **No error recovery** — Failed API calls surface as silent failures or unhandled promise rejections; users have no way to retry.
3. **No error boundaries** — An uncaught React error in one section crashes the entire page to a blank white screen.
4. **Desktop-only layout** — The video grid and profile management screens overflow or become unusable on mobile and tablet viewports.

This phase closes all four gaps so the application is ready for real users across all devices.

## Goals

- [ ] Implement skeleton loaders for all major data-loading surfaces (video feed, profile switcher, subscription picker, profile editor).
- [ ] Implement a global toast notification system for transient success and error feedback.
- [ ] Add retry logic (automatic + manual) to all API calls so transient failures are handled gracefully.
- [ ] Add React error boundaries around major UI sections to prevent full-page crashes.
- [ ] Make every page fully responsive across mobile (320 px+), tablet (768 px+), and desktop (1024 px+) viewports.
- [ ] Ensure all interactive elements meet the WCAG 2.1 minimum 44 × 44 px touch target size.

## Non-Goals

- No new backend API endpoints are added in this phase.
- Remote error/crash reporting (e.g. Sentry integration) is out of scope.
- Offline / PWA / service-worker support is out of scope.
- Dark mode theming is out of scope.
- Native mobile app (React Native / Capacitor) is out of scope.
- Video player embed (watch inline) is out of scope — covered in future phases.
- Server-side retry logic for YouTube API calls is out of scope.

## Target Users / Personas

| Persona | Description |
|---|---|
| End User | A YouTube viewer using Focused Tube on various devices (phone, tablet, desktop) who expects a smooth, responsive experience with clear feedback during loading and errors. They are non-technical and interpret a blank screen or missing content as the app being broken. |
| Developer | The developer(s) maintaining Focused Tube who need consistent, centralized patterns for error handling (toast helper, `fetchWithRetry`, `<ErrorBoundary>`) so new features can adopt them without reinventing the wheel. |

## Functional Requirements

1. The system shall display animated skeleton placeholder components in every content area while its data is being fetched.
2. The system shall automatically retry failed API calls (network errors and 5xx responses) up to 3 times with exponential back-off before surfacing an error state.
3. The system shall display a toast notification on every API call success or failure that results from a user-initiated mutation (add channel, remove channel, add keyword, remove keyword).
4. The system shall display an inline error state with a "Try Again" button when all retries for a feed or list fetch are exhausted.
5. The system shall catch uncaught React runtime errors via error boundaries and render a friendly fallback UI instead of a blank page.
6. The system shall render the video grid in 1 column on mobile, 2 columns on tablet, 3 columns on small desktop, and 4 columns on large desktop.
7. The system shall not produce horizontal overflow on any viewport width ≥ 320 px.
8. The system shall render all interactive elements with a minimum tap target of 44 × 44 px.
9. The system shall auto-dismiss toast notifications after 5 seconds and allow immediate manual dismissal.
10. The system shall revert optimistic UI updates and show an error toast when a profile mutation fails.

## Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Skeleton loaders must render synchronously (no async delay) so there is zero blank-screen time during navigation. |
| Performance | The shimmer animation must use CSS `transform` / `background-position` to avoid layout recalculation (no JS animation loops). |
| Accessibility | All skeleton placeholders must include `aria-busy="true"` or equivalent ARIA live region announcements so screen readers understand content is loading. |
| Accessibility | Toast notifications must use `role="status"` (success/info) or `role="alert"` (error) so screen readers announce them. |
| Accessibility | All interactive elements must have a visible `focus-visible` ring for keyboard navigation. |
| Accessibility | Touch targets must be ≥ 44 × 44 px per WCAG 2.1 Success Criterion 2.5.5. |
| Scalability | `fetchWithRetry` must be a generic utility usable by any future API call, not tied to specific endpoints. |
| Maintainability | Toast calls must go through a typed wrapper (`lib/toast.ts`) so the underlying library can be swapped without touching call sites. |

## UX / Design Considerations

- **Skeleton loaders**: Use a left-to-right gradient shimmer animation (light grey → lighter grey → light grey). Skeletons should exactly mirror the shape and dimensions of the content they replace to prevent layout shift when data arrives.
- **Toast notifications**: Appear at the bottom-right corner on desktop; bottom-center on mobile (full-width). Use green for success, red for error, blue for info. Stack up to 3 toasts before collapsing older ones.
- **Inline error states**: When a data fetch fails permanently, show an error icon + short message + "Try Again" button centered in the content area. Do not show both an inline error AND a toast for the same failure — the toast is for mutations, inline state is for data fetches.
- **Error boundaries**: The fallback UI should include the Focused Tube logo/name, a neutral error illustration (or emoji), a plain-English message ("Something went wrong in this section"), and a "Reload" button that calls `window.location.reload()`.
- **Key responsive flows**:
  - Mobile Dashboard: Single-column feed, compact header with profile switcher dropdown full-width below the logo.
  - Mobile Profile Editor: Vertical stack — profile name at top, channels list, then keywords section.
  - Mobile Subscription Picker: Full-width sticky search bar, scrollable list below, each row with large tap target.

## Technical Considerations

- **Toast library**: Use `react-hot-toast` (lightweight, zero dependencies, built-in ARIA support) or `sonner` (Radix-based). Add a `client/src/lib/toast.ts` abstraction layer regardless of which library is chosen.
- **`fetchWithRetry`**: Implement as a wrapper around the native `fetch` API. Accept the same signature as `fetch` plus a `maxRetries` option. Retry only on `TypeError` (network error) or response status ≥ 500. Use `delay = 100 * 2^attempt + Math.random() * 100` ms back-off.
- **Error boundaries**: Must be class components (React limitation). Place one around each major page section, not globally, so a failure in the feed doesn't prevent the profile switcher from working.
- **CSS approach**: The project uses Tailwind CSS (per `initia_plan.md` file structure). Use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`) with a mobile-first authoring approach. Avoid inline styles for responsive rules.
- **Touch targets**: Expand hit areas using padding rather than changing visible element size. Utility class `p-2` (8 px padding) on a 28 px icon gives a 44 px target.
- **Skeleton shimmer**: Use a `@keyframes shimmer` animation with `background: linear-gradient(90deg, ...)` and `background-size: 200%` animating `background-position`. Define once in `globals.css` and reference via a `animate-shimmer` Tailwind custom utility.

## Dependencies

| Dependency | Type | Notes |
|---|---|---|
| Phase 1–4 completion (S1–S14) | Internal | All frontend components (`<VideoFeed>`, `<ProfileEditor>`, `<SubscriptionPicker>`, `<ProfileSwitcher>`) must exist and be functional before this phase begins. |
| `react-hot-toast` or `sonner` | External (npm) | Toast notification library. Evaluate bundle size; either is < 5 KB gzipped. |
| Tailwind CSS | Internal (already in project) | Responsive grid utilities and breakpoint config. |
| React 18 | Internal (already in project) | Error boundaries use class component APIs stable since React 16.2. |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Skeleton layout doesn't match real content, causing layout shift (CLS) | Med | Med | Build skeleton components to exactly mirror the real component structure and measure with Lighthouse CLS metric. |
| `fetchWithRetry` masks real 4xx errors by retrying | Med | High | Explicitly check `response.status < 500` to skip retries on client errors (400, 401, 403, 404). |
| Overly aggressive toasts annoy users (too many notifications) | Med | Med | Only toast user-initiated mutations; never toast background polling or read operations. |
| Mobile layout regressions introduced by responsive changes | Med | Med | Test all breakpoints in devtools after every layout change; add breakpoint smoke tests. |
| Error boundary catches errors that should propagate (e.g. auth redirect) | Low | High | Don't place an error boundary above the auth routing logic; scope boundaries to content sections only. |
| Third-party toast library API changes | Low | Low | The `lib/toast.ts` wrapper isolates the app from library changes. |

## Success Metrics

- Metric 1: Lighthouse mobile performance score ≥ 80 on the Dashboard page (CLS < 0.1, no layout shift from skeleton → content).
- Metric 2: Lighthouse accessibility score ≥ 90 (no tap-target or ARIA violations).
- Metric 3: Zero blank-screen crashes in manual testing — every uncaught error is caught by an error boundary.
- Metric 4: All five key pages (Login, Dashboard, Profile Editor, Subscription Picker, and the error boundary fallback) render correctly without horizontal overflow at 320 px viewport width.
- Metric 5: All interactive elements pass a manual 44 × 44 px tap target audit using browser devtools.

## Open Questions

- [ ] Should the toast position on mobile be bottom-center (full-width) or bottom-right (same as desktop)? Decide based on visual testing.
- [ ] Should `fetchWithRetry` retry on 429 (rate limit) responses with a longer delay, or surface an error immediately? YouTube API quota errors will return 403, not 429 — clarify expected error codes from YouTube Data API v3.
- [ ] Is a Storybook setup in scope for documenting skeleton and error boundary components, or is inline documentation sufficient?
- [ ] Should the error boundary "Reload" button reload the whole page (`window.location.reload()`) or only attempt to re-render the boundary's subtree (via a state reset pattern)?

## User Stories

| Story | File |
|---|---|
| Error Handling & Loading States (S15) | [stories/error-handling-and-loading-states.md](stories/error-handling-and-loading-states.md) |
| Responsive Design (S16) | [stories/responsive-design.md](stories/responsive-design.md) |
