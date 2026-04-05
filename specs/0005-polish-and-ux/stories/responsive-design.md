# User Story: Responsive Design

## Summary

**As an** end user,
**I want** Focused Tube to look great and be easy to use on my phone, tablet, and desktop,
**So that** I can browse my curated video feed comfortably regardless of the device I am on.

## Description

The application was initially built with a desktop-first layout. This story makes every screen fully responsive by applying a mobile-first CSS approach (using Tailwind CSS breakpoint utilities or CSS Grid/Flexbox media queries, consistent with the existing styling approach). Key concerns are:

- The **video grid** should reflow from 1 column (phone) → 2 columns (tablet) → 3–4 columns (desktop).
- The **navigation / profile switcher** should collapse gracefully on small screens (hamburger or bottom-bar pattern).
- The **profile editor** (channel list + keyword manager) should stack vertically on mobile instead of using side-by-side panels.
- The **subscription picker** should scroll efficiently on touch devices and use a full-width search bar.
- Interactive targets (buttons, tags, channel rows) must meet the WCAG 2.1 minimum touch target size of 44 × 44 px.
- No horizontal overflow ("scroll jail") on any viewport width ≥ 320 px.

## Acceptance Criteria

- [ ] Given a viewport width of 320–639 px (mobile), when the dashboard renders, then the video grid shows 1 column.
- [ ] Given a viewport width of 640–1023 px (tablet), when the dashboard renders, then the video grid shows 2 columns.
- [ ] Given a viewport width of 1024–1279 px (small desktop), when the dashboard renders, then the video grid shows 3 columns.
- [ ] Given a viewport width ≥ 1280 px (large desktop), when the dashboard renders, then the video grid shows 4 columns.
- [ ] Given any viewport width ≥ 320 px, when the page loads, then no element causes horizontal overflow or a horizontal scrollbar.
- [ ] Given a mobile viewport, when the user opens the profile switcher, then it renders as a full-width dropdown or bottom sheet that is easy to tap.
- [ ] Given a mobile viewport, when the user navigates to the profile editor, then the channel list and keyword manager are stacked vertically and fully usable with touch.
- [ ] Given a mobile viewport, when the user opens the subscription picker, then the search bar spans the full width and each subscription row has a tap target of at least 44 × 44 px.
- [ ] Given any viewport, when interactive elements (buttons, keyword tags, remove icons) are measured, then each has a minimum tap/click target area of 44 × 44 px.
- [ ] Given a tablet or mobile viewport, when the main navigation / header is shown, then it does not overlap or obscure page content.
- [ ] Given a mobile viewport, when the user scrolls the video feed with infinite scroll, then new cards load smoothly without layout jank.
- [ ] Given a mobile viewport, when `<VideoCard>` renders, then the thumbnail maintains its 16:9 aspect ratio and the text does not overflow the card.

## Tasks

### Audit & Setup

- [ ] Audit all existing page components (`Dashboard`, `ProfileEditorPage`, `SubscriptionPickerPage`, `LoginPage`) for fixed widths, hard-coded pixel values, and overflow issues at 320 px viewport width using browser devtools.
- [ ] Confirm Tailwind CSS breakpoint config (`sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`) or add custom breakpoints to `tailwind.config.ts` if needed; document the breakpoint strategy in a comment at the top of `tailwind.config.ts`.
- [ ] Add a `<meta name="viewport" content="width=device-width, initial-scale=1">` tag to `client/index.html` if not already present.

### Video Grid — Responsive Columns

