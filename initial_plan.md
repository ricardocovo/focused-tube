# Focused-Tube: Curated YouTube Feed Web App

## Context

A web app that acts as a layer over YouTube, allowing users to escape the algorithm. Users sign in with Google, create multiple "profiles" — each containing selected channels (from their YouTube subscriptions) and keyword filters — and view a curated feed showing only matching videos. Multiple profiles allow quick context switching (e.g. "tech news" vs "cooking").

The project currently has no application code — just APM configuration files.

---

## Tech Stack

**Next.js 14 (App Router) + TypeScript + NextAuth.js v5 + Prisma + SQLite + Tailwind CSS**

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 App Router | Full-stack in one repo; API routes + SSR |
| Auth | NextAuth.js v5 | Google OAuth built-in; persists access token in JWT for YouTube API calls |
| Database | Prisma + SQLite | Zero-config, single file; trivially upgradeable to Postgres |
| Styling | Tailwind CSS | Rapid utility-first styling |
| YouTube API | googleapis (npm) | Official Google client library |

---

## Project Structure

```
focused-tube/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── layout.tsx                              # Root layout (SessionProvider)
│   │   ├── page.tsx                                # Landing / sign-in page
│   │   ├── (auth)/auth/[...nextauth]/route.ts      # NextAuth handler
│   │   ├── (app)/                                  # Auth-guarded route group
│   │   │   ├── layout.tsx                          # App shell: nav + profile switcher
│   │   │   ├── feed/page.tsx                       # Main curated feed
│   │   │   └── profiles/
│   │   │       ├── page.tsx                        # Profile list
│   │   │       ├── new/page.tsx                    # Create profile
│   │   │       └── [id]/
│   │   │           ├── page.tsx                    # Edit profile
│   │   │           └── channels/page.tsx           # Channel picker
│   │   └── api/
│   │       ├── profiles/route.ts                   # GET list, POST create
│   │       ├── profiles/[id]/route.ts              # GET, PUT, DELETE
│   │       ├── profiles/[id]/channels/route.ts     # GET, POST, DELETE
│   │       ├── feed/route.ts                       # GET curated feed
│   │       └── youtube/subscriptions/route.ts      # GET user's subscriptions
│   ├── lib/
│   │   ├── auth.ts        # NextAuth config
│   │   ├── db.ts          # Prisma client singleton
│   │   ├── youtube.ts     # YouTube Data API v3 wrapper
│   │   └── feed.ts        # Feed assembly + keyword filtering
│   ├── components/
│   │   ├── ProfileSwitcher.tsx
│   │   ├── VideoCard.tsx
│   │   ├── ChannelPicker.tsx
│   │   ├── KeywordEditor.tsx
│   │   └── FeedGrid.tsx
│   └── types/index.ts
├── middleware.ts            # Auth guard for (app) routes
├── .env.local               # Never committed
├── .env.example
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## Data Models (`prisma/schema.prisma`)

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String    @id @default(cuid())
  email     String    @unique
  name      String?
  image     String?
  googleId  String    @unique
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  profiles  Profile[]
}

model Profile {
  id        String           @id @default(cuid())
  userId    String
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  name      String
  keywords  String           // JSON array stored as string: ["news","typescript"]
  isDefault Boolean          @default(false)
  createdAt DateTime         @default(now())
  updatedAt DateTime         @updatedAt
  channels  ProfileChannel[]
}

model ProfileChannel {
  id                String   @id @default(cuid())
  profileId         String
  profile           Profile  @relation(fields: [profileId], references: [id], onDelete: Cascade)
  channelId         String   // YouTube channel ID (e.g. "UCxxxxxx")
  channelTitle      String   // Cached channel name
  channelThumb      String?  // Cached thumbnail URL
  uploadsPlaylistId String?  // Cached for quota optimization (never changes)
  addedAt           DateTime @default(now())

  @@unique([profileId, channelId])
}
```

---

## API Endpoints

| Route | Method | Description |
|---|---|---|
| `/api/auth/[...nextauth]` | GET/POST | OAuth flow (handled by NextAuth) |
| `/api/profiles` | GET | List all profiles for authed user |
| `/api/profiles` | POST | Create new profile |
| `/api/profiles/[id]` | GET | Get single profile with channels |
| `/api/profiles/[id]` | PUT | Update name, keywords, isDefault |
| `/api/profiles/[id]` | DELETE | Delete profile and its channels |
| `/api/profiles/[id]/channels` | GET | List channels in profile |
| `/api/profiles/[id]/channels` | POST | Add channel to profile |
| `/api/profiles/[id]/channels/[channelId]` | DELETE | Remove channel from profile |
| `/api/youtube/subscriptions` | GET | User's YouTube subscriptions (proxied, 1hr cache) |
| `/api/feed?profileId=xxx` | GET | Assembled, filtered, sorted video feed |

---

## YouTube API Quota Strategy

**The critical optimization:** `search.list` costs 100 units/call. A 10-channel profile costs 1,000 units per feed load (daily limit: 10,000). Use the **uploads playlist trick** instead:

| Operation | API Method | Cost |
|---|---|---|
| Get uploads playlist ID (once, cached forever) | `channels.list` | 1 unit |
| Get recent videos | `playlistItems.list` | 1 unit per 50 results |
| (avoided) Search videos | `search.list` | 100 units |

