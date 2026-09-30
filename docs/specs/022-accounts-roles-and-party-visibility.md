# SPEC-022: Accounts, roles, and campaign visibility

- **Status:** Agreed 2026-09-30. Rewritten that day around the DM's answers, then approved with the last two questions answered (§9).
- **Date:** 2026-09-22 (rewritten 2026-09-30)
- **Phase:** 5
- **Related:** [ADR-0008](../adr/0008-map-image-storage.md) and [ADR-0017](../adr/0017-record-images.md) (their access check is "authenticated", which this spec redefines) · [SPEC-012](./012-publishing-and-internet-exposure.md) (exposure; deferred, and this spec is its prerequisite) · [SPEC-013](./013-campaign-management.md) (the campaign a group belongs to) · [SPEC-004](./004-world-model.md) (the tree visibility inherits down) · [SPEC-011](./011-cross-entity-search.md) (a read path that must learn to filter) · [SPEC-018](./018-game-systems.md) (a campaign has one system) · TD-01 (`requireSession`, the guard this spec extends) · ROADMAP, _Asked for on 2026-08-18, in one batch_

---

## 1. Problem

There is exactly one kind of account. Anyone who can log in can edit everything:
the world tree, every domain's records, the maps, the factions. There is no way
to give a player an account, and no way to show a player part of the setting
without showing them all of it, including the fields written for the DM's eyes
(`secrets`, `motivations`). So the DM's material is either private or fully
shared, and the app is used by one person because it cannot safely be used by
more.

The world is played by more than one group. Each group is a campaign's players
(SPEC-013), and what one group has uncovered is not what another has. A
single "visible to the party" flag cannot say that.

The same gap has four smaller consequences:

- a new DM cannot sign up (accounts are created by hand in the database);
- a logged-in DM has no page on which to change their own name or password;
- a forgotten password has no recovery path at all;
- ADR-0008's map-image route equates "authenticated" with "the DM", which
  stops being true the moment a second kind of account exists.

## 2. Goal

The app knows who is asking. A DM edits the setting. A player sees the parts of
it the DM has revealed to the campaign they play in. Every read and write path
enforces that distinction on the server.

## 3. Non-goals

- **Per-player visibility.** A record is revealed to a campaign, and so to
  everyone playing in it. Showing an NPC to one adventurer and not to the rest of
  their table is a different and much larger feature.
- **A player-facing editor.** Players read. Nothing in this spec lets a player
  create or change a record. The temporary map marker (TD-86) stays usable by a
  player because it is client-only and never reaches the server.
- **Character sheets.** An account identifies a person, not a character.
  Characters belong to SPEC-018's game layer.
- **Organisations, invitations, multi-tenancy.** One world, one self-hosted
  instance. Several DMs may share it, and all of them edit the same world.
  `CLAUDE.md`'s "public multi-tenant hosting" exclusion still holds.
- **Mail.** Password reset is performed by hand by a DM (§9), so this spec adds
  no mail transport.
- **Field-level visibility.** A record is revealed or not as a whole. Hiding
  `secrets` while showing the rest of an NPC is not configurable. §5 covers it
  instead by never sending DM-only fields to a player.
- **Revealing prep material.** Campaigns, adventures, scenes, loot, the treasure
  catalogue, and the world calendar and history stay the DM's alone.
  Calendar events link places, NPCs, deities and factions, so revealing one
  raises the same leak questions as §5's inventory a second time. If the DM
  wants that later, it is a follow-up spec.
- **A DM "view as campaign" preview.** The player filter takes a campaign, so
  this is cheap to add later. It is recorded in the roadmap, not built here.

## 4. User stories

- As a DM, I want only DM accounts to reach the edit pages, so that an account
  I hand to a player cannot change my world.
- As a DM, I want to create an account for each player and add it to the
  campaigns they play in, so that each table can read the setting without
  sharing my login.
- As a DM, I want to reveal a place, NPC, deity, magic item or faction to a
  campaign, so that each group uncovers the world at its own pace.
