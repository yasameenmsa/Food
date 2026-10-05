import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * `DATABASE_MAX_CONNECTIONS=1` is only for the PGlite-backed dev server, which
 * can serve a single connection. Real Postgres in production uses the pool
 * default and leaves this unset.
 */
const maxConnections = process.env.DATABASE_MAX_CONNECTIONS;

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ...(maxConnections ? { max: Number(maxConnections) } : {}),
});

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}