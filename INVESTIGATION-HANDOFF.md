# Investigation handoff — DB down + admin login broken

Date: 2026-10-06
Repo: `/home/yasmeen/code/alzaytonaweb` (branch `main`)
Note: **another agent was actively editing this repo during this investigation**
(`lib/settings.ts`, `package.json`, `app/api/`, `lib/site.ts`,
`components/molecules/AdminLink.tsx` all changed mid-session). Findings below are
separated into what I fixed and what the other agent owns. Nothing was committed.

---

## Fixed and verified

### 1. `/admin` returned 500 — illegal `timeStyle` on `toLocaleDateString`

`components/organisms/OrderList.tsx:32`

```ts
created.toLocaleDateString("ar-EG", {
  dateStyle: "medium",
  timeStyle: "short",   // toLocaleDateString rejects this outright
  timeZone: "Asia/Jerusalem",
});
```

`toLocaleDateString` throws `TypeError: Invalid option : timeStyle`. Confirmed in
isolation on Node v24.12.0. This is why login *looked* broken: authentication
succeeded, then the orders page threw while rendering.

Fix: extracted `lib/datetime.ts` → `formatDateTime()` (uses `toLocaleString`).
Removed the now-unused `created` local.

Tests: `tests/datetime.test.mts`, 4 cases. Verified they **fail** without the fix
(all 4 report `TypeError: Invalid option : timeStyle`) and pass with it.
Full suite: 21 pass, 0 fail.

### 2. Login was hard-blocked — `LoginAttempt` had no migration, client was stale

The working tree contained an uncommitted login-throttle feature:
`LoginAttempt` model in `prisma/schema.prisma`, `lib/login-throttle.ts` calling
`prisma.loginAttempt`, wired into `app/login/actions.ts`. But:

- no migration for the table
- `generated/prisma/` predated the model, so `prisma.loginAttempt` was `undefined`
- `lib/search.ts` / `lib/dishes.ts` already failed `tsc` for the same reason

Every login attempt threw:

```
Cannot read properties of undefined (reading 'findFirst')
```

Fix: `pnpm db:generate`, plus a new migration
`prisma/migrations/20260105000000_login_attempt_search_key/migration.sql`
(created via `prisma migrate diff`, because `migrate dev` cannot run against
PGlite — see below). Also added the missing `prisma/migrations/migration_lock.toml`
(`provider = "postgresql"`), without which `migrate diff --from-migrations` errors.

Verified against the DB: `recordFailure`, `isLockedOut`, `clearFailures` all work;
`prisma.loginAttempt` is now an object.

### 3. The dev database was not running

`.env` points at `127.0.0.1:55432`, which only exists while `pnpm db:local`
(PGlite) is alive. Nothing was listening → `ECONNREFUSED`. This is expected
local-dev behaviour, not a code bug, but it is the "DB not working" symptom.

**PGlite data dir got corrupted mid-investigation** (`RuntimeError: Aborted()` on
startup, unrecoverable: stale-pid removal and WAL-trim attempts both failed).
Rebuilt from migrations + seed. Row counts match the original:

| table | rows |
|---|---|
| Dish | 34 |
| Category | 6 |
| Order | 3 |
| OrderItem | 8 |
| Special | 2 |
| Announcement | 1 |
| Settings | 1 |
| LoginAttempt | 0 |

Old corrupt copy kept at `/tmp/pg-corrupt-final`; pre-corruption backup at
`/tmp/local-pg-backup-1791234572`. Delete when convenient — both are under `/tmp`.

---

## NOT fixed — owned by the concurrent agent

`getSettings` (`lib/settings.ts`) returns undefined/malformed after a
half-finished ISR refactor. `cache(() => unstable_cache(...))`.

Downstream 500s:

```
TypeError: Cannot read properties of undefined (reading 'replace')  at Navbar.tsx:14
TypeError: settings.openingHours is undefined                       at Footer.tsx:53
TypeError: categories.map is not a function                        at MenuToolbar.tsx:109
```

Affects `/menu`, `/admin/dishes`, `/admin/settings`. `/admin` itself is 200.

A transient `Error: Expected ',', got ';'` on `lib/settings.ts:99` was the other
agent writing the file mid-compile — not a real syntax error, resolves on recompile.

---

## Operational notes for whoever finishes this

- **`prisma migrate dev` does not work against PGlite.** PGlite serves one
  connection at a time (`scripts/db-concurrency.mts` proves the second connection
  fails) and `migrate dev` wants more, plus a shadow database. Use `migrate deploy`,
  or generate SQL with `prisma migrate diff` and apply it directly.
- **`.env` `ADMIN_PASSWORD_HASH` matches no obvious candidate.** Tested
  `admin1234` (the seed script's demo password), `admin`, `alzaytona`, `password`,
  `123456` — all `false`. The hash is valid bcrypt (`$2b$10$`, 60 chars), so
  verification works; the actual password is unknown. `pnpm admin:hash` is
  referenced in `.env.example:11` but **that script does not exist** in
  `package.json`.
- **Typecheck baseline: 26 errors before my changes**, all in
  `lib/login-throttle.ts`, `lib/search.ts`, `lib/dishes.ts` — all downstream of
  the stale generated client. `pnpm typecheck` was not clean at session start.
- Starting `pnpm db:local` needs `setsid`/detachment from the tool shell, or the
  process dies when the shell call returns.