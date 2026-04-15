# User Story: Profile Switcher with Followed Profiles

## Summary

**As a** user who follows public profiles,
**I want** to see followed profiles in my profile switcher dropdown,
**So that** I can quickly switch to a followed profile's feed without navigating to the Community page.

## Description

Extend the `ProfileContext` to load followed profiles alongside owned profiles. Update the `ProfileSwitcher` component to display followed profiles in a visually distinct group below the user's own profiles, with a community icon and an unfollow action. Create a `useFollowedProfiles` hook to manage the followed profiles state and actions.

## Acceptance Criteria

- [ ] Given a user who follows one or more profiles, when the profile switcher opens, then followed profiles appear below owned profiles with a "Following" group label.
- [ ] Given a followed profile in the switcher, then it displays a community/people icon (e.g., 👥) next to the profile name.
- [ ] Given a followed profile in the switcher, then the owner's name is displayed (e.g., "by John").
- [ ] Given a followed profile in the switcher, when hovered or focused, then an "Unfollow" action button appears.
- [ ] Given the user clicks "Unfollow" on a followed profile in the switcher, when confirmed, then the profile is removed from the followed list.
- [ ] Given the user selects a followed profile in the switcher, then it becomes the active profile and the feed loads.
- [ ] Given the profile switcher, then the "Following" group uses semantic grouping (e.g., `role="group"` with `aria-label`).
- [ ] Given a user with no followed profiles, then no "Following" section appears in the switcher.
- [ ] Given the unfollow button, then it has an accessible name that includes the profile name (e.g., "Unfollow Cooking Favorites").

## Tasks

- [ ] Create `client/src/hooks/useFollowedProfiles.ts` hook that fetches followed profiles via `fetchFollowedProfiles()` and provides unfollow action
- [ ] Update `client/src/context/ProfileContext.tsx` to integrate followed profiles: load them on mount, expose them separately, and allow selecting them as active
- [ ] Update `client/src/components/profile/ProfileSwitcher.tsx` to render two groups: "Your Profiles" and "Following"
- [ ] Add community icon (👥 or SVG) next to followed profile names in the switcher
- [ ] Add owner name display ("by {ownerName}") for followed profiles
- [ ] Add unfollow button that appears on hover/focus for followed profiles
- [ ] Implement unfollow action: call `unfollowProfile()`, remove from local state, show toast
- [ ] Add semantic grouping with `role="group"` and `aria-label` for the "Following" section
- [ ] Update `ProfileSwitcher.css` with styles for the following group, icon, owner name, and unfollow button
- [ ] Add component tests for the updated ProfileSwitcher

## Dependencies

- Depends on: [client-types-api.md](client-types-api.md) — `fetchFollowedProfiles`, `unfollowProfile` API functions and types must exist
- Depends on: [community-api.md](community-api.md) — server endpoints for following and followed list must exist

## Out of Scope

- Following profiles from the switcher (must go to Community page to follow)
- Reordering followed profiles
- Showing follower counts in the switcher

## Notes

- The `ProfileContext` must distinguish between owned and followed profiles. The `isFollowing` flag on the profile object is used for this.
- When a followed profile is selected as active, the feed endpoint will use the profile owner's YouTube credentials (handled server-side in the feed-auth-update story).
- The unfollow action in the switcher should optimistically remove the profile from the list and revert on error.
- If the active profile is unfollowed, the switcher should fall back to the user's default or first owned profile.
