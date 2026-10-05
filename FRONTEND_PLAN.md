# Front-End Plan: Al Zaytouna Restaurant Site

Stack: **Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · Prisma 7 / PostgreSQL**
Direction: Arabic-only (RTL), mobile-first, photo-led, owner-operated.

> **This document was rewritten on 2026-10-05.** The previous version described a
> WhatsApp-only ordering site with customer accounts, dish variants (S/M/L/XL), and a
> customer-discount approval flow. None of that was built, and the product moved on:
> the app is now a cart + checkout site with a password-protected owner admin. That
> version is superseded. See §2 for what was dropped and §3 for what carried over.
>
> This plan covers **what is actually missing**, in dependency order.

---

## 1. What this app is today

Factual baseline, verified against the tree:

| Layer | State |
|---|---|
| Storefront | `/`, `/menu`, `/menu/[slug]`, `/specials`, `/cart`, `/order`, `/order/[reference]`, `/contact` — all built |
| Admin | `/admin`, `/admin/dishes`, `/admin/settings` — dishes, orders, announcements, settings. One shared owner password, no `User` table (`lib/auth.ts`) |
| Auth | `ADMIN_PASSWORD_HASH` + HMAC-signed cookie, guarded by `proxy.ts` and re-checked by `requireSession()` in every action (`app/admin/actions.ts:15`) |
| Money | Integer agorot everywhere. No floats (`lib/money.ts`) |
| Checkout | Re-reads prices/availability from the DB, enforces `minOrder` and `orderingHours`, normalizes the phone, refuses open-redirect `next` (`app/(store)/order/actions.ts`) |
| Tests | 6 suites, 102 assertions, all passing (`pnpm test`) |
| Gates | `pnpm build` ✓ · `pnpm typecheck` ✓ · `pnpm test` ✓ 102 · `pnpm lint` 3 pre-existing errors |

**Known baseline quirk:** `pnpm typecheck` fails on a clean tree because `PageProps`
and `LayoutProps` are generated into `.next/types` by `next build`. Always build before
typechecking, or the gate lies.

**The problem this plan set out to fix:** every one of the 12 routes rendered dynamic
(`ƒ`), so nothing was static or CDN-cacheable, yet admin writes called a
`revalidatePath` that could not invalidate anything. The site is photo-led and
SEO-sensitive, and it served every visitor a full database round trip.

That is fixed. `/`, `/contact` and `/specials` are now static with a one-hour window,
`/cart` and `/order` became static as a side effect, and admin writes invalidate by
cache tag. See WS-5.

---

## 2. Decisions locked in review

Each was a real fork. Recorded here so nobody relitigates them.

| # | Decision | Why |
|---|---|---|
| 1 | Rewrite against the real app; add no new product models | 80% of the old plan's "pending" work already exists. Customer accounts and variant tables would deprecate the working cart |
| 2 | **Drop `Dish.offerPrice`**, route all discounting through `Special` | The column is written by `app/admin/actions.ts:98` and never read by `toDishDTO` (`lib/dishes.ts:65`). The owner sees "تم الحفظ." and customers pay full price. Two discount concepts is one too many |
| 3 | Make `sortOrder` real | It is written by nobody and then discarded by `byMenuOrder` (`lib/dishes.ts:83-87`), so the menu orders by cuid. The owner cannot control what appears first |
| 4 | ISR the catalog; make the shell session-free | The only reason the storefront is dynamic is `hasSession()` in `StoreTemplate` (`components/templates/StoreTemplate.tsx:26`). It buys a single Admin link |
| 5 | Normalized `searchKey` column + trigram index | `ILIKE '%q%'` cannot use an index and cannot see Arabic orthographic variants |
| 6 | DB-backed login rate limiting | One password guards every dish, price, customer phone number and delivery address |
| 7 | Build the full image pipeline | `app/api/` is empty; every dish image URL 404s and there is no way to upload a photo |
| 8 | Test all touched code | Money, slugs, phone, totals, cart math and every new module are untested |