- As a DM, I want to manage my own account (name, password) from inside the
  app, and reset a player's password when they forget it, so that the database
  is not the only way to do either.
- As a player, I want to see only what the DM has revealed to my campaign, so
  that I do not learn something my character has not.

## 5. Behaviour

**Roles.** Every account carries one role: `dm` or `player`. The existing
account becomes a `dm` in the migration. Authorisation is a server concern:
`requireSession` grows a role-aware sibling (working name `requireDm`), and every
mutation and every write route handler calls it. Hiding a button is presentation,
never the check. `CLAUDE.md`'s non-negotiable rule 1 applies unchanged.

**Groups are campaigns.** A player account is a member of zero or more
campaigns. The DM adds and removes members from the campaign's page.

- A player sees nothing of the setting until they are in at least one campaign.
- A campaign has one game system (SPEC-018), so a player reaches only the
  systems of their campaigns. Any other `[system]` segment returns 404 for them.

**Revealing.** A record is revealed to a set of campaigns, empty by default.
Five domains carry it: places (zones and landmarks), NPCs, deities, magic items
and factions. The reveal is edited in two places:

- the record's form, as a campaign multi-select;
- for places, the map's edit panels, since places have no admin list.

The admin list of each domain shows the campaigns a record is revealed to.
Revealing is a mutation like any other: authenticated, DM-only, validated.
The picker offers only campaigns of a system the domain belongs to, so a
magic item (5e) cannot be revealed to a Daggerheart campaign.

