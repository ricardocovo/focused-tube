import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '..', '..', '..', '.env') });

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  DATABASE_URL: process.env.DATABASE_URL || 'file:./prisma/dev.db',
  NODE_ENV: process.env.NODE_ENV || 'development',

  // These are required in Phase 2+ but optional during Phase 1
  get GOOGLE_CLIENT_ID() { return requireEnv('GOOGLE_CLIENT_ID'); },
  get GOOGLE_CLIENT_SECRET() { return requireEnv('GOOGLE_CLIENT_SECRET'); },
  get GOOGLE_CALLBACK_URL() { return process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback'; },
  get JWT_SECRET() { return requireEnv('JWT_SECRET'); },
  get JWT_REFRESH_SECRET() { return requireEnv('JWT_REFRESH_SECRET'); },
  get ENCRYPTION_KEY() { return requireEnv('ENCRYPTION_KEY'); },
};
