# SPEC-034: Lighthouse (Core Web Vitals) checks in CI

- **Status:** Draft — written 2026-10-15 from the ROADMAP's Phase 5 entry of the same name. Five questions wait for the maintainer (§9, _Open questions_); each carries a recommendation. Nothing is implemented.
- **Date:** 2026-10-15
- **Phase:** 5
- **Related:** `.github/workflows/ci.yml` (the `build` and `e2e` jobs this one borrows from) · `e2e/a11y.spec.ts` (TD-15/TD-24, the accessibility gate this does not replace) · `e2e/auth.setup.ts` and `e2e/fixtures/testUser.ts` (the seeded account and the login flow) · [ADR-0020](../adr/0020-roles-in-the-session-and-four-guards.md) (what a valid session carries) · `docs/AGENT_WORKFLOW.md` _Ratchet, do not flip_ · ADR-0021 (to be written in T1)

---

## 1. Problem

**Nothing tells the maintainer when a change makes the app slower.** CI proves the code types, lints, passes ~74% coverage, builds for production and has zero axe violations — but no job loads a page and measures it. A heavier bundle, a layout that shifts while the list loads, or a Server Component that now blocks the first paint all merge green and are found, if ever, by the DM noticing the app feels slow.

The only "core-web-vitals" in the repo today is `eslint-config-next/core-web-vitals` in `eslint.config.mjs`: a lint preset that flags known anti-patterns (`<img>` instead of `next/image`, sync scripts). It measures nothing.

## 2. Goal

Every pull request into `main` runs Lighthouse against a production build of the app on a few representative pages, and fails when performance, best practices or the lab Core Web Vitals fall below the level `main` holds today.

## 3. Non-goals

- **Field data.** No `web-vitals` reporting from real browsers, no RUM endpoint, no dashboard. This is lab data on a CI runner.
- **INP.** Interaction to Next Paint needs a real interaction; Lighthouse's navigation audit cannot produce it. Total Blocking Time is its lab proxy and is what is asserted. Anything that describes this check (README, a CV) says "LCP, CLS and TBT", not "all three Core Web Vitals".
- **Replacing the accessibility gate.** `e2e/a11y.spec.ts` asserts zero axe violations on ~30 pages and stays the gate. Lighthouse's accessibility category runs a subset of the same axe rules on five pages; it is recorded, not asserted (§9 Q5).
- **SEO and PWA categories.** Every page but `/login` sits behind auth, so SEO scores mean nothing here; Lighthouse 12 removed the PWA category.
- **A Lighthouse CI server** (`lhci server`), historical charts, or uploading reports to `temporary-public-storage` — that target publishes every report to a public Google bucket. Reports stay a CI artifact.
- **Performance work.** This spec measures. If the baseline shows a slow page, that is a debt item of its own, not part of this spec.
- **Dev-server numbers.** Turbopack's dev server compiles on request and ships unminified code; auditing it would measure the compiler.

## 4. User stories

- As the maintainer, I want a PR that regresses a page's performance to fail CI, so that I find out before merging rather than from the DM.
- As the maintainer, I want the full Lighthouse report of every run kept as an artifact, so that a failure shows which metric moved and why, without re-running anything locally.
- As the maintainer, I want to run the same audit locally with one command, so that I can check a fix before pushing.

## 5. Behaviour

**Main flow (CI)**

1. A new `lighthouse` job in `ci.yml` starts after `build` succeeds, with the same Postgres service, `prisma migrate deploy` and `pnpm db:seed` as the `e2e` job. The seeded data is the workload: every page is measured against the same rows.
2. It builds the app (`pnpm build`) and starts it with `pnpm start` on `:3000`.
3. A login script (`scripts/lighthouse/login.ts`) drives the real login form with Playwright's library API — not the test runner, whose `webServer` would start `pnpm dev` — as the seeded `TEST_USER`, and writes the session cookie to a file outside the repo's tracked paths.
4. `lhci collect` audits each page three times with the **desktop** preset (§9 Q1), sending that cookie through Lighthouse's `extraHeaders`, using Playwright's pinned Chromium (`chromePath`) so the browser version moves with the lockfile, not with the runner image.
5. A guard (`scripts/lighthouse/checkFinalUrls.ts`) reads every report and fails the job if any audit ended anywhere but the URL it asked for — above all on `/login`. Without it, an expired or rejected cookie makes Lighthouse audit the login page five times and pass.
6. `lhci assert` checks the median run of each page against the budgets in `lighthouserc.cjs` (§9 Q4).
7. `.lighthouseci/` is uploaded as the `lighthouse-report` artifact, kept 7 days like `playwright-report`, whether the job passed or not.

