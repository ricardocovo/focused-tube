# User Story: CI/CD with GitHub Actions

## Summary

**As a** developer,
**I want** a CI/CD pipeline that automatically builds and deploys both the client and server to Azure on every push to `main`,
**So that** I can deploy changes by simply pushing code without running any manual CLI commands.

## Description

Azure Developer CLI can generate GitHub Actions workflow files that are pre-configured to deploy to the provisioned Azure resources. Running `azd pipeline config` sets up:

- A service principal (or federated identity credential) with the permissions needed to deploy
- GitHub repository secrets for the Azure credentials and environment configuration
- Workflow YAML files in `.github/workflows/` that build and deploy on push to `main`

For this monorepo, the pipeline needs to:
1. Install dependencies and build `server/` (TypeScript compilation)
2. Install dependencies and build `client/` (Vite bundle)
3. Deploy `server/` build output to Azure App Service
4. Deploy `client/dist/` to Azure Static Web Apps

The pipeline should fail fast on build errors before any deployment occurs.

## Acceptance Criteria

- [ ] Given a push to the `main` branch on GitHub, when the Actions workflow runs, then both the client and server are deployed to Azure automatically without manual intervention.
- [ ] Given a TypeScript compilation error in `server/`, when a commit is pushed to `main`, then the workflow fails at the build step and no deployment occurs.
- [ ] Given a Vite build error in `client/`, when a commit is pushed to `main`, then the workflow fails at the build step and no deployment occurs.
- [ ] Given the workflow completes successfully, when the SWA URL is visited in a browser, then the latest code is live.
- [ ] Given the workflow completes successfully, when `GET /api/health` is called, then the latest server code is running (verifiable by a version or timestamp endpoint if one exists).
- [ ] Given no sensitive values are stored in workflow YAML, when a developer reviews `.github/workflows/`, then all secrets are referenced via `${{ secrets.VARIABLE_NAME }}` from GitHub repository secrets.

## Tasks

- [ ] Ensure `azd up` has been run at least once (required to have a provisioned environment before `azd pipeline config` can link to it)
- [ ] Run `azd pipeline config` from the workspace root — this generates workflow files and sets up GitHub secrets automatically
- [ ] Review the generated workflow file(s) in `.github/workflows/` — verify build steps for both `client/` and `server/` are correct
- [ ] Verify the generated workflow installs dependencies with `npm ci` (not `npm install`) for reproducible builds
- [ ] Verify the server build step runs `npm run build` in `server/` to compile TypeScript
- [ ] Verify the client build step runs `npm run build` in `client/` to produce `dist/`
- [ ] Verify `prisma generate` runs in the server build step (it runs automatically via `postinstall` on `npm ci`)
- [ ] Confirm GitHub repository secrets are set (visible in GitHub → Settings → Secrets → Actions): `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID` (federated) or `AZURE_CREDENTIALS` (service principal JSON)
- [ ] Confirm Google OAuth and JWT secrets are also set as GitHub secrets if the pipeline sets App Settings during deployment
- [ ] Trigger a manual test push to `main` and verify the workflow runs to completion in GitHub Actions
- [ ] Verify the deployed app is functional after the pipeline run (load SWA URL, test `/api/health`, test login flow)

## Dependencies

> Depends on: Infrastructure as Code (Bicep + azd) — `azd pipeline config` requires an already-provisioned environment with resources in Azure.

> Depends on: Production Readiness — build scripts (`npm run build`) must work correctly in both `client/` and `server/` before the pipeline can succeed.

## Out of Scope

- Pull request preview deployments (SWA already supports this automatically for PRs via its built-in staging environments).
- Running automated tests in the pipeline (no test suite exists yet; can be added when tests are written).
- Separate staging and production environments.
- Manual approval gates before production deployment.

## Notes

- `azd pipeline config` supports both federated identity credentials (OIDC, recommended) and service principal JSON. OIDC is preferred as it avoids long-lived secrets but requires GitHub Actions OIDC support.
- If `azd pipeline config` generates a single monorepo workflow, verify it handles both `./client` and `./server` subdirectories.
- SWA has its own deployment token (`AZURE_STATIC_WEB_APPS_API_TOKEN_*`) that is separate from the main Azure credentials. `azd pipeline config` should set this automatically.
- The App Service deploy step uses `azure/webapps-deploy` GitHub Action or `azd deploy` — either works, but the `azd`-generated workflow is the simplest starting point.
- After `azd pipeline config`, the generated workflow files should be reviewed and committed to the repository.
