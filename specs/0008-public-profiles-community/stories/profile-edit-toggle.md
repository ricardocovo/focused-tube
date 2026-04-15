# User Story: Profile Edit Public Toggle and Follower Count

## Summary

**As a** profile owner,
**I want** a toggle on the profile edit page to make my profile public or private,
**So that** I can control whether my profile appears on the Community page.

## Description

Add a toggle (switch or checkbox) to the `ProfileEditPage` component that allows the user to set `isPublic` on their profile. When the profile is public, display the current follower count as a badge or informational text. The toggle calls the existing `updateProfile` API with the `isPublic` field.

## Acceptance Criteria

- [ ] Given the profile edit page, then a "Make this profile public" toggle is displayed.
- [ ] Given the toggle is off, when the user turns it on, then `updateProfile(id, { isPublic: true })` is called and the profile becomes public.
- [ ] Given the toggle is on, when the user turns it off, then `updateProfile(id, { isPublic: false })` is called and the profile becomes private.
- [ ] Given the toggle state changes, when the API call succeeds, then a success toast notification is shown.
- [ ] Given the toggle state changes, when the API call fails, then the toggle reverts to its previous state and an error toast is shown.
- [ ] Given the profile is public, then a follower count (e.g., "5 followers") is displayed near the toggle.
- [ ] Given the profile is private, then no follower count is displayed.
- [ ] Given the toggle, then it has a visible label and is keyboard operable.
- [ ] Given the toggle, then it uses appropriate ARIA attributes (`role="switch"` or `aria-checked`).

## Tasks

- [ ] Update `ProfileEditPage.tsx` to include a public visibility toggle section below the name form
- [ ] Load `isPublic` and `followerCount` (from `_count.followers`) in the profile fetch
- [ ] Implement the toggle as an accessible switch with proper ARIA attributes
- [ ] Call `updateProfile(id, { isPublic: value })` on toggle change
- [ ] Show success/error toast notifications for toggle changes
- [ ] Display follower count text when `isPublic` is true
- [ ] Add helper text explaining what making a profile public means
- [ ] Add styles for the toggle section in `ProfileEditPage.css`
- [ ] Add component tests for the toggle behavior

## Dependencies

- Depends on: [client-types-api.md](client-types-api.md) — `isPublic` must be in the `Profile` type and `updateProfile` must accept it

## Out of Scope

- Viewing the list of individual followers
- Confirmation dialog before making a profile public (keep it simple for now)

## Notes

- The toggle should include helper text like: "Public profiles appear on the Community page and can be followed by other users."
- The follower count comes from `_count.followers` in the profile API response (updated in the toggle-public-api story).
- Consider using a `<button role="switch">` pattern or a styled checkbox for the toggle.
