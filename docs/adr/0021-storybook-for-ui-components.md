# ADR-0021: Storybook for the UI components, run as Vitest browser tests

- **Status:** Accepted
- **Date:** 2026-11-05
- **Deciders:** Maintainer (DM)
- **Related:** [ADR-0002](./0002-testing-stack.md) (Vitest and Playwright), [ADR-0003](./0003-metadata-driven-domain-configuration.md), [ADR-0004](./0004-server-actions-over-rest-api.md), [ADR-0006](./0006-bilingual-ui.md), TD-155, TD-156, `docs/ROADMAP.md` Phase 5 "A design system"

## Context

The DM asked for a Storybook of every UI component the app uses, with tests. About 216 `.tsx` files sit under `app/ui/` and `app/modules/`. Nothing documented them as a set: Phase 5's design-system entry notes that `BaseButton`, `Modal`, `PageTitle`, `ListPage`, `Spinner` and `Toaster` are shared but written down nowhere.

What makes this app awkward to put in Storybook:

- **Next 16 App Router.** Components call `next/navigation`, `next/image`, `next/font/google` and next-intl's navigation helpers.
- **Server Actions everywhere** ([ADR-0004](./0004-server-actions-over-rest-api.md)). 135 modules start with `"use server"`, and most client forms import one directly. A further 112 modules import Prisma. None of them can load in a browser: they pull in `pg`, Prisma's client, bcrypt and the env validation behind them.
- **Async Server Components** (`SideNav`, `EntityList`, `AccountsTable`) that call `getTranslations` from `next-intl/server`, which throws by design outside a server render.
- **Two locales from day one** ([ADR-0006](./0006-bilingual-ui.md)), and a player's read-only view (SPEC-022) that changes what a card offers.
- **A Vitest 5 + Playwright stack** ([ADR-0002](./0002-testing-stack.md)), with an axe gate already in the E2E suite (TD-15).

## Decision

We will use **Storybook 10 with the `@storybook/nextjs-vite` framework**. Stories sit next to their component as `*.stories.tsx`, and **every story also runs as a Vitest test** in headless Chromium through `@storybook/addon-vitest`. That test renders the story, runs its `play` function and fails on any axe violation.

How it fits this codebase:

1. **Server-only modules become spies, decided from source.** `.storybook/serverModuleStubs.ts` is a Vite plugin. It replaces every module whose first statement is `"use server"`, or that imports `app/lib/connections/prisma`, with one `fn()` spy per export, named `<path>::<export>`. There is no list of modules to keep up to date. This mirrors Next itself, which never ships a Server Action's body to the browser. Storybook logs each call in the Actions panel and resets it before every story. A story that needs an answer sets it: `mocked(createSpell).mockResolvedValue({ ok: true })`. A unit test checks that every server module in `app/` can be stubbed. A computed non-function export fails `pnpm test` there, not in Storybook.
2. **Two entry points are aliased** to `.storybook/mocks/`. `next-intl/server` gets a `getTranslations`/`getLocale` built on next-intl's own `createTranslator` over the shipped catalogues. `@/auth` gets spies. Everything from Next itself (`next/navigation`, `next/image`, `next/font`) is the framework's.
3. **`preview.tsx` gives every story what the layouts give a page:** the font, `NextIntlClientProvider` with the real messages, `ReadOnlyViewProvider`, and a `Toaster` keyed per story. The toolbar switches locale (it/en) and viewer (DM/player).
4. **Async Server Components render** through `features.experimentalRSC`.
5. **a11y is a gate, not a panel.** `parameters.a11y.test = "error"` checks the whole `body`, portals included. A story the code cannot pass yet opts down to `"todo"` and names its debt item (TD-155). It never goes to `"off"`. This is the project's ratchet: ship at the level the code passes, then tighten.
6. **`pnpm test` is unchanged.** `vitest.config.ts` now has two projects: `unit` (jsdom, the old suite, the coverage ratchet) and `storybook` (browser). `pnpm test` runs `--project unit`; `pnpm test:storybook` runs the stories. CI runs the stories in their own job.
7. **Coverage is a ratchet too.** `.storybook/storyCoverage.test.ts`, in `pnpm test`, fails on a new component that no story imports. It also fails on a `PENDING_STORIES` entry (TD-156) that a story now covers. The list only shrinks.

