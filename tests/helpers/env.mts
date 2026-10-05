/**
 * Test bootstrap for anything that touches the database.
 *
 * `next dev` and `next build` load `.env` for you. `tsx --test` does not, and
 * `lib/prisma.ts` constructs its client at module scope from
 * `process.env.DATABASE_URL` — so without this the client is built with no
 * connection string and every query fails with a SCRAM error that says nothing
 * about the real cause.
 *
 * Import this *before* anything that imports `lib/prisma`, and use dynamic
 * imports for those modules, since ESM hoists static imports above statements:
 *
 *   import { testEnv } from "./helpers/env.mts";
 *   testEnv();
 *   const { prisma } = await import("../lib/prisma");
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..");

export function testEnv(): void {
  const envPath = path.join(root, ".env");
  if (existsSync(envPath)) process.loadEnvFile(envPath);
}
