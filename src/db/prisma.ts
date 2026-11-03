import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

let prisma: PrismaClient | undefined;

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    const connectionString =
      process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL is required to connect to Prisma Postgres.');
    }

    const adapter = new PrismaPg({ connectionString });
    prisma = new PrismaClient({ adapter });
  }

  return prisma;
}