Implementation:
1. On first channel add to profile: call `channels.list?part=contentDetails&id={channelId}` → store `uploadsPlaylistId` in `ProfileChannel`
2. Feed load: call `playlistItems.list?playlistId={uploadsPlaylistId}&maxResults=10` per channel
3. Cache per-channel video lists for 30–60 min via Next.js `unstable_cache`
4. **No auto-refresh** — show a manual "Refresh feed" button to prevent runaway quota use
5. Surface a friendly error when quota is exceeded (YouTube returns 403)

---

## Feed Assembly Logic (`src/lib/feed.ts`)

```
buildFeed(profile, accessToken):
  1. Load profile.channels (with uploadsPlaylistId)
  2. Parse keywords = JSON.parse(profile.keywords)
  3. For each channel (in parallel):
       a. If uploadsPlaylistId missing: fetch + save it
       b. Fetch recent videos via playlistItems.list (cached)
  4. Flatten all videos into one array
  5. If keywords.length > 0:
       filter: keep video if title OR description contains any keyword (case-insensitive)
  6. Sort by publishedAt descending
  7. Return paginated slice
```

---

## Auth Token Flow (`src/lib/auth.ts`)

```typescript
// Google OAuth scope — youtube.readonly is required
scope: "openid email profile https://www.googleapis.com/auth/youtube.readonly"

// jwt callback: persist tokens
async jwt({ token, account }) {
  if (account) {
    token.accessToken = account.access_token
    token.refreshToken = account.refresh_token
    token.expiresAt = account.expires_at
  }
  // Refresh if expired
  if (Date.now() < token.expiresAt * 1000) return token
  return refreshGoogleToken(token)
}

// session callback: expose accessToken to API routes
async session({ session, token }) {
  session.accessToken = token.accessToken
  return session
}
```

---

## Implementation Phases

### Phase 1 — Bootstrap
1. `npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*"`
2. Install deps: `prisma @prisma/client next-auth@beta @auth/prisma-adapter googleapis`
3. `npx prisma init --datasource-provider sqlite`
4. Write `prisma/schema.prisma`, run `npx prisma migrate dev --name init`
5. Create `src/lib/db.ts` Prisma client singleton

### Phase 2 — Google OAuth
6. Create Google Cloud project → enable YouTube Data API v3 + OAuth 2.0
7. Set authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
8. Write `src/lib/auth.ts` — GoogleProvider + PrismaAdapter + JWT/session callbacks
9. Create `src/app/(auth)/auth/[...nextauth]/route.ts`
10. Write `middleware.ts` — protect all `/(app)` routes

### Phase 3 — Profile CRUD API
11. `/api/profiles` — GET, POST (auto-set `isDefault: true` on first profile)
12. `/api/profiles/[id]` — GET, PUT, DELETE (always verify ownership)
13. `/api/profiles/[id]/channels` — GET, POST (store cached channel info), DELETE

### Phase 4 — YouTube Integration
14. Write `src/lib/youtube.ts`:
    - `getSubscriptions(accessToken, pageToken?)` → `subscriptions.list`
    - `getUploadsPlaylistId(accessToken, channelId)` → `channels.list`
    - `getRecentVideos(accessToken, uploadsPlaylistId, maxResults)` → `playlistItems.list`
15. `/api/youtube/subscriptions` — proxy with 1hr `unstable_cache`
16. Write `src/lib/feed.ts` — `buildFeed()` with parallel fetches + keyword filter
17. `/api/feed?profileId=xxx` — orchestrates feed.ts with auth + caching + error handling

### Phase 5 — Frontend
18. Landing page (`page.tsx`) — Google sign-in button, app value proposition
19. App shell layout — top nav + `ProfileSwitcher` dropdown + sign-out
20. Feed page — `FeedGrid` of `VideoCard` + manual refresh button
21. `VideoCard` — thumbnail, title (→ `youtube.com/watch?v=xxx`), channel name, relative time
22. Profile list + create/edit forms with name input
23. `KeywordEditor` — add/remove keyword pills (tag input)
24. `ChannelPicker` — subscription list with checkboxes, pre-checked for existing channels

### Phase 6 — Polish
25. Loading skeletons for feed and channel picker
26. Error states: quota exceeded (403), token expired, network failure
27. Token refresh in NextAuth `jwt` callback
28. `tsc --noEmit` type-check pass

---

## Environment Variables (`.env.local`)

```bash
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET=""   # generate: openssl rand -hex 32

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

---

## Verification Checklist

- [ ] `npm run dev` → app loads at `http://localhost:3000`
- [ ] Sign in with Google → redirected to `/feed`, session contains user info
- [ ] `/profiles/new` → create "Tech" profile with keyword "typescript"
- [ ] Channel picker → subscriptions load, select 2–3 channels, save
- [ ] `/feed` → videos appear, filtered by keyword
- [ ] Create "Gaming" profile with different channels/keywords
- [ ] Profile switcher → feed updates correctly
- [ ] Check Google Cloud Console API quota after a few feed loads
- [ ] Quota error (403) → friendly error message shown
- [ ] Sign out → redirected to landing page, protected routes inaccessible
