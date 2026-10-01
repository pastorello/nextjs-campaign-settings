# SPEC-022: Accounts, roles, and campaign visibility

- **Status:** In progress — T1–T5 shipped 2026-09-30, T6, T7 and T8a 2026-10-01. Agreed the same day: rewritten around the DM's answers, then approved with the last two questions answered (§9).
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

- **The app shows one campaign per system** (found 2026-09-30, while building
  T2/T3). `fetchCampaign` reads the first campaign of the URL's system, and
  SPEC-013 left a second one to "multi-campaign support". So "a player in two
  campaigns of the same system" cannot arise until the campaign page can hold
  several. This spec does not depend on it: membership and reveals are per
  campaign, and the selector lists whatever campaigns a player is in. But
  several groups in one system needs that change first. It is recorded in
  `ROADMAP.md` as a question for the DM.
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

- [x] **T1** — Roles. Write the ADR (roles in the session, the four guards,
      `forbidden()`). Add a migration for `role` and `active` that backfills every
      existing account to `dm`. Rename `requireSession` to `requireDm` (pure
      rename), then give it the role and `active` checks, and add `requireApiDm`.
      `requireDmPage` guards every R15 layout. Sign-in refuses an inactive account.
      _(test: the guards; each R15 layout; a player refused by a mutation; the
      backfill)_
  - _Done 2026-09-30._ [ADR-0020](../adr/0020-roles-in-the-session-and-four-guards.md).
    - Migration `*_spec022_user_roles` adds `role` (CHECK `dm`/`player`,
      default `player`) and `active`, and backfills every account to `dm`.
      The seed's account is a `dm`.
    - `requireSession` → `requireDm` and `requireApiSession` → `requireApiDm`
      are a pure rename commit. The role check (`ForbiddenError`, 403) lands in
      the next commit.
    - The jwt callback (`app/lib/auth/sessionCallbacks.ts`) re-reads `role`
      and `active` on every `auth()` call. `authorizeCredentials` refuses an
      inactive account.
    - **The whole dashboard is DM-only for now**, not just R15. The proxy
      re-reads the account for every signed-in dashboard request and rewrites
      a player to `/[locale]/access-denied`, whose `forbidden()` renders
      `app/[locale]/forbidden.tsx`: a 403 with a sign-out button. The
      layout's `requireDmPage` is a second layer only. Checked in the running
      app: the layout's `forbidden()` alone still sent the page's data, since
      a page renders in parallel with its layout (ADR-0020). A player's
      document load and client navigation both got the 403 page with no
      record in it, a player's DELETE got 403, and sign-out worked. T7/T8
      open the read pages one by one, as each learns to filter. This is the
      ratchet `AGENT_WORKFLOW.md` asks for.
    - The sign-out tile is now `SignOutButton`, shared by the sidebar and the
      403 page.
    - There is no committed player e2e yet: no account can be made a player
      until T3's accounts page, whose e2e covers the 403. The check above
      used a throwaway spec and a hand-inserted row, both removed.

- [x] **T2** — Account self-management: a DM's own name and password (the
      current password required), on an account page.
      _(test: the actions; a wrong current password)_
  - _Done 2026-09-30._ `/dashboard/[system]/account`
    (`OwnAccountForms`, `updateOwnName`, `changeOwnPassword`).
    - The account is always the session's, never an id the client sends.
    - The email is shown but not editable there: it is the sign-in name,
      so changing it is another DM's call from T3's page. (The accounts page
      does not edit emails yet either; see T3.)
- [x] **T3** — Accounts page: create (name, email, first password, role),
      rename, disable, delete, set a password, and activate. The last active DM
      cannot be disabled, deleted or demoted.
      _(test: every action; the last-DM refusals)_
  - _Done 2026-09-30._ `/dashboard/[system]/admin/accounts`
    (`NewAccountForm`, `AccountsTable`, `AccountRowActions`), with actions
    in `app/lib/data/accounts/`.
    - The sidebar's new "Account" tile opens the DM's own page, and its
      pencil opens this one.
    - Rules on the data:
      - Passwords set through the app are 8–72 characters; bcrypt reads 72
        bytes at most. Sign-in still accepts the seed's six.
      - Emails are stored lower-cased and matched lower-cased at sign-in.
      - A taken email is a field error (`emailTaken`).
    - **The last-DM rule** is `leavesNoActiveDm`, read and written inside one
      serializable transaction, so two DMs demoting each other at once cannot
      both succeed.
    - "Activate" re-enables a disabled account and will activate T4's
      sign-ups: they are the same write.
    - Generic machinery changed:
      - `TextInput` takes `inputType` (`password`, `email`). It is not
        `type`, which the control registry already passes as the
        `ControlType`.
      - `FormErrorSummary` takes `labels` for fields outside the metadata
        layer.
    - **Not built: editing another account's email.** The task did not list
      it. An account whose email is wrong is deleted and created again.
    - E2E: `e2e/accounts.spec.ts`.
      - The DM creates a player. The player signs in and gets only the 403
        page: no records in the body, 403 on the API.
      - The DM resets the player's password, and the player signs in with
        the new one.
      - The DM disables the account: its open session ends, and sign-in
        fails.
      - Deleting the only active DM is refused.
      - The DM renames their own account.

      `a11y.spec.ts` scans both pages.
- [x] **T4** — DM sign-up from the logged-out screen, created inactive.
      _(test: sign-up; sign-in refused until activated)_
  - _Done 2026-09-30._ `/signup`, linked from the login form
    (`SignUpForm`, `requestDmAccount`). It is the proxy's second public
    page.
    - **The only mutation without a session**, recorded as the one exception
      to `CLAUDE.md` rule 1. It creates an _inactive_ `dm`, never takes role
      or `active` from the client, and answers a taken email exactly like a
      free one. The form therefore cannot tell anyone which addresses have
      accounts.
    - Signing in before activation reads as invalid credentials, like any
      inactive account. T3's "Activate" is the activation.
    - **No rate limit.** Nothing in the app has one. A flood of requests
      creates inactive rows the DM can delete from the accounts page, and
      grants no one anything. If the app is ever exposed (SPEC-012), this is
      one of the things to revisit.
    - E2E: `accounts.spec.ts` covers the whole flow. A newcomer signs up and
      cannot sign in; the DM activates the account; the newcomer then reaches
      the dashboard. `a11y.spec.ts` scans `/signup`.

- [x] **T5** — Campaign membership: the players of a campaign, added and
      removed by the DM. _(test: the actions; a campaign's deletion takes its
      memberships)_
  - _Done 2026-09-30._ Migration `*_spec022_campaign_members`: the implicit
    relation `campaign.members` ↔ `users.campaigns` (`_campaignMembers`,
    cascades on both sides).
    - The campaign page ends with a "Players" section (`CampaignPlayers`,
      `fetchCampaignPlayers`, `addCampaignMember`, `removeCampaignMember`):
      the members, a select of player accounts not yet in the group, and a
      remove button per member that names them.
    - **Only `player` accounts join** (`notAPlayer`). A member later promoted
      to DM keeps the row but is no longer listed, since a DM sees everything.
    - Campaigns have no delete (SPEC-013 T6), so "a deleted campaign takes
      its memberships" holds through the cascade and has no UI to test it.
      The cascade is in the migration.
    - E2E: `campaign-players.spec.ts` adds a player and removes them. The
      shared account helpers live in `e2e/helpers/accounts.ts`.

- [x] **T6** — Reveals. Split in two on 2026-10-01: the records in the
      metadata layer, then the places on the map.
  - [x] **T6a** — The four metadata-layer domains. _Done 2026-10-01._
    - Migration `*_spec022_reveals` creates all six implicit relations
      (`_zoneReveals` … `_factionReveals`), the places' included.
    - The field is `revealedTo`, a multiselect over the new `campaign`
      option table, on NPCs, deities and factions.
    - Magic items get `revealedToDnd5e`, over `dnd5eCampaign`. A 5e catalogue
      offers only 5e campaigns, and `checkRevealCampaigns` refuses another
      system's (`revealWrongSystem`) or a missing one (`campaignNotFound`).
    - Both keys read and write the one Prisma relation `revealedTo`:
      - lists read it through `revealedToInclude` + `withRevealedIds`;
      - create connects, and update replaces the set (`revealedToWrite`);
      - an update that leaves the field out does not touch the reveals.
    - Each admin list shows the column, neither sortable nor filtrable,
      because a relation is neither.
    - Generic machinery fixed on the way: `InputComponent` gave a
      table-backed _multiselect_ the single select's "none" entry, worth 0,
      which the validator refused. A multiselect now has no "none" and an
      empty list for nothing.
    - The three "new" pages for deities, magic items and factions became
      server pages that load the option bundle, as the NPC one already did.
    - New invariant test: `formFields` lists only fields its page declares.
      It caught the reveal field on the treasure form instead of the
      faction's while this was built.
    - E2E: `reveals.spec.ts` reveals an NPC to a campaign from its form,
      checks the admin list shows it, and hides it again. The four domains'
      CRUD specs and the admin a11y scans are green with the new field.
  - [x] **T6b** — Places. _Done 2026-10-01._
    - **The control is a "Rivela…" entry in the place popover**, for a zone
      and a landmark alike (`PlaceRevealDialog`), not in the edit panels
      §10 named. The landmark panel (`MapPOIPanel`) works on the marker's
      stable client key, not the row id (`CLAUDE.md`, 2026-09-09), while
      the popover holds the row id for both kinds.
    - One checkbox per campaign of every system, since places are the
      shared world. Each tick is its own write (`setPlaceReveal`), applied
      at once and re-read.
    - **Inheritance** is `computeVisiblePlaces` in
      `app/lib/data/visibility/placeTree.ts`. It reads the whole tree once
      (`fetchPlaceTree`) and walks it in memory:
      - a zone is visible only if it and every ancestor are revealed;
      - a landmark is visible only if it is revealed and its zone is visible;
      - a cycle or a missing parent hides.

      `visiblePlaceIds(campaignId)` is the helper T7's read paths will ask.

    - The dialog names `hidingAncestor`, the nearest ancestor not revealed to
      a campaign, under every campaign the place is revealed to but which
      still cannot see it.
    - E2E: `place-reveals.spec.ts` covers the whole flow. It reveals a new
      landmark from its popover, sees the "still hidden by" hint (the E2E
      root is revealed to no one), hides it again, and runs an axe scan of
      the dialog.

