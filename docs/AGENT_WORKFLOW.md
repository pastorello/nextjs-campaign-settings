# Agent workflow

How an agent session works in this repo — locally or in a Claude Code cloud
session. `CLAUDE.md` says _what is true about the codebase_; this file says _how
to work in it_, and is imported from `CLAUDE.md` so every session loads it.

These rules used to live only in the maintainer's uncommitted
`CLAUDE.local.md` and in one machine's agent memory, so a cloud session never
saw them. They were moved here on 2026-09-30. Anything that is true of one
machine only (its shell, its Docker container names) stays out of this file.

The reason behind most of them: context is re-sent on every tool call. It is
cached, so not catastrophic, but it is charged on **every** call and only grows.
What enters the context is paid for again at each later step — the cheapest
token is the one never read. A cloud session spends credit, not a discount:
the same rules apply there.

---

## Tests — run the narrowest thing that can fail

- **Unit:** `pnpm test <path>` while iterating (e.g. `pnpm test app/lib/data/spells`).
  The full `pnpm test` runs once, at the end, before handing over. It needs
  nothing in the environment (TD-75); if a suite ever fails on a missing env
  var, that is a TD-75 regression, not something to paper over.
- **E2E:** the spec that covers the touched files, not the suite:
  `pnpm test:e2e e2e/<name>.spec.ts --project=chromium`. Two prerequisites that
  fail loudly and confusingly if missed (TD-65, TD-73): `.env.test` must exist
  with a `DATABASE_URL` different from `.env`'s, and **nothing may be listening
  on :3000** (`reuseExistingServer: false`). In a cloud session,
  `scripts/cloud-setup.sh` provides both — see `docs/TESTING.md` §E2E.
- The full E2E suite belongs in CI and the final pre-PR check, not in the loop.

## Reading and output

- **Read ranges, not whole files.** `grep` for the line, then read around it.
- **Never run `pnpm build` unless asked.** It is slow and its output is huge;
  `pnpm typecheck` answers the question that usually motivates it.
- **Cap verbose failures:** `2>&1 | head -40`. Read further only if the first
  errors do not explain the failure.
- **Screenshots only when appearance itself is the question** (layout, colour,
  a visual regression). Text, counts, computed styles and toasts are cheaper and
  more precise through DOM queries.
- **Batch independent calls into one turn.** The number of turns multiplies
  cost on its own. Before a wide exploration, say which files you will open.
- **Do not re-derive what is in context:** no re-reading `CLAUDE.md`, no
  `git status` every turn, no reading back a file just edited.
- **Subagents only for genuine fan-out.** They start cold with no cache.
- **Brief summaries.** Output is the expensive direction.

## Facts about the repo

- **Verify before claiming.** General knowledge is reliable for mechanics
  (how Prisma, Next or Playwright work) and unreliable for facts about this
  repository. A claim about the code is checked in the code first.
- **When a doc and the code disagree, the code is the fact and the doc gets
  fixed** in the same change, with a dated note where the old text mattered.

## Git and CI

- **No direct commits to `main`** — branch protection blocks it, including
  one-line doc edits. Cut the branch before editing.
- **Before pushing, check the branch's PR is still open:**
  `gh pr list --head <branch> --state all`. A push to a branch whose PR is
  merged fires no CI at all; cut a new branch instead.
- **`pnpm format:check` after the literal last edit** — including doc edits
  made while writing the commit message or closing a debt item. The recurring
  failure is: all checks green, then one more edit to `docs/TECH_DEBT.md`, then
  a push that CI rejects on formatting.
- **Open the PR without asking, then bring its CI to green before reporting
  back** (the maintainer, 2026-09-30). Once the Definition of Done holds and
  the branch is pushed, open the PR (following
  `.github/PULL_REQUEST_TEMPLATE.md`), follow its CI, and fix and push until it
  is green. Only then hand over. Stop earlier only for a failure that needs
  the DM's decision rather than a fix, and say exactly what it is.
- **Never poll CI** (`gh pr checks` loops, `gh run watch`, sleep-and-retry).
  In the desktop app, turn on the PR's Auto-fix monitor after opening it and
  act on its events. In a cloud session, subscribe to the PR's activity and
  act on its events. Elsewhere, stop after pushing and say CI is pending.
- **Diagnosing a CI-only E2E failure:** the run's `playwright-report` artifact
  (ask before downloading it — name, source, size). `data/` holds one
  `error-context` `.md` per attempt (cheap to read) and the trace `.zip`, kept
  only for the first retry. In the trace, `*-trace.trace` has the actions and
  `*-trace.network` every request; Server Action POSTs carry a `next-action`
  header. Align the two clocks through the `context-options` line.
- **Reading a CI job's log from a cloud session:** the full log's download
  URL (Azure blob storage) is refused by the egress proxy (403), and so is the
  artifact. Read it through the GitHub tools' job-log call with the content
  returned and a tail of ~420 lines: the end of an E2E job is the Postgres
  service container's log (a `role "root" does not exist` line every 10 s),
  and Playwright's failure summary sits just above it. The summary names each
  `error-context.md`; reproducing locally and reading the local one gives the
  page snapshot, which is how TD-152's out-of-bounds form value was found.

## Scope and product decisions

- **Ratchet, do not flip.** A new check ships at the level the code passes
  today; the backlog becomes a named debt item that tightens it later.
- **Campaign material stays out of search.** `searchAllDomains` is a
  hand-written opt-in list; campaigns, adventures, scenes and loot are the DM's
  private working material and must not be added to it.

## Session hygiene

- **One task per session.** When a debt item or spec task closes, or the
  context fills with spent material, write the handoff and end the session —
  do not push on until the context compacts.
- **The handoff has two parts.** The state goes into the relevant `docs/` file
  (usually the item's own entry), because it belongs in the repo. The next
  session's prompt is given in the final message, unprompted, and is **plain**:
  goal and task ID, then short factual bullets — branch, files in flight,
  what is done, what is next. Reasoning stays in the register; a prompt is an
  instruction to execute, not a document to read.
- **Mechanical work does not need the most capable model — say so before
  starting it.** A rename, a string extraction into the catalogues, a wide but
  shallow find-and-replace: stop, name the cheaper model **and** effort level
  (e.g. "Sonnet, medium effort"), and wait. Mentioning it after starting is
  worth nothing.
