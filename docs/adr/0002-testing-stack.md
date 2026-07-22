# ADR-0002: Use Vitest and Playwright for testing

- **Status:** Accepted
- **Date:** 2026-07-22
- **Deciders:** Turu
- **Related:** [TD-03](../TECH_DEBT.md), [TESTING.md](../TESTING.md)

## Context

The project has a Jest setup that does not run. `npx jest` fails at startup with `Module <rootDir>/jest.setup.ts in the setupFilesAfterEnv option was not found`, despite the file existing. Beyond that failure, the configuration is misconfigured in ways that would surface immediately after fixing it: `testEnvironment` is `jest-environment-node` while the suite renders React components with Testing Library, `collectCoverage` is on for every run, and the config file is the unedited 150-line Jest scaffold with about ten real settings buried in commented-out defaults.

The suite itself is three trivial utility tests and one dashboard snapshot. One test file (`__test__/utils/createEmptyArraytest..ts`) has a malformed name and has never been collected. Effective coverage of business logic is zero.

Running Jest also requires the Babel toolchain (`@babel/preset-env`, `@babel/preset-react`, `@babel/preset-typescript` are all direct dependencies) purely to transform TypeScript for tests — a parallel build pipeline that exists for no other reason.

So the real question is not "how do we fix Jest" but "given that we are rebuilding the test suite from nothing anyway, what should we build it on". There is no meaningful migration cost because there is almost nothing to migrate.

There are also no end-to-end tests at all, and the flows most likely to break — login, CRUD round-trips, filter persistence across reloads — are precisely the ones only E2E can cover.

## Decision

We will use **Vitest** with Testing Library for unit and integration tests, and **Playwright** for end-to-end tests.

Jest, Babel and the associated stub files are removed entirely.

## Alternatives considered

### Repair the existing Jest setup

The conservative option: fix the `setupFilesAfterEnv` resolution, switch `testEnvironment` to `jsdom`, turn off default coverage collection, strip the commented scaffold. Perhaps an hour of work versus roughly two for the migration.

Rejected because it preserves the Babel dependency chain for no benefit, keeps `moduleNameMapper` duplicating the `@/*` alias that `tsconfig.json` already declares (two sources of truth, one of which will drift), and leaves the project on the slower runner. The hour saved buys a worse outcome. Jest remains an entirely reasonable choice for a codebase with a large existing suite — that is simply not this codebase.

### Vitest with no E2E layer

Unit and integration only. Cheaper, and covers the query-construction logic that carries most of the risk.

Rejected because the stated goal is portfolio readiness, and the bugs a reviewer will actually hit are integration-level: a form that submits but does not persist, a filter that resets on reload, a pagination control showing the wrong page count (a live risk — see TD-12). None of those are visible to unit tests. A small, disciplined E2E suite is the difference between "the code looks tested" and "the app demonstrably works".

### Cypress instead of Playwright

Mature, good developer experience, large community.

Rejected on three counts: Playwright's parallel execution and multi-browser support are stronger out of the box, its auto-waiting removes a whole category of flakiness that Cypress requires explicit handling for, and `@axe-core/playwright` gives us the accessibility assertions we need for TD-15 in the same suite rather than a second tool. Playwright is also the better-aligned choice with Next.js, which uses it for its own testing documentation.

### Node's built-in test runner

Zero dependencies, increasingly capable.

Rejected: no first-class JSX/TSX transform, no watch-mode ergonomics comparable to Vitest, and Testing Library integration requires manual wiring. The dependency saved is not worth the friction on a project where test-writing needs to be as low-friction as possible to actually happen.

## Consequences

**Positive**

- Native ESM and TypeScript execution; the entire Babel dependency chain (`@babel/preset-env`, `-react`, `-typescript`, `babel.config.js`) is deleted.
- `vite-tsconfig-paths` resolves the `@/*` alias from `tsconfig.json` directly — the path mapping stops being duplicated in test config.
- Substantially faster runs, which matters because a slow suite is a suite that gets skipped.
- `vi.mock` API is close enough to `jest.mock` that the existing `__test__/mocks/next/*` files port with a find-and-replace.
- Vitest's `--ui` and Playwright's `--ui` and trace viewer make failures diagnosable rather than mysterious.
- Playwright's role-based selectors (`getByRole`, `getByLabel`) double as accessibility assertions, so the E2E suite contributes to TD-15 for free.
- Both are current-generation tools; a reviewer reads the choice as up to date.

**Negative**

- Vitest's ecosystem of Jest-specific plugins and blog answers is smaller. Rarely an issue, occasionally a search that takes longer.
- Playwright adds browser binaries to CI (~30s of cold install, cached thereafter) and E2E specs need a running app and database, making CI setup non-trivial.
- E2E tests are the most expensive tests to maintain. Mitigated by capping the suite at roughly eight specs covering only critical flows — see `TESTING.md`.

**Neutral / follow-up**

- Integration tests will run against a real Postgres rather than a mocked Prisma client. This requires a disposable database in CI (Testcontainers or a compose service) — deliberate, since mocking Prisma tests the mock rather than the query.
- Coverage thresholds start at whatever Phase 1 achieves and ratchet upward. A threshold that must be disabled to merge is worse than none.

## Revisit when

The unit suite exceeds roughly ten seconds, or Vitest's Next.js App Router support (Server Components in particular) proves inadequate for testing the data layer. In the latter case the likely answer is not "return to Jest" but "move more of that coverage into the integration layer".