- [x] **T7** — Player reads, map: `getViewer`, the campaign cookie and
      selector, and R8, R9, R11. _(test: one per path)_
  - _Done 2026-10-01._ R12 and R13 came with it, since a player's popover
    shows a place's picture, its NPCs' portraits and its formatted
    description.
    - **The viewer.** `getViewer()` (`app/lib/auth/`) returns the DM, or a
      player with their campaigns and the one they are viewing. That one is
      the `campaign` cookie, checked against their memberships on every
      read, else their first. `selectCampaign` writes the cookie, only for a
      campaign the player is in. The sidebar's `CampaignSelector` replaces
      the system switch for a player with two campaigns or more, and opens
      the chosen campaign's map under its system.
    - **The scope.** `getVisibilityScope()` (`app/lib/data/visibility/`) is
      what every read path below asks: `{ kind: "all" }` for the DM, else the
      campaign's id with its visible zones and landmarks, computed once per
      request. `revealedWhere(scope)` is the `where` fragment for the four
      revealed domains.
    - **Pages.** The proxy lets a player through to `PLAYER_PAGES`
      (`["/geography"]`, `app/lib/auth/playerPages.ts`) and to the overview,
      which sends them to their campaign's map before reading anything, until
      T8 filters its counts. The dashboard layout takes any active account;
      `admin/`, `campaign/`, `treasures/` and `world/` keep `requireDmPage()`
      in their own layouts as the second layer (ADR-0020's follow-up).
    - **R8.** The geography page, for a player: no campaign says so; another
      system's URL is a 404; a hidden root says nothing is revealed yet; a
      deep link to a hidden, missing or malformed place is a 404, the three
      alike. The explorer is read only: no options menu, no landmark panel,
      no add entries, no dragging, no actions in the popover but "Apri
      mappa", no unpositioned pool. `fetchPlaceChildren` returns the visible
      children of a visible place, and nothing for a hidden one.
    - **R9.** `fetchEntitiesAtPlace` returns nothing for a hidden place, and
      only the revealed NPCs and deities of a visible one.
    - **R11, R12.** The map-image route and both record-image routes take
      the scope (`apiVisibilityScope`): a player gets a 404 unless the place,
      or the record owning the image, is visible. A treasure's image never is.
    - **R13.** `fetchRecordLinkTargets` takes the scope, now a required
      argument so no caller can forget it. A link to a hidden place or an
      unrevealed record resolves to nothing and renders as its text, and a
      player is never told which links point at deleted records.
      `ResolvedRecordLinks` and `resolveRecordLinks` read the scope.
    - **Found while building it:** nothing could reveal the **root**. The
      popover reveals a child, and the root is nobody's child, so a player
      could never see anything. The map options menu gained "Rivela…" for
      the place in view, the root included.
    - E2E: `player-map.spec.ts`. The DM adds a player to the campaign and
      reveals one of two new landmarks. With the root hidden the player sees
      the "nothing revealed" page and a 404 for the root's map image; once
      the root is revealed, the revealed landmark and not the other, the
      image, no options menu, a popover without writes, and a 404 for a
      deep link to a missing place. `accounts.spec.ts` now expects a player
      in no campaign to land on the map page's message.
- [ ] **T8** — Player reads, everything else: R1–R7, R10, R14 (R12 and R13
      shipped with T7), and the DM-only fields stripped. _(test: one per
      path)_ Split in three:
  - [x] **T8a** — R14, the rules catalogues, and the system rule. _Done
        2026-10-01._
    - `PLAYER_PAGES` gains spells, classes, subclasses, domains and domain
      cards. Their pages read nothing but rules, and no client component on
      them calls a Server Action other than the scoped record links, so they
      open unfiltered, as §5 says.
    - The dashboard layout is a 404 for a player under a system none of
      their campaigns plays (§8). A player in no campaign reads the
      catalogues of either system, per §5's edge case.
    - E2E: `accounts.spec.ts` (a player in no campaign opens the spells and
      the Daggerheart domains) and `player-map.spec.ts` (a dnd5e player
      opens the spells, and the Daggerheart domains are a 404).
  - [ ] **T8b** — R2–R7: NPCs, deities, magic items and factions, their
        relation labels and filter options, and the DM-only fields stripped.
  - [ ] **T8c** — R1 and R10: the overview counts and the search.
- [ ] **T9** — i18n, a11y and an e2e journey. The DM reveals a place and an
      NPC to one of two campaigns, and a player in both switches between them and
      sees each campaign's share. _(test: e2e)_

## 11. Outcome

_Fill in at close._
