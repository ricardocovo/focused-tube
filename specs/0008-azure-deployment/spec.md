# Feature: Azure Deployment

## Overview

Deploy the Focused Tube monorepo (React SPA + Express API + SQLite) to Azure using cost-optimized services suitable for a hobby project. The client will be hosted on Azure Static Web Apps (free tier), the API on Azure App Service (B1 Basic, ~$13/mo), and the database migrated from SQLite to Azure SQL Database (free tier). Total estimated monthly cost: **~$13/month**.

## Problem Statement

Focused Tube currently only runs locally. To be useful as a persistent, shareable web app it needs to be deployed to a publicly accessible host. Local SQLite is not suitable for cloud hosting due to ephemeral filesystems, and the app needs a managed database, a scalable API host, and a CDN-backed frontend — with all of this remaining affordable for a hobby project.

## Goals

- [ ] Migrate the database from SQLite to Azure SQL Database (free tier)
- [ ] Deploy the React SPA to Azure Static Web Apps (free tier) with global CDN and SSL
- [ ] Deploy the Express API to Azure App Service (B1 Basic) with Node.js 20 LTS
- [ ] Configure all required environment variables and secrets securely in Azure
- [ ] Enable automatic API routing from SWA to App Service with zero CORS configuration
- [ ] Set up CI/CD via GitHub Actions so every push to `main` redeploys both services
- [ ] Update Google OAuth configuration to work with the production Azure domains

## Non-Goals

- Custom domain configuration (Azure default domains are sufficient)
- Azure Key Vault integration (App Service App Settings provide encryption at rest for secrets)
- Application Insights / monitoring (can be added as a follow-up feature)
- Staging / preview environments beyond what SWA provides automatically
- Database backups beyond what Azure SQL includes automatically

## Target Users / Personas

| Persona | Description |
|---|---|
| Developer (Ricardo) | The sole developer and user of the app; needs a cheap, reliable hosting setup that is easy to redeploy from a laptop via CLI or push to GitHub |
| End user | A person who signs in with Google to manage their curated YouTube feed; needs the app to load fast, stay authenticated across sessions, and be always available |

## Functional Requirements

1. The system shall host the React SPA on Azure Static Web Apps with SPA routing fallback (all unknown paths return `index.html`).
2. The system shall proxy all `/api/*` requests from the SWA domain to the App Service backend using the SWA linked backend feature, eliminating cross-origin cookie or CORS issues.
3. The system shall host the Express API on an Azure App Service (B1 Basic, Node 20 LTS) that starts automatically after deployment.
4. The system shall persist application data in Azure SQL Database (free serverless tier: 100K vCore-sec/month, 32 GB storage).
5. The system shall run Prisma migrations automatically on each server deployment before the API starts accepting traffic.
6. The system shall store all secrets (Google OAuth credentials, JWT secrets, encryption key, database connection string) as encrypted App Service Application Settings.
7. The system shall configure `CLIENT_ORIGIN` and `GOOGLE_CALLBACK_URL` to match production Azure hostnames so OAuth and cookies function correctly.
8. The system shall provide a CI/CD pipeline (GitHub Actions) that builds and deploys both client and server on every push to `main`.
9. The infrastructure shall be defined as code using Bicep templates and deployable end-to-end via Azure Developer CLI (`azd up`).

## Non-Functional Requirements

| Category | Requirement |
|---|---|
| Cost | Total monthly spend ≤ $25. App Service B1 ~$13/mo is the only billable component; SWA free tier and Azure SQL free tier incur no charges. |
| Security | Secrets never committed to source control; stored as App Service Application Settings (encrypted at rest). Traffic served over HTTPS only. |
| Availability | App Service B1 provides always-on mode (no cold starts). Azure SQL serverless auto-pauses after 1 hour of inactivity and resumes on next request. |
| Scalability | B1 App Service handles the hobby-level traffic. Can scale up manually if needed. |
| Accessibility | No changes to the frontend UI; accessibility posture of existing UI is preserved. |
| Performance | SWA serves static assets from Azure CDN edge nodes. API latency depends on App Service region proximity to the user. Deploy to the region closest to the developer. |

## UX / Design Considerations

No changes to the application UI. The deployment affects only infrastructure and configuration:

- **Login flow**: Google OAuth callback URL must point to the App Service (`https://<app>.azurewebsites.net/api/auth/google/callback`) and be registered in Google Cloud Console.
- **API calls from client**: The client must use a relative base URL (`/api`) so that all API calls go through the SWA linked backend proxy, not directly to the App Service origin.
- **Cookie domains**: `CLIENT_ORIGIN` must be set to the SWA domain so that CORS and cookie `SameSite` settings are correctly scoped.

## Technical Considerations

### Azure Services

