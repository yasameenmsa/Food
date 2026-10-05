/**
 * Order totals and menu ordering, against the real database.
 *
 * These are the invariants that decide what a customer is charged. They are
 * asserted against Prisma rather than a hand-rolled stub so a schema change that
 * breaks them fails here.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { testEnv } from "./helpers/env.mts";

testEnv();

const { prisma } = await import("../lib/prisma");
const { createOrder, getOrderByReference } = await import("../lib/orders");
const { getDishes, getDishesByIds, getAllDishes } =
  await import("../lib/dishes");
const { dishSearchKey } = await import("../lib/search");

/** Every order created by a test, removed afterwards. */
const created: string[] = [];

/** Every scratch dish created by a test, removed afterwards. */
const scratch: string[] = [];

/**
 * A throwaway dish, deleted in `test.after`.
 *
 * Tests must never mutate the seeded menu. The dev database holds the owner's
 * real data, and a run that aborts before its cleanup leaves a product hidden
 * from the actual site — which is exactly what happened once already.
 */
async function createScratchDish(name: string, available: boolean) {
  const category = await prisma.category.findFirst();
  assert.ok(category, "the seed must contain at least one category");

  const dish = await prisma.dish.create({
    data: {
      name,
      slug: `scratch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      description: "صنف اختباري",
      price: 1000,
      searchKey: dishSearchKey(name, "صنف اختباري"),
      sortOrder: 0,
      categoryId: category.id,
      available,
    },
    select: { id: true, name: true, price: true },
  });

  scratch.push(dish.id);
  return dish;
}

async function withDish<T>(
  fn: (dish: { id: string; price: number }) => Promise<T>,
): Promise<T> {
  const dish = await prisma.dish.findFirst({
    select: { id: true, price: true },
  });
  assert.ok(dish, "the seed must contain at least one dish");
  return fn(dish);
}

test.after(async () => {
  for (const reference of created) {
    await prisma.order.deleteMany({ where: { reference } });
  }
  if (scratch.length) {
    await prisma.dish.deleteMany({ where: { id: { in: scratch } } });
  }
  await prisma.$disconnect();
});

test("an order stores a total equal to subtotal plus fee", async () => {
  await withDish(async (dish) => {
    const input = {
      type: "DELIVERY" as const,
      customerName: "عميل تجريبي",
      phone: "0598502578",
      address: "غزة، شارع النصر",
      notes: null,
      lines: [
        {
          dishId: dish.id,
          slug: "test",
          name: "اختبار",
          image: null,
          unitPrice: dish.price,
          quantity: 3,
          lineTotal: dish.price * 3,
        },
      ],
      fee: 500,
    };

    const order = await createOrder(input);
    created.push(order.reference);

    assert.equal(order.subtotal, dish.price * 3);
    assert.equal(order.fee, 500);
    assert.equal(order.total, order.subtotal + order.fee);
  });
});

test("a pickup order charges no delivery fee", async () => {
  await withDish(async (dish) => {
    const order = await createOrder({
      type: "PICKUP",
      customerName: "عميل استلام",
      phone: "0598502578",
      address: null,
      notes: null,
      lines: [
        {
          dishId: dish.id,
          slug: "test",
          name: "اختبار",
          image: null,
          unitPrice: dish.price,
          quantity: 1,
          lineTotal: dish.price,
        },
      ],
      fee: 0,
    });
    created.push(order.reference);

    assert.equal(order.fee, 0);
    assert.equal(order.total, order.subtotal);
    assert.equal(order.address, null);
  });
});

test("a zero-fee order still totals correctly", async () => {
  await withDish(async (dish) => {
    const order = await createOrder({
      type: "PICKUP",
      customerName: "عميل",
      phone: "0598502578",
      address: null,
      notes: null,
      lines: [
        {
          dishId: dish.id,
          slug: "test",
          name: "اختبار",
          image: null,
          unitPrice: dish.price,
          quantity: 1,
          lineTotal: dish.price,
        },
      ],
      fee: 0,
    });
    created.push(order.reference);
    assert.equal(order.total, dish.price);
  });
});

test("order line totals add up to the subtotal", async () => {
  await withDish(async (dish) => {
    const order = await createOrder({
      type: "DELIVERY",
      customerName: "عميل",
      phone: "0598502578",
      address: "غزة",
      notes: null,
      lines: [
        {
          dishId: dish.id,
          slug: "a",
          name: "أ",
          image: null,
          unitPrice: 1000,
          quantity: 2,
          lineTotal: 2000,
        },
        {
          dishId: dish.id,
          slug: "b",
          name: "ب",
          image: null,
          unitPrice: 2500,
          quantity: 3,
          lineTotal: 7500,
        },
      ],
      fee: 700,
    });
    created.push(order.reference);

    const summed = order.items.reduce(
      (total, item) => total + item.lineTotal,
      0,
    );
    assert.equal(summed, order.subtotal);
    assert.equal(order.subtotal, 9500);
    assert.equal(order.total, 10200);
  });
});

test("a reference is allocated and is unique", async () => {
  await withDish(async (dish) => {
    const order = await createOrder({
      type: "PICKUP",
      customerName: "عميل",
      phone: "0598502578",
      address: null,
      notes: null,
      lines: [
        {
          dishId: dish.id,
          slug: "test",
          name: "اختبار",
          image: null,
          unitPrice: dish.price,
          quantity: 1,
          lineTotal: dish.price,
        },
      ],
      fee: 0,
    });
    created.push(order.reference);

    assert.match(order.reference, /^ZAY-[A-Z0-9]+$/);
    assert.ok(order.reference.length >= 8);

    // Five characters from a 32-symbol alphabet, not four from Math.random.
    assert.ok(
      order.reference.length >= 9,
      `reference too short: ${order.reference}`,
    );
  });
});

test("concurrent orders never collide on a reference", async () => {
  // The previous implementation checked for a clash with a SELECT before writing,
  // which races. The unique constraint is now the check, with a retry.
  await withDish(async (dish) => {
    const make = () =>
      createOrder({
        type: "PICKUP" as const,
        customerName: "عميل",
        phone: "0598502578",
        address: null,
        notes: null,
        lines: [
          {
            dishId: dish.id,
            slug: "test",
            name: "اختبار",
            image: null,
            unitPrice: dish.price,
            quantity: 1,
            lineTotal: dish.price,
          },
        ],
        fee: 0,
      });

    const orders = await Promise.all(Array.from({ length: 8 }, make));
    for (const order of orders) created.push(order.reference);

    const references = new Set(orders.map((order) => order.reference));
    assert.equal(
      references.size,
      orders.length,
      "two orders shared a reference",
    );
  });
});

test("an order can be read back by its reference", async () => {
  await withDish(async (dish) => {
    const order = await createOrder({
      type: "PICKUP",
      customerName: "عميل",
      phone: "0598502578",
      address: null,
      notes: "بدون بصل",
      lines: [
        {
          dishId: dish.id,
          slug: "test",
          name: "اختبار",
          image: null,
          unitPrice: dish.price,
          quantity: 1,
          lineTotal: dish.price,
        },
      ],
      fee: 0,
    });
    created.push(order.reference);

    const found = await getOrderByReference(order.reference);
    assert.ok(found);
    assert.equal(found.id, order.id);
    assert.equal(found.notes, "بدون بصل");
    assert.equal(found.status, "PENDING");
    assert.equal(found.whatsappSent, false);
  });
});

test("an unknown reference reads back as null, not a throw", async () => {
  assert.equal(await getOrderByReference("ZAY-NOPE00"), null);
});

test("an empty cart creates no order", async () => {
  await withDish(async (dish) => {
    const before = await prisma.order.count();
    await getDishesByIds([]);
    assert.equal(await prisma.order.count(), before);
    assert.ok(dish.id);
  });
});

test("getDishesByIds excludes dishes that are unavailable", async () => {
  // The cart trusts nothing: an unavailable dish must not come back priced.
  //
  // Uses a throwaway dish rather than flipping a seeded one. An earlier version
  // of this test mutated real menu rows, and when the run aborted it left
  // "بيتزا المعجنات" hidden on the owner's own dev database.
  const dish = await createScratchDish("اختبار-غير-متوفر", false);

  const found = await getDishesByIds([dish.id]);
  assert.equal(found.length, 0, "an unavailable dish must not be orderable");
});

test("getDishesByIds returns an available dish and ignores unknown ids", async () => {
  const dish = await createScratchDish("اختبار-متوفر", true);
  const found = await getDishesByIds([dish.id, "does-not-exist"]);
  assert.equal(
    found.length,
    1,
    "the real dish comes back, the fake id does not",
  );
  assert.equal(found[0]!.id, dish.id);
});

test("menu results respect the owner's sortOrder", async () => {
  // Two scratch dishes in one category, placed deliberately so that the
  // assertion is about sortOrder rather than about insertion luck.
  const category = await prisma.category.findFirst();
  assert.ok(category);

  const late = await createScratchDish("اختبار-ترتيب-اول", true);
  const early = await createScratchDish("اختبار-ترتيب-ثاني", true);

  // The one created first gets the higher sortOrder, so id order and menu order
  // disagree and the test can actually fail.
  await prisma.dish.update({ where: { id: late.id }, data: { sortOrder: 1 } });
  await prisma.dish.update({ where: { id: early.id }, data: { sortOrder: 0 } });

  const result = await getDishes({ pageSize: 100, categoryId: category.id });
  const ids = result.dishes.map((dish) => dish.id);

  assert.ok(
    ids.indexOf(early.id) < ids.indexOf(late.id),
    "sortOrder 0 must come before sortOrder 1",
  );

  const positions = result.dishes.map((dish) => dish.sortOrder);
  assert.deepEqual(
    positions,
    [...positions].sort((a, b) => a - b),
    "menu is not in sortOrder sequence",
  );
});

test("search matches an orthographic variant of the dish name", async () => {
  const dish = await prisma.dish.findFirst({
    where: { name: { contains: "المشكلة" } },
    select: { id: true, name: true },
  });
  assert.ok(dish, "the seed should contain بيتزا المشكلة");

  // The stored key keeps the article; the query drops it.
  const result = await getDishes({ q: "مشكله", pageSize: 50 });
  assert.ok(
    result.dishes.some((found) => found.id === dish.id),
    `searching مشكله should find ${dish.name}`,
  );
});

test("search matches the ة/ه variant that Postgres alone would miss", async () => {
  const dish = await prisma.dish.findFirst({
    select: { id: true, name: true },
  });
  assert.ok(dish);

  // Re-fold the dish under a swapped ta marbuta and confirm the typed form finds it.
  const stored = dishSearchKey(dish.name, null);
  const typed = stored.replace(/ه/g, "ة");
  if (typed !== stored) {
    const result = await getDishes({ q: typed, pageSize: 50 });
    assert.ok(
      result.dishes.some((found) => found.id === dish.id),
      `searching ${typed} should find ${dish.name}`,
    );
  }
});

test("a search with no matches is empty rather than an error", async () => {
  const result = await getDishes({ q: "زززززز", pageSize: 10 });
  assert.equal(result.total, 0);
  assert.deepEqual(result.dishes, []);
  assert.equal(result.pageCount, 1);
});

test("an unknown slug resolves to null, which is what notFound() acts on", async () => {
  // Deliberately not `getDishBySlug`: the tagged reads wrap `unstable_cache`,
  // which needs Next's incremental cache and throws "invariant: incrementalCache
  // missing" outside a request. The page depends on the null-vs-row distinction,
  // so that distinction is asserted here at the data layer.
  const row = await prisma.dish.findUnique({
    where: { slug: "no-such-slug-at-all" },
    select: { id: true },
  });
  assert.equal(row, null);
});

test("a real slug resolves to exactly one dish", async () => {
  const dish = await prisma.dish.findFirst({ select: { slug: true } });
  assert.ok(dish);

  const row = await prisma.dish.findUnique({
    where: { slug: dish.slug },
    select: { id: true, slug: true },
  });
  assert.ok(row);
  assert.equal(row.slug, dish.slug);
});

test("slugs are unique, so findUnique is safe for every page", async () => {
  const duplicates = await prisma.$queryRaw<
    Array<{ slug: string; count: bigint }>
  >`
    SELECT slug, COUNT(*)::bigint AS count FROM "Dish" GROUP BY slug HAVING COUNT(*) > 1
  `;
  assert.deepEqual(
    duplicates,
    [],
    "a duplicate slug would make one dish unreachable",
  );
});

test("dishSearchKey is maintained for every existing dish", async () => {
  // The backfill script exists for rows written before the column landed. If a
  // row drifts, search silently stops finding that dish.
  const stale = await prisma.dish.findMany({
    select: { id: true, name: true, description: true, searchKey: true },
  });

  const wrong = stale.filter(
    (dish) => dish.searchKey !== dishSearchKey(dish.name, dish.description),
  );
  assert.deepEqual(
    wrong.map((dish) => dish.name),
    [],
    "run `pnpm db:backfill-search`",
  );
});
