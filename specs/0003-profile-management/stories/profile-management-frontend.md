# User Story: S9 — Profile Management Frontend

## Summary

**As an** end user,
**I want** a profile editor page where I can create and delete profiles and manage the channels and keywords in each profile,
**So that** I can organise my YouTube viewing into focused, curated collections without touching the YouTube app itself.

## Description

This story builds the client-side profile management UI. It covers a dedicated Profile Editor page (accessible from the dashboard's profile switcher or directly via URL), the inline channel list with remove actions, the keyword tag manager, a create-profile flow, and a delete-profile confirmation flow.

The editor page fetches a single profile's full data (channels + keywords) on mount and reflects mutations immediately in local state after each successful API call. A `useProfiles` hook encapsulates all API interactions and exposes loading and error states to the UI.

The "Add Channel" button is rendered in this phase but is disabled/placeholder — it will link to the Subscription Picker built in Phase 4 (S12).

## Acceptance Criteria

- [ ] Given an authenticated user, when they navigate to `/profiles` or click "Manage Profiles", then they see a list of their profiles and can select one to edit.
- [ ] Given the user is on the profile editor for a profile, when the page loads, then it displays the profile name, the list of added channels (with thumbnail and title), and the list of keywords as removable tag chips.
- [ ] Given the user is on the profile editor, when they click the remove button next to a channel, then the channel is removed from the profile and disappears from the list without a full page reload.
- [ ] Given the user is on the profile editor, when they type a keyword into the `<KeywordManager>` input and press Enter or comma, then the keyword is added to the profile and appears as a new tag chip.
- [ ] Given the user types a keyword that already exists on the profile, when they press Enter, then the duplicate is not added and a brief visual indication is shown.
- [ ] Given the user is on the profile editor, when they click the ✕ on a keyword chip, then the keyword is removed from the profile.
- [ ] Given the user clicks "+ New Profile", when a name is entered and the form is submitted, then a new profile is created via the API, and the editor navigates to the new profile's editor page.
- [ ] Given the user submits a new profile name that already exists, when the API returns 409, then an inline error message is shown and the form stays open.
- [ ] Given the user clicks "Delete Profile" and confirms the dialog, when the API call succeeds, then the profile is deleted and the user is redirected to another profile or an empty state page.
- [ ] Given a user is not authenticated, when they attempt to access `/profiles`, then they are redirected to the login page (protected route).
- [ ] Given the API call is in-flight, when a channel or keyword operation is pending, then the relevant control shows a loading/disabled state to prevent double-submission.

## Tasks

- [ ] Create `client/src/pages/ProfileEditPage.tsx` — page component that reads `:profileId` from the URL, fetches profile data, and renders the editor UI
- [ ] Create `client/src/hooks/useProfiles.ts` — custom hook exposing `profiles`, `activeProfile`, `createProfile`, `deleteProfile`, `updateProfile`, `loading`, and `error`; all API calls delegated to `profilesApi.ts`
- [ ] Create `client/src/services/profilesApi.ts` — typed API client functions: `listProfiles`, `getProfile`, `createProfile`, `updateProfile`, `deleteProfile`, `addChannel`, `removeChannel`, `addKeyword`, `removeKeyword`
- [ ] Create `client/src/types/profile.ts` — TypeScript interfaces: `Profile`, `ProfileChannel`, `ProfileKeyword`, `CreateProfilePayload`, `AddChannelPayload`, `AddKeywordPayload`
- [ ] Create `client/src/components/profile/ProfileEditor.tsx` — displays profile name (with inline rename), channel list, keyword manager, and action buttons
- [ ] Create `client/src/components/profile/ChannelList.tsx` — renders a list of `ProfileChannel` items each with thumbnail, title, and a remove button; calls `removeChannel` on click
- [ ] Create `client/src/components/profile/KeywordManager.tsx` — tag-style text input component; pressing Enter or comma adds a keyword chip; each chip has a ✕ remove button; calls `addKeyword` / `removeKeyword` via props
- [ ] Add a "Create Profile" modal or inline form (in `ProfileEditPage` or a separate `CreateProfileModal.tsx`) with a text input for the profile name, a submit button, and inline error display for 409 responses
- [ ] Add a "Delete Profile" button in `ProfileEditor` that opens a confirmation dialog before calling `deleteProfile`; on success navigate to `/profiles`
- [ ] Add an "Add Channel" button placeholder in `ProfileEditor` that is visually present but shows a tooltip "Coming in a future update" (to be wired to Subscription Picker in Phase 4)
- [ ] Register the `/profiles` and `/profiles/:profileId` routes in the React Router config and wrap them with the existing protected-route guard from Phase 2 (S6)
- [ ] Add a "Manage Profiles" link in the app header or dashboard that navigates to `/profiles`
- [ ] Handle API error states in the UI — show a toast or inline error message for failed add/remove operations
- [ ] Add loading skeletons or disabled states to all mutation buttons while requests are in-flight

## Dependencies

- Depends on: S7 (Profile CRUD backend — list, create, update, delete endpoints must be live)
- Depends on: S8 (Profile channels & keywords backend — add/remove channel/keyword endpoints must be live)
- Depends on: S6 (Auth frontend — `AuthProvider`, protected route wrapper, and token handling must be in place)
- Depends on: S10 (Profile switcher — loosely coupled; `ProfileContext` should be established in this story or S10, coordinate to avoid duplication)

## Out of Scope

- Browsing and importing YouTube subscriptions to add channels (Phase 4, S12)
- Displaying the video feed (Phase 4, S14)
- Responsive / mobile layout polish (Phase 5, S16)
- Skeleton loaders and full error-boundary treatment (Phase 5, S15)

## Notes

- `KeywordManager` should be a controlled component receiving `keywords: string[]`, `onAdd: (kw: string) => void`, and `onRemove: (kwId: string) => void` props — keep it decoupled from the API layer.
- For the inline rename flow: use a contenteditable `<h1>` or a toggle between display text and an `<input>`. On blur or Enter, call `updateProfile`. On Escape, revert to the original name.
- Profile data should be refetched (or the local state updated) after every successful mutation — do not rely solely on optimistic updates in Phase 3 (add optimistic updates as polish in Phase 5).
- Component file locations follow the structure from `initia_plan.md`: `client/src/components/profile/` for profile-specific components, `client/src/pages/` for page-level components, `client/src/hooks/` for hooks, `client/src/services/` for API clients.
