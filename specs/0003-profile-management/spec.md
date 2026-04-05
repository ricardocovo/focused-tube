# Feature: Profile Management

## Overview

Profile Management is the core organizational layer of Focused Tube. It lets authenticated users create multiple named profiles — each with its own set of YouTube channels and keywords — and switch between them on the dashboard. This phase delivers the full backend CRUD API for profiles, the channel/keyword association endpoints, the profile editor UI, and the profile switcher component.

## Problem Statement

YouTube's recommendation algorithm surfaces content the platform wants users to watch, not what users actually intend to watch. Focused Tube solves this by letting users define their own curated "lenses" (profiles) on YouTube content. Without a profile management system, users have no way to create, edit, or switch between these curated views — making the rest of the application impossible to use.

## Goals

- [ ] Provide a complete REST API for profile CRUD with per-user ownership enforcement
- [ ] Provide REST endpoints for managing channels and keywords within a profile
- [ ] Deliver a profile editor page where users can view, add, and remove channels and keywords
- [ ] Deliver a profile switcher component so users can flip between profiles on the dashboard
- [ ] Persist the user's last-active profile across sessions

## Non-Goals

- Importing channels from YouTube subscriptions (covered in Phase 4 — S11/S12)
- Displaying a video feed for a profile (covered in Phase 4 — S13/S14)
- Sharing profiles with other users (future scope)
- Profile-level notification or new-video alerts (future scope)
- Profile import/export (future scope)

## Target Users / Personas

| Persona | Description |
|---|---|
| End User | A YouTube viewer who organizes their viewing into named profiles (e.g., "Programming", "Cooking", "Music") and wants to add specific channels and keywords to each, then switch between them without losing their configuration. |
| Developer | The developer(s) building and maintaining Focused Tube who need clear, testable API contracts and composable frontend components for profile management. |

## Functional Requirements

1. The system shall allow an authenticated user to create a profile with a unique name (per user).
2. The system shall allow an authenticated user to list all of their profiles.
3. The system shall allow an authenticated user to rename a profile.
4. The system shall allow an authenticated user to mark a profile as the default profile.
5. The system shall allow an authenticated user to delete a profile (with cascade deletion of its channels and keywords).
6. The system shall prevent a user from accessing, modifying, or deleting another user's profiles (ownership enforcement).
7. The system shall allow a user to add one or more YouTube channels to a profile, storing the channel ID, title, and optional thumbnail URL.
8. The system shall allow a user to remove a channel from a profile.
9. The system shall allow a user to add one or more keywords to a profile.
10. The system shall allow a user to remove a keyword from a profile.
11. The system shall enforce uniqueness of (profileId, youtubeChannelId) and (profileId, keyword) to prevent duplicates.
12. The system shall provide a profile editor page listing the profile's current channels and keywords with actions to add/remove each.
13. The system shall provide a profile switcher component on the dashboard that lists all user profiles and activates the selected one.
14. The system shall persist the last-active profile in localStorage so it is restored on next visit.
15. The system shall display a UI to create a new profile and delete an existing profile from the profile management area.

## Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Profile list, create, update, and delete operations should complete in under 300 ms under normal load. |
| Security | All profile and channel/keyword endpoints must be protected by the JWT auth middleware from Phase 2; unauthenticated requests receive 401. |
| Security | Ownership checks must be enforced server-side; a user cannot mutate another user's profile even with a valid JWT. |
| Data Integrity | Deleting a profile must cascade-delete all associated ProfileChannel and ProfileKeyword rows. |
| Accessibility | Interactive profile switcher and editor controls must be keyboard-navigable and have appropriate ARIA labels. |
| Scalability | The design should support users having up to 50 profiles each with up to 200 channels and 100 keywords without schema changes. |

## UX / Design Considerations

- **Profile Switcher**: Rendered in the dashboard header or sidebar as a dropdown (or tab bar for ≤5 profiles). Selecting a profile immediately updates the active profile context and triggers a feed refresh. The active profile is highlighted. A "Manage Profiles" link navigates to the profile editor.
- **Profile Editor Page**: Accessible via `/profiles` or `/profiles/:id`. Shows profile name (editable inline), a channel list with remove buttons, a keyword tag cloud with remove buttons, and an "Add Channel" button (disabled in Phase 3 — will link to Subscription Picker in Phase 4). Includes a "+ New Profile" button and a "Delete Profile" button with a confirmation dialog.
- **Keyword Manager**: Tag-style text input — user types a keyword and presses Enter or comma to add it as a removable tag chip. Duplicate keywords are silently ignored (or highlighted briefly).
- **Create Profile Flow**: Inline form or modal with a single "Profile Name" field. On submit, creates the profile via API and navigates to its editor.
- **Delete Profile Flow**: Confirmation dialog ("Delete profile 'X'? This cannot be undone."). On confirm, deletes and redirects to the next available profile or an empty state.
- **Empty State**: If the user has no profiles, show a friendly prompt to create their first profile.

