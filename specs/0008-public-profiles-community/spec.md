# Feature: Public Profiles & Community

## Overview

Allow users to share their curated viewing profiles with the broader Focused Tube community by toggling a public visibility flag. Public profiles appear on a new Community page where other authenticated users can discover them via keyword search, view summary information (profile name, owner, follower count), and follow profiles they find interesting. Followed profiles behave like the user's own profiles — they appear in the profile switcher and their video feed is fully accessible.

## Problem Statement

Currently, Focused Tube profiles are entirely private — users build curated channel/keyword collections but have no way to share them or benefit from what others have curated. New users face a cold-start problem: they must manually build profiles from scratch with no guidance. Enabling profile sharing creates a discovery mechanism that surfaces high-quality curation, reduces onboarding friction, and builds community engagement around shared interests.

## Goals

- [ ] Let profile owners toggle individual profiles between private and public
- [ ] Provide a Community page where users can browse and search public profiles by keyword
- [ ] Enable users to follow public profiles they find interesting
- [ ] Display followed profiles in the profile switcher with a clear visual distinction
- [ ] Allow users to view the video feed of any profile they follow
- [ ] Show follower counts to profile owners as social proof

## Non-Goals

- Commenting, rating, or reviewing public profiles
- Cloning or forking a public profile into the user's own profile list
- Notification system for new followers or profile updates
- User-to-user messaging or social features beyond follow/unfollow
- Moderation tooling for public profiles (deferred to a future iteration)
- Making user accounts themselves public — only individual profiles are shared

## Target Users / Personas

| Persona | Description |
|---|---|
| Curator | An experienced user who has built well-organized profiles and wants to share their curation with others |
| Explorer | A user (especially new) who wants to discover interesting content collections without building profiles from scratch |
| Casual User | An existing user who occasionally browses the community to find niche topic profiles to follow |

## Functional Requirements

1. The system shall allow a profile owner to toggle `isPublic` on any profile they own via the profile edit page
2. The system shall default all profiles to private (`isPublic = false`)
3. The system shall provide a Community page accessible from the main navigation header
4. The system shall list all public profiles on the Community page, excluding the current user's own profiles
5. The system shall support keyword-based search on the Community page, filtering by the profile's associated keywords
6. The system shall display each community profile card with: profile name, owner display name, and follower count
7. The system shall allow an authenticated user to follow a public profile
8. The system shall allow an authenticated user to unfollow a previously followed profile
9. The system shall prevent a user from following their own profiles
10. The system shall display followed profiles in the profile switcher dropdown, visually distinguished from owned profiles
11. The system shall allow unfollowing directly from the profile switcher dropdown
12. The system shall allow the video feed to be loaded for any followed profile (same behavior as owned profiles)
13. The system shall use the followed profile owner's YouTube API credentials when fetching feed data for a followed profile
14. The system shall display follower count on owned profiles in the profile edit page when the profile is public
15. The system shall automatically unfollow users from a profile if it is made private or deleted (cascade)

## Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Community page listing should respond within 500ms for up to 1000 public profiles |
| Performance | Follow/unfollow operations should complete within 200ms |
| Security | Users must be authenticated to access the Community page and follow/unfollow actions |
| Security | Feed endpoint must verify follow relationship before serving feed data for non-owned profiles |
| Accessibility | Community page must meet WCAG 2.2 Level AA — keyboard navigable, proper landmarks, focus management |
| Accessibility | Follow/unfollow buttons must have descriptive accessible names including the profile name |
| Accessibility | Profile switcher grouping must use semantic structure (e.g., `role="group"` with labels) |
| Scalability | Database queries for public profile listing must use indexed fields and support pagination |

## UX / Design Considerations

- **Community navigation**: A "Community" link appears in the AppHeader navigation bar, between the brand logo and user controls
- **Community page layout**: A search bar at the top, followed by a responsive grid/list of profile cards. Each card shows profile name, owner name/avatar, and follower count with a Follow/Unfollow button
- **Keyword search**: A single text input with debounced search. Filters profiles whose associated keywords match the query
- **Profile edit toggle**: A clearly labeled switch/checkbox for "Make this profile public" with helper text explaining what public means. When public, a follower count badge is shown
- **Profile switcher**: Owned profiles appear first. A visual separator (label: "Following") divides owned from followed profiles. Followed profiles display a people/community icon. On hover/focus, an unfollow action appears
- **Responsive**: Community page cards reflow to single column at 320px viewport width