---

## 3. Superseded

Drop these. Do not implement them.

- Customer accounts, `RegisterForm`, roles, "logged-in customers"
- `Product` variants (S/M/L/XL), `SizeSelector`, `VariantsEditor`
- `/discount` customer-discount applications, `ApplicationStatusCard`, `ApplicationsTable`, discount codes
- Bilingual `name AR` / `name EN` fields
- Nested categories (`Category` has no `parentId` and does not need one)
- Amber placeholder palette and the `brand-800` / `brand-900` scale. The real olive/cream palette already lives in `app/globals.css:10`
- Two-tap WhatsApp ordering as the primary path. The cart is the primary path; WhatsApp is the handoff

### Conflicts inside the source docs

`brand-style.md` disagrees with itself and with this plan. Resolve in favour of this
plan and edit `brand-style.md` so the next reader is not misled:

| `brand-style.md` | Resolution |
|---|---|
| §7 mandates `react-i18next` with an EN/AR toggle that flips `dir` on `<html>` | **Not adopted.** Arabic-only, per §12 of the old plan and the built code. React-i18next would also force the shell back to dynamic, defeating decision 4 |
| §9 shows `tailwind.config.js` | **Stale.** This is Tailwind v4; tokens are declared in `@theme` in `app/globals.css`. There is no config file and there will not be one |
| §5 header shows an "EN/AR toggle" | Remove. See above |
| Dark mode token table | Parked. Not in scope |

---

## 4. Workstreams

Ordered by dependency. Each has an explicit gate.

### WS-1 · Dead discount field → one discount concept

Drop `Dish.offerPrice` and its admin field. `Special` already models a time-boxed
discount with an expiry, already renders on `/specials`, and already has an owner
flow.

- Remove `offerPrice` from `Dish` in `prisma/schema.prisma:89`
- Remove the field and its validation from `saveDish` (`app/admin/actions.ts:73-84,98`)
- Remove it from `DishManager.tsx:43-49`
- Migration: `ALTER TABLE "Dish" DROP COLUMN "offerPrice";`
- Audit for anything that assumed it — `currentPrice` in `lib/dishes.ts:65` is now unambiguously `special ? special.offerPrice : price`

**Gate:** no `offerPrice` reference outside `Special.offerPrice`, and a special still
shows the struck-through original price on the product page.

### WS-2 · Deterministic, owner-controlled ordering

- Add `sortOrder` to the `saveDish` payload and the admin form
- Fix `byMenuOrder` (`lib/dishes.ts:83-87`) to sort by `categoryId`, then `sortOrder`,
  then `id` as the tiebreaker. It currently drops `sortOrder` entirely
- Add reordering to `DishManager` — drag, or a numeric input per row. Prefer the
  simplest thing that works on a phone, since the owner may be editing on one
- Reorder within a category only. Cross-category moves belong to `Category.sortOrder`,
  which is already honoured at `lib/dishes.ts:91`
- Fix the stale comment at `lib/dishes.ts:82` — it claims specials are sorted cheapest
  first, which they are not

**Gate:** set a dish to position 1, reload `/menu`, it is first. Order survives a restart.

### WS-3 · Search that understands Arabic

Two defects: `contains` + `insensitive` compiles to `ILIKE '%q%'` (no index can serve
a leading wildcard), and Arabic has no case, so `insensitive` does nothing while
orthographic variants still miss. Searching "مشكله" found nothing against a dish
named "المشكلة".

- New `lib/search.ts` exporting `toSearchKey(text)`. **Reuse the normalization that
  already exists in `lib/slug.ts:12-24`** (`آأإ→ا`, `ى→ي`, `ة→ه`, tashkeel stripping).
  Do not write a second copy of these rules
- Add `Dish.searchKey String?` plus an index
- Populate it in `saveDish` for `name` and `description`
- Backfill existing rows in the migration
- `getDishes` matches `searchKey` instead of `name`/`description`, so one comparison
  covers all three fields

