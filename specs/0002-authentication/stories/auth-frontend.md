# User Story: S6 — Auth Frontend

## Summary

**As an** end user of Focused Tube,
**I want** a login page where I can sign in with my Google account, and seamless authentication state management throughout the app,
**So that** I can access my curated profiles and video feed after signing in, stay logged in across page refreshes, and be automatically redirected to the login page if my session expires.

## Description

This story builds the complete React authentication experience on top of the backend from S4 and S5. It covers four interconnected pieces:

1. **Login page** — a minimal, visually clean `/login` route with a "Sign in with Google" button.
2. **`<AuthProvider>`** — a React context provider that wraps the entire app, silently restores sessions on load (via the httpOnly refresh cookie), stores the access JWT in memory, and exposes `user`, `isLoading`, and `logout` to all components.
3. **`<ProtectedRoute>`** — a route guard component that redirects unauthenticated users to `/login`, preserving the original destination for post-login redirect.
4. **API service layer** — an Axios instance with request interceptors that attach the `Authorization: Bearer` header and response interceptors that transparently refresh the access JWT on `401` responses before retrying the original request.

## Acceptance Criteria

- [ ] Given an unauthenticated user visits any protected route (e.g. `/`), when the app loads, then they are redirected to `/login` with the original path preserved (e.g. `?redirect=/`).
- [ ] Given an unauthenticated user is on `/login`, when they click "Sign in with Google", then the browser navigates to `GET /api/auth/google` (the backend OAuth entry point).
- [ ] Given a user has successfully completed the OAuth flow and the backend has set the auth cookie and returned a JWT, when they are redirected back to the frontend callback URL, then `<AuthProvider>` stores the access JWT in memory and marks the user as authenticated.
- [ ] Given an authenticated user is on `/login`, when the page loads, then they are redirected away from `/login` to `/` (or the `redirect` query param destination).
- [ ] Given an authenticated user refreshes the page, when `<AuthProvider>` mounts, then it calls `POST /api/auth/refresh` using the httpOnly cookie, obtains a new access JWT, and restores the authenticated session without requiring re-login.
- [ ] Given the refresh call fails (expired or missing cookie), when `<AuthProvider>` receives the error, then it sets `user` to `null`, marks loading as complete, and the user sees the login page.
- [ ] Given an authenticated user clicks "Logout", when `logout()` from `useAuth` is called, then `POST /api/auth/logout` is called, the in-memory JWT is cleared, `user` is set to `null`, and the user is redirected to `/login`.
- [ ] Given `<AuthProvider>` is still determining auth state on initial load, when any protected route renders, then a full-screen loading spinner is shown (not a flash of the login page).
- [ ] Given an API call returns `401`, when the Axios response interceptor handles it, then it attempts one silent token refresh and retries the original request; if the refresh also fails, it calls `logout()` and redirects to `/login`.
- [ ] Given `useAuth()` is called outside of `<AuthProvider>`, when the hook runs, then it throws a descriptive error: `"useAuth must be used within an AuthProvider"`.

## Tasks

