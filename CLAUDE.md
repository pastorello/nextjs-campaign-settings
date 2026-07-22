# CLAUDE.md

Guidance for AI agents (Claude Code, Cowork) working in this repository. Read this before making any change.

---

## Project

**Campaign Settings** — a self-hosted Next.js app for managing a D&D 5e homebrew campaign setting: spells, magic items, NPCs, deities, and an interactive world map.

Current phase: **hardening for portfolio presentation**. Correctness, tests and code quality take priority over new features. Do not add features unless explicitly asked — if you spot one worth building, note it in `docs/ROADMAP.md` instead.

Read [`docs/PROJECT_STATE.md`](./docs/PROJECT_STATE.md) and [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) before your first substantial change in a session.

---

## Language conventions

| Context | Language |
|---|---|
| Domain vocabulary in code | **Italian** — `incantesimi`, `png`, `patroni`, `fazioni`, `allineamento`, `circolo`, `rarita` |
| Technical identifiers | **English** — `fetchFilteredSpells`, `usePageManager`, `validateParams` |
| UI copy | **Italian** — this is the end-user language |
| Comments, docs, commit messages, PR descriptions | **English** |

Do not "fix" Italian domain names into English. They mirror the D&D 5e Italian rulebook and are deliberate. Do not introduce Italian into technical identifiers or documentation.

---

## Commands

```bash
pnpm dev                # dev server (Turbopack)
pnpm build              # production build
pnpm typecheck          # tsc --noEmit          — MUST pass
pnpm lint               # eslint .              — MUST pass
pnpm test               # vitest run            — MUST pass
pnpm test:watch         # vitest
pnpm test:coverage      # vitest run --coverage
pnpm test:e2e           # playwright test
pnpm db:seed            # prisma db seed
pnpm db:studio          # prisma studio
docker-compose up       # Postgres on :5432
```

> Some of these scripts do not exist yet — they arrive with TD-03 and TD-05. If a command fails because it is missing, say so rather than working around it.

---

## Architecture in one screen

- **Next.js App Router.** Server Components read from Postgres via Prisma. Server Actions write. No REST layer for domain data; the only route handlers are four DELETE endpoints and two read-only GeoJSON endpoints.
- **The metadata layer is the core abstraction.** Each field is declared once in `app/lib/config/<domain>/<domain>Meta.ts` as a `PageMeta`, composed into `pageMetaFields.ts` and ordered per page in `pagesConfig.ts`. That single declaration drives form rendering, list columns, filters and Prisma query construction. **Never bypass it** by hardcoding a field in a component — extend the metadata instead.
- **One concept per file** in `app/lib/definitions/` (enums, interfaces, types) and `app/lib/data/` (one function per file). Follow this.
- **`app/modules/maps/` is the quality bar.** Self-contained, typed, with an error boundary and defensive hooks. When refactoring elsewhere, aim for that structure.

---

## Non-negotiable rules

1. **Every mutation checks auth.** Every Server Action and every route handler that writes must verify a session first. No exceptions. (See TD-01.)
2. **Every mutation validates input.** Use the Zod `validator` already declared in the field's `PageMeta`. Never pass client data into `prisma.x.create({ data })` unvalidated. (See TD-02.)
3. **No new `any`.** The codebase has 16 and is removing them. If you genuinely cannot type something, use `unknown` and narrow.
4. **No new files in `app/ui/forms/`** — `PngForm.tsx` and `SpellForm.tsx` there are dead duplicates awaiting deletion. The live forms are in `app/ui/<domain>/`.
5. **Do not touch `app/lib/utils.ts`'s tutorial leftovers to "improve" them** — they are scheduled for deletion (TD-06).
6. **Never commit `.env`,** and never print secrets in output.
7. **Do not run destructive database commands** (`prisma migrate reset`, `db push --force-reset`, `DROP`) without explicit confirmation in the conversation.
8. **Do not upgrade `next` / `react` / `prisma` major versions** as a side effect of another task.

---

## Definition of done

