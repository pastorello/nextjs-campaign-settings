# CLAUDE.md

Guidance for AI agents (Claude Code, Cowork) working in this repository. Read this before making any change.

---

## Project

**Campaign Settings** — a self-hosted Next.js app for managing a D&D 5e homebrew campaign setting: spells, magic items, NPCs, deities, and an interactive world map.

Current phase: **hardening.** Correctness, tests and code quality take priority over new features — not to impress a reader, but because a correct, well-documented, low-drift base is what keeps this project cheap to pick back up, for the maintainer and for whichever agent opens it next. Do not add features unless explicitly asked — if you spot one worth building, note it in `docs/ROADMAP.md` instead.

Read [`docs/PROJECT_STATE.md`](./docs/PROJECT_STATE.md) and [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) before your first substantial change in a session.

---

## Language conventions

**Target state** — all code in English; user-facing text Italian today, Italian + English once TD-21 lands. See [ADR-0005](./docs/adr/0005-english-identifiers.md) and [ADR-0006](./docs/adr/0006-bilingual-ui.md).

| Context                                                            | Language                                                                                         |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| All identifiers: variables, functions, types, enums, Prisma fields | **English** — `name`, `description`, `rarity`, `npc`, `fetchFilteredSpells`                      |
| UI copy shown to the user                                          | **Italian + English**, from message catalogues — see [ADR-0006](./docs/adr/0006-bilingual-ui.md) |
| Campaign content in the database                                   | **Whatever the DM wrote.** Never translated, never dual-columned.                                |
| Postgres column names                                              | **Italian for now** — decoupled from code via Prisma `@map`; renamed later if ever               |
| Comments, docs, commit messages, PR descriptions                   | **English**                                                                                      |

**The rename happened — TD-19 landed 2026-07-30.** Domain fields and enums are English (`name`, `description`, `level`, `circle`, `npc`); Postgres columns stayed Italian and are decoupled by Prisma `@map` (`name String @map("nome")`). So `psql` and raw SQL still show `nome`, `descrizione`, `livello`, and that is expected, not drift.

**A residual set survived it: 16 Italian identifiers, tracked as TD-33.** Mostly option-list data and geography/tarot enums (`Circolo`, `Luogo`, `Tarocco`, `fazioni`, `allineamenti`, `FazioneItem`). They are unfinished work under ADR-0005, **not** a deliberate exception.

Rules that still hold:

- **Do not opportunistically rename the TD-33 identifiers** as part of unrelated work. Land them as one pure-rename commit, as TD-19 did. Unlike TD-19's, these renames are fully compiler-verified — nothing here is string-keyed — but a rename mixed into a behaviour change is still unreviewable.
- **New code uses English identifiers.** Never invent a new Italian one.
- Never put Italian in technical identifiers, comments or documentation.
- **The metadata layer is still string-keyed in places, and the compiler will not catch what you miss.** `getQuery.ts` hardcodes the free-text-search and default-sort field as a literal; that exact line was one of TD-19's two near-misses, caught only by the test suite going red. A missed key becomes a filter that silently stops filtering, which no type error announces.
- **Do not add new hardcoded UI strings.** The app ships bilingual (TD-21, still open). Until the catalogues exist, keep new user-facing copy in one obvious place per file so extraction stays cheap — do not scatter it through JSX. Several files already carry a single `COPY` object at the top for this reason; follow that.

---

## Commands

```bash
pnpm dev                # dev server (Turbopack)
pnpm build              # production build
pnpm typecheck          # next typegen && tsc --noEmit — MUST pass
pnpm lint               # eslint .              — MUST pass
pnpm test               # vitest run            — MUST pass
pnpm test:watch         # vitest
pnpm test:coverage      # vitest run --coverage
pnpm format:check       # prettier --check .    — MUST pass
pnpm test:e2e           # playwright test       — MUST pass
pnpm test:e2e:ui        # playwright test --ui
pnpm db:seed            # prisma db seed
pnpm db:studio          # prisma studio
docker-compose up       # Postgres on :5432
```

