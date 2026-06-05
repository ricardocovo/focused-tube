import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const defaultDatabaseUrl = 'sqlserver://localhost:1433;database=focusedtube;user=sa;******;encrypt=true;trustServerCertificate=true';

export default defineConfig({
  schema: 'src/prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL ?? defaultDatabaseUrl,
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL ?? process.env.DATABASE_URL ?? defaultDatabaseUrl,
  },
});