- [ ] Install client dependencies: `axios`, `react-router-dom` (if not already present from Phase 1)
- [ ] Create `client/src/services/api.ts` with a configured Axios instance (`baseURL` pointing to the Express server, `withCredentials: true`)
- [ ] Add a request interceptor to the Axios instance that attaches `Authorization: Bearer <token>` from the in-memory token store when a token is available
- [ ] Add a response interceptor that catches `401` responses, calls `POST /api/auth/refresh` once, updates the in-memory token, and retries the failed request; if the refresh itself returns `401`, trigger logout
- [ ] Create `client/src/context/AuthContext.tsx` defining the `AuthContext` with type `{ user: User | null; isLoading: boolean; logout: () => Promise<void> }`
- [ ] Implement `<AuthProvider>` in `AuthContext.tsx` that on mount calls `POST /api/auth/refresh` to restore session, stores the returned JWT in a module-level variable (not state), sets `user` in state, and sets `isLoading` to `false` when done
- [ ] Implement the `logout` function in `<AuthProvider>`: call `POST /api/auth/logout`, clear the in-memory token, set `user` to `null`, and navigate to `/login`
- [ ] Export a `useAuth()` custom hook from `AuthContext.tsx` that reads from `AuthContext` and throws if called outside the provider
- [ ] Create `client/src/components/auth/ProtectedRoute.tsx` that uses `useAuth()` and renders `<Navigate to="/login" state={{ from: location }} replace />` when `user` is `null` and loading is complete
- [ ] Handle the loading state in `<ProtectedRoute>`: render a full-screen `<Spinner />` (or equivalent) while `isLoading` is `true` to prevent flashing
- [ ] Create `client/src/pages/LoginPage.tsx` with a centred layout, app name/logo, tagline, and a `<a href="/api/auth/google">Sign in with Google</a>` button styled to Google branding guidelines
- [ ] Redirect already-authenticated users away from `/login` in `LoginPage.tsx` using `useAuth()` (if `!isLoading && user`, navigate to `state.from || '/'`)
- [ ] Create `client/src/types/auth.ts` defining the `User` interface: `{ id: string; email: string; name: string; avatarUrl: string | null }`
- [ ] Handle the post-OAuth redirect: decide on the mechanism (short-lived cookie from backend or query param), implement corresponding client-side logic to extract and store the initial access JWT after the Google callback
- [ ] Wrap `<App />` in `client/src/main.tsx` with `<BrowserRouter>` and `<AuthProvider>` in the correct order
- [ ] Set up React Router routes in `client/src/App.tsx`: `/login` → `<LoginPage>`, `/` (and other protected routes) → `<ProtectedRoute><Dashboard /></ProtectedRoute>`
- [ ] Write tests for `<AuthProvider>` covering: successful session restore, failed restore (no cookie), and logout flow (using `msw` or `jest.mock` for API calls)
- [ ] Write tests for `<ProtectedRoute>` covering: renders children when authenticated, redirects to `/login` when unauthenticated, shows spinner while loading
- [ ] Write a test for `<LoginPage>` verifying it redirects authenticated users and renders the sign-in button for unauthenticated users
- [ ] Verify the "Sign in with Google" button is keyboard-focusable and has an accessible `aria-label` or visible text label

## Dependencies

- Depends on: S4 — Google OAuth Backend (the `/api/auth/refresh`, `/api/auth/logout`, and `/api/auth/me` endpoints must be available)
- Depends on: S5 — Auth Middleware (so `GET /api/auth/me` works correctly with the JWT)
- Depends on: Phase 1 — S1 (React + Vite + TypeScript client workspace must exist; React Router must be installable)

## Out of Scope

- Any profile management UI or dashboard content (Phase 3)
- Video feed display (Phase 4)
- "Remember me" or persistent login beyond the 30-day refresh token window
- Multi-account switching or account management
- Social login providers other than Google
- Custom error page UI (Phase 5)

## Notes

- The access JWT must **never** be written to `localStorage` or `sessionStorage`. Store it in a module-level variable in `api.ts` (e.g. `let accessToken: string | null = null`) and expose setter/getter functions. This avoids XSS token theft.
- The `withCredentials: true` Axios option is required for the httpOnly refresh cookie to be sent cross-origin during development (Vite dev server on a different port than Express). Ensure the backend CORS config allows the Vite origin with `credentials: true`.
- For the initial JWT handoff after the OAuth callback, the recommended approach is: backend sets a short-lived (60s) `httpOnly` cookie named `ft_initial_token`, frontend `<AuthProvider>` reads it via `GET /api/auth/me` (which returns the user and implicitly validates the cookie), then immediately calls the refresh endpoint to switch to the standard refresh-cookie flow.
- If using React Router v6, `<ProtectedRoute>` is an `<Outlet>`-based wrapper component, not a modified `<Route>`.
- The `state={{ from: location }}` pattern in `<Navigate>` and reading `state.from` on the login page enables seamless "redirect after login" without polluting the URL with redirect parameters.