**Pages audited** (§9 Q2)

| Page                                | Why this one                                                                     |
| ----------------------------------- | -------------------------------------------------------------------------------- |
| `/login`                            | The only public page, and the first one anyone sees                              |
| `/dashboard/dnd5e`                  | The landing page after login; the sidebar and layout every page shares           |
| `/dashboard/dnd5e/spells`           | The largest seeded list: cards, filters, pagination — the metadata layer at work |
| `/dashboard/dnd5e/admin/spells/new` | The heaviest form: two Tiptap rich-text editors (SPEC-019)                       |
| `/dashboard/dnd5e/geography`        | The Leaflet map, the largest client-side module                                  |

**Locally**

`pnpm lighthouse` runs steps 3–6 against an app already running with `pnpm build && pnpm start`, pointed at `.env.test`'s database for the same reason the E2E suite is (TD-65). It does not build or start the app itself: a production build is slow and the person running it decides when it is current. Numbers from a laptop are not comparable with CI's and are not used to set budgets.

**Edge cases**

| Situation                                                   | Expected behaviour                                                                                                                               |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| The cookie is rejected or expires mid-run                   | The final-URL guard fails the job and names the page that redirected                                                                             |
| The login script cannot sign in (form copy or flow changed) | The script fails before any audit runs, with the step that failed                                                                                |
| The seed changes                                            | The numbers may move with it. A PR that changes the seed and moves a budget re-baselines in the same PR and says so                              |
| One run of three is an outlier                              | The median absorbs it; that is why there are three                                                                                               |
| A budget flakes on `main` with no code change               | Widen that one budget through a named debt item that records the observed spread — never by deleting the assertion or turning the job off        |
| The map page has no uploaded map image in CI                | Accepted: the upload dir is empty in CI, so the map measures its own code and tiles, not an image. Stated in the ADR so nobody reads it as a bug |
| A deliberate change makes a page heavier                    | The PR raises that page's budget in `lighthouserc.cjs` and says why in its description; the diff is the record                                   |

## 6. Data model changes

None.

## 7. Metadata changes

None.

## 8. Acceptance criteria

- [ ] A PR into `main` runs a `lighthouse` job against a production build; a PR that breaks a budget fails it
- [ ] Each page in §5 is audited three times and asserted on its median run
- [ ] Assertions cover the performance and best-practices category scores, LCP, CLS and TBT; accessibility is reported, not asserted
- [ ] The job fails if any audit's final URL differs from the one requested (`checkFinalUrls` has a unit test that fails without it, on a report fixture redirected to `/login`)
- [ ] The cookie-header builder has a unit test (storage state in, `Cookie` header out; no session cookie → throws)
- [ ] The `lighthouse-report` artifact is uploaded on success and on failure
- [ ] No report is uploaded anywhere outside GitHub Actions artifacts
- [ ] Budgets start at the level `main` passes (the ratchet rule), measured from CI runs, not from a laptop
- [ ] `pnpm lighthouse` works locally against a running production build, documented in `docs/TESTING.md`
- [ ] Coverage has not dropped

## 9. Implementation plan

**Files touched, in order**

| #   | File                                        | Change                                                                                                      |
| --- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 1   | `docs/adr/0021-lighthouse-ci.md`            | The runner choice and the rejected alternatives (below)                                                     |
| 2   | `package.json`                              | `@lhci/cli` as a dev dependency; `lighthouse` script                                                        |
| 3   | `scripts/lighthouse/login.ts`               | Sign in with Playwright's library API, write storage state                                                  |
| 4   | `scripts/lighthouse/cookieHeader.ts`        | Pure: storage state → `Cookie` header; throws without the Auth.js session cookie                            |
| 5   | `scripts/lighthouse/checkFinalUrls.ts`      | Pure core + thin CLI: fail on any report whose final URL differs from the requested one                     |
| 6   | `lighthouserc.cjs`                          | URLs, `numberOfRuns: 3`, desktop preset, `chromePath`, `extraHeaders`, assertions                           |
| 7   | `.github/workflows/ci.yml`                  | The `lighthouse` job                                                                                        |
| 8   | `.gitignore`                                | `.lighthouseci/` and the cookie file                                                                        |
| 9   | `docs/TESTING.md`, `CLAUDE.md`, `README.md` | How to run it; the command in the commands table; one line in the engineering highlights, worded as §3 says |

