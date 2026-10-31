import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const createPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
  }

  const normalizedConnectionString = (() => {
    try {
      const url = new URL(connectionString);
      const sslmode = url.searchParams.get('sslmode');
      if (sslmode && ['require', 'prefer', 'verify-ca'].includes(sslmode)) {
        url.searchParams.set('sslmode', 'verify-full');
      }
      return url.toString();
    } catch {
      return connectionString;
    }
  })();

  const pool = new pg.Pool({ connectionString: normalizedConnectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });
};

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
