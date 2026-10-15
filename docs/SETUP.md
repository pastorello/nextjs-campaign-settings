# Setup

How to install, configure and run this app locally, and how to run its test suites. The
[README](../README.md) says what the project is; this file is the operational half, moved out of it
on 2026-10-15 so neither document has to serve two audiences.

There is no deployment guide, because there is no deployment yet: putting the app on a domain is
[SPEC-012](./specs/012-publishing-and-internet-exposure.md), deliberately deferred until the
authorisation model it depends on had shipped (it has — [SPEC-022](./specs/022-accounts-roles-and-party-visibility.md)).

---

## Requirements

- **Node.js >= 24** — the version is declared in `package.json`'s `engines` field
- **pnpm**, the only supported package manager — the version is pinned in `packageManager`, so
  `corepack enable` once and the right one is used automatically (CI reads the same field)
- **Docker**, for PostgreSQL (the compose file tracks `postgres:latest`; CI runs 16)

## 1. Install

```bash
pnpm install
```

`postinstall` runs `prisma generate`, so the client is built for you.

## 2. Configure

```bash
cp .env.example .env
```

Then generate a strong `AUTH_SECRET` — this rewrites the placeholder in `.env` in place:

```bash
pnpm dlx auth secret
```

Two variables are worth reading the comments on in `.env.example`:

- **`DATABASE_URL`** is the only connection string the app uses, and it is constructed from the
  `POSTGRES_*` values above it. Keep them consistent or the app and `docker-compose` will disagree
  about which database they mean.
- **`UPLOAD_DIR`** is where uploaded map images live on disk
  ([ADR-0008](./adr/0008-map-image-storage.md)), with record images in its `records/` subfolder
  ([ADR-0017](./adr/0017-record-images.md)). It must be **absolute**: a relative path resolves
  against `process.cwd()`, which differs between two checkouts of this repository even when they
  share a database. Leave it unset to use a fixed default under your home directory.

Never commit `.env`. It is gitignored, and so are the uploads and any exported library.

## 3. Start the database

```bash
docker-compose up -d
```

PostgreSQL on `POSTGRES_PORT` (5432 by default), with a named volume so the data survives a
restart, plus Adminer on http://localhost:8080 for a browser look at the raw tables — where columns
still carry their original Italian names, decoupled from the code by Prisma `@map` and expected
([ADR-0005](./adr/0005-english-identifiers.md)).

## 4. Create the schema and seed it

```bash
pnpm prisma migrate deploy
pnpm db:seed
```

Two things worth knowing:

- **Use `prisma migrate deploy`, not `db push`.** Some migrations embed data — the `faction` table
  is seeded by `20260806220000_add_faction_table_and_fk` in raw SQL — which `db push` skips, after
  which the seed fails on a foreign key constraint. `migrate deploy` applies schema and
  migration-embedded data in order.
- **The seed is safe to re-run.** It matches existing records by name (and users by email) before
  creating, so a second run creates nothing rather than duplicating, and it inserts no explicit ids:
  the database assigns them, exactly as it does for a record created through the UI.

To check the database agrees with the schema:

```bash
pnpm prisma migrate status
```

## 5. Run it

```bash
pnpm dev
```

The dev server is Turbopack, on http://localhost:3000. The seed creates one DM account —
`user@nextmail.com`, password `123456`, declared in
[`app/seed/initial-data/users.ts`](../app/seed/initial-data/users.ts) — which is a local development
credential and nothing else: change it before the app is reachable from anywhere. A logged-in DM
creates further accounts, player accounts included, under _Admin → Accounts_; a new account defaults
to the `player` role.

## Loading a real library

`pnpm db:seed` installs a handful of demo records — enough to see every page populated. A real
campaign library is loaded from a JSON export instead:

```bash
pnpm db:import ~/path/to/export.json --dry-run   # validate, write nothing
pnpm db:import ~/path/to/export.json
```

Every record is checked against the same Zod validators the app's own mutations use, and records are
matched by name, so re-importing updates rather than duplicates. Export files are gitignored by
design: campaign content belongs to whoever wrote it, and rulebook prose must not enter this
repository ([`docs/domain/licensing.md`](./domain/licensing.md)).

## Commands

```bash
pnpm dev            # dev server (Turbopack)
pnpm build          # production build
pnpm typecheck      # next typegen && tsc on tsconfig.typecheck.json
pnpm lint           # eslint .
pnpm format:check   # prettier --check .
pnpm test           # vitest run
pnpm test:watch     # vitest
pnpm test:coverage  # vitest run --coverage
pnpm test:e2e       # playwright test
pnpm test:e2e:ui    # playwright test --ui
pnpm db:seed        # seed demo data
pnpm db:import FILE # load a campaign library export
pnpm db:studio      # Prisma Studio
```

`typecheck`, `lint`, `format:check`, `test` and `test:e2e` are the five checks CI runs; all of them
must pass before a change is done ([`CLAUDE.md`](../CLAUDE.md), _Definition of done_).

## Running the tests

**Unit and component tests** need nothing in the environment — no database, no `.env`:

```bash
pnpm test                      # everything
pnpm test app/lib/data/spells  # just the paths you touched
```

**E2E tests** drive a real browser against a real database, and have two prerequisites that fail
loudly and confusingly if missed:

1. **`.env.test` must exist, with a `DATABASE_URL` different from `.env`'s.** The CRUD specs create
   and delete real rows, so `playwright.config.ts` refuses to start if the file is missing or points
   at the development database.
2. **Nothing may be listening on port 3000.** `reuseExistingServer` is `false`, so a stray
   `pnpm dev` is a port conflict rather than a silent attach to the wrong database.

```bash
pnpm test:e2e                                      # the whole suite, serial, one worker
pnpm test:e2e e2e/filtering.spec.ts --project=chromium   # one spec while iterating
```

The `chromium` project depends on the `setup` and `world-setup` projects, so authentication and the
world tree's root place are handled for you; `auth.spec.ts` runs under the `unauthenticated`
project instead. [`docs/TESTING.md`](./TESTING.md) §E2E has the full setup, including why it is
`prisma migrate deploy` and not `db push`.

## Troubleshooting

| Symptom                                                 | Cause                                                                                              |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Seed fails on a foreign key constraint                  | The schema was created with `db push`. Recreate it with `prisma migrate deploy`.                   |
| Playwright exits immediately with a config error        | `.env.test` is missing, or its `DATABASE_URL` equals `.env`'s.                                     |
| Playwright cannot start the dev server                  | Something is already on port 3000.                                                                 |
| Uploaded maps appear in one checkout and not another    | `UPLOAD_DIR` is relative, or unset in one of them.                                                 |
| Vitest reports twice the expected number of tests       | A leftover agent worktree under `.claude/` is a second checkout; both runners walk the filesystem. |
| `pnpm prisma migrate status` reports pending migrations | Run `pnpm prisma migrate deploy`; do not hand-apply schema changes.                                |