> **Risk to verify first: `pg_trgm` may not exist in the PGlite build used by
> `pnpm db:local`.** A `CREATE EXTENSION pg_trgm` will fail there and break the local
> dev loop. Check this before writing the migration. Fallback if unavailable: ship the
> `searchKey` normalization (which fixes correctness — the actual user-facing bug) and
> use a plain btree on `searchKey` for prefix matching, deferring full trigram search
> to the production database only. Do not let an index optimisation block the
> correctness fix.

**Gate:** searching "مشكله", "المشكلة" and "مشكلة" all return the same dish.

Each query term is matched separately (OR-ed), never joined into one phrase. Joining is
wrong: trimming the article from a *middle* term breaks contiguity, so
`%بيتزا مشكله%` will not match the stored `بيتزا المشكله`. This was caught by the test
suite after the first implementation shipped it wrong.

> **Not in scope:** this fixes orthographic variants, not misspellings. "بيزا" will
> still miss "بيتزا" — a dropped consonant is a typo, not a variant, and no
> normalization scheme should paper over it. Real typo tolerance means trigram
> similarity, which needs `pg_trgm`.

### WS-4 · Rate-limited admin login

`app/login/actions.ts:28` runs `bcrypt.compareSync` on every submit with no attempt cap.
That single password guards every dish, price, customer phone number and delivery
address.

- New `LoginAttempt` model: `ipHash`, `windowStart`, `attempts`
- **Hash the IP with `SESSION_SECRET` before storing it.** Never persist a raw IP
- Check and increment inside a transaction so concurrent requests cannot race past the cap
- Lock out after 8 failed attempts in a 15-minute window; clear on success
- Keep the vague error at `app/login/actions.ts:30` — it is correct as written
- Return a distinct Arabic message on lockout so the owner understands what happened

**Gate:** the ninth wrong password in fifteen minutes is refused, and a correct password
immediately after a success still works.

### WS-5 · ISR the catalog

The session read exists only to render one Admin link. Move it.

- Remove `hasSession()` from `StoreTemplate` (`components/templates/StoreTemplate.tsx:26`)
- Render `/` `/menu` `/menu/[slug]` `/specials` `/contact` as ISR with a short
  `revalidate`, plus on-demand `revalidateTag` from every admin write, replacing the
  current broad `revalidatePath` calls
- Add a `<AdminLink />` client component that calls `/api/session` to decide. Small,
  cached, `no-store`. It must render nothing on the server to avoid shifting layout
- `/cart`, `/order`, `/order/[reference]` and everything under `/admin` and `/login`
  stay dynamic — they are per-user or per-request by nature
- Tag reads in `lib/`: `settings`, `categories`, `dishes`

**Gate:** `/`, `/contact` and `/specials` show `○` with a `1h` revalidate in the build
route table, `/admin` still shows `ƒ`, and a dish edit appears on `/menu` without a
redeploy.

**What the build actually produces** (verified, `pnpm build`):

```
○ /                 1h      ← was ƒ for the whole app
○ /contact           1h
○ /specials          1h
● /menu/[slug]              ← SSG shell; full prerender with PRERENDER_PRODUCTS=1
○ /cart, ○ /order           ← were ƒ, now static as a side effect
○ /sitemap.xml, ○ /robots.txt
ƒ /menu                     ← reads searchParams, so it must stay dynamic
ƒ /admin, /admin/dishes, /admin/settings, /login, /order/[reference], /api/*
```

`/menu` is dynamic by design: its grid depends on `?q=`, `?category=` and `?page=`.
That is correct, not a miss.