| Service | Tier | Monthly Cost |
|---|---|---|
| Azure Static Web Apps | Free | $0 |
| Azure App Service Plan | B1 Basic (1 vCore, 1.75 GB RAM) | ~$13 |
| Azure SQL Database | Free serverless (General Purpose) | $0 |

### Database Migration

- Prisma schema uses standard types (`String`, `DateTime`, `Boolean`) with no SQLite-specific SQL. Migration to `sqlserver` provider requires only:
  1. Changing `provider = "sqlite"` → `provider = "sqlserver"` in `schema.prisma`
  2. Deleting old SQLite migration files and regenerating with `prisma migrate dev`
  3. Updating `DATABASE_URL` to Azure SQL connection string format
- All service code uses Prisma ORM exclusively — no raw SQL to update.

### SWA Linked Backend

Azure Static Web Apps supports a "linked backend" feature that proxies requests with path prefix `/api` to a specified Azure App Service. This means:
- No CORS headers need to be set for the SWA domain
- Cookies set by the API are same-origin from the browser's perspective
- The App Service URL does not need to be exposed to the client

### IaC with Bicep + azd

- `azure.yaml` defines the two services (`client`, `server`) and maps them to Azure resource types
- Bicep templates in `infra/` provision all Azure resources declaratively
- `azd up` = provision infrastructure + deploy both apps in one command
- `azd pipeline config` generates GitHub Actions workflows linked to the Azure subscription

### Startup Command

The App Service startup command is:
```
cd /home/site/wwwroot && npm run build && npx prisma migrate deploy && node dist/index.js
```
This ensures TypeScript is compiled, pending migrations are applied, and the server starts — all before App Service marks the instance as healthy.

## Dependencies

| Dependency | Type | Notes |
|---|---|---|
| Azure subscription (Pay-As-You-Go) | External | Must have billing enabled for B1 App Service |
| Google Cloud Console project | External | Must add production callback URL and SWA origin to authorized URIs |
| Azure Developer CLI (`azd`) | External tooling | Required for infrastructure provisioning and CI/CD setup |
| Azure CLI (`az`) | External tooling | Required for some Bicep validation commands |
| Prisma CLI | Internal | Used to regenerate migrations for SQL Server provider |
| Docker (optional) | External tooling | For running SQL Server locally to test migration before deploying |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Azure SQL free tier depletes 100K vCore-sec/month | Low | Medium | Auto-pause after 1h inactivity conserves quota. Monitor usage in Azure Portal. |
| Prisma migration incompatibility between SQLite and SQL Server | Low | High | All code uses standard ORM queries; no raw SQL. Verify with local SQL Server Docker before deploying. |
| Google OAuth `redirect_uri_mismatch` in production | Medium | High | Register the production callback URL in Google Cloud Console before first login attempt. |
| App Service cold start latency | Low | Low | B1 tier with always-on enabled. No cold starts. |
| Secrets accidentally committed to git | Low | High | `.env` is gitignored. Bicep parameters file uses `secureString` type for sensitive values. |
| SWA linked backend propagation delay | Low | Low | After linking, SWA may take a few minutes to route `/api/*` correctly. Verify with `/api/health`. |

## Success Metrics

- The React SPA loads at the SWA URL (`https://*.azurestaticapps.net`) and all routes render correctly.
- `GET https://<swa-url>/api/health` returns HTTP 200 (verifies linked backend proxy works).
- Google OAuth sign-in flow completes end-to-end in production (no `redirect_uri_mismatch`).
- Profile CRUD and feed loading work correctly against Azure SQL data.
- `azd up` provisions and deploys the entire stack from scratch in a fresh environment.
- Monthly Azure cost does not exceed $25 (verified in Azure Portal → Cost Management).

## Open Questions

- [ ] What Azure region should be used for deployment? (Recommend East US or West Europe for lowest latency to most users)
- [ ] Should the Azure SQL `AUTO_PAUSE_DELAY_IN_MINUTES` be tuned? Default is 60 minutes, which is fine for hobby use.
- [ ] Is a separate `staging` slot on App Service useful, or is `main` branch the only deployment target?

## User Stories

> List of all user stories for this feature (links will be added as files are created).

| Story | File |
|---|---|
| Migrate SQLite to Azure SQL | [stories/migrate-sqlite-to-azure-sql.md](stories/migrate-sqlite-to-azure-sql.md) |
| Production Readiness for Cloud Hosting | [stories/production-readiness.md](stories/production-readiness.md) |
| Infrastructure as Code (Bicep + azd) | [stories/infrastructure-as-code.md](stories/infrastructure-as-code.md) |
| CI/CD with GitHub Actions | [stories/cicd-github-actions.md](stories/cicd-github-actions.md) |
| Google OAuth Production Configuration | [stories/google-oauth-production.md](stories/google-oauth-production.md) |
