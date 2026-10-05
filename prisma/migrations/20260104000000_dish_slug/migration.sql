-- AlterTable
ALTER TABLE "Dish" ADD COLUMN     "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Dish_slug_key" ON "Dish"("slug");

-- Backfill: existing rows keep working, they just fall back to their id in the URL
-- until an owner gives them a slug in /admin.
UPDATE "Dish" SET "slug" = "id" WHERE "slug" IS NULL;

-- Enforce not-null now that every row has a value
ALTER TABLE "Dish" ALTER COLUMN "slug" SET NOT NULL;