# User Story: Schema and Migration for Public Profiles and Follows

## Summary

**As a** developer,
**I want** the database schema updated with a public visibility flag on profiles and a follow relationship table,
**So that** all subsequent API and UI work has the data foundation it needs.

## Description

This story adds the `isPublic` Boolean field to the existing `Profile` model (defaulting to `false` so all existing profiles remain private) and introduces a new `ProfileFollow` join model that tracks which users follow which profiles. The join model uses a unique constraint on `(followerId, profileId)` to prevent duplicate follows, and cascade deletes ensure cleanup when users or profiles are removed.

## Acceptance Criteria

- [ ] Given the existing `Profile` model, when the migration runs, then a new `isPublic` column exists with a default value of `false`.
- [ ] Given the migration, when it completes, then a new `ProfileFollow` table exists with columns: `id`, `followerId`, `profileId`, `createdAt`.
- [ ] Given the `ProfileFollow` table, when a record is inserted, then the `(followerId, profileId)` pair must be unique.
- [ ] Given a `User` is deleted, when cascade runs, then all `ProfileFollow` records where that user is the follower are also deleted.
- [ ] Given a `Profile` is deleted, when cascade runs, then all `ProfileFollow` records referencing that profile are also deleted.
- [ ] Given existing data in the database, when the migration runs, then no existing data is lost or corrupted.
- [ ] Given the updated schema, when `npx prisma generate` runs, then the Prisma client types include `isPublic` on `Profile` and the `ProfileFollow` model.

## Tasks

- [ ] Add `isPublic Boolean @default(false)` field to the `Profile` model in `server/src/prisma/schema.prisma`
- [ ] Create the `ProfileFollow` model with `id`, `followerId`, `profileId`, `createdAt` fields and appropriate relations
- [ ] Add `@@unique([followerId, profileId])` constraint to `ProfileFollow`
- [ ] Add `onDelete: Cascade` to both the `follower` and `profile` relations on `ProfileFollow`
- [ ] Add reverse relation fields on `User` (`follows ProfileFollow[]`) and `Profile` (`followers ProfileFollow[]`) with named relations
- [ ] Run `npx prisma migrate dev --name add-public-profiles-and-follows` from the `server/` directory
- [ ] Run `npx prisma generate` to regenerate the Prisma client
- [ ] Verify the migration SQL is correct and the generated client compiles

## Dependencies

- None — this is the foundational story for the feature.

## Out of Scope

- API route changes (handled in subsequent stories)
- Client-side type changes (handled in a later story)
- Data seeding or backfilling

## Notes

- The database provider is SQL Server (`sqlserver` in the Prisma datasource). Ensure migration SQL is compatible.
- The `isPublic` default of `false` means no existing profiles become public without explicit user action.
- Named relations (`"UserFollows"`, `"ProfileFollowers"`) are used to disambiguate multiple relations between the same models.