> **`unstable_cache` is still in use and is on its way out.** Next 16 replaced it with
> the `'use cache'` directive plus `cacheTag()`. `lib/cached.ts` keeps `unstable_cache`
> because adopting Cache Components changes rendering semantics for *every* route in
> the app, including the dynamic admin ones, and that is too large to smuggle into this
> change set. The upgrade is: delete `lib/cached.ts`, put `'use cache'` + `cacheTag(...)`
> in each read, and drop the `tagged()` wrapper. Nothing else has to move.

> **`generateStaticParams` is opt-in** via `PRERENDER_PRODUCTS=1`. Prerendering one page
> per dish means one query set per dish during the build, and PGlite serves a single
> connection — build workers overrun it and the build dies with "Connection terminated
> unexpectedly". Production Postgres has no such limit, so it sets the flag. Unset, the
> route still renders on demand and is still tagged, so admin edits land immediately; the
> only thing lost is the cold-start win.

### WS-6 · The image pipeline

`app/api/` is empty. `lib/images.ts:23` builds `/api/images/<filename>`, but no handler
exists and nothing writes an `Image` row. Every dish currently falls through to the
branded placeholder tile (`DishImage.tsx:26-35`), which is why this has gone unnoticed.
The first uploaded photo 404s, and the product OG tag breaks with it.

- `app/api/images/[filename]/route.ts` — stream from `UPLOAD_DIR`, validate the filename
  against traversal before touching the filesystem, set long-lived `Cache-Control` and
  an `ETag`
- Admin upload on the dish form: accept the file, decode it to get **real** width and
  height, write the `Image` row. `toImageDTO` currently falls back to a hardcoded
  800×600 (`lib/images.ts:14`), which is a guess and will cause layout shift on any
  photo that is not exactly 4:3
- Convert to WebP/AVIF and enforce the sub-200KB target at upload time, rejecting
  oversized files with an Arabic error
- Make the alt text field explicit rather than always falling back to the dish name
- Re-enable the OG image in `generateMetadata` (`app/(store)/menu/[slug]/page.tsx:30`)
  only once the handler exists — it is currently emitting a URL that 404s
- Add the missing `app/api/session` route from WS-5 here, so image work and session work
  ship as one API slice

**Gate:** upload a photo, it appears in the grid and on the product page at the correct
aspect ratio, survives a restart, and `curl` on `/api/images/<file>` returns the image.
A traversal attempt like `../../.env` returns 404.

### WS-7 · Missing surfaces

Nothing exists. `notFound()` is called at `app/(store)/menu/page.tsx:43` and
`app/(store)/menu/[slug]/page.tsx:39` with no `not-found.tsx` to catch it, so users
land on Next's unbranded default 404.

- `app/not-found.tsx` — Arabic, inside the storefront chrome
- `app/(store)/not-found.tsx` if a menu-specific variant is wanted
- `app/(store)/menu/loading.tsx` — skeleton grid, fixed `aspect-[4/3]`, so nothing
  jumps when it lands
- `app/error.tsx` with a retry button. Today a thrown error loses the navbar and footer
  entirely and shows Next's raw error page
- `app/(store)/error.tsx` scoped to the storefront

**Gate:** kill the dev server mid-navigation and you get a branded skeleton. Throw from
a loader and you get a branded retry, not a stack trace.

### WS-8 · SEO

- `app/sitemap.ts` from `getAllDishes`, and `app/robots.ts`
- JSON-LD: `Restaurant` on `/` with hours, address and geo; `Product` with `offers` on
  product pages. Hours come from the `Settings.openingHours` JSON and must be emitted
  in `Asia/Jerusalem`, not the server's zone — `lib/hours.ts` already knows how
- Confirm the Arabic title and description on every page

### WS-9 · Correctness cleanups

Small, but each is a live defect.

- **Delete `specialsOnly`** from `MenuQuery` (`lib/dishes.ts:108`). It is dead code that
  filters *after* pagination (`:162,166-168`), so wiring it to a filter today would
  silently drop specials from page 1 while reporting a correct total
