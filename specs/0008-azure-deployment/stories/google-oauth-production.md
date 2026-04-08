# User Story: Google OAuth Production Configuration

## Summary

**As a** developer,
**I want** Google OAuth configured to work with the production Azure domains,
**So that** users can sign in with Google when accessing the app on Azure without `redirect_uri_mismatch` or CORS errors.

## Description

Google OAuth requires that all authorized JavaScript origins and redirect URIs are explicitly registered in the Google Cloud Console. When running locally, `http://localhost:3001` and `http://localhost:5173` are used. In production, the Azure App Service and SWA domains are different and must be registered.

Additionally, the `GOOGLE_CALLBACK_URL` environment variable in the server config must point to the App Service production URL, and the `passport-google-oauth20` strategy must use this value at runtime rather than the localhost default.

Without these changes, any sign-in attempt in production will result in a Google OAuth error: **"Error 400: redirect_uri_mismatch"**.

## Acceptance Criteria

- [ ] Given the app is running on Azure with production URLs, when a user clicks "Sign in with Google", then they are redirected to Google's consent screen without a `redirect_uri_mismatch` error.
- [ ] Given the user approves the consent screen, when Google redirects to the callback URL, then the App Service receives the callback, creates/updates the user in Azure SQL, and sets the session cookie correctly.
- [ ] Given the OAuth flow completes, when the browser returns to the SWA URL, then the user is authenticated and the dashboard loads.
- [ ] Given `GOOGLE_CALLBACK_URL` is set as an App Service Application Setting, when the server starts, then `passport-google-oauth20` is configured with the production callback URL (not the localhost default from config.ts).
- [ ] Given the SWA domain is registered as an authorized JavaScript origin in Google Cloud Console, when the app loads in a browser at the SWA URL, then no browser console errors appear related to blocked cross-origin requests by Google.

## Tasks

- [ ] After `azd up` completes and the App Service URL is known, open Google Cloud Console → APIs & Services → Credentials → the OAuth 2.0 Client ID used by this app
- [ ] Add the production App Service callback URL to **Authorized redirect URIs**: `https://<appservice-name>.azurewebsites.net/api/auth/google/callback`
- [ ] Add the production SWA hostname to **Authorized JavaScript origins**: `https://<swa-name>.azurestaticapps.net`
- [ ] Keep the existing localhost entries for local development: `http://localhost:3001` in redirect URIs, `http://localhost:5173` in origins
- [ ] Verify `GOOGLE_CALLBACK_URL` App Service Application Setting is set to the production callback URL (should be set by Bicep using the App Service output hostname)
- [ ] Read `server/src/config/passport.ts` — confirm the `callbackURL` option in the Google strategy uses `config.GOOGLE_CALLBACK_URL` (not a hardcoded string)
- [ ] If `callbackURL` is hardcoded or uses a localhost default, update it to use `config.GOOGLE_CALLBACK_URL`
- [ ] Test the full OAuth flow in production:
  1. Navigate to `https://<swa-name>.azurestaticapps.net`
  2. Click "Sign in with Google"
  3. Complete Google consent
  4. Verify redirect back to the SWA and successful authentication
  5. Verify user record in Azure SQL database was created or updated
- [ ] Verify the session persists across page refreshes (JWT cookie is set correctly with `secure: true`)
- [ ] Verify sign-out flow works correctly in production

## Dependencies

> Depends on: Infrastructure as Code (Bicep + azd) — the App Service and SWA URLs must be known (post-provisioning) before they can be registered in Google Cloud Console.

> Depends on: Production Readiness — `GOOGLE_CALLBACK_URL` must be read from env config, not hardcoded.

## Out of Scope

- Changing or rotating the Google OAuth client ID/secret (use existing credentials from development).
- Adding other OAuth providers (Google only).
- Implementing email-based sign-in or username/password authentication.

## Notes

- The `redirect_uri_mismatch` error is one of the most common OAuth issues in production deployments. It occurs when the `redirect_uri` sent by the app doesn't exactly match any registered URI in Google Cloud Console — including trailing slashes and protocol (http vs https).
- Google Cloud Console changes to OAuth credentials may take a few minutes to propagate globally.
- The SWA linked backend means the browser never directly calls the App Service URL — all API calls go to `https://<swa>.azurestaticapps.net/api/...`. However, Google OAuth redirects the user's browser *directly* to the `callbackURL` (i.e., the App Service URL), not through the SWA proxy. This is expected behavior — the callback sets the cookie on the App Service domain, but since the session is a JWT stored in an HttpOnly cookie, the frontend uses the shared `/api/` path via SWA for all subsequent requests.
- **Cookie domain consideration**: If the JWT cookie is set with `domain: .azurewebsites.net`, it would be accessible from the SWA proxy path. However, since the SWA linked backend sends requests to the App Service, the App Service sets the cookie on the SWA domain response — verify cookie behavior end-to-end after the OAuth callback.
- If cookies don't work as expected via the SWA linked backend, an alternative is to redirect from the App Service callback back to the SWA URL with the JWT as a query parameter, then store it in localStorage. This is a fallback approach and should be avoided if cookies work correctly.
