# User Story: Community Page UI

## Summary

**As an** authenticated user,
**I want** a Community page where I can browse public profiles and search by keyword,
**So that** I can discover and follow interesting profiles curated by other users.

## Description

Create a new `CommunityPage` component with a keyword search input and a responsive list of public profile cards. Each card shows the profile name, owner name, and follower count, along with a Follow or Unfollow button depending on the user's current relationship. The page supports pagination for large result sets. A `useCommunity` hook manages the page's state (search term, loading, pagination, results).

## Acceptance Criteria

- [ ] Given an authenticated user navigates to `/community`, then the Community page loads with a list of public profiles.
- [ ] Given the Community page, when the user types a keyword in the search input, then the profile list filters to profiles whose keywords match (debounced).
- [ ] Given a profile card, then it displays the profile name, owner display name, and follower count.
- [ ] Given a profile the user does not follow, then a "Follow" button is displayed on the card.
- [ ] Given a profile the user already follows, then an "Unfollow" button is displayed on the card.
- [ ] Given the user clicks "Follow", when the request succeeds, then the button changes to "Unfollow" and the follower count increments.
- [ ] Given the user clicks "Unfollow", when the request succeeds, then the button changes to "Follow" and the follower count decrements.
- [ ] Given more profiles than fit on one page, then pagination controls are displayed and functional.
- [ ] Given the page is viewed at 320px viewport width, then content reflows to a single column without horizontal scrolling.
- [ ] Given the page, then it uses semantic HTML: `main` landmark, heading hierarchy starting at `h1`, and labeled search input.
- [ ] Given the Follow/Unfollow buttons, then each has an accessible name that includes the profile name (e.g., "Follow Cooking Favorites").
- [ ] Given no public profiles match the search, then an empty state message is displayed.
- [ ] Given the profiles are loading, then a loading indicator is shown.

## Tasks

- [ ] Create `client/src/hooks/useCommunity.ts` hook managing search term, pagination, profile list, loading, and follow/unfollow actions
- [ ] Create `client/src/pages/CommunityPage.tsx` with page structure: header, search input, profile card list, pagination
- [ ] Create `client/src/pages/CommunityPage.css` with responsive styles (single-column at 320px)
- [ ] Implement keyword search input with debounce (300ms)
- [ ] Implement profile card component with profile name, owner name, follower count, and Follow/Unfollow button
- [ ] Implement optimistic UI update for follow/unfollow actions (update count and button state immediately, revert on error)
- [ ] Implement pagination controls (Previous/Next or page numbers)
- [ ] Add empty state for no results and loading state
- [ ] Ensure all accessibility requirements: landmarks, headings, labeled inputs, descriptive button names, keyboard navigation, focus management
- [ ] Add component tests for the Community page

## Dependencies

- Depends on: [client-types-api.md](client-types-api.md) — types and API service functions must exist

## Out of Scope

- Viewing detailed channel/keyword lists of a public profile
- Sorting by popularity or trending
- Profile owner avatars (show name only; avatar is a nice-to-have)

## Notes

- The `useCommunity` hook calls `fetchCommunityProfiles` from `communityApi.ts` and manages local state for the search term, debounced query, current page, and results.
- Follow/unfollow actions should optimistically update the local state (button label and follower count) and revert on API error.
- The debounce on search prevents excessive API calls while the user types.
- Profile cards are intentionally minimal (no channel/keyword detail) per the product decision to show only name, owner, and follower count.
