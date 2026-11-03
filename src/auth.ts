import { betterAuth } from 'better-auth';
import { prismaAdapter } from '@better-auth/prisma-adapter';
import { getPrismaClient } from './db/prisma.js';

const trustedOrigins = (
  process.env.CORS_ORIGINS ??
  'http://localhost:5173,http://localhost:3000'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const auth = betterAuth({
  appName: 'Gym Trainer',
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3001',
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(getPrismaClient(), {
    provider: 'postgresql',
  }),
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
  },
  rateLimit: {
    storage: 'database',
    customRules: {
      '/sign-in/email': {
        window: 60,
        max: 5,
      },
      '/sign-up/email': {
        window: 60,
        max: 5,
      },
    },
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },
});