**The runner, and what was weighed** (for ADR-0021)

- **Chosen: `@lhci/cli`** in its own job. It already does what would otherwise be written by hand: several runs per URL, the median, declarative assertions with `error`/`warn` levels, and a report directory to upload.
- **Rejected: Lighthouse driven from a Playwright test.** It would reuse `auth.setup.ts` as-is, but the median, the assertions and the report would all be hand-written, and the E2E config's `webServer` starts `pnpm dev` — the one server this must not audit.
- **Rejected: `lhci`'s `puppeteerScript` for the login.** It needs `puppeteer` and a second browser download, for a login Playwright already knows how to do.
- **Rejected: minting the session JWT directly with `@auth/core/jwt`.** Fastest, and no browser — but it hand-builds what ADR-0020's `jwt` callback puts in the token, so it silently drifts the day that callback changes. Driving the real form tests the real thing.
- **Rejected: logging in over HTTP.** There is no `/api/auth/*` route: login is the `authenticate` Server Action, and calling a Server Action from a script means forging its action id.

**Risks**

- **Noise.** Shared runners vary in CPU. Lighthouse's default simulated throttling (Lantern) models the network and CPU from the trace rather than slowing the browser, which keeps the spread smaller than DevTools throttling would; three runs and a median do the rest. If a metric still flaps, the margin widens through a debt item (§5).
- **Job time.** A second production build plus 5 pages × 3 runs. Estimated at 6–9 minutes, running in parallel with `e2e`, which is longer, so the PR's wall-clock time should not grow. Reusing the `build` job's `.next` through an artifact is a later optimisation, not part of this spec.
- **A false green.** An audit of the wrong page passes everything. The final-URL guard exists for exactly this, and its test is the one that must fail first.

**Open questions**

1. **Desktop or mobile preset?** _Recommended: desktop._ The app is where the DM builds the setting, not where sessions are run (CLAUDE.md, 2026-09-22), and that happens at a desk. The mobile preset's 4× CPU slowdown would set budgets for a device this app is not used on. Mobile can be added later as a second, `warn`-only collection.
2. **The five pages in §5 — right set?** _Recommended: as listed._ Adding a page costs roughly a minute of CI per page.
3. **Required from day one, or after a burn-in?** _Recommended: budgets set from the first CI baseline (the ratchet rule), but the job made a required status check only after ~10 green runs on `main` with no flake._ That is a branch-protection setting only the maintainer can change.
4. **Margins.** _Recommended:_ category scores at the baseline median − 0.05; LCP and TBT at the baseline median + 20%; CLS at the baseline + 0.02, and never looser than 0.1 (Google's "good" line). Tightened later through debt items, never loosened silently.
5. **Assert Lighthouse's accessibility score too?** _Recommended: no — report it._ The axe suite is stricter (zero violations, ~30 pages); a second, weaker gate on the same rules adds a failure that can never be the first one to fire.

## 10. Task breakdown

- [ ] **T1** — ADR-0021: Lighthouse CI with `@lhci/cli`, the login through Playwright's library, reports as an artifact only; the rejected alternatives above. _(test: none — a document)_
- [ ] **T2** — `cookieHeader.ts` and `checkFinalUrls.ts`, test first. _(test: unit — a storage state without the session cookie throws; a report fixture whose final URL is `/login` fails the check)_
- [ ] **T3** — `login.ts`, `lighthouserc.cjs` with every assertion at `warn`, `pnpm lighthouse`; run locally against `pnpm build && pnpm start` on `.env.test`'s database. _(test: the local run produces five reports, none on `/login`)_
- [ ] **T4** — The `lighthouse` job in `ci.yml`, still `warn`-only, with the artifact upload. Record the first CI runs' medians per page in §11 as the baseline. _(test: the job is green on the PR and the artifact holds 15 reports)_
- [ ] **T5** — Assertions to `error` at the baseline with the margins of Q4; `docs/TESTING.md`, `CLAUDE.md` commands, `README.md` highlight; ROADMAP entry ✅. _(test: a throwaway commit that adds a 2 s artificial delay to `/dashboard/dnd5e/spells` fails the job; reverted before merge)_

## 11. Outcome

_Fill in at close._

- Shipped: YYYY-MM-DD
- Baseline (CI median, per page): …
- Deviations from spec and why: …
- Follow-up debt created: …
