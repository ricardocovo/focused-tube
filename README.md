# Focused Tube

A YouTube overlay web app that lets users create curated profiles to bypass YouTube's recommendation algorithm.

## Prerequisites

- Node.js ≥ 18
- npm ≥ 8

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy environment config: `cp .env.example .env` (fill in values)
4. Start development: `npm run dev`

## Development

- `npm run dev` — starts both client (port 5173) and server (port 3001)
- `npm run build` — builds both workspaces

## Database

This project uses SQLite via [Prisma ORM](https://www.prisma.io/). The schema lives at `server/src/prisma/schema.prisma`.

### Setup

```bash
cd server
npx prisma generate      # Generate the Prisma Client
npx prisma migrate dev   # Apply migrations (creates the SQLite DB)
```

### Useful commands

| Command | Description |
|---|---|
| `npx prisma studio` | Open the visual database editor |
| `npx prisma migrate dev --name <name>` | Create a new migration |
| `npx prisma migrate reset` | Reset the database |
| `npx prisma generate` | Regenerate the Prisma Client after schema changes |

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 3001) |
| `CLIENT_ORIGIN` | Frontend URL for CORS (default: http://localhost:5173) |
| `DATABASE_URL` | SQLite connection string |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `GOOGLE_CALLBACK_URL` | OAuth callback URL |
| `JWT_SECRET` | Secret for signing access JWTs |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens |
| `ENCRYPTION_KEY` | 32-byte hex key for encrypting stored tokens |
