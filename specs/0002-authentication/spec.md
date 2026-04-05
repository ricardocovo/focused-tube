# Feature: Authentication

## Overview

Focused Tube requires users to sign in with their Google account before accessing any part of the application. This phase implements the full Google OAuth 2.0 authentication flow — covering backend OAuth handling, JWT-based session management, auth middleware for protected routes, and the React frontend auth experience. It enables the app to securely identify users and obtain the YouTube API tokens needed by later phases.

## Problem Statement

Without authentication, Focused Tube cannot associate curated profiles with individual users or make authorised calls to the YouTube Data API on their behalf. The app needs a secure, well-structured auth layer that handles Google's OAuth 2.0 consent flow, persists user identity in the database, issues short-lived JWTs for stateless API authorisation, and gives the React SPA a reliable way to know whether a user is logged in — before any profile or feed features are built.

## Goals

- [ ] Users can sign in to Focused Tube using their Google account via OAuth 2.0
- [ ] The backend issues short-lived JWTs (15 min) and rotates refresh tokens via httpOnly cookies
- [ ] Google access and refresh tokens are stored encrypted in the database
- [ ] All protected API routes reject unauthenticated requests with a clear error
- [ ] The React frontend tracks auth state globally and redirects unauthenticated users to the login page
- [ ] Logging out clears all session state on both client and server

## Non-Goals

- Building any profile management, video feed, or YouTube subscription features (Phase 3+)
- Implementing any auth provider other than Google OAuth 2.0
- Password-based or magic-link authentication
- Admin roles or fine-grained permission scopes beyond the basic YouTube read scope
- Caching or rate-limiting of auth endpoints
- Email verification flow

## Target Users / Personas

| Persona | Description |
|---|---|
| End User | A YouTube viewer who wants to sign in with their Google account to access their curated Focused Tube profiles and YouTube subscriptions. |
| Developer | The developer(s) building Focused Tube who need secure, well-structured auth infrastructure that subsequent phases (profiles, feed) can build on. |

## Functional Requirements

1. The system shall expose `GET /api/auth/google` to redirect users to Google's OAuth 2.0 consent screen, requesting the `profile`, `email`, and `https://www.googleapis.com/auth/youtube.readonly` scopes.
2. The system shall expose `GET /api/auth/google/callback` to receive the OAuth authorisation code, exchange it for Google tokens, and upsert the user record in the database.
3. The system shall encrypt Google `accessToken` and `refreshToken` values before persisting them to the database.
4. The system shall issue a signed, short-lived JWT (15-minute expiry) containing the user's internal ID upon successful authentication.
5. The system shall issue a long-lived refresh token stored in a `Set-Cookie` header using an `httpOnly`, `SameSite=Lax`, `Secure` (in production) cookie.
6. The system shall expose `GET /api/auth/me` to return the currently authenticated user's `id`, `email`, `name`, and `avatarUrl`.
7. The system shall expose `POST /api/auth/logout` to clear the refresh token cookie and invalidate the session.
8. The system shall provide a JWT verification middleware that validates the `Authorization: Bearer <token>` header on protected routes and attaches the decoded user to `req.user`.
9. The system shall return `401 Unauthorized` for requests to protected routes that are missing, expired, or invalid JWTs.
10. The system shall support refresh token rotation: a valid refresh token cookie may be exchanged for a new access JWT and a new refresh token cookie.
11. The React frontend shall display a dedicated login page with a "Sign in with Google" button when no authenticated session exists.
12. The React frontend shall provide an `<AuthProvider>` React context that exposes the current user, loading state, and a `logout` function to the entire component tree.
13. The React frontend shall implement a `<ProtectedRoute>` component that redirects unauthenticated users to `/login`, preserving the originally requested path for post-login redirect.
14. The React frontend shall store the access JWT in memory (not `localStorage`) and refresh it transparently using the httpOnly cookie before expiry.