> Every script here is live. If a command fails because it is missing, say so rather than working around it.
>
> `test:e2e` starts its own dev server and **writes to whatever `DATABASE_URL` points at** — the CRUD specs create and delete real rows. Point it at a throwaway database. It runs serially on one worker, so prefer a single spec while iterating: `pnpm test:e2e e2e/<name>.spec.ts --project=chromium` (`auth.spec.ts` runs under the `unauthenticated` project instead).

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
3. **No new `any`.** The count is **zero**, and `no-explicit-any` is an `error` as of TD-08 step 4 (2026-07-27) — the linter enforces this rule now rather than trusting you to. If you genuinely cannot type something, use `unknown` and narrow at the point of use; a single documented assertion beats an `any` that silently disables checking on everything it touches.
4. **`app/ui/forms/` holds only generic form machinery** — today `PageForm.tsx`, `EntityForm.tsx` and `inputs/`. Domain forms live in `app/ui/<domain>/`. Do not add a domain form to `app/ui/forms/` — that is how the duplicate `PngForm` / `SpellForm` pair got there in the first place. (`EntityForm` is the generic shell TD-09 extracted; the per-domain field _layout_ stays in `app/ui/<domain>/`, deliberately, because encoding a field arrangement as configuration would move CSS into data.)
5. **Never commit `.env`,** and never print secrets in output.
6. **Do not run destructive database commands** (`prisma migrate reset`, `db push --force-reset`, `DROP`) without explicit confirmation in the conversation.
7. **Do not upgrade `next` / `react` / `prisma` major versions** as a side effect of another task.

---

## Decisions and rejected approaches

Git history records what was done. **Nothing records what was deliberately not done** — so without this list an agent will confidently re-propose an option that was already weighed and rejected, complete with a fresh rationale. That is the single most repetitive failure mode in this project, and this section exists to prevent it.

**Add an entry when** a suggestion is rejected, an approach is chosen over an obvious alternative, or an instruction written in `docs/` turns out to be wrong. Two lines each. A genuinely architectural decision goes in an ADR and is only linked from here. Keep this list short enough to be read every session — if it passes ~15 entries, prune the ones the code now makes obvious.

- **2026-07-22 — Unused is not dead: ask before deleting.** Some unused code is scaffolding for features not yet built. `app/modules/maps/components/map/` is a vendored library (taken from a GitHub project); `WorldMap.tsx` is a thin MVP that will wire more of it up over time, so its unused imports and unwired handlers are intentional. Do not remove an unused component, prop or import on the strength of "nothing references it" — distinguish _dead_ (tutorial leftover, superseded duplicate) from _unwired_ (waiting to be used), and when unsure, ask. (`BaseButton.buttonState` was such an unwired-but-planned prop; it was implemented on 2026-07-25 — loading / active / disabled / default — and now drives the button, so it is no longer an example of this.)
- **2026-07-22 — `Circolo.ts` stays, though nothing imports it.** The 23 thematic magic circles are the surviving half of the setting's original design; spells are now grouped by D&D 5e subclasses instead, and the DM intends to revisit the idea. Not dead code — do not delete it in a cleanup pass.
- **2026-07-22 — `circolo` holds subclass ids and is labelled "Sottoclassi".** The concept converged: the column keeps its old name (renaming it is TD-19 plus a migration) while the UI says what it actually contains. The duplicate `sottoclassi` field was removed from the code — it was never populated, and its column is dropped with TD-11.
- **2026-07-22 — No AI session log in this repo.** A sibling project (`local-social-network`) keeps a `docs/ai-log/` of per-session logs; this project deliberately does not. The durable half of that format — decisions and rejections — lives in this section instead, where it is actually read. Do not propose adding one.
- **2026-07-22 — `ItemMeta.value` is `ReactNode`, not `PrimitiveValue`.** TD-06's written instruction to repoint the import at `PrimitiveValue` was wrong: the prop always receives `PageMeta.getDatum` output, declared `string | ReactNode`. Restoring `PrimitiveValue` re-breaks `SpellCard` and `DeityCard` with nine errors.
- **2026-07-22 — `pg` is not dead code.** The raw `postgres` driver was removed in favour of Prisma, but `@prisma/adapter-pg` requires `pg`. `DATABASE_URL` is now the only connection string; `POSTGRES_URL` is gone.
- **2026-07-22 — No flat file beside a directory of the same name.** `app/lib/utils.ts` and `app/lib/data.ts` were deleted and their one surviving export each moved into `app/lib/utils/data/` and `app/lib/data/`. Do not reintroduce the pattern.
- **2026-08-01 — This project is not "for portfolio"; do not reintroduce that framing.** The stated goal used to be "hardening for portfolio presentation" (this file) and "portfolio-grade" (`docs/PROJECT_STATE.md`); both were reworded to "sustainable to keep working on" — same practical priorities (correctness and tests before features), different reason, because the audience is the maintainer and future agent sessions, not a reviewer. `README.md` was cut from 240 lines to a minimal functional one (stack, quickstart, commands, doc links) in the same pass — its screenshots, "Project status" scorecard and pitch language existed only to be looked at, cost real sync effort (they were already stale twice), and served no session's actual work. `docs/TECH_DEBT_ARCHIVE.md`'s narrative write-ups were deliberately kept as-is despite reading similarly — that content is a working record of what was tried and rejected, not a showcase, and earns its length. Don't re-add screenshots, status badges or reviewer-facing copy to `README.md` on the theory that it "looks unfinished" without them.

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

