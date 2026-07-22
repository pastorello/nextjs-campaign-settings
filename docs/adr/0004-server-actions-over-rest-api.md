# ADR-0004: Server Actions over a REST API layer

- **Status:** Accepted
- **Date:** 2026-07-22
- **Deciders:** Turu
- **Related:** [TD-01](../TECH_DEBT.md), [TD-02](../TECH_DEBT.md), [ARCHITECTURE.md §1](../ARCHITECTURE.md)

_Retroactive: documents a decision already embodied in the code, including the inconsistency it currently has._

## Context

The app needs to read and write five domain entities. Next.js App Router offers two options: Server Components reading directly from the database with Server Actions writing to it, or a conventional REST layer under `app/api/` with client-side fetching.

The current implementation is inconsistent, and that inconsistency is itself a finding. Reads go through Server Components calling the data layer directly. Creates and updates go through Server Actions (`"use server"` in `app/lib/data/*/create*.ts`). But **deletes go through REST route handlers** at `app/api/<domain>/[id]/route.ts`, called with `fetch` from the client.

That split is not a design; it is an accident. And it has produced a security hole: `proxy.ts`'s matcher explicitly excludes `/api`, and the route handlers perform no auth check of their own, so the DELETE endpoints are reachable unauthenticated (TD-01). The one operation that left the Server Action path is the one that lost its protection.

There is no external consumer of this app. It is a single-user, self-hosted tool with no mobile client and no third-party integration, current or planned.

## Decision

**Server Actions are the default for all mutations.** Route handlers exist only where an HTTP endpoint is genuinely required.

Concretely:

- Reads: Server Components call `app/lib/data/**` directly.
- Creates, updates, **and deletes**: Server Actions.
- Route handlers retained only for `app/api/countries/**`, which serve GeoJSON to Leaflet — a genuine client-side `fetch` consumer that cannot use a Server Action.
- The four `app/api/<domain>/[id]/route.ts` DELETE handlers are migrated to Server Actions and removed.

Every mutation, regardless of path, must call `auth()` and validate its input with the field's declared Zod schema.

## Alternatives considered

### A full REST API layer under `app/api/`

Every domain gets `GET /api/spells`, `POST /api/spells`, `PATCH /api/spells/[id]`, `DELETE /api/spells/[id]`, with the UI as a pure client.

Rejected. It is roughly four times the code for the same behaviour, gives up RSC's ability to query the database without a network round-trip, requires hand-rolling client-side data fetching and cache invalidation (which `revalidatePath` provides for free), and serves an audience that does not exist — there is no second consumer. It would look more conventional to a reviewer, but "conventional" is not the same as "justified", and being able to explain _why_ the conventional layer was omitted is the stronger signal.

### Keep the current hybrid

Do nothing; leave deletes on REST and writes on Server Actions.

Rejected. It is the worst of both: two mutation paths with different auth stories, different error handling, and different testing requirements, for no gain. The security hole in TD-01 is a direct consequence.

### Move everything to route handlers so `proxy.ts` can protect it uniformly

Superficially appealing — one middleware, one guard, done.

Rejected on a false premise. The `proxy.ts` matcher currently _excludes_ `/api`; the uniformity would have to be built, not inherited. More fundamentally, relying on middleware alone for authorisation is fragile: a matcher regex is easy to get subtly wrong (as it already is here), and a route added later silently inherits whatever the pattern happens to do. Explicit `auth()` calls inside each mutation are verifiable per call site and testable in isolation. Middleware becomes defence in depth rather than the only defence.

## Consequences

**Positive**

- One mutation path, one place to enforce auth and validation.
- Progressive enhancement: forms work without client JavaScript.
- No client-side fetching, caching or invalidation code; `revalidatePath` handles it.
- Type safety across the boundary — no serialisation contract to keep in sync between a client type and a handler type.
- Deleting the four DELETE route handlers removes four of the nineteen TypeScript errors (they all mistype `params` as non-`Promise`).

**Negative**

- **Server Actions are POST endpoints.** This is the decision's central risk and the one most often misunderstood: a Server Action is publicly reachable via its generated action ID, and being "server code" confers no protection. Every action must independently verify the session. Not optional; enforced as rule 1 in `CLAUDE.md`.
- No API surface if a mobile client or third-party integration is ever wanted. Accepted: adding route handlers later that call the same data layer is a small, additive change.
- Server Actions are harder to exercise with a plain HTTP client (curl, Postman) than REST endpoints. Testing shifts to integration tests calling the functions directly plus Playwright covering the flows — which is where `TESTING.md` puts it anyway.
- Slightly less familiar to reviewers unfamiliar with the App Router. Mitigated by this ADR existing.

**Neutral / follow-up**

- **TD-01**: migrate the four DELETE route handlers to Server Actions; add `auth()` guards to every mutation; add tests asserting 401 without a session. This is the action item this ADR generates.
- `app/api/countries/**` stays as-is and should be documented as a deliberate exception, not an oversight.

## Revisit when

A second consumer appears — a mobile client, a Discord bot, a public read-only API for sharing a campaign setting. At that point add route handlers that delegate to the same `app/lib/data/**` functions; the data layer is already the right seam for this, and no rewrite is implied.