## Technical Considerations

- **Auth Middleware**: All profile routes require the `requireAuth` middleware implemented in Phase 2 (S5). The middleware attaches `req.user` with at minimum `{ id: string }`.
- **Prisma Ownership Check**: Profile routes must query with `where: { id, userId: req.user.id }` to enforce ownership rather than looking up by ID alone.
- **Default Profile Logic**: Only one profile per user can be `isDefault: true`. Setting a new default should unset the previous default in the same transaction.
- **Active Profile State (Frontend)**: Use a `ProfileContext` (React context) that holds the `activeProfileId`. The switcher updates this context; the dashboard and editor pages consume it.
- **localStorage Key**: Use a namespaced key like `focusedtube:activeProfileId` to persist the active profile ID.
- **API Client**: Frontend API calls should live in `client/src/services/profilesApi.ts` with typed request/response shapes imported from `client/src/types/`.
- **Error Handling**: 409 Conflict returned when attempting to create a duplicate profile name. 404 when a profile ID is not found or is owned by another user.
- **Cascade Deletes**: Prisma schema already defines `onDelete: Cascade` on ProfileChannel and ProfileKeyword — ensure migration is applied.

## Dependencies

| Dependency | Type | Notes |
|---|---|---|
| Phase 1 — Monorepo scaffolding (S1) | Internal | Express server, Vite client, and root workspace scripts must be in place. |
| Phase 1 — Database & Prisma (S2) | Internal | Prisma schema with Profile, ProfileChannel, ProfileKeyword models and initial migration must exist. |
| Phase 1 — Server foundation (S3) | Internal | Express app with CORS, JSON parsing, and error-handling middleware must be in place. |
| Phase 2 — Auth middleware (S5) | Internal | `requireAuth` middleware must be implemented; all profile routes depend on it. |
| Phase 2 — Auth frontend (S6) | Internal | `AuthProvider` context and protected route wrapper must exist for the profile editor page to be a protected route. |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Profile name uniqueness constraint not enforced at DB level causes duplicate profiles | Low | Med | Prisma `@@unique([userId, name])` constraint is already defined; catch Prisma `P2002` unique constraint error and return 409. |
| User accidentally deletes a profile with many channels/keywords | Med | High | Show a confirmation dialog with the profile name before deletion. |
| localStorage active profile ID references a deleted profile | Med | Med | On app load, validate the stored ID against the profiles API; fall back to the default or first profile if invalid. |
| JWT auth middleware not yet available when starting S7 | Low | High | S7 depends on S5 — coordinate phase ordering or stub the middleware during development. |
| Frontend active profile state causes stale data after switching | Med | Med | Always re-fetch profile details on context change; avoid caching profile data without invalidation. |

## Success Metrics

- Metric 1: All 8 profile API endpoints return correct status codes and payloads per their contract (verified by integration tests).
- Metric 2: A user can complete the full flow — create profile → add channels → add keywords → switch profile → delete profile — without errors.
- Metric 3: Active profile persists correctly across browser refresh (localStorage restore validated).
- Metric 4: Ownership enforcement verified: authenticated user B cannot read or mutate user A's profiles (verified by test).

## Open Questions

- [ ] Should deleting the active (last) profile redirect to an "empty state" page, or automatically create a default "General" profile?
- [ ] Should the profile name be editable directly in the switcher dropdown, or only inside the profile editor page?
- [ ] Is there a maximum number of profiles per user we want to enforce at the API level in this phase?
- [ ] Should the "Add Channel" button in the profile editor be fully disabled in Phase 3, or show a placeholder linking to Phase 4's subscription picker?

## User Stories

| Story | File |
|---|---|
| S7: Profile CRUD Backend | [stories/profile-crud-backend.md](stories/profile-crud-backend.md) |
| S8: Profile Channels & Keywords Backend | [stories/profile-channels-keywords-backend.md](stories/profile-channels-keywords-backend.md) |
| S9: Profile Management Frontend | [stories/profile-management-frontend.md](stories/profile-management-frontend.md) |
| S10: Profile Switcher | [stories/profile-switcher.md](stories/profile-switcher.md) |
