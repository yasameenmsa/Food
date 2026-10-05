/**
 * Backfills `Dish.searchKey` for rows that existed before the column landed.
 *
 * New writes maintain the key in `saveDish`, but a migration can only default
 * the column to ''. Folding Arabic cannot be expressed in SQL, so existing rows
 * are repaired here. Safe to re-run: it recomputes every row.
 *
 *   pnpm db:backfill-search
 */
import { prisma } from "../lib/prisma";
import { dishSearchKey } from "../lib/search";

async function main() {
  const dishes = await prisma.dish.findMany({
    select: { id: true, name: true, description: true, searchKey: true },
  });

  const stale = dishes.filter(
    (dish) => dish.searchKey !== dishSearchKey(dish.name, dish.description),
  );

  if (stale.length === 0) {
    console.log(`searchKey already correct for all ${dishes.length} dishes.`);
    return;
  }

  for (const dish of stale) {
    await prisma.dish.update({
      where: { id: dish.id },
      data: { searchKey: dishSearchKey(dish.name, dish.description) },
    });
  }

  console.log(`Backfilled searchKey on ${stale.length} of ${dishes.length} dishes.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