**Inheritance down the tree** (the DM's answer, §9). A place is visible to a
campaign only if it **and every ancestor** is revealed to that campaign.
Inheritance only hides: revealing a region reveals nothing inside it, and each
child still needs its own reveal. The rule covers zones and landmarks alike.
When a place is revealed but an ancestor is not, the reveal control says which
ancestor hides it.

**What a player sees.** The dashboard's read pages, filtered:

- only the records visible to the campaign they are viewing. A player in several campaigns views one at a time, chosen from a selector in the side navigation (§9); with one campaign there is no selector;
- without DM-only fields: `npc.motivations` and `npc.secrets` are the only such
  columns today, and any column added later declares whether it is one.

Rules catalogues are the rules the table plays by, so every player sees them in
full, unfiltered: spells, classes, subclasses, Daggerheart domains and domain
cards.

Admin pages, campaign pages, the treasure catalogue, the world calendar and
history, and the unpositioned-places pool are not rendered for a player. More
importantly, the server refuses the request.

**The read-path inventory.** A flag is one column; honouring it is every read
path in the app. The metadata layer is string-keyed, so a read path that forgets
to filter keeps working and leaks quietly: this is the TD-19 failure mode
`CLAUDE.md` records. Each line below is one acceptance criterion in §8:

| #   | Read path                                                                                                   | Player gets                                                                                  |
| --- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| R1  | Overview counts (`getItemsCount`)                                                                           | Counts of visible records only; prep domains absent                                          |
| R2  | NPC list, card, filters                                                                                     | Visible NPCs; no `motivations`/`secrets`                                                     |
| R3  | Deity list, card, filters                                                                                   | Visible deities                                                                              |
| R4  | Magic item list, card, filters (5e)                                                                         | Visible items                                                                                |
| R5  | Faction list, card, members                                                                                 | Visible factions; member lists name visible NPCs only                                        |
| R6  | Relation labels on any card (an NPC's location or faction, a deity's places, a faction's seat)              | A hidden target reads as unknown, never by name                                              |
| R7  | Filter and picker option lists (`app/lib/data/options`)                                                     | Options for visible records only: a secret place's name must not appear in a location filter |
| R8  | Geography explorer: the tree, breadcrumb and ancestry chain, child markers and areas, landmarks, deep links | Visible places only; a deep link to a hidden place is 404                                    |
| R9  | Entities attached on the map (NPCs and deities on a place or landmark)                                      | Visible entities only                                                                        |
| R10 | Cross-entity search (`searchAllDomains`, SPEC-011)                                                          | Hits and per-domain counts for visible records only                                          |
| R11 | Map-image route (`/api/maps/[id]/image`)                                                                    | 404 unless the place is visible                                                              |
| R12 | Record-image routes (`/api/record-images/[key]`, `/by-id/[id]`)                                             | 404 unless the image's record is visible                                                     |
| R13 | Record links inside formatted text (SPEC-019 T5)                                                            | A link to a hidden record renders as its text, without the link                              |
| R14 | Rules catalogues (spells, classes, subclasses, domains, domain cards)                                       | Everything: no filter, by design                                                             |
| R15 | Admin, campaign, treasure, calendar and history pages; the unpositioned pool; every write route and uploads | 403 from the server, with no data in the body                                                |

**Edge cases**

| Situation                                                       | Expected behaviour                                                                     |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| A player requests an admin URL directly                         | 403 from the server, not a redirect to a prettier page that also renders the data.     |
| A player opens a link to a hidden record                        | 404, not 403: the record's existence is itself information.                            |
| A place is revealed but its parent is not                       | Hidden: inheritance (above). The DM's reveal control names the ancestor that hides it. |
| An NPC or deity is revealed but the place it lives at is hidden | The NPC is shown and its location reads as unknown (§9).                               |
| A player is removed from a campaign                             | Their next request sees nothing of it. No background session invalidation is built.    |
| A campaign is deleted                                           | Its memberships and reveals go with it. The records themselves are untouched.          |
| A record is deleted                                             | Its reveals go with it.                                                                |
| The last DM account is deleted, disabled or demoted             | Refused. There is always at least one active DM.                                       |
| A player's session is open when their account is disabled       | The next request fails the check. No background invalidation is built.                 |
| A player plays in no campaign                                   | They can log in and see the rules catalogues only.                                     |

**Main flow — the order that works**

1. **Roles.** `role` and `active` on the account, `requireDm`, every mutation
   and write route behind it, and R15. No visible change for the DM.
2. **Account self-management.** A DM changes their own name and password, and
   sets a new password on any other account. This is the hand-performed reset
   the DM chose, which absorbs the draft's separate reset step.
3. **Accounts page.** The DM creates, renames, disables and deletes accounts,
   and activates pending DM sign-ups.
4. **Self-service DM sign-up** from the logged-out screen, inactive until a DM
   activates it on the page from step 3.
5. **Campaign membership.** The players section on a campaign's page.
6. **Reveals.** The relations, the controls, and the inheritance helper. This
   step is DM-only: no player read changes yet.
7. **Player reads.** R1–R14, the campaign selector, and a
   test per path.

Steps 2 and 3 are independent of each other. Step 5 precedes step 6 because
"revealed to a campaign" means nothing until a campaign has players to show.

## 6. Data model changes

```prisma
// proposed — names follow the new-table convention (English, no @map)
model users {
  // ...existing fields
  role        String   @default("player") // dm | player — closed vocabulary in code, like campaign.system
  active      Boolean  @default(true)     // false = disabled, or a DM sign-up awaiting activation
  campaigns   campaign[] @relation("campaignMembers")
}

model campaign {
  // ...existing fields
  members         users[]      @relation("campaignMembers")
  revealedZones   zone[]       @relation("zoneReveals")
  revealedPois    poi[]        @relation("poiReveals")
  revealedNpcs    npc[]        @relation("npcReveals")
  revealedDeities deities[]    @relation("deityReveals")
  revealedItems   magicitems[] @relation("magicItemReveals")
  revealedFactions faction[]   @relation("factionReveals")
}

// on zone, poi, npc, deities, magicitems, faction:
  revealedTo campaign[] @relation("<domain>Reveals")
```

- **Why implicit many-to-many relations.** `calendarEvent`'s links to places,
  NPCs, deities and factions are already implicit relations, so this adds no new
  pattern. Prisma's `some`/`none` filters express "revealed to campaign C"
  directly. Deleting either end deletes the link row, which gives the two
  deletion edge cases in §5 for free.
- **Backfill needed?** Yes, and it is the whole risk. The existing account must
  become `dm` in the same migration that adds the column, or the DM locks
  themselves out of their own app. No record starts revealed, which is the safe
  direction: nothing becomes visible by accident.
- **Reversible?** Dropping the columns and link tables restores today's
  behaviour exactly. Nothing else in the schema depends on them.

## 7. Metadata changes

`revealedTo` is a field like any other on the five domains. It declares its
`PageMeta`, a `Multiselect` over campaigns as `worldHistoryLinkMeta` does for
its links, so that the form control and the admin list column come from the
layer rather than a hand-written cell. Places have no admin list; their map
panels consume the same `PageMeta` (validator and label key), as ADR-0011's
inline editors do.

Where the player filter itself lives is an implementation-plan decision (§9):
either a clause `getQuery` adds, or the data functions. The acceptance criteria
are written against behaviour either way.

`role` is not a metadata field. The accounts page (step 3) is the one place that
lists users, and it does not need the layer.

## 8. Acceptance criteria

- [ ] An account has a role; the pre-existing account is a `dm` after migrating.
- [ ] Every mutation and every write route handler refuses a `player` with 403.
- [ ] Every path in R15 refuses a player with 403, with no data in the
      response body.
- [ ] Each of R1–R13 has its own test asserting that a player sees only what is
      visible to their campaign, per the "Player gets" column.
- [ ] R14's catalogues render in full for a player.
- [ ] A place whose ancestor is hidden stays hidden, even when it is revealed itself.
- [ ] A hidden record reached by direct link returns 404 for a player.
- [ ] `npc.motivations` and `npc.secrets` never appear in a response sent to a player.
- [ ] A player reaches only the systems of their campaigns; any other system is 404.
- [ ] A magic item cannot be revealed to a campaign of another system.
- [ ] The DM can create, rename, disable and delete an account, and set its password.
- [ ] A DM changes their own name and password from inside the app.
- [ ] A self-service sign-up is inactive until a DM activates it.
- [ ] The DM adds and removes a campaign's players.
- [ ] The last active DM cannot be deleted, disabled or demoted.
- [ ] Deleting a campaign removes its memberships and reveals, and nothing else.
- [ ] Every new mutation rejects an unauthenticated request.
- [ ] Every new mutation rejects invalid input with field-level errors.
- [ ] Coverage has not dropped.

## 9. Implementation plan

**Decisions the plan rests on**

- **The session carries the account's id and role, but the guards do not trust
  it.** The JWT callback in `auth.config.ts` adds `id` and `role`, so that pages
  can decide what to render without a query. Each guard still re-reads the row
  (`role`, `active`). Otherwise a disabled or demoted account would keep its
  powers until the token expired, and §5's edge case says the next request
  fails. The page guard reads the row once per request through React's
  `cache()`.
- **Four guards in `app/lib/auth/`**, recorded in an ADR in T1:
  - `requireDm()` for Server Actions. Throws `UnauthorizedError` without an
    active session and `ForbiddenError` for a player.
  - `requireApiDm()` for write route handlers. Returns 401 or 403.
  - `requireDmPage()` for the layouts of R15's pages. Calls Next's
    `forbidden()` (the `authInterrupts` flag), which renders a `forbidden.tsx`
    with no data.
  - `getViewer()` for read paths. Returns `{ kind: "dm" }` or
    `{ kind: "player", campaignId, system }`.
- **`requireSession` becomes `requireDm`.** Every one of today's mutations is
  the DM's, so the ~90 call sites change name, not meaning. The rename lands
  as its own commit (`CLAUDE.md`: a pure rename is never mixed into a
  behaviour change), then the role check lands in the renamed function.
- **The player filter lives in `app/lib/data/visibility/`.** Two helpers:
  - `visiblePlaceIds(campaignId)` walks the tree once from the roots, keeping a
    place only if it and every ancestor are revealed. The world tree is small
    (hundreds of rows), so this is cheaper and far easier to test than a
    recursive CTE per query.
  - `revealedWhere(domain, campaignId)` returns the Prisma `where` fragment for
    the four flat domains.

  Each data function takes the viewer and applies the fragment once. Whether
  `getQuery` applies it for the list pages is decided in T8 against the first
  list; the criterion is one place per domain, never one per call site.

- **The campaign a player is viewing is a cookie.** It is validated against
  the player's memberships on every read, defaults to their first campaign,
  and decides their `[system]`. A campaign the player is no longer in falls
  back to the default, never to "everything".

**Risks**

- **The rename touches almost every mutation.** It is mechanical, and its
  commit contains nothing else. The suites that mock `requireSession` change
  with it.
- **A read path that forgets the viewer leaks quietly.** R1–R14 each get a test
  written against a fixture with one revealed and one hidden record per domain.
  A new read path added after this spec has no such test until someone writes
  one. The ADR says so, and `ARCHITECTURE.md` gains the rule.
- **Existing E2E runs as the DM.** The E2E account becomes a `dm` through the
  same backfill. The player journeys need a second account, created by a setup
  step, never seeded into `.env`.

**Answered by the DM on 2026-09-30**

- Password reset by email, or by hand like activation already is? **By hand**,
  by a DM. The reset step is folded into step 2, and this spec carries no mail
  dependency.
- Does visibility inherit down the world tree, or is each record independent?
  **Inherited.** A hidden place hides every place inside it, whatever the
  children's own reveals say.
- Is one party enough, or do several groups play in this world? **Several
  groups, and a group is a campaign's players** (SPEC-013). What a record
  reveals is per campaign, and a player may play in more than one. The draft's
  "one DM, one party" non-goal and its `visibleToParty` boolean were replaced by
  this rewrite.
- A player in two campaigns of the same system: what do they see? **One
  campaign at a time**, chosen from a selector. No knowledge crosses between
  tables, and the filter stays one campaign.
- An NPC or deity revealed, living in a hidden place: shown or hidden?
  **Shown, with its location unknown.** The party meets people away from home.

## 10. Task breakdown

- [ ] **T1** — Roles. Write the ADR (roles in the session, the four guards,
      `forbidden()`). Add a migration for `role` and `active` that backfills every
      existing account to `dm`. Rename `requireSession` to `requireDm` (pure
      rename), then give it the role and `active` checks, and add `requireApiDm`.
      `requireDmPage` guards every R15 layout. Sign-in refuses an inactive account.
      _(test: the guards; each R15 layout; a player refused by a mutation; the
      backfill)_
- [ ] **T2** — Account self-management: a DM's own name and password (the
      current password required), on an account page.
      _(test: the actions; a wrong current password)_
- [ ] **T3** — Accounts page: create (name, email, first password, role),
      rename, disable, delete, set a password, and activate. The last active DM
      cannot be disabled, deleted or demoted.
      _(test: every action; the last-DM refusals)_
- [ ] **T4** — DM sign-up from the logged-out screen, created inactive.
      _(test: sign-up; sign-in refused until activated)_
- [ ] **T5** — Campaign membership: the players of a campaign, added and
      removed by the DM. _(test: the actions; a campaign's deletion takes its
      memberships)_
- [ ] **T6** — Reveals:
  - the implicit relations' migration;
  - the `revealedTo` field on the four domains' forms and admin lists;
  - the control in the map's place panels;
  - `visiblePlaceIds` and the "hidden by <ancestor>" hint.

  _(test: inheritance; the system restriction on the picker)_

- [ ] **T7** — Player reads, map: `getViewer`, the campaign cookie and
      selector, and R8, R9, R11. _(test: one per path)_
- [ ] **T8** — Player reads, everything else: R1–R7, R10, R12–R14, and the
      DM-only fields stripped. _(test: one per path)_
- [ ] **T9** — i18n, a11y and an e2e journey. The DM reveals a place and an
      NPC to one of two campaigns, and a player in both switches between them and
      sees each campaign's share. _(test: e2e)_

## 11. Outcome

_Fill in at close._