## Alternatives considered

### `@storybook/nextjs` (the Webpack framework)

This is the older, more featureful integration, and its Server Action mocking is documented. We did not choose it because the Vitest addon, the part that turns stories into tests, needs a Vite-based framework. The repo already runs on Vite through Vitest. Webpack would have been a second bundler configured only for Storybook.

### Mocking server modules with `sb.mock()` in `preview.tsx`

Storybook 10's module mocking is the documented route. It takes one static `sb.mock(import("…"))` call per module, so here that is 247 lines, plus one more each time an action is added. The plugin derives the same set from the source and can never fall out of date. `sb.mock` is still the tool for a story that needs a real module's behaviour spied on (`{ spy: true }`). Nothing needs that today.

### MSW (Mock Service Worker)

MSW mocks the network. Server Actions here are imported functions, not fetches the story makes, so MSW would only cover `DeleteButton`'s `fetch` and the upload routes. A `spyOn(globalThis, "fetch")` per story covers those without a service worker.

### Visual regression (Chromatic, or Vitest screenshot assertions)

This is still out of scope, as `docs/TESTING.md` §3 says. Chromatic is an external service with an account. Committed screenshots differ between macOS and the Linux runner by font rendering, so the baselines would need regenerating in CI. Stories make it cheap to add later: see _Revisit when_.

### Ladle, or Histoire

Both are lighter. Neither has an equivalent of the Next framework integration or the Vitest addon, so the mocking above would have been hand-built on top.

## Consequences

**Positive**

- The shared components have a catalogue with variants, controls and autodocs. That is the "where their variants are written down" half of Phase 5's design-system entry.
- Every story is an interaction and axe test in a real browser. On its first run the axe gate found four contrast failures the E2E axe pass never reached (TD-155): `ItemMeta`'s value text on every card, Sonner's `richColors` toasts, the login error, and a dialog measured mid-fade-in. The last was a test-timing artefact, fixed by skipping framer-motion animations in test mode. _Corrected 2026-11-05 (TD-157):_ the `ItemMeta` finding was an artefact too. Its story rendered on a white canvas, but the component only ever sits on a dark card, where its original colour passes. Darkening it broke the real cards, and TD-157 reverted it. So a story renders a component on the surface it lives on.
- Server Actions, Prisma and auth never load in a story, and that holds without upkeep.

**Negative**

- **Installing `@vitest/browser-playwright` changes Vitest's own types.** `vitest/node` imports `vitest/browser`, which then resolves the provider's browser-mode `expect` matchers. Those apply to every test, and their `toHaveTextContent` takes no RegExp. One unit test (`DhClassLibrary.test.tsx`) went from a RegExp to the equivalent substring. A future `toHaveTextContent(/…/)` in a unit test is a type error. Pass a string, or assert on `textContent`.
- The stubs default to `undefined`. A story that clicks through to an action has to say what the action answers, or the component sees `undefined` where it expects a `MutationResult`.
- `test:storybook` needs Playwright's Chromium (`pnpm exec playwright install chromium`), the same browser as `test:e2e`.
- Vite discovers some dependencies lazily. A new library imported only by a story can reload the page once mid-run ("Vite unexpectedly reloaded a test"). `UI_DEPENDENCIES` in `.storybook/main.ts` pre-bundles the known ones. A missing entry costs one reload, never a wrong result.

**Neutral / follow-up work**

- TD-156: 171 components still have no story, grouped by domain in `.storybook/pendingStories.ts`. The batches are wide but shallow once the patterns exist.
- TD-155: the contrast findings. Each story marked `"todo"` returns to `"error"` when its finding is fixed.

## Revisit when

- **A visual regression would have been caught by a screenshot and not by axe or a `play` assertion.** That is the moment to add Vitest screenshot assertions, with baselines generated in CI.
- **Storybook's own Server Action mocking for the Vite framework** grows to cover `"use server"` modules generically. Then the plugin is redundant.
- **`@vitest/browser`'s jest-dom typings** accept a RegExp again. Then the note above can go.