## External skill packs

Five skills from [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) are installed:

| Skill                          | Used for                                                      |
| ------------------------------ | ------------------------------------------------------------- |
| `security-and-hardening`       | TD-01, TD-02 — auth guards, boundary validation, OWASP checks |
| `test-driven-development`      | TD-03 and every subsequent change — red-green-refactor        |
| `code-review-and-quality`      | Self-review before any commit; change sizing                  |
| `debugging-and-error-recovery` | Any failing test or unexpected behaviour                      |
| `incremental-implementation`   | TD-19, TD-09, TD-21 — the wide refactors                      |

**Precedence.** The pack supplies _method_ — how to do TDD, how to run a security review, how to slice a refactor. This file and `docs/` supply _constraints_ — what is true about this codebase specifically.

**Where they conflict, this file wins.** The pack cannot know that the metadata layer is string-keyed, that a partial rename silently breaks filters, or that `app/ui/forms/` holds dead duplicates. Do not let a generic workflow override a project rule in the _Non-negotiable rules_ section above.

**Not installed, deliberately:**

- `spec-driven-development` and `planning-and-task-breakdown` — this project uses `docs/specs/TEMPLATE.md` and the change workflow below. Two overlapping spec systems produce inconsistent behaviour between sessions. If you think the pack's version is better, replace ours deliberately and write an ADR — do not run both.
- `performance-optimization` — premature. Measure after Phase 2, and only if there is a complaint.
- The `/ship` skill and deploy tooling — there is no deployment pipeline yet.

Adding more skills from the pack is fine; record it here when you do.

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

## Bringing research into the codebase (Cowork → Claude Code)

Design and research often start in a Cowork/Chat session or a claude.ai Project.
**A Claude Code session cannot read a Project's knowledge or memory** — the two
are separate systems (verified 2026-07-22). The only bridge is the filesystem: the
product of that thinking has to be **committed to the repo as a file** before an
agent here can build against it.

- **Reference rules** (how the game works) go in `docs/domain/`, restated in our
  own words. **Game mechanics are not copyrightable; rulebook text is** — restate
  the systems, never paste manual prose, never commit the PDFs. Prefer the SRD
  5.1 (Creative Commons). See [`docs/domain/README.md`](./docs/domain/README.md).
- **Feature intent** (what we build and why) goes in `docs/specs/`, using the
  existing template. A spec cites the domain files it depends on.
- Claude Code reads PDFs directly (up to 20 pages at a time), but the durable
  pattern is to distil first and commit the distilled markdown, not the source.

The loop: research in Cowork → commit distilled notes to `docs/domain/` and a
spec to `docs/specs/` → Claude Code builds against them → PR.

---

## Related documents

| Document                                           | Read it when                                     |
| -------------------------------------------------- | ------------------------------------------------ |
| [`docs/PROJECT_STATE.md`](./docs/PROJECT_STATE.md) | Starting a session; you need the inventory       |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)   | Touching the metadata layer, data access or auth |
| [`docs/domain/`](./docs/domain/)                   | Building a game feature; you need the 5e rules   |
| [`docs/TECH_DEBT.md`](./docs/TECH_DEBT.md)         | Deciding what to work on; checking sequencing    |
| [`docs/TESTING.md`](./docs/TESTING.md)             | Writing any test                                 |
| [`docs/ROADMAP.md`](./docs/ROADMAP.md)             | Planning; recording a feature idea               |
| [`docs/adr/`](./docs/adr/)                         | Making or revisiting an architectural decision   |
| [`docs/specs/`](./docs/specs/)                     | Building a feature                               |
