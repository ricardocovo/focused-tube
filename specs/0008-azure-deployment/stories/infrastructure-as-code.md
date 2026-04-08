# User Story: Infrastructure as Code (Bicep + azd)

## Summary

**As a** developer,
**I want** all Azure infrastructure defined as Bicep templates deployable with a single `azd up` command,
**So that** the entire stack (SWA + App Service + Azure SQL) can be provisioned reproducibly from scratch without manual portal clicks.

## Description

All Azure resources will be defined declaratively using Bicep templates and orchestrated by Azure Developer CLI (`azd`). This provides:

- **Repeatability**: Any developer can run `azd up` to create a fresh environment.
- **Version control**: Infrastructure changes are tracked in git alongside application code.
- **Secret management**: App Service Application Settings are set from parameters (prompted by `azd`) and never stored in plaintext in source control.
- **Linked backend**: The SWA → App Service linked backend connection is configured in Bicep, eliminating the need for manual CORS setup.

The resources to provision:

| Resource | Bicep Module | Notes |
|---|---|---|
| Azure SQL Server | `infra/modules/sql.bicep` | Admin password from parameter |
| Azure SQL Database | `infra/modules/sql.bicep` | Free serverless tier, auto-pause after 60 min |
| App Service Plan | `infra/modules/appservice.bicep` | B1 Basic SKU |
| App Service (Web App) | `infra/modules/appservice.bicep` | Node 20 LTS, all env vars as App Settings |
| Azure Static Web App | `infra/modules/staticwebapp.bicep` | Free tier |
| SWA Linked Backend | `infra/modules/staticwebapp.bicep` | Links SWA to App Service |

## Acceptance Criteria

- [ ] Given a clean Azure subscription with no existing resources, when `azd up` is run from the workspace root, then all resources are provisioned and both services are deployed successfully.
- [ ] Given the Bicep templates are in `infra/`, when `az deployment group validate` is run, then no validation errors are returned.
- [ ] Given `azd up` completes, when `GET https://<swa-url>/api/health` is called, then it returns HTTP 200 (confirms SWA linked backend is routing to App Service).
- [ ] Given `azd up` completes, when the React app is loaded in a browser at the SWA URL, then the app renders and all client-side routes work (no 404s).
- [ ] Given the App Service is running, when the startup command executes, then Prisma migrations are applied and the server starts without errors (visible in App Service logs).
- [ ] Given all Azure resources are defined in Bicep, when `azd down` is run, then all resources are deleted cleanly without orphan resources.
- [ ] Given the `infra/main.parameters.json` file, when a developer reviews it, then no secrets are hardcoded — sensitive parameters use `secureString` type and are resolved from `azd` prompts or environment.

## Tasks

- [ ] Install Azure Developer CLI (`azd`) if not already installed: `winget install microsoft.azd`
- [ ] Create `azure.yaml` at workspace root defining the project and two services:
  - `client` service: language `js`, host `staticwebapp`, project `./client`, build command `npm run build`, output path `dist`
  - `server` service: language `js`, host `appservice`, project `./server`, build command `npm run build`
- [ ] Create `infra/main.bicep` as the orchestrator that calls all child modules and passes outputs between them (e.g., App Service URL → SWA linked backend)
- [ ] Create `infra/main.parameters.json` with all deployment parameters (use `${AZURE_ENV_NAME}` convention for resource naming)
- [ ] Create `infra/modules/sql.bicep` that provisions:
  - `Microsoft.Sql/servers` — Azure SQL Server with SQL authentication, public access enabled (Azure services allowed), firewall rule for Azure services
  - `Microsoft.Sql/servers/databases` — Free serverless database (`sku: { name: "GP_S_Gen5_1", tier: "GeneralPurpose", family: "Gen5", capacity: 1 }`), `autoPauseDelay: 60`, `minCapacity: 0.5`
  - Output: SQL Server FQDN and database name
- [ ] Create `infra/modules/appservice.bicep` that provisions:
  - `Microsoft.Web/serverfarms` — App Service Plan, B1 Basic SKU, Linux
  - `Microsoft.Web/sites` — Web App, Node 20 LTS (`linuxFxVersion: 'NODE|20-lts'`), always-on enabled
  - App Settings: `DATABASE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ENCRYPTION_KEY`, `GOOGLE_CALLBACK_URL`, `CLIENT_ORIGIN`, `NODE_ENV=production`, `PORT=3001`
  - Startup command: `cd /home/site/wwwroot && npm run build && npx prisma migrate deploy && node dist/index.js`
  - Output: App Service default hostname (e.g., `https://<name>.azurewebsites.net`)
- [ ] Create `infra/modules/staticwebapp.bicep` that provisions:
  - `Microsoft.Web/staticSites` — Free tier Static Web App
  - `Microsoft.Web/staticSites/linkedBackends` — links the SWA to the App Service backend with the `/api` prefix
  - Output: SWA default hostname (e.g., `https://<name>.azurestaticapps.net`)
- [ ] Parameterize all secrets in `infra/main.bicep` as `@secure()` parameters: `sqlAdminPassword`, `googleClientId`, `googleClientSecret`, `jwtSecret`, `jwtRefreshSecret`, `encryptionKey`
- [ ] Add `infra/` directory to `.gitignore` exceptions (Bicep files should be committed; `.azure/` folder with azd state should be gitignored)
- [ ] Add `.azure/` to `.gitignore` (azd state contains subscription IDs and should not be committed)
- [ ] Run `azd provision` (dry run with `--preview` if available) to validate all Bicep templates against a real Azure subscription
- [ ] Run `azd up` end-to-end to verify full provisioning and deployment
- [ ] Confirm in Azure Portal that: SQL Server and database exist, App Service is running, SWA is deployed, linked backend is configured
- [ ] Verify `GET https://<swa-url>/api/health` returns 200

## Dependencies

> Depends on: Migrate SQLite to Azure SQL (schema.prisma must have `provider = "sqlserver"` before App Service can start with Azure SQL)

> Depends on: Production Readiness (server must have a `start` script and client must have `staticwebapp.config.json` before azd deploy works)

## Out of Scope

- Azure Key Vault integration (secrets go directly into App Service App Settings).
- Virtual network / private endpoints (overkill for a hobby project).
- Multiple environments (dev/staging/prod) — single environment only.
- Custom domain or TLS certificate configuration.

## Notes

- `azd` expects an `azure.yaml` at the workspace root. The monorepo has `client/` and `server/` as subdirectories — both are mapped as separate services in `azure.yaml`.
- For the App Service startup command, note that `npm run build` will recompile TypeScript from source on each deployment. This is simpler than uploading pre-built artifacts via a separate CI step, and B1 CPU is sufficient for the build time.
- The Azure SQL free database tier (`GP_S_Gen5_1`) is **1 free database per subscription**. If the subscription already has a free database, use a paid tier (e.g., `Basic` at ~$5/mo).
- SQL Server firewall: enable "Allow Azure services and resources to access this server" so App Service can connect. Do not open to all public IPs.
- The `DATABASE_URL` constructed for Prisma from Bicep outputs: `sqlserver://<fqdn>:1433;database=<dbname>;user=<adminLogin>@<serverName>;password=<adminPassword>;encrypt=true;trustServerCertificate=false;`
- `GOOGLE_CALLBACK_URL` will be `https://<appservicehostname>/api/auth/google/callback` — derived from the App Service output hostname in Bicep.
- `CLIENT_ORIGIN` will be `https://<swa-hostname>` — derived from the SWA output hostname in Bicep.
