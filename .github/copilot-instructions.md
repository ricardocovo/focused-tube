# Copilot Instructions for Focused Tube

## Project Overview

Focused Tube is a YouTube overlay web app that lets users create curated profiles — each with subscribed channels and keywords — to bypass YouTube's recommendation algorithm. Users sign in with Google to import their YouTube subscriptions, organize them into profiles, and view a combined feed of subscription-based and keyword-search videos.

## Architecture

Monorepo with two workspaces:

- **`client/`** — React 18 SPA built with Vite and TypeScript
- **`server/`** — Express REST API in TypeScript, with Prisma ORM over SQLite

Communication is via REST JSON API. Authentication uses Google OAuth 2.0 with JWT session tokens. The server proxies all YouTube Data API v3 calls.

### Key data flow

1. User authenticates via Google OAuth → server stores encrypted access/refresh tokens
2. User creates profiles with channels (from their YouTube subscriptions) and keywords
3. Feed endpoint combines two sources per profile:
   - **Subscription feed**: recent uploads from profile's channels via `youtube.search.list`
   - **Keyword search feed**: results for each keyword via `youtube.search.list`
4. Videos are deduplicated by ID, sorted by date, and tagged with their source (`"subscription"` or `"search"`)

### API route structure

All routes are prefixed with `/api/`:
- `/api/auth/*` — Google OAuth flow, session management
- `/api/profiles/*` — Profile CRUD, channel/keyword management
- `/api/subscriptions` — Fetch user's YouTube subscriptions
- `/api/feed/:profileId` — Combined video feed (filterable by `?source=subscriptions|search`)

## Conventions

### Server-side patterns
- Routes live in `server/src/routes/`, one file per resource domain
- Business logic goes in `server/src/services/`, keeping routes thin
- Auth middleware in `server/src/middleware/` attaches the authenticated user to the request
- YouTube API calls are isolated in a service layer to support future caching
- Google access/refresh tokens are stored encrypted — use the encryption utils in `server/src/utils/`
- Environment variables: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `JWT_SECRET`, `DATABASE_URL` (all in `.env`, gitignored)

### Client-side patterns
- Components organized by domain: `auth/`, `feed/`, `profile/`, `subscriptions/`, `ui/`
- Custom hooks in `hooks/` (`useAuth`, `useProfiles`, `useFeed`)
- API client functions in `services/` — all server communication goes through these
- Auth state managed via React context (`AuthProvider`)
- TypeScript interfaces in `types/`

### Database
- Prisma schema at `server/src/prisma/schema.prisma`
- SQLite database file (gitignored)
- Run `npx prisma migrate dev` from `server/` for migrations
- Run `npx prisma generate` after schema changes

## Brand Color Palette

Defined in `references/schema.css`:

| Name | Hex | Usage |
|------|-----|-------|
| Primary Blue | `#11A0D9` | Primary actions, links |
| Light Blue | `#11B4D9` | Secondary accents |
| Mint Green | `#80F2DD` | Success states, highlights |
| Amber | `#F2B441` | Warnings, attention |
| Coral Red | `#F2594B` | Errors, destructive actions |

Use these colors for all UI work. Reference `references/schema.css` for RGBA/HSLA variants.

## Spec-Driven Development

Feature work follows a spec-driven workflow:

1. **Specs** live in `specs/{NNNN}-{feature-name}/spec.md` with user stories in `specs/{NNNN}-{feature-name}/stories/`
2. Use the **feature-spec-generator** agent to create new specs
3. Use the **developer** agent to implement a spec end-to-end (reads spec → plans → implements → validates)

Always read the relevant spec and user stories before implementing a feature.

## YouTube API Quota Awareness

The YouTube Data API v3 has a 10,000 unit daily quota. `search.list` costs 100 units per call. When implementing YouTube-related features:
- Batch API calls where possible
- Keep the service layer cache-friendly (a caching layer will be added later)
- Avoid unnecessary duplicate calls for the same data
