-- Optional: makes menu search use an index instead of a sequential scan.
--
-- NOT part of the Prisma migrations, on purpose. `pg_trgm` is not available in
-- the PGlite build that `pnpm db:local` uses, so putting `CREATE EXTENSION` in a
-- migration would break the local dev loop for an optimisation that changes
-- nothing about correctness.
--
-- Without it, search still returns the right rows — `Dish.searchKey` does the
-- Arabic folding — it just scans the table instead of using an index. At bakery
-- menu scale that is invisible. Run this once against production, if ever:
--
--   psql "$DATABASE_URL" -f scripts/enable-search-trigram.sql
--
-- Then EXPLAIN ANALYZE a search to confirm it is an index scan.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "Dish_searchKey_trgm_idx"
  ON "Dish" USING GIN ("searchKey" gin_trgm_ops);
