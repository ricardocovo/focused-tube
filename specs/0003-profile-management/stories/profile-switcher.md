# User Story: S10 — Profile Switcher

## Summary

**As an** end user,
**I want** a profile switcher on the dashboard that lets me quickly change which profile I'm viewing,
**So that** I can instantly jump between my curated collections (e.g., "Programming" → "Cooking") without navigating away from the dashboard.

## Description

This story delivers the `<ProfileSwitcher>` component and the underlying `ProfileContext` that tracks the currently active profile application-wide. The switcher renders in the dashboard header as a dropdown (or tab bar for small profile counts) and updates the active profile immediately on selection. The active profile ID is persisted to `localStorage` so that the user's last-used profile is automatically restored on their next visit.

On app initialisation, the context loads the user's profiles and resolves the active profile using this priority order:
1. The ID stored in `localStorage` (if it matches an existing profile owned by the user)
2. The user's `isDefault` profile
3. The first profile in the list

If the user has no profiles, the switcher shows an "empty state" prompt with a link to create one.

## Acceptance Criteria

- [ ] Given an authenticated user with multiple profiles, when they open the dashboard, then the `<ProfileSwitcher>` is visible and shows the active profile's name.
- [ ] Given the switcher is open, when the user selects a different profile, then the active profile is updated in `ProfileContext`, the switcher closes and shows the new profile name, and the dashboard reflects the change.
- [ ] Given the user selects a profile, when the selection is made, then the new active profile ID is written to `localStorage` under the key `focusedtube:activeProfileId`.
- [ ] Given the user refreshes the browser, when the page reloads, then the `ProfileContext` restores the last-used profile from `localStorage` (if it still exists and belongs to the user).
- [ ] Given the stored `localStorage` profile ID no longer exists (e.g., was deleted), when the app initialises, then the context falls back to the user's default profile or the first available profile.
- [ ] Given an authenticated user with no profiles, when they view the dashboard, then the switcher shows an empty state message with a "Create your first profile" link to `/profiles`.
- [ ] Given the profiles are loading on initial app mount, when the switcher renders, then a loading indicator or skeleton is shown in place of the profile name.
- [ ] Given a "Manage Profiles" option in the switcher dropdown, when clicked, then the user is navigated to `/profiles`.
- [ ] Given an unauthenticated user, when they view any page, then `ProfileContext` is in an unauthenticated/empty state and the switcher is not rendered.

## Tasks

- [ ] Create `client/src/context/ProfileContext.tsx` — React context providing `activeProfile`, `profiles`, `setActiveProfile`, `loading`, and `error`; export a `ProfileProvider` component and a `useProfileContext` hook
- [ ] Implement profile resolution logic inside `ProfileProvider` — on mount (after user is authenticated), fetch all profiles via `listProfiles()`, read `localStorage` for `focusedtube:activeProfileId`, resolve active profile using the priority order (localStorage → isDefault → first), update state
- [ ] Implement `setActiveProfile(profileId: string)` in `ProfileProvider` — updates context state and writes the new ID to `localStorage`
- [ ] Create `client/src/components/profile/ProfileSwitcher.tsx` — dropdown component that renders the active profile name as a button trigger; on open, lists all profiles; on item click, calls `setActiveProfile`; includes a "Manage Profiles" item that navigates to `/profiles`
- [ ] Add keyboard navigation support to `<ProfileSwitcher>` — arrow keys to navigate list items, Enter to select, Escape to close
- [ ] Add an empty state in `<ProfileSwitcher>` — when `profiles` is empty, render a message and a link to `/profiles` to create the first profile
- [ ] Add a loading skeleton in `<ProfileSwitcher>` — while `loading` is `true`, show a placeholder in place of the profile name button
- [ ] Wrap the dashboard page (and any page that needs the active profile) with `ProfileProvider` in the React Router layout or `App.tsx`; ensure `ProfileProvider` is nested inside `AuthProvider`
- [ ] Validate that the active profile ID from `localStorage` still belongs to the authenticated user by cross-referencing with the fetched profiles list — clear stale localStorage value if not found
- [ ] Add a "Manage Profiles" navigation link in the dashboard header/sidebar (if not already added in S9) that links to `/profiles`
- [ ] Write unit/integration tests for `ProfileContext`: initial load with localStorage match, initial load with localStorage miss (falls back to default), initial load with no profiles (empty state), `setActiveProfile` updates state and localStorage

## Dependencies

- Depends on: S7 (Profile CRUD backend — `GET /api/profiles` must be available to populate the switcher)
- Depends on: S6 (Auth frontend — `AuthProvider` and `useAuth` hook must be available; `ProfileProvider` must read auth state to know when to fetch profiles)
- Depends on: S9 (Profile management frontend — `profilesApi.ts` and type definitions should already exist; coordinate to avoid creating duplicate API client code)

## Out of Scope

- Triggering a video feed refresh when the active profile changes (Phase 4, S14 — the feed page will consume `activeProfile` from context)
- Inline profile creation from the switcher dropdown (creation is handled in the Profile Editor, S9)
- Reordering or pinning profiles in the switcher

## Notes

- `ProfileContext` is the single source of truth for the active profile across the app. Phase 4's feed components (S14) will consume `useProfileContext().activeProfile` to know which profile to fetch the feed for — design the context API with that consumer in mind.
- Use `localStorage` (not `sessionStorage`) so the preference persists across browser sessions.
- The `localStorage` key `focusedtube:activeProfileId` is namespaced to avoid collisions with other apps on the same origin.
- Avoid storing the full profile object in `localStorage` — only the ID. Always resolve the full profile object from the in-memory `profiles` array to avoid stale data.
- If `ProfileProvider` is placed at a high level in the tree (e.g., in the authenticated layout), it will remain mounted across page navigations, preventing redundant API calls.