## Non-Functional Requirements

| Category | Requirement |
|---|---|
| Security | Google tokens encrypted at rest using AES-256 (or equivalent) via a server-side encryption utility. JWT signed with HS256 using a secret from environment variables. Refresh token cookie must be `httpOnly` and `SameSite=Lax`. |
| Security | No sensitive tokens (access JWT, Google tokens) stored in `localStorage` or exposed to client-side JavaScript beyond the current session. |
| Performance | OAuth callback and JWT verification must add no more than 50 ms latency under normal conditions. |
| Reliability | If Google token refresh fails (e.g. revoked access), the user is gracefully signed out and redirected to the login page. |
| Developer Experience | All auth configuration (Client ID, Client Secret, JWT secret, encryption key) loaded exclusively from `.env`; `.env.example` updated with required keys. |
| Accessibility | Login page "Sign in with Google" button must be keyboard-focusable and include an accessible label. |

## UX / Design Considerations

- **Login Page** (`/login`): Centred card with the Focused Tube name/logo, a brief tagline, and a single "Sign in with Google" button using Google's official branding guidelines (white button, Google logo). No other inputs or navigation.
- **Key flow — first-time sign-in**: User visits any route → redirected to `/login` → clicks "Sign in with Google" → Google consent screen → callback → redirected to originally requested route (or `/` dashboard).
- **Key flow — returning user**: App loads → `<AuthProvider>` silently refreshes token via cookie → user lands directly on the dashboard.
- **Key flow — logout**: User clicks logout → `POST /api/auth/logout` clears cookie → client clears in-memory JWT → redirect to `/login`.
- **Key flow — expired session with no valid refresh token**: Any API call returns `401` → `<AuthProvider>` catches it → clears state → redirects to `/login` with a brief "Session expired, please sign in again" message.
- **Loading state**: While `<AuthProvider>` is determining auth state on initial load, show a full-screen spinner/skeleton to prevent a flash of the login page for authenticated users.

## Technical Considerations

- **OAuth library**: Use `passport` + `passport-google-oauth20` on the Express backend for well-tested OAuth 2.0 handling, or implement the manual PKCE flow if passport adds unacceptable complexity. Passport is preferred.
- **JWT library**: Use `jsonwebtoken` (already common in the Node ecosystem). Keep the payload minimal: `{ sub: userId, iat, exp }`.
- **Encryption**: Implement a `server/src/utils/encryption.ts` module using Node's built-in `crypto` (AES-256-GCM) so there is no extra runtime dependency. Store the encryption key as `ENCRYPTION_KEY` in `.env`.
- **Token refresh endpoint**: Expose `POST /api/auth/refresh` (or handle transparently in `GET /api/auth/me`) to allow the client to exchange a valid refresh cookie for a new access JWT.
- **Frontend token management**: Store the JWT in a React ref / closure (module-level variable), not in `localStorage`. Use an Axios (or `fetch`) interceptor to attach the `Authorization` header and trigger a refresh when a `401` is received.
- **CORS**: The Express CORS configuration (from Phase 1/S3) must allow credentials (`credentials: true`) and restrict the origin to `VITE_DEV_ORIGIN` during development so cookies work cross-origin in the Vite dev server setup.
- **Prisma User model**: The `accessToken` and `refreshToken` fields on the `User` model (defined in Phase 1/S2) store the encrypted values. No schema changes are required in this phase.
- **File locations**:
  - `server/src/routes/auth.ts` — auth route handlers
  - `server/src/middleware/auth.ts` — JWT verification middleware
  - `server/src/services/auth.service.ts` — OAuth logic, token exchange, user upsert
  - `server/src/utils/jwt.ts` — sign/verify helpers
  - `server/src/utils/encryption.ts` — encrypt/decrypt helpers
  - `client/src/context/AuthContext.tsx` — `<AuthProvider>` and `useAuth` hook
  - `client/src/components/auth/ProtectedRoute.tsx` — route guard
  - `client/src/pages/LoginPage.tsx` — login UI
  - `client/src/services/api.ts` — Axios instance with auth interceptors

