## What

<!-- One or two sentences. What changes, in behavioural terms. -->

## Why

<!-- Link the debt ID, spec or issue: Closes TD-01 / Implements SPEC-003 / Fixes #12 -->

## How

<!-- The approach, and anything non-obvious a reviewer should know before reading the diff.
     If you rejected an obvious alternative, say why here — or in an ADR if the decision is significant. -->

## Type of change

- [ ] Bug fix
- [ ] New feature
- [ ] Refactor (no behaviour change)
- [ ] Tests
- [ ] Documentation
- [ ] Chore / dependencies

## Definition of done

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm test` passes; coverage did not drop
- [ ] New behaviour has a test that fails without this change
- [ ] Bug fixes have a regression test reproducing the original bug
- [ ] No new `any`, `@ts-ignore` or `eslint-disable` without an inline reason
- [ ] Docs updated if architecture, conventions or setup changed
- [ ] No secrets, no `.env`, no `.DS_Store`

## Security

<!-- Delete if the change touches no write path. -->

- [ ] Every new or modified mutation calls `auth()` and rejects requests without a session
- [ ] Every new or modified mutation validates its input with the field's Zod schema
- [ ] No user-supplied value reaches Prisma unvalidated

## Screenshots

<!-- Before/after for any UI change. -->

## Notes for the reviewer

<!-- Anything partial, deliberately deferred, or uncertain. Say it here rather than leaving it to be discovered. -->