- **Make `liveSpecial` deterministic** (`lib/dishes.ts:50-55`). The specials `include` has
  no `orderBy`, so with two active specials `find()` returns an arbitrary one. Add an
  explicit `orderBy` and honour `startsAt`, which exists in the schema and is currently
  ignored
- **Fix the `nextReference` race** (`lib/orders.ts:64-79`). It checks-then-writes a
  4-character reference, so concurrent orders can collide and surface as a 500 on the
  unique constraint. Use `crypto.randomInt` and catch the unique violation to retry
- **Deduplicate `NEXT_PUBLIC_SITE_URL`.** The expression
  `process.env.NEXT_PUBLIC_SITE_URL ?? "https://alzaytona.example"` is inlined at
  `app/(store)/menu/page.tsx:46`, `app/(store)/specials/page.tsx:17` and
  `app/(store)/menu/[slug]/page.tsx:42`, leaking a placeholder domain into every
  WhatsApp link and OG tag. Add `lib/site.ts` with a single `siteUrl()`, and **throw in
  production** if it is unset rather than silently shipping the placeholder
- Fix `liveSpecial`'s neighbours: `nextReference`'s collision `findUnique` runs on every
  attempt and will be removed with the retry

### WS-10 · Tests

`tests/hours.test.mts` is the entire suite. Money, slugs, phone normalization, order
totals and cart arithmetic are all untested, and WS-1 through WS-9 add more. Every module
this plan touches gets covered.

- `lib/money.ts` — `parseAgorot` against malformed input, negative, zero, `"39.5"`,
  `"39.50"`, thousands separators; `formatMoney` rounding and negatives
- `lib/slug.ts` — Arabic normalization, tashkeel stripping, empty input, `resolveSlug`
  precedence, and the collision guard at `app/admin/actions.ts:105-108`
- `lib/whatsapp.ts` — `normalizePhone` against local formats; `whatsappLink` encoding
- `lib/search.ts` — every variant pair from WS-3, plus query and store normalization
  agreeing
- Cart math — the `add` / `setQuantity` / 99-cap logic in `components/molecules/cart-context.tsx`,
  including the hydration guard that stops an empty server render from wiping a cart
- Order totals — subtotal, delivery fee only on delivery, `minOrder` rejection, and that
  the stored `total` always equals `subtotal + fee`
- `LoginAttempt` — the cap, the window boundary, and clearing on success
- `liveSpecial` — deterministic winner with two active specials, and `startsAt` in the future
- The `parseLines` guard at `app/(store)/order/actions.ts:17-35` — malformed, negative,
  over-99, duplicate-merge

Keep the existing `node:test` + `tsx` runner. No new test framework.

**Shipped:** `tests/search.test.mts` (26), `tests/money.test.mts` (9),
`tests/uploads.test.mts` (14), `tests/login-throttle.test.mts` (13),
`tests/orders.test.mts` (20), plus the original `tests/hours.test.mts`. 102 passing.

Two rules the database tests must follow, both learned the hard way:

1. **`tsx --test` does not load `.env`.** `lib/prisma.ts` builds its client at module
   scope, so a DB-backed test must call `testEnv()` from `tests/helpers/env.mts` and use
   *dynamic* imports for anything that touches Prisma — ESM hoists static imports above
   statements.
2. **Never mutate seeded rows.** The dev database is the owner's real menu. A test that
   flips `available` on a real dish and then aborts leaves that product hidden on the
   actual site — which is exactly what happened to `بيتزا المعجنات` during this work.
   Database tests create a throwaway dish and delete it in `test.after`.

Two behaviours cannot be unit-tested outside a Next request, and are asserted at the
data layer instead with a comment saying why: the tagged reads (`unstable_cache` throws
"invariant: incrementalCache missing"), and anything needing `cookies()`.

---

## 5. Build order

Gate rule: each step works in the browser before the next starts. WS-1 through WS-4 are
independent and can run in any order; WS-5 depends on nothing but is best done before
WS-6 so the new routes inherit ISR; WS-7 through WS-10 come last.