## Dependencies

| Dependency | Type | Notes |
|---|---|---|
| Phase 1 — S1: Monorepo setup | Internal | `client/` and `server/` workspaces, TypeScript configs, and root scripts must exist. |
| Phase 1 — S2: Database & Prisma | Internal | Prisma `User` model with `googleId`, `email`, `name`, `avatarUrl`, `accessToken`, `refreshToken` fields must be migrated. |
| Phase 1 — S3: Server foundation | Internal | Express app with CORS (credentials enabled), JSON parsing, and error-handling middleware must be in place. |
| Google OAuth 2.0 API | External | Requires a Google Cloud project with OAuth 2.0 credentials (Client ID + Secret) and the YouTube Data API v3 enabled. |
| `passport`, `passport-google-oauth20` | External NPM | OAuth 2.0 strategy for Express. |
| `jsonwebtoken`, `@types/jsonwebtoken` | External NPM | JWT signing and verification. |
| `react-router-dom` v6 | External NPM | `<Routes>`, `<Navigate>`, and `useLocation` needed for protected route and redirect logic on the frontend. |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Google OAuth credentials not configured in `.env` | Med | High | Document required env vars clearly in `.env.example`; server startup should fail fast with a descriptive error if they are missing. |
| httpOnly cookie not sent by browser in Vite dev (cross-origin) | Med | High | Ensure `credentials: true` in CORS config and `withCredentials: true` on Axios; document the required Vite proxy or CORS origin setting. |
| Refresh token leakage via XSS | Low | High | Store refresh token exclusively in `httpOnly` cookie; access JWT in memory only; enforce `Content-Security-Policy` header. |
| Google token revocation causing silent API failures in later phases | Med | Med | Detect `401`/`invalid_grant` from YouTube API calls and trigger re-auth flow; surface error to user clearly. |
| Encryption key loss leading to inaccessible stored tokens | Low | High | Document that `ENCRYPTION_KEY` must be backed up; include a note in `.env.example`. |
| JWT secret rotation breaking active sessions | Low | Med | Plan for a graceful rotation strategy (versioned secrets) in a future phase; for now, document that changing `JWT_SECRET` invalidates all sessions. |

## Success Metrics

- Metric 1: A new user can complete the full sign-in flow (click → Google consent → callback → dashboard) in under 5 seconds on a standard connection.
- Metric 2: All protected API endpoints return `401` for requests without a valid JWT (verified by integration tests).
- Metric 3: An authenticated user's session persists across a full page refresh without requiring re-login (refresh token rotation working).
- Metric 4: Logging out clears the refresh cookie and subsequent requests to protected endpoints return `401`.
- Metric 5: No Google tokens or JWTs appear in `localStorage`, session storage, or the browser URL bar at any point.

## Open Questions

- [ ] Should the OAuth callback redirect to the frontend via a short-lived one-time code in the URL (to avoid tokens in the URL), or use a server-side session to pass the JWT to the client via a redirect with a cookie only?
- [ ] Do we need to handle the case where a user revokes Focused Tube's Google access mid-session? If so, should we poll or rely on API call failures?
- [ ] Should `POST /api/auth/refresh` be a dedicated endpoint or handled transparently inside `GET /api/auth/me`?
- [ ] Is a "Sign out of Google" (full Google account sign-out) button needed, or just a local Focused Tube session logout?

## User Stories

| Story | File |
|---|---|
| S4: Google OAuth Backend | [stories/google-oauth-backend.md](stories/google-oauth-backend.md) |
| S5: Auth Middleware | [stories/auth-middleware.md](stories/auth-middleware.md) |
| S6: Auth Frontend | [stories/auth-frontend.md](stories/auth-frontend.md) |