- [ ] Refactor the video grid container in `<VideoFeed>` to use CSS Grid with responsive column counts: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` (Tailwind) or equivalent media-query CSS.
- [ ] Ensure `<VideoCardSkeleton>` uses the same grid classes so the skeleton layout matches the real grid at every breakpoint.
- [ ] Verify `<VideoCard>` thumbnail uses `aspect-video` (16:9) so cards don't collapse or stretch on narrow screens.
- [ ] Test infinite scroll on a simulated mobile viewport to confirm the `IntersectionObserver` sentinel element is not hidden or clipped.

### Header & Navigation

- [ ] Refactor the top navigation bar / header component to use a `flex-wrap` or responsive flex layout that keeps the app logo, profile switcher, and user avatar from overflowing on small screens.
- [ ] On viewports < 640 px, collapse the profile switcher label text if necessary, showing only the active profile name (truncated with `text-ellipsis`) and a chevron icon.
- [ ] Ensure the user avatar / logout button remains accessible on mobile (not hidden behind overflow).
- [ ] Add `min-h-[44px]` and `min-w-[44px]` to all header interactive elements.

### ProfileSwitcher — Mobile Layout

- [ ] Update `<ProfileSwitcher>` dropdown to use `w-full` on mobile so it does not clip or overflow the viewport.
- [ ] Ensure each profile option row has adequate padding for a 44 px touch target.
- [ ] On mobile, position the dropdown below the trigger button using `top-full` so it doesn't go off-screen.

### ProfileEditor — Responsive Stacking

- [ ] Refactor the `<ProfileEditor>` layout: on desktop keep a two-panel layout (channels left, keywords right) using `md:grid md:grid-cols-2 md:gap-6`; on mobile stack them vertically (`flex flex-col gap-6`).
- [ ] Ensure each channel row has a minimum height of 44 px and the remove button (×) has a 44 × 44 px tap target.
- [ ] Ensure `<KeywordManager>` tag chips have adequate padding and the remove icon on each chip is at least 24 × 24 px (with extra invisible hit-area padding to reach 44 px where space allows).
- [ ] Ensure the "Add keyword" input field is full-width on mobile.
- [ ] Test the profile editor at 320 px width — verify no content overflows and all actions are reachable without zooming.

### SubscriptionPicker — Mobile Layout

- [ ] Make the search bar in `<SubscriptionPicker>` full-width on all viewports using `w-full`.
- [ ] Ensure each subscription row (avatar + channel name + "Add" button) is at least 44 px tall with comfortable padding.
- [ ] On mobile, ensure the "Add to Profile" button on each row has a minimum 44 × 44 px tap target (consider making the entire row tappable or using an icon button with adequate padding).
- [ ] Use `-webkit-overflow-scrolling: touch` (or `overflow-y: auto` with Tailwind `overscroll-contain`) on the subscription list container to enable smooth momentum scrolling on iOS.
- [ ] Ensure the sticky/fixed search bar does not obscure list items (add correct top padding/offset to the scrollable list).

### General Touch & Spacing

- [ ] Audit all `<button>` and `<a>` elements across all components — add `min-h-[44px] min-w-[44px]` or equivalent padding where the target is smaller.
- [ ] Replace any `hover:` only interactive styles with combined `hover:focus:` styles so keyboard and touch users also get visual feedback.
- [ ] Add `focus-visible:ring` outlines to all interactive elements for keyboard accessibility (consistent ring color from design tokens).
- [ ] Verify no `position: fixed` or `position: sticky` elements cause content to be hidden under them on mobile (check header height offset on scrollable containers).

### VideoCard — Mobile Polish

- [ ] Constrain `<VideoCard>` text: title to 2 lines (`line-clamp-2`), channel name to 1 line (`truncate`), to prevent cards from growing to unequal heights in the grid.
- [ ] Ensure the source badge ("From Subscription" / "From Search") wraps correctly on narrow cards and does not overflow.
- [ ] Verify the "open on YouTube" link/button on `<VideoCard>` is tappable on mobile with adequate target size.

### Cross-Device Testing & Verification

- [ ] Test all pages at the following breakpoints using browser devtools device emulation: 320 px (iPhone SE), 375 px (iPhone 14), 768 px (iPad), 1024 px (iPad landscape / small laptop), 1440 px (desktop).
- [ ] Test touch scrolling and tap interactions in Chrome devtools touch simulation mode for the video feed and subscription picker.
- [ ] Run a Lighthouse mobile audit (category: Best Practices + Accessibility) on the Dashboard page and address any viewport/touch-target findings.
- [ ] Write a snapshot or visual regression test (e.g. with Storybook or `@testing-library/react` render) for `<VideoFeed>` at 320 px width to catch future regressions — or document a manual test checklist if visual regression tooling is not in scope.

## Dependencies

- Depends on: S14 (Video feed frontend) — `<VideoFeed>` and `<VideoCard>` must exist and be functional.
- Depends on: S12 (Subscription picker frontend) — `<SubscriptionPicker>` must exist.
- Depends on: S9/S10 (Profile management frontend + switcher) — `<ProfileEditor>`, `<KeywordManager>`, `<ProfileSwitcher>` must exist.
- Depends on: S15 (Error handling & loading states) — skeleton components should already be responsive-aware, so coordinate grid classes with S15 if developed in parallel.

## Out of Scope

- Native mobile app (React Native / Capacitor) — Focused Tube is a web app only.
- Dark mode / theming — separate future enhancement.
- Print stylesheet — not required.
- Tablet-specific gestures (swipe to switch profile) — future enhancement.
- Right-to-left (RTL) language support — future enhancement.

## Notes

- Follow a **mobile-first** CSS authoring approach: write base styles for mobile, then layer on `sm:`, `md:`, `lg:`, `xl:` overrides. This keeps the stylesheet smaller and avoids specificity fights.
- "Touch target size" refers to the interactive area, not the visible element. Use padding to expand the hit area without changing visual size where needed.
- The video grid column count (1 → 2 → 3 → 4) is a recommendation based on the `initia_plan.md` component design. Verify with product/design before finalizing if a designer is involved.
- Coordinate with S15 (Error handling & loading states) to ensure skeleton components use the same responsive grid classes as the real `<VideoFeed>` grid, so the layout doesn't shift when content loads.
