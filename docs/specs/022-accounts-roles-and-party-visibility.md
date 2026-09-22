# SPEC-022: Accounts, roles, and party visibility

- **Status:** Draft — needs the DM's agreement
- **Date:** 2026-09-22
- **Phase:** 5
- **Related:** [ADR-0008](../adr/0008-map-image-storage.md) (its access check is "authenticated", which this spec redefines) · [SPEC-012](./012-publishing-and-internet-exposure.md) (exposure; this spec is its prerequisite) · [SPEC-011](./011-cross-entity-search.md) (a read path that must learn to filter) · TD-01 (`requireSession`, the guard this spec extends) · ROADMAP, _Asked for on 2026-08-18, in one batch_

---

## 1. Problem

There is exactly one kind of account. Anyone who can log in can edit everything:
the world tree, every domain's records, the maps, the factions. There is no way
to give a player an account, and no way to show a player part of the setting
without showing them all of it — including the fields written for the DM's eyes
(`secrets`, `motivations`). So the DM's material is either private or fully
shared, and the app is used by one person because it cannot safely be used by
more.

Four smaller consequences of the same gap: a new DM cannot sign up (accounts are
created by hand in the database), a logged-in DM has no page on which to change
their own name or password, a forgotten password has no recovery path at all,
and ADR-0008's map-image route equates "authenticated" with "the DM", which stops
being true the moment a second kind of account exists.

## 2. Goal

The app knows who is asking: a DM edits the setting, a player sees the parts of
it the DM has marked as visible to the party, and every read and write path
enforces that distinction on the server.

## 3. Non-goals

- **Per-player visibility.** A record is visible to the party or it is not.
  Showing an NPC to one adventurer and not another is a different feature and a
  much larger one.
- **A player-facing editor.** Players read. Nothing in this spec lets a player
  create or change a record.
- **Character sheets.** A party account identifies a person, not a character.
  Characters belong to SPEC-018's game layer.
- **Organisations, invitations, multi-tenancy.** One DM, one party, one
  self-hosted instance — `CLAUDE.md`'s "public multi-tenant hosting" exclusion
  still holds.
- **Deciding the mail transport.** See §5's open decision on password reset: if
  emailing a link is wanted, choosing the transport is an ADR of its own and
  most of that item's cost.
- **Field-level visibility.** A record is secret or public as a whole. Hiding
  `secrets` while showing the rest of an NPC is explicitly not this spec —
  §5 covers it instead by never sending DM-only fields to a player.

## 4. User stories

- As a DM, I want only my own account to reach the edit pages, so that an
  account I hand to a player cannot change my world.
- As a DM, I want to create an account for each adventurer, so that the party
  can read the setting without sharing my login.
- As a DM, I want to mark a place, NPC, deity, magic item or faction as visible
  to the party, so that I can reveal the world as the campaign uncovers it.
- As a DM, I want to manage my own account — name, password — from inside the
  app, so that the database is not the only way to change it.
- As a player, I want to see only what the DM has revealed, so that I do not
  learn something my character has not.

## 5. Behaviour

**Roles.** Every account carries one role: `dm` or `player`. The existing
account becomes a `dm` in the migration. Authorisation is a server concern:
`requireSession` grows a role-aware sibling (working name `requireDm`), and every
mutation and every write route handler calls it. Hiding a button is presentation,
never the check — `CLAUDE.md`'s non-negotiable rule 1 applies unchanged.

**What a player sees.** The read pages the app already has, filtered: only
records flagged visible to the party, and without the DM-only fields. Edit
pages, the admin lists and `/dashboard/admin/**` are not rendered and, more
importantly, refuse the request.

**Marking a record visible.** A toggle on the admin list row of each of the five
domains that have one (places, NPCs, deities, magic items, factions), defaulting
to secret. Toggling is a mutation like any other: authenticated, DM-only,
validated.

**The map is not read-only for players.** The DM was explicit on 2026-08-18: the
temporary scratch markers (TD-86) are for players too. Whatever shape the role
check takes has to leave room for an action that is neither a read nor an edit of
the setting.

**Main flow — the order that works**

1. **Roles.** `role` on the account, `requireDm`, every mutation behind it, the
   admin surfaces refusing a player. No visible change for the DM.
2. **Account self-management** — a DM changes their own name and password.
3. **Self-service DM sign-up** from the logged-out screen, inactive until the
   existing DM activates it by hand.
4. **Password reset** — see the open decision below.
5. **Party accounts** — the DM creates, renames, disables and deletes player
   accounts.
6. **Visibility** — the flag, the toggle, and every read path honouring it.

Steps 2–4 are independent of each other. Step 5 precedes step 6 because "visible
to the party" means nothing until a party exists.

**The inventory that step 6 actually is.** A flag is one column and one toggle;
honouring it is every read path in the app. This spec is not agreed until that
list is written out and turned into acceptance criteria, one line per path: each
domain's public list and card, each admin list, the map's markers (places,
areas, landmarks, attached entities), cross-entity search, the dashboard counts,
the geography explorer, and the authenticated image routes. The metadata layer is
string-keyed, so a read path that forgets to filter keeps working and leaks
quietly — the TD-19 failure mode `CLAUDE.md` records.

**Edge cases**

| Situation                                                 | Expected behaviour                                                                                                                                |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| A player requests an admin URL directly                   | 403 from the server. Not a redirect to a prettier page that also renders the data.                                                                |
| A player opens a link to a secret record                  | 404, not 403 — the existence of the record is itself information.                                                                                 |
| A place is visible but its parent is not                  | Open decision: either visibility is inherited down the tree, or a visible child of a secret parent is shown without its ancestry. The DM decides. |
| An NPC is visible but the place it lives at is not        | The NPC is shown; its location reads as unknown rather than naming a secret place.                                                                |
| The last DM account is deleted or demoted                 | Refused. There is always at least one DM.                                                                                                         |
| A player's session is open when their account is disabled | The next request fails the check. No background invalidation is built.                                                                            |
| Map images and record images                              | The routes check the viewer, not merely a session (ADR-0008's check is widened here, and ADR-0017's with it).                                     |

**The open decision on password reset.** There is no mail transport in this repo
— no `nodemailer`, no service, nothing in `package.json` — and the deployment
story is `docker-compose`. A reset link by email means choosing and configuring
one, which is an ADR and most of that item's cost. Since the DM already activates
sign-ups by hand, **the question for the DM is whether a hand-performed reset is
enough for now.** If it is, item 4 collapses into item 2 and this spec carries no
mail dependency at all.

## 6. Data model changes

```prisma
// proposed — names are indicative, the column names follow the table's convention
model user {
  // ...existing fields
  role     UserRole @default(player)
  active   Boolean  @default(true)
}

enum UserRole {
  dm
  player
}

// on zone, poi, npc, deities, magicitems, faction:
  visibleToParty Boolean @default(false)
```

- **Backfill needed?** Yes, and it is the whole risk: the existing account must
  become `dm` in the same migration that adds the column, or the DM locks
  themselves out of their own app. Every existing record defaults to secret,
  which is the safe direction — nothing becomes visible by accident.
- **Reversible?** Dropping the columns restores today's behaviour exactly.
  Nothing else in the schema depends on them.

## 7. Metadata changes

`visibleToParty` is a field like any other and declares its `PageMeta` in each
domain's meta file — `fieldType`, `controlType`, `validator`, `getDatum` — so
the admin list column and its toggle come from the layer rather than from a
hand-written cell. Whether the filter itself belongs in the metadata layer (a
`visibleToParty` clause added by `getQuery`) or in the data functions is an
implementation-plan decision; the acceptance criteria below are written against
behaviour either way. `role` is not a metadata field: no page lists users yet,
and step 5 decides what that page looks like.

## 8. Acceptance criteria

- [ ] An account has a role; the pre-existing account is a `dm` after migrating.
- [ ] Every mutation and every write route handler refuses a `player` with 403.
- [ ] A player reaching an admin page gets 403 from the server, with no data in
      the response body.
- [ ] A player's read pages show only records flagged visible to the party.
- [ ] A secret record reached by direct link returns 404 for a player.
- [ ] DM-only fields (`secrets`, `motivations`, and the equivalents named in the
      §5 inventory) never appear in a response sent to a player.
- [ ] Every read path in the §5 inventory has its own test asserting a player
      sees only what is visible.
- [ ] The DM can create, rename, disable and delete a party account.
- [ ] The last remaining DM cannot be deleted or demoted.
- [ ] Map-image and record-image routes check the viewer's role, not just a session.
- [ ] Temporary scratch markers still work for a player.
- [ ] Every new mutation rejects an unauthenticated request.
- [ ] Every new mutation rejects invalid input with field-level errors.
- [ ] Coverage has not dropped.

## 9. Implementation plan

_Fill in after the sections above are agreed._

**Open questions for the DM**

- Password reset by email, or by hand like activation already is?
- Does visibility inherit down the world tree, or is each record independent?
- Is one party enough, or do several groups play in this world?

## 10. Task breakdown

_Fill in after §9. The six steps in §5 are the natural slice boundaries; step 6
is large enough that it may become its own spec once the read-path inventory is
written._

## 11. Outcome

_Fill in at close._
