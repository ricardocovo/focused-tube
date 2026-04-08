# User Story: Production Readiness for Cloud Hosting

## Summary

**As a** developer,
**I want** the application code updated with production-specific configuration and scripts,
**So that** both the client and server can be built, deployed, and run correctly on Azure without manual intervention.

## Description

Several small but critical changes are needed before the app can run in Azure:

1. **Server start script**: App Service needs a `npm start` command to run the compiled JavaScript. Currently there is only a `dev` script (uses `ts-node-dev`).
2. **SPA routing fallback**: React Router handles routing client-side. Azure Static Web Apps must be told to return `index.html` for all non-asset routes; otherwise, a direct navigation to `/dashboard` returns a 404.
3. **Relative API base URL**: The client's API service must use a relative base URL (`/api`) so calls work via the SWA linked backend proxy instead of hardcoding `localhost:3001`.
4. **Production environment config**: The server's `CLIENT_ORIGIN` and `GOOGLE_CALLBACK_URL` must be configurable via environment variables so they point to the correct Azure hostnames at runtime.

These changes should not affect local development behavior (Vite proxy already handles `/api` in dev).

## Acceptance Criteria

- [ ] Given the app is built with `npm run build` in `server/`, when App Service runs `npm start`, then the compiled Express server starts on the configured port without error.
- [ ] Given the React app is deployed to SWA, when a user navigates directly to a client-side route (e.g., `/dashboard`, `/profiles`), then the page loads correctly without a 404 response.
- [ ] Given `CLIENT_ORIGIN` is set to the SWA production domain, when the API sets cookies or checks CORS headers, then requests from the SWA domain succeed.
- [ ] Given `GOOGLE_CALLBACK_URL` is set to the App Service production URL, when a user completes Google OAuth, then they are redirected to the correct callback and authentication completes.
- [ ] Given the client's API service uses relative URLs, when the app runs behind the SWA linked backend in production, then all API calls resolve correctly without CORS errors.
- [ ] Given `NODE_ENV=production` is set on App Service, when the server starts, then development-only behaviors (e.g., verbose stack traces in errors) are suppressed.

## Tasks

- [ ] Add `"start": "node dist/index.js"` script to `server/package.json`
- [ ] Create `client/staticwebapp.config.json` with navigation fallback configuration for SPA routing:
  ```json
  {
    "navigationFallback": {
      "rewrite": "/index.html",
      "exclude": ["/images/*.{png,jpg,gif}", "/css/*", "/assets/*"]
    }
  }
  ```
- [ ] Read `client/src/services/api.ts` and verify the API base URL is already relative (`/api`); if it is hardcoded to `localhost`, update it to use a relative URL or `import.meta.env.VITE_API_URL || '/api'`
- [ ] Review `server/src/middleware/cors.ts` to confirm `CLIENT_ORIGIN` env var is used for the CORS allowed origins list (not hardcoded)
- [ ] Review all cookie `sameSite` and `secure` settings — ensure `secure: true` is set when `NODE_ENV === 'production'`
- [ ] Review `server/src/routes/auth.ts` to ensure the OAuth redirect and callback use `GOOGLE_CALLBACK_URL` from config (not hardcoded localhost)
- [ ] Add `NODE_ENV=production` to the list of required App Service Application Settings (documented and included in Bicep)
- [ ] Verify `npm run build` in `server/` produces a working `dist/index.js` with no TypeScript errors
- [ ] Verify `npm run build` in `client/` produces a working `dist/` folder with the SPA bundle
- [ ] Test the production build locally: build server, set `NODE_ENV=production`, run `node dist/index.js`, and confirm the server starts and responds to `/api/health`

## Dependencies

> Depends on: Migrate SQLite to Azure SQL (the server must start correctly with the SQL Server `DATABASE_URL` before production build testing is meaningful)

## Out of Scope

- Changes to the UI design or user-facing behavior.
- SSL certificate management (handled by Azure for both SWA and App Service).
- Environment variable injection at client build time (the client only uses `/api` relative URL; no API keys are embedded in the frontend bundle).

## Notes

- `client/staticwebapp.config.json` must be placed in the `client/` root (alongside `index.html`), not in `client/src/`. During `vite build`, it will be copied to `client/dist/` if Vite is configured to include public assets — or it can be placed in `client/public/` to be automatically included.
- Actually, `staticwebapp.config.json` should go in `client/public/` so Vite copies it to `dist/` automatically during build.
- The SWA linked backend proxies any request path starting with `/api` to the App Service. The App Service must therefore still have all API routes mounted under `/api/`.
- For cookies with `SameSite=None; Secure`, the SWA linked backend same-origin setup means this is not needed — the cookie will be same-site from the browser's perspective.
