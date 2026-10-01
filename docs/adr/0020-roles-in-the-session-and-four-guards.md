# ADR-0020: Carry the role in the session, check it fresh, and guard at four boundaries

- **Status:** Accepted
- **Date:** 2026-09-30
- **Deciders:** the DM, Claude
- **Related:** [SPEC-022](../specs/022-accounts-roles-and-party-visibility.md) · TD-01 (the session guards this extends) · [ADR-0008](./0008-map-image-storage.md), [ADR-0017](./0017-record-images.md) (routes whose "authenticated" check this narrows)

## Context

Until SPEC-022 there was one kind of account, and every check in the app asked
only "is anyone signed in". SPEC-022 adds a `player` role that may read what a
campaign has been shown and change nothing, beside the `dm` who may do
everything. Four facts shape how the role is checked:

- **Sessions are JWTs** (Auth.js v5, Credentials provider). A token is signed
  once and read many times. A role copied into it at sign-in is stale the
  moment the DM disables or demotes the account, and SPEC-022 §5 wants such a
  change to apply at the account's next request.
- **The proxy decodes the token but does not run Auth.js's callbacks**
  (`getToken`), and its matcher excludes `/api`. TD-01 already made every
  route handler and Server Action guard itself. In Next 16 the proxy runs on
  Node.js, so it can read the database.
- **A layout is not a boundary for its pages' data.** A page renders in
  parallel with its layout. When the dashboard layout called `forbidden()`,
  the 403 response still carried the page's RSC payload: the NPC list's names
  were in the body (observed 2026-09-30 while building T1). A client
  navigation can also skip the layout altogether.
- **Next strips the RSC headers before the proxy runs** (`FLIGHT_HEADERS` in
  `next/dist/server/web/adapter.js`), so the proxy cannot tell a client
  navigation from a document load.

The rollout is also staged. Player accounts arrive in T3, but the read paths
learn to filter only in T7 and T8. In between, a player must see nothing.

## Decision

We will put the account's `id` and `role` in the session. We will re-read the
role and `active` from the row wherever the decision is made. We will check at
four boundaries:

1. **`requireDm()`** in every Server Action. It throws `UnauthorizedError`
   without a session and `ForbiddenError` for a player. It is
   `requireSession` renamed, since every mutation was already the DM's. The
   role it sees is fresh: `auth()` runs the jwt callback
   (`app/lib/auth/sessionCallbacks.ts`), which re-reads the row and ends the
   session of a disabled, deleted or role-less account.
2. **`requireApiDm()`** in every route handler. It returns 401 or 403 (it was
   `requireApiSession`). Read routes open to players one at a time in T7/T8,
   each with its own viewer-aware check.
3. **The proxy**, for every signed-in request under `/dashboard`, re-reads the
   account (`dashboardAccess`):
   - a disabled or deleted account is sent to the login page;
   - a player is **rewritten** to `/[locale]/access-denied`. That page calls
     `forbidden()` (`experimental.authInterrupts`), so the response is
     `app/[locale]/forbidden.tsx`: a 403, a sign-out button, and no page data.
     The address bar keeps the URL that was asked for, and a client
     navigation gets the same page's RSC payload.
   - A Server Action's POST goes through to its action, which guards itself,
     because signing out is one.
4. **`requireDmPage()`** in the dashboard layout, as the second layer. If the
   proxy's check ever fails open (the database unreachable), the layout still
   renders the 403 page. It is not relied on to keep data out of the body.

The dashboard is DM-only as a whole until T7/T8, which relax (3) and (4) path
by path as each read path gains its filter. That is the ratchet: players get
nothing by default, and each path opens with its test.

## Alternatives considered

### Trust the token's role

This is the cheapest option, with no query per request. But a disabled or
demoted account would keep its powers until the token expired (30 days by
default), which contradicts SPEC-022 §5. The fresh read is one primary-key
lookup, on a self-hosted app with a handful of users.

### A database session strategy

Auth.js can store sessions in a table and look them up on every request, which
makes revocation exact. It needs the Prisma adapter's four tables and a
migration of every signed-in session. That is more machinery than one indexed
read, which gives the same freshness for role and `active`.

### Check only in the dashboard layout

One line, and it covers every page. It was built first and failed the third
fact above: the 403 carried the page's data.

### A bare 403 from the proxy

This is correct, and simpler than a rewrite. But it leaves a player looking at
an empty error with no way to sign out, since the sidebar is part of the
refused page. The rewrite gives the same status with the page that explains it.

## Consequences

**Positive**

- A disabled, deleted or demoted account loses its powers at its next
  request: every mutation, route and dashboard page checks the row.
- A player's 403 contains no page data, whether they loaded the page or
  navigated to it.
- Every mutation's check is one import. The ~90 call sites changed name, not
  shape.
- `ForbiddenError` is distinct from `UnauthorizedError`, so a test can tell
  "not signed in" apart from "not allowed".

**Negative**

- A dashboard page request costs two primary-key reads of `users`: one in the
  proxy and one in the layout's `auth()`. `requireDmPage` is wrapped in
  React's `cache()`, so a layout and a page share the second.
- When the database is unreachable, the jwt callback keeps the token as it was
  and the proxy uses the token's role, rather than signing everyone out. For
  that window a disabled account keeps its old role, but no page can load its
  data and no mutation can write without the same database.

**Neutral / follow-up work**

- T7/T8 add `getViewer()` and relax the proxy and the layout for the read paths
  they filter. _T7 (2026-10-01):_ the proxy lets a player through to
  `PLAYER_PAGES` (`app/lib/auth/playerPages.ts`) and to the overview, which
  sends them on to their campaign's map. The dashboard layout now takes any
  active account (`getViewer()`), so guard (4) moved into the layouts of the
  sections that stay the DM's: `admin/`, `campaign/`, `treasures/` and
  `world/`, plus the account page itself. The catalogues T8 has not opened
  yet are refused by the proxy alone in between. Each opened path gets a test that a player sees only what their
  campaign has been shown. A page that stays the DM's (R15) keeps the proxy's
  refusal, since its data renders in parallel with anything the page itself
  would check late.
- `ARCHITECTURE.md` §5 records the rule: a new read path is DM-only until it
  takes the viewer.

## Revisit when

- The app is exposed beyond its own users (SPEC-012): exact revocation may
  then be worth a database session strategy.
- A third role appears. `requireDm` is a yes/no check, and a hierarchy of
  roles would need a different shape.
