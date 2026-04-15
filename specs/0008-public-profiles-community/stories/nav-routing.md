# User Story: Navigation and Routing for Community Page

## Summary

**As an** authenticated user,
**I want** a "Community" link in the app navigation and a route for the Community page,
**So that** I can easily navigate to the Community page from anywhere in the app.

## Description

Add a "Community" navigation link to the `AppHeader` component and register the `/community` route in the app's router configuration. The route is protected (requires authentication) and renders the `CommunityPage` component wrapped in an `ErrorBoundary`.

## Acceptance Criteria

- [ ] Given the app header, then a "Community" navigation link is visible between the brand logo and user controls.
- [ ] Given the "Community" link, when clicked, then the user is navigated to `/community`.
- [ ] Given an authenticated user, when they navigate to `/community`, then the Community page is rendered.
- [ ] Given an unauthenticated user, when they navigate to `/community`, then they are redirected to the login page.
- [ ] Given the Community page route, then it is wrapped in `ProtectedRoute` and `ErrorBoundary` consistent with other protected routes.
- [ ] Given the "Community" link, then it is visually consistent with the existing navigation style.
- [ ] Given the "Community" link, when on the Community page, then the link is visually indicated as active/current.
- [ ] Given keyboard navigation, then the "Community" link is reachable via Tab and activatable via Enter/Space.

## Tasks

- [ ] Add a "Community" `<Link>` element to `client/src/components/ui/AppHeader.tsx` in the header center area or as a navigation item
- [ ] Style the Community link consistently with existing header styles in `AppHeader.css`
- [ ] Add the `/community` route to `client/src/App.tsx` with `ProtectedRoute` and `ErrorBoundary` wrappers
- [ ] Import `CommunityPage` in `App.tsx`
- [ ] Add active-state styling for the Community link when on `/community` (use `NavLink` from react-router-dom or check current path)
- [ ] Verify keyboard accessibility of the new navigation link

## Dependencies

- Depends on: [community-page.md](community-page.md) — the `CommunityPage` component must exist

## Out of Scope

- Mobile hamburger menu or responsive navigation collapse
- Badge or notification indicator on the Community link

## Notes

- Use `NavLink` from `react-router-dom` for automatic active-state class application.
- The link should appear for all authenticated users, regardless of whether they have profiles.
- Placement in the header center area alongside any existing breadcrumb/navigation content, or as a standalone nav item if no breadcrumb is present (e.g., on the Dashboard).