## Technical Considerations

- **Database**: Add `isPublic` Boolean column to `Profile` table and a new `ProfileFollow` join table with `(followerId, profileId)` unique constraint and cascade deletes
- **API design**: New `/api/community/*` route group for public profile listing, follow/unfollow, and following list. Existing `/api/profiles/*` routes extended for `isPublic` field
- **Feed authorization**: The feed route (`/api/feed/:profileId`) currently checks `profile.userId === req.user.id`. This must be relaxed to also allow access when a `ProfileFollow` record exists for the requesting user. When serving a followed profile's feed, the system must use the **profile owner's** YouTube credentials (access/refresh tokens), not the follower's
- **Pagination**: Community listing uses cursor-based or offset pagination. Initial implementation can use offset (`?page=1&limit=20`)
- **Prisma schema**: SQL Server is the database provider. Migration must be compatible with the existing schema and data
- **Client state**: `ProfileContext` is extended to load and merge followed profiles alongside owned profiles. Followed profiles carry an `isFollowing` flag for UI differentiation

## Dependencies

| Dependency | Type | Notes |
|---|---|---|
| Prisma ORM & SQL Server | Internal | Schema migration required for new column and table |
| Existing Profile CRUD routes | Internal | Extended to support `isPublic` field |
| Existing Feed route | Internal | Authorization logic updated |
| YouTube API credentials (per-user) | Internal | Followed profile feeds use the profile owner's tokens |
| AuthContext / JWT auth | Internal | All new endpoints require authentication |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| YouTube API quota exhaustion from popular followed profiles | Medium | High | Feed requests for followed profiles use the profile owner's quota, not the follower's. Document this clearly. Future caching layer (spec 0006) will reduce redundant calls |
| Public profiles exposing sensitive curation choices | Low | Medium | Clear UX messaging when toggling public. Only profile name, keyword count, and channel count are shared — not detailed channel lists |
| Follower count gaming or spam follows | Low | Low | No immediate mitigation needed. Future moderation tooling can address this |
| SQL Server migration on existing production data | Low | High | Migration only adds a column with default value and a new table — no data transformation needed. Test migration on shadow database first |

## Success Metrics

- At least 20% of active users make one or more profiles public within the first month
- At least 30% of active users visit the Community page within the first month
- Average user follows at least 1 profile within the first two weeks of using the Community page
- Followed profiles are selected in the profile switcher at least once per session by users who have followed profiles

## Open Questions

- [ ] Should there be a maximum number of profiles a user can follow to prevent abuse?
- [ ] Should the Community page show trending or most-followed profiles as a default sort, or newest first?
- [ ] When a public profile is made private, should existing followers see a notification or just silently lose access?
- [ ] Should the profile owner be able to see *who* is following their profile, or only the count?

## User Stories

| Story | File |
|---|---|
| Schema and migration for public profiles and follows | [stories/schema-migration.md](stories/schema-migration.md) |
| Toggle profile public visibility via API | [stories/toggle-public-api.md](stories/toggle-public-api.md) |
| Community API for browsing and following profiles | [stories/community-api.md](stories/community-api.md) |
| Feed access for followed profiles | [stories/feed-auth-update.md](stories/feed-auth-update.md) |
| Client types and API services for community features | [stories/client-types-api.md](stories/client-types-api.md) |
| Community page UI | [stories/community-page.md](stories/community-page.md) |
| Profile edit public toggle and follower count | [stories/profile-edit-toggle.md](stories/profile-edit-toggle.md) |
| Profile switcher with followed profiles | [stories/profile-switcher-update.md](stories/profile-switcher-update.md) |
| Navigation and routing for Community page | [stories/nav-routing.md](stories/nav-routing.md) |
