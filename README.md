# Al Zaytouna — Restaurant Site & Ordering

Arabic-only (RTL), mobile-first site for a restaurant: public menu, cart, and
WhatsApp order handoff, plus a password-protected `/admin` for the owner to
manage dishes, announcements, and settings.

## Tech stack

| Layer | What we use | Version |
| --- | --- | --- |
| Framework | Next.js (App Router, RSC, Server Actions) | 16.3.8 |
| UI runtime | React / React DOM | 19.2.8 |
| Language | TypeScript (`strict`, path alias `@/*`) | ^5 |
| Styling | Tailwind CSS 4 via `@tailwindcss/postcss` | ^4 |
| Icons | lucide-react | ^1.51.0 |
| ORM | Prisma (PostgreSQL, `prisma-client` generator → `generated/prisma`) | 7.10.0 |
| Database | PostgreSQL via `pg` + `@prisma/adapter-pg` | ^8.23.1 |
| Local DB | PGlite + `pglite-socket` (`pnpm db:local` on `127.0.0.1:55432`) | ^0.5.8 |
| Auth | `bcryptjs` password hash + HMAC-signed session cookie (`proxy.ts` guard) | ^3.0.3 |
| Tests | `node:test` via `tsx` (`pnpm test`) | ^4.23.15 |
| Lint | ESLint 9 + `eslint-config-next` | 16.3.8 |
| Package manager | pnpm | 10.28.2 |

Everything else (`lib/*`, `components/*`) is first-party — no component
library, no ORM-adjacent UI kit, no state-management library.

## Requirements

- Node.js 24+
- pnpm 10 (`corepack enable`)

## Getting started

```bash
pnpm install
cp .env.example .env      # then set ADMIN_PASSWORD_HASH and SESSION_SECRET
pnpm db:local             # PGlite-backed Postgres on 127.0.0.1:55432
pnpm db:migrate           # apply migrations
pnpm db:seed              # optional starter data
pnpm dev                  # http://localhost:3000
```

`pnpm dev` runs `scripts/dev-guard.mts` first and will tell you if the database
or `.env` is not ready.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Dev server (with a pre-flight DB/env guard) |
| `pnpm build` | `prisma generate` then `next build` |
| `pnpm lint` / `pnpm typecheck` | ESLint / `tsc --noEmit` |
| `pnpm test` | `node:test` suites in `tests/` |
| `pnpm db:local` | Start the PGlite Postgres used for local dev |
| `pnpm db:migrate` / `db:deploy` | Create / apply migrations |
| `pnpm db:seed` / `db:studio` | Seed data / browse the DB |
| `pnpm db:generate` | Regenerate the Prisma client |
| `pnpm dev:clear-sw` | Clear the service worker cache |

## Environment variables

See `.env.example` for the full list: `DATABASE_URL`, `ADMIN_PASSWORD_HASH`,
`SESSION_SECRET`, `UPLOAD_DIR`, `NEXT_PUBLIC_GA_ID` (reserved for analytics; not wired up yet),
and `NEXT_PUBLIC_SITE_URL` (canonical URLs + JSON-LD).

## Layout

```
app/            routes: (store) public pages, /admin, /login, /order
components/     atomic design: atoms → molecules → organisms → templates
lib/            domain logic: dishes, orders, hours, money, settings, session
prisma/         schema, migrations, seed
generated/      Prisma client output (git-ignored)
scripts/        dev guard, local Postgres, DB checks
tests/          node:test suites
proxy.ts        signed-cookie guard for /admin/*
```

## Conventions

- Arabic-only UI, RTL always; use logical Tailwind utilities (`ms-`, `ps-`,
  `start-`, `end-`).
- Server components by default; `'use client'` only where the browser is needed.
- Money is stored as `Int` agorot (1 shekel = 100 agorot) — never floats.
- Design tokens and rules live in `brand-style.md`; the front-end plan is
  `FRONTEND_PLAN.md`.