/**
 * Development-only Postgres, backed by PGlite, served over the Postgres wire
 * protocol so Prisma's driver adapter can talk to it.
 *
 * This exists so `pnpm dev` and the test suite work on a machine with no Docker
 * and no local Postgres install. Production uses the real Postgres service from
 * docker-compose.yml — see .env.example.
 *
 *   pnpm db:local
 */
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const port = Number(process.env.LOCAL_PG_PORT ?? 55432);
const dataDir = process.env.LOCAL_PG_DIR ?? "./.local-pg";

const db = await PGlite.create({ dataDir });

const server = new PGLiteSocketServer({ db, port, host: "127.0.0.1" });
await server.start();

console.log(`[db:local] PGlite listening on 127.0.0.1:${port} (data: ${dataDir})`);
console.log(`[db:local] DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:${port}/postgres`);

const shutdown = async () => {
  await server.stop();
  await db.close();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);