import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Non-sensitive placeholder used only so Prisma CLI commands can run in CI environments
// that do not provide DATABASE_URL values.
const placeholderPassword = 'PLACEHOLDER_PASSWORD';
const defaultDatabaseUrl = `sqlserver://localhost:1433;database=focusedtube;user=sa;******;encrypt=true;trustServerCertificate=true`;

export default defineConfig({
  schema: 'src/prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL ?? defaultDatabaseUrl,
    // Reuse DATABASE_URL when a dedicated shadow database is not configured so
    // generate/build-only CI tasks can still run without migration-specific env.
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL ?? process.env.DATABASE_URL ?? defaultDatabaseUrl,
  },
});
