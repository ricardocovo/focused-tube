# User Story: Conditional OAuth Consent Prompt

## Summary

**As a** returning user,
**I want** to sign in without being forced through the Google consent screen every time,
**So that** my login experience is seamless and my existing authorization is preserved.

## Description

The current OAuth flow in `server/src/routes/auth.ts` always sets `prompt: 'consent'`, which forces the Google consent screen on every login — even for returning users who have already granted the necessary permissions. This creates unnecessary friction, generates a new refresh token each time (invalidating the previous one), and contributes to the perception of excessive "Google grant" consumption. This story makes the consent prompt conditional: only show it for first-time users or when permissions need to be re-granted.

## Acceptance Criteria

- [ ] Given a returning user with a valid refresh token stored in the database, when they click "Sign in with Google", then they are not shown the consent screen (Google silently redirects back).
- [ ] Given a new user who has never signed in, when they click "Sign in with Google", then they see the full consent screen with the requested scopes.
- [ ] Given a returning user whose refresh token is invalid or expired, when silent authentication fails, then the system falls back to showing the consent screen.
- [ ] Given the conditional prompt logic, when `prompt: 'consent'` is used, then `accessType: 'offline'` is also included to ensure a refresh token is issued.
- [ ] Given the updated flow, when a returning user signs in, then their existing refresh token in the database is preserved (not overwritten with an empty value).

## Tasks

- [ ] Add a new route `GET /api/auth/google/check` (or query parameter) that determines whether the user has an existing refresh token by checking a session hint (e.g., a long-lived cookie with the user's Google ID)
- [ ] Modify the `GET /api/auth/google` route to accept a query parameter (e.g., `?returning=true`) that controls whether `prompt: 'consent'` is included
- [ ] When `returning=true`, omit the `prompt` parameter entirely (Google will use its default behavior — skip consent if already granted)
- [ ] When `returning=false` or absent, include `prompt: 'consent'` and `accessType: 'offline'` to ensure a refresh token is issued
- [ ] Update the Passport Google strategy callback to handle the case where `_refreshToken` is `undefined` (returning users may not get a new refresh token) — preserve the existing stored token
- [ ] Add a long-lived `ft_returning_user` cookie (e.g., 90 days, httpOnly, sameSite) that is set after successful first authentication, used to detect returning users on the client
- [ ] Update the client login page to read the `ft_returning_user` cookie and append `?returning=true` to the OAuth URL when present
- [ ] Test the complete flow for: new user (sees consent), returning user (skips consent), returning user with cleared cookies (sees consent again)

## Dependencies

- Depends on: None (independent of caching stories, but part of the same quota-optimization feature)

## Out of Scope

- Revoking Google access tokens
- Supporting multiple Google accounts per Focused Tube user
- Incremental scope authorization (requesting additional scopes after initial consent)

## Notes

- The key insight is that `prompt: 'consent'` forces Google to issue a new refresh token and show the consent screen. Without this parameter, Google uses its default behavior: if the user has already granted the requested scopes, it silently redirects back with only an access token (no new refresh token needed).
- The Passport Google strategy callback must be updated to not overwrite the stored `refreshToken` with an empty string when Google doesn't return one (returning user flow).
- This is a relatively low-risk change since the fallback is always to show the consent screen (existing behavior).