No change is complete until all of these hold:

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm test` passes; coverage did not drop
- [ ] New behaviour has a test that fails without the change
- [ ] Bug fixes have a regression test reproducing the original bug
- [ ] No new `any`, no new `@ts-ignore`, no new `eslint-disable` without an inline reason
- [ ] Docs updated if the change alters architecture, conventions or setup

If you cannot satisfy one of these, say so explicitly in your summary rather than quietly skipping it.

---

## Working style

**Understand before changing.** Read the surrounding code and the relevant `docs/` section first. This codebase has an abstraction (the metadata layer) that is easy to accidentally bypass; a change that hardcodes a field "just this once" is a regression even if it works.

**Small, reviewable changes.** One concern per change. If a task turns out to require touching an unrelated area, stop and ask.

**Report honestly.** If a fix is partial, if a test is skipped, if something is uncertain — say it. A summary that overstates completeness costs more than one that admits a gap.

**Say when the plan is wrong.** If the requested approach conflicts with the architecture or with `docs/TECH_DEBT.md`'s sequencing, push back with a reason before implementing.

**Ask when genuinely ambiguous.** Do not guess at product decisions (what a field means, how a flow should behave). Do not ask about things you can determine by reading the code.

**Prefer deleting to adding.** This codebase's biggest problem is accumulated leftovers, not missing code.

---

## Change workflow

For anything beyond a one-line fix:

1. **Locate** the relevant item in `docs/TECH_DEBT.md` or `docs/ROADMAP.md`. If there isn't one, add it.
2. **For a feature**, write a spec first using `docs/specs/TEMPLATE.md`. Get it agreed before implementing.
3. **Plan** — state the files you will touch and the order, before editing.
4. **Test first** where practical, especially for bug fixes: write the failing test, then fix.
5. **Implement.**
6. **Verify** against the Definition of Done.
7. **Document** — update the relevant `docs/` file. If the change involved a non-obvious architectural decision, write an ADR (`docs/adr/`).

For architectural decisions (choosing a library, changing a data model, introducing a pattern), write an ADR using `docs/adr/TEMPLATE.md` **before** implementing. The ADR is where the reasoning lives; the code only shows the outcome.

---

## Commits and PRs

Conventional Commits:

```
feat(spells): add level range filter
fix(auth): require session on delete endpoints
refactor(meta): make PageMeta a discriminated union on fieldType
test(data): cover getQuery array filtering
docs(adr): record Vitest migration decision
chore(deps): pin next and react to exact versions
```

Scopes: `spells`, `magicitems`, `png`, `deities`, `maps`, `auth`, `meta`, `data`, `ui`, `ci`, `deps`.

One logical change per commit. Do not mix a refactor with a behaviour change — reviewers cannot separate them, and neither can `git bisect`.

Reference the debt ID where one applies: `fix(auth): require session on delete endpoints (TD-01)`.

---

## Where things live

```
app/api/**                    route handlers (DELETE + GeoJSON)
app/dashboard/**              authenticated pages
app/lib/config/**             ← metadata declarations (start here for field changes)
app/lib/data/<domain>/**      ← data access, one function per file
app/lib/definitions/**        enums / interfaces / types, one per file
app/lib/hooks/**              page manager + filter hooks
app/lib/utils/**              pure helpers and validators
app/modules/maps/**           self-contained Leaflet module
app/ui/<domain>/**            ← live domain components
app/ui/forms/inputs/**        metadata-driven form controls
prisma/schema.prisma          data model
docs/**                       state, architecture, debt, testing, roadmap, ADRs, specs
```

---

## Related documents

| Document | Read it when |
|---|---|
| [`docs/PROJECT_STATE.md`](./docs/PROJECT_STATE.md) | Starting a session; you need the inventory |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | Touching the metadata layer, data access or auth |
| [`docs/TECH_DEBT.md`](./docs/TECH_DEBT.md) | Deciding what to work on; checking sequencing |
| [`docs/TESTING.md`](./docs/TESTING.md) | Writing any test |
| [`docs/ROADMAP.md`](./docs/ROADMAP.md) | Planning; recording a feature idea |
| [`docs/adr/`](./docs/adr/) | Making or revisiting an architectural decision |
| [`docs/specs/`](./docs/specs/) | Building a feature |
