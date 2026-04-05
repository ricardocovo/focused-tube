# User Story: S4 — Google OAuth Backend

## Summary

**As a** developer building Focused Tube,
**I want** a complete Google OAuth 2.0 backend flow that exchanges authorisation codes for Google tokens, upserts user records in the database with encrypted tokens, and issues JWTs for session management,
**So that** users can securely sign in with their Google account and the app can make authorised YouTube API calls on their behalf.

## Description

This story implements the server-side half of authentication. It covers everything from receiving Google's OAuth authorisation code through to returning a session JWT to the client. The backend must handle first-time sign-ups (inserting a new `User` row) and returning users (updating their tokens), store Google tokens encrypted at rest, and issue short-lived JWTs alongside a long-lived refresh token in an httpOnly cookie. A token refresh endpoint allows the client to obtain a new access JWT without requiring the user to re-authenticate with Google.

The implementation should use `passport` + `passport-google-oauth20` for the OAuth flow, `jsonwebtoken` for JWT operations, and a custom `encryption.ts` utility (using Node's built-in `crypto`, AES-256-GCM) for token storage.

## Acceptance Criteria

- [ ] Given a user navigates to `GET /api/auth/google`, when the handler is invoked, then the server redirects the browser to Google's OAuth 2.0 consent screen with the correct `client_id`, `redirect_uri`, and scopes (`profile email https://www.googleapis.com/auth/youtube.readonly`).
- [ ] Given Google redirects back to `GET /api/auth/google/callback` with a valid code, when the callback is processed, then a `User` record is upserted in the database with the user's `googleId`, `email`, `name`, `avatarUrl`, and encrypted `accessToken` and `refreshToken`.
- [ ] Given a successful callback, when the JWT is issued, then it is signed with `JWT_SECRET`, contains `{ sub: userId }`, and expires in 15 minutes.
- [ ] Given a successful callback, when the refresh token cookie is set, then it uses `httpOnly: true`, `sameSite: 'lax'`, `secure: true` (in production), and has a 30-day expiry.
- [ ] Given `GET /api/auth/me` is called with a valid JWT, when the handler runs, then it returns `{ id, email, name, avatarUrl }` for the authenticated user.
- [ ] Given `POST /api/auth/logout` is called, when the handler runs, then the refresh token cookie is cleared and a `200` response is returned.
- [ ] Given `POST /api/auth/refresh` is called with a valid refresh token cookie, when the handler runs, then a new access JWT is returned in the response body and the refresh cookie is rotated (new cookie issued, old value invalidated).
- [ ] Given `POST /api/auth/refresh` is called with a missing or invalid refresh token cookie, when the handler runs, then a `401 Unauthorized` response is returned.
- [ ] Given Google tokens are stored in the database, when they are read back and decrypted, then the plaintext values match the original tokens from Google.
- [ ] Given the `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `JWT_SECRET`, or `ENCRYPTION_KEY` environment variables are missing at startup, when the server starts, then it throws a descriptive error and exits.

## Tasks

- [ ] Install server dependencies: `passport`, `passport-google-oauth20`, `@types/passport`, `@types/passport-google-oauth20`, `jsonwebtoken`, `@types/jsonwebtoken`
- [ ] Add required environment variables to `.env.example`: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ENCRYPTION_KEY`
- [ ] Create `server/src/utils/config.ts` that reads and validates all required env vars at startup, throwing a descriptive error if any are missing
- [ ] Create `server/src/utils/encryption.ts` with `encrypt(plaintext: string): string` and `decrypt(ciphertext: string): string` functions using Node `crypto` AES-256-GCM; store IV prepended to ciphertext in base64
- [ ] Write unit tests for `encryption.ts` verifying round-trip encrypt/decrypt and that ciphertexts differ between calls (random IV)
- [ ] Create `server/src/utils/jwt.ts` with `signAccessToken(userId: string): string`, `signRefreshToken(userId: string): string`, and `verifyAccessToken(token: string): JwtPayload` helpers
- [ ] Write unit tests for `jwt.ts` covering valid tokens, expired tokens, and tampered signatures
- [ ] Create `server/src/services/auth.service.ts` with `upsertUser(profile: GoogleProfile, tokens: GoogleTokens): Promise<User>` that encrypts tokens and calls Prisma `upsert` on the `User` model
- [ ] Configure Passport in `server/src/config/passport.ts` with the `GoogleStrategy`, pointing `callbackURL` to `GOOGLE_CALLBACK_URL`, and wiring the verify callback to `auth.service.upsertUser`
- [ ] Register Passport in the Express app (`server/src/index.ts`) with `app.use(passport.initialize())`
- [ ] Create `server/src/routes/auth.ts` and implement `GET /api/auth/google` using `passport.authenticate('google', { scope: [...] })`
- [ ] Implement `GET /api/auth/google/callback` handler: run Passport callback, sign access JWT, set refresh token httpOnly cookie, redirect to frontend with access token as a short-lived query param or via a server-set cookie
- [ ] Implement `GET /api/auth/me` handler (requires auth middleware from S5): query Prisma for the user by `req.user.id` and return `{ id, email, name, avatarUrl }`
- [ ] Implement `POST /api/auth/logout` handler: clear the refresh token cookie and return `{ message: 'Logged out' }`
- [ ] Implement `POST /api/auth/refresh` handler: read refresh cookie, verify with `JWT_REFRESH_SECRET`, look up user, issue new access JWT and new refresh cookie (rotation)
- [ ] Register the auth router on the Express app under `/api/auth`
- [ ] Write integration tests for the full OAuth callback flow using a mocked Passport strategy (verify user upsert, JWT issuance, cookie setting)
- [ ] Write integration tests for `POST /api/auth/logout` and `POST /api/auth/refresh`
- [ ] Update `README.md` with setup steps for Google Cloud OAuth credentials and required env vars

## Dependencies

- Depends on: Phase 1 — S1 (monorepo/server workspace exists with TypeScript config)
- Depends on: Phase 1 — S2 (Prisma `User` model with `googleId`, `email`, `name`, `avatarUrl`, `accessToken`, `refreshToken` fields migrated)
- Depends on: Phase 1 — S3 (Express app with CORS `credentials: true`, JSON body parser, and error-handling middleware in place)

## Out of Scope

- Auth middleware / JWT verification on protected routes (covered in S5)
- Any frontend UI or React context (covered in S6)
- YouTube API calls using the stored tokens (Phase 4)
- Revoking Google access or handling mid-session token revocation (future phase)
- Admin roles or multi-provider auth

## Notes

- The `ENCRYPTION_KEY` must be exactly 32 bytes (256 bits) when decoded. Document this constraint in `.env.example` with a generation command: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
- After the OAuth callback, avoid putting the access JWT in the redirect URL query string in production — prefer setting it as a second short-lived cookie or passing it through a server-side session. For the initial implementation a short-lived cookie is acceptable; note the open question in `spec.md`.
- The `User.accessToken` and `User.refreshToken` Prisma fields store encrypted ciphertext; the service layer is responsible for encrypting before write and decrypting after read.
- Passport `serializeUser` / `deserializeUser` are NOT needed since we are using JWTs, not server-side sessions. Call `passport.initialize()` but not `passport.session()`.