1. **WS-1** drop the dead discount field
2. **WS-9** correctness cleanups — small, isolated, and they make the rest testable
3. **WS-3** search — needs the normalization extracted anyway
4. **WS-4** login rate limiting — includes a migration
5. **WS-2** ordering
6. **WS-5** ISR the catalog
7. **WS-6** image pipeline
8. **WS-7** missing surfaces
9. **WS-8** SEO
10. **WS-10** tests, written alongside each step above rather than batched at the end

Steps 1–5 are one migration if you prefer (`ALTER TABLE "Dish" DROP COLUMN
"offerPrice"`, add `Dish.searchKey`, add `LoginAttempt`, add the index). Split them if
any step needs to ship on its own.

---

## 6. Definition of done

Applies to every step, not just the last.

- [ ] `pnpm build`, `pnpm typecheck` and `pnpm test` all pass. Remember: build before
      typecheck
- [ ] Works at 375px, 768px and 1280px, in RTL
- [ ] Correct in RTL — logical utilities only (`ms-`, `ps-`, `start-`, `end-`)
- [ ] Keyboard and screen-reader pass. Drawers trap focus, close on Esc, restore focus
- [ ] No status conveyed by colour alone
- [ ] Lighthouse mobile: performance and accessibility both 90+
- [ ] Nothing under `components/` imports a Prisma type
- [ ] Every new pure module has tests covering its edge cases
- [ ] No `?.` on a value that the type says is non-nullable
- [ ] Nothing ships behind a placeholder domain
- [ ] A database test creates its own rows and cleans them up; it never mutates the
      seeded menu

---

## 7. Open questions

1. **Photos.** Who provides them, and by when? WS-6 builds the plumbing but the menu
   stays placeholder-tiled until real photography exists. This is the single biggest
   gap between the plan and the product.
2. **Logo.** `brand-style.md` §3 says the logotype must stay an image and be vectorized
   from the designer's original. That file has not been supplied. `Settings.logoImageId`
   exists and nothing writes it.
3. **Brand colours.** `brand-style.md:7` says the hex values were eyeballed from a
   banner, not sampled. Sample them from the source artwork before the design is
   considered final.
4. **WhatsApp handoff.** Orders show a reference and a WhatsApp link, but nothing
   reminds the owner to actually send the message. `Order.whatsappSent` is a manual
   checkbox in admin (`app/admin/actions.ts:41`). Should the customer be nudged, or is
   the reference enough?
5. **Delivery areas.** `Settings.deliveryAreas` is a free-text field and is not enforced
   at checkout. Should the address be checked against a list of areas?
6. **`app/api/images` storage.** `UPLOAD_DIR` is referenced in a comment
   (`lib/images.ts:2`) but never defined in code. Local filesystem is fine for one box;
   it will not survive a horizontal scale-out. Object storage is the eventual answer.

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | Not run |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | Not run |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR | 8 issues, 3 critical gaps, all resolved |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | Not run |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | Not run |

Critical gaps found and closed in this review: `Dish.offerPrice` was written by the admin
form but never read when rendering prices, so the owner could set a discount and customers
still paid full price; `Dish.sortOrder` was written by nobody and then discarded by
`byMenuOrder`, so menu order was effectively random; `app/api/` was empty, so every dish
image URL 404s and no photo can be uploaded.

The scope gate redirected the review. The plan as written described a different product
(customer accounts, dish variants, a customer-discount approval flow). 80% of its
"pending" work already existed in a different shape. It was rewritten against the real
tree rather than reviewed as written.

- **VERDICT:** ENG CLEARED — ready to implement

**UNRESOLVED DECISIONS:**
- Does the PGlite build used by `pnpm db:local` provide `pg_trgm`? If not, WS-3 ships the `searchKey` normalization with a btree prefix index and defers trigram to production. Verify before writing the migration; do not let the index block the correctness fix.