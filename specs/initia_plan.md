# Focused Tube — Implementation Plan

## Problem Statement

YouTube's recommendation algorithm often surfaces irrelevant content. **Focused Tube** is a web application that lets users create curated profiles — each with a set of subscribed channels and keywords — so they see only the videos they actually care about. Users sign in with Google to import their YouTube subscriptions, then organize them into purpose-built profiles they can switch between.

## Proposed Approach

A monorepo with two workspaces:

| Layer | Tech | Purpose |
|-------|------|---------|
| **client/** | React 18 + TypeScript + Vite | SPA with profile management & video feed UI |
| **server/** | Express + TypeScript | REST API, Google OAuth, YouTube Data API proxy |
| **Database** | SQLite + Prisma ORM | User accounts, profiles, channels, keywords |

Communication: REST JSON API. Auth via Google OAuth 2.0 with JWT session tokens.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                   React SPA                      │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  Auth    │  │ Profile  │  │  Video Feed   │  │
│  │  Context │  │ Manager  │  │  (Combined)   │  │
│  └──────────┘  └──────────┘  └───────────────┘  │
└────────────────────┬────────────────────────────┘
                     │ REST API
┌────────────────────▼────────────────────────────┐
│              Express Server                      │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  Auth    │  │ Profile  │  │  YouTube      │  │
│  │  Routes  │  │ Routes   │  │  Routes       │  │
│  └──────────┘  └──────────┘  └───────────────┘  │
│  ┌──────────┐  ┌──────────────────────────────┐  │
│  │  Prisma  │  │  YouTube Data API v3 Client  │  │
│  │  (SQLite)│  │  (google-apis)               │  │
│  └──────────┘  └──────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

---

## Data Model (Prisma Schema)

```prisma
model User {
  id            String    @id @default(uuid())
  googleId      String    @unique
  email         String    @unique
  name          String
  avatarUrl     String?
  accessToken   String    // YouTube API access (encrypted at rest)
  refreshToken  String    // For token refresh
  profiles      Profile[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Profile {
  id          String           @id @default(uuid())
  name        String
  userId      String
  user        User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  channels    ProfileChannel[]
  keywords    ProfileKeyword[]
  isDefault   Boolean          @default(false)
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  @@unique([userId, name])
}

model ProfileChannel {
  id              String  @id @default(uuid())
  profileId       String
  profile         Profile @relation(fields: [profileId], references: [id], onDelete: Cascade)
  youtubeChannelId String
  channelTitle    String
  thumbnailUrl    String?

  @@unique([profileId, youtubeChannelId])
}

model ProfileKeyword {
  id        String  @id @default(uuid())
  profileId String
  profile   Profile @relation(fields: [profileId], references: [id], onDelete: Cascade)
  keyword   String

  @@unique([profileId, keyword])
}
```

---

## API Design

### Auth Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/auth/google` | Redirect to Google OAuth consent screen |
| GET | `/api/auth/google/callback` | Handle OAuth callback, create/update user, return JWT |
| POST | `/api/auth/logout` | Invalidate session |
| GET | `/api/auth/me` | Get current user info |

### Profile Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/profiles` | List all profiles for current user |
| POST | `/api/profiles` | Create a new profile |
| PUT | `/api/profiles/:id` | Update profile (name, default flag) |
| DELETE | `/api/profiles/:id` | Delete a profile |
| POST | `/api/profiles/:id/channels` | Add channel(s) to profile |
| DELETE | `/api/profiles/:id/channels/:channelId` | Remove channel from profile |
| POST | `/api/profiles/:id/keywords` | Add keyword(s) to profile |
| DELETE | `/api/profiles/:id/keywords/:keywordId` | Remove keyword from profile |

### YouTube / Feed Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/subscriptions` | Fetch user's YouTube subscriptions (from YouTube API) |
| GET | `/api/feed/:profileId` | Get combined video feed for a profile |
| GET | `/api/feed/:profileId?source=subscriptions` | Only subscription-based results |
| GET | `/api/feed/:profileId?source=search` | Only keyword search results |

### Feed Logic
The `/api/feed/:profileId` endpoint combines two data sources:
1. **Subscription feed**: For each channel in the profile, fetch recent uploads via `youtube.search.list(channelId, order=date)`. Optionally further filter by keywords client-side.
2. **Keyword search feed**: For each keyword, call `youtube.search.list(q=keyword, type=video)`.

Each video in the response includes a `source` field: `"subscription"` or `"search"`, so the UI can visually distinguish them. Results are deduplicated by video ID and sorted by publish date.

---

## Frontend Pages & Components

### Pages
1. **Login Page** — Google sign-in button
2. **Dashboard** — Profile switcher (dropdown/tabs) + video feed
3. **Profile Editor** — Manage channels & keywords for a profile
4. **Subscription Picker** — Browse YouTube subscriptions and add channels to a profile

### Key Components
- `<AuthProvider>` — React context for auth state
- `<ProfileSwitcher>` — Dropdown to switch active profile
- `<VideoFeed>` — Infinite-scroll grid of video cards
- `<VideoCard>` — Thumbnail, title, channel, date, source badge ("From Subscription" / "From Search")
- `<ProfileEditor>` — Add/remove channels and keywords
- `<SubscriptionPicker>` — Searchable list of user's YouTube subscriptions with add-to-profile action
- `<KeywordManager>` — Tag-style input for adding/removing keywords

---

## Implementation Phases (User Stories)

### Phase 1: Project Scaffolding & Infrastructure
- **S1: Monorepo setup** — Initialize monorepo with `client/` (Vite + React + TS) and `server/` (Express + TS) workspaces, shared tsconfig, root-level scripts for dev/build.
- **S2: Database & Prisma** — Set up Prisma with SQLite, define schema, generate client, create initial migration.
- **S3: Server foundation** — Express app with middleware (CORS, JSON parsing, error handling), health check endpoint, environment config (.env).

### Phase 2: Authentication
- **S4: Google OAuth backend** — Implement Google OAuth 2.0 flow (passport-google-oauth20 or manual), JWT issuance, user upsert in DB, token refresh logic.
- **S5: Auth middleware** — JWT verification middleware for protected routes, attach user to request.
- **S6: Auth frontend** — Login page, AuthProvider context, token storage (httpOnly cookie or localStorage), protected route wrapper, redirect logic.

### Phase 3: Profile Management
- **S7: Profile CRUD backend** — REST endpoints for creating, listing, updating, deleting profiles. Enforce per-user ownership.
- **S8: Profile channels & keywords backend** — Endpoints for adding/removing channels and keywords to/from profiles.
- **S9: Profile management frontend** — Profile editor page, channel list, keyword tag manager, create/delete profile UI.
- **S10: Profile switcher** — Dropdown/tab component on dashboard to switch active profile, persist last-used profile.

### Phase 4: YouTube Integration & Feed
- **S11: YouTube subscriptions endpoint** — Fetch user's subscriptions from YouTube Data API v3, return channel list with metadata.
- **S12: Subscription picker frontend** — Searchable UI to browse subscriptions and add channels to the active profile.
- **S13: Feed endpoint** — Combine subscription-based and keyword-search feeds, deduplicate, sort by date, include source tags.
- **S14: Video feed frontend** — Dashboard video grid with infinite scroll, source badges, video card components, click-to-watch (open YouTube or embed).

### Phase 5: Polish & UX
- **S15: Error handling & loading states** — Skeleton loaders, error boundaries, toast notifications, retry logic.
- **S16: Responsive design** — Mobile-friendly layout, responsive grid.

### Future (Out of Scope for Now)
- **Caching layer** — Redis or in-memory cache for YouTube API responses to reduce quota usage and improve performance.
- **Video player embed** — Watch videos inline instead of opening YouTube.
- **Profile sharing** — Share a profile's channel/keyword config with others.
- **Notification/new-video alerts** — Periodic checks for new videos matching profiles.

---

## Technical Decisions & Notes

1. **YouTube API Quota**: The YouTube Data API v3 has a daily quota of 10,000 units. `search.list` costs 100 units per call. We should be mindful — batch where possible and design for future caching.
2. **Token Storage**: Google access tokens stored encrypted in the DB. Refresh tokens used to get new access tokens transparently.
3. **JWT Strategy**: Short-lived JWTs (15 min) + refresh token rotation via httpOnly cookies for security.
4. **Caching (future)**: The architecture separates YouTube API calls into a service layer, making it straightforward to add a cache (Redis, node-cache, or similar) in front of API calls later.
5. **CORS**: Server allows requests from the Vite dev server origin during development.
6. **Environment variables**: Google Client ID/Secret, JWT secret, database URL stored in `.env` (gitignored).

---

## File Structure

```
focused-tube/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/          # LoginButton, AuthProvider
│   │   │   ├── feed/          # VideoFeed, VideoCard
│   │   │   ├── profile/       # ProfileSwitcher, ProfileEditor
│   │   │   ├── subscriptions/ # SubscriptionPicker
│   │   │   └── ui/            # Shared UI components
│   │   ├── hooks/             # useAuth, useProfiles, useFeed
│   │   ├── pages/             # LoginPage, Dashboard, ProfileEditPage
│   │   ├── services/          # API client functions
│   │   ├── types/             # TypeScript interfaces
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── package.json
├── server/
│   ├── src/
│   │   ├── routes/            # auth, profiles, feed, subscriptions
│   │   ├── middleware/        # auth, error-handler
│   │   ├── services/          # youtube, profile, auth services
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── utils/             # jwt, encryption, config
│   │   ├── types/             # TypeScript interfaces
│   │   └── index.ts           # Express app entry point
│   ├── tsconfig.json
│   └── package.json
├── .env.example
├── .gitignore
├── package.json               # Root workspace config
├── tsconfig.base.json
└── README.md
```
