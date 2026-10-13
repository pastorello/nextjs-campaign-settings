# SPEC-032: Several campaigns in one system

- **Status:** Agreed 2026-10-12 — the DM answered the four product questions, then the points of the first review, the same day (§9, _Answered_); nothing is open.
- **Date:** 2026-10-12
- **Phase:** 4
- **Related:** [SPEC-013](./013-campaign-management.md) (the campaign, its adventures, scenes, creatures and loot; "multi-campaign support" was left to a later spec) · [SPEC-014](./014-calendar-and-timeline.md) (campaign events, world history, and the campaign's "today") · [SPEC-018](./018-game-systems.md) / [ADR-0013](../adr/0013-game-systems.md) (a campaign has one system) · [SPEC-022](./022-accounts-roles-and-party-visibility.md) (§9's risk and R15: a group is a campaign's players, and the campaign section is the DM's alone) · [SPEC-030](./030-daggerheart-campaign-management.md) · [SPEC-031](./031-encounter-builder.md) · [ADR-0011](../adr/0011-inline-collections-outside-the-metadata-layer.md) · [ADR-0020](../adr/0020-roles-in-the-session-and-four-guards.md) · ROADMAP, _Open question for the DM: several campaigns in one system_

---

## 1. Problem

The DM runs more than one group in this world, under the same rules. The app holds one campaign per game system: `fetchCampaign` reads the first row of the route's system, the campaign page and the campaign calendar render only that one, and the create form appears only while none exists. A second group has nowhere to go — no campaign page, no ladder of adventures of its own, no "today" of its own on the calendar — even though everything underneath already treats the campaign as the unit: players belong to campaigns, reveals are per campaign, the current day sits on the campaign row, a calendar event names its campaign and the adventure it belongs to, and a player in several campaigns already picks one from a selector.

Two things follow from running the same world for two tables. The same adventure has to be authored twice by hand, because its check-offs (experience given, loot taken, scene done) live on the adventure's own rows. And a group that stops playing leaves its campaign in the way, with no way to put it aside.

## 2. Goal

A DM can hold any number of campaigns in a system, each with its own page, adventures, calendar and players; can start one from another's adventures by copying them; and can archive one when its group stops.

## 3. Non-goals

- **Adventures shared between campaigns, with progress kept per campaign.** The DM chose copying (§9). Check-offs (`scene.awarded`, `sceneCreature.awarded`, `loot.taken`) stay on the rows, which is why a copy is what gives each group its own. Moving progress into per-campaign tables would touch scenes, creatures, loot and every budget total, and is not this spec.
- **A cross-campaign calendar.** A campaign's events are those of its adventures, and its "today" is its own; the setting's events (the world history) stay the one shared timeline. No overlay (§9).
- **Deleting a campaign.** There is none today (the adventures' foreign key is `Restrict`), and the DM asked for archiving, not removal.
- **Keeping a copy in step with its original.** A copy is independent from the moment it is made.
- **Scoping the setting by campaign.** The standing decision holds (ROADMAP, _Campaigns as stories, not as scoping_): no `campaignId` on spells, NPCs, deities, factions or places. A campaign's only filter on the setting remains what it has been shown (SPEC-022 reveals).
- **Changing a campaign's system after creation**, and **a player's one-campaign-at-a-time view** (SPEC-022 §9): both stay as they are.
- **Read-only archives.** Archiving is visibility, not a lock (§5.6).
- **Requiring an adventure on every campaign event.** SPEC-014 lets an event of a campaign name none, and this spec leaves that as it is (§9, _Answered_).

## 4. User stories

- As a DM, I want each of my groups to have its own campaign, with its own adventures and calendar, so that what one group did never shows up in the other's prep.
- As a DM, I want to copy an adventure I have built into another group's campaign, so that I do not write it twice and each group has its own check-offs.
- As a DM, I want to start a new campaign as a copy of an existing one, so that a second group begins from the same ladder with nothing ticked.
- As a DM, I want to see which campaign I am working on from the address of the page, so that a bookmark or a link always opens the right group's prep.
- As a DM, I want to archive the campaign of a group that has stopped playing, so that it leaves my list and its players stop seeing the world, and I can bring it back.

## 5. Behaviour

### 5.0 The model, in the DM's words (2026-10-12)

The **setting** (_ambientazione_) is the one world. In it the DM creates **campaigns**, each of a type — D&D, Pathfinder or Daggerheart, which is `campaign.system` (Pathfinder is not yet a game system in the app: SPEC-018, _Later_). A campaign is a run of **adventures** and has no events of its own; **events belong to adventures**, and the setting has its own, recurring ones such as the feasts of the deities (world history, `repeatsYearly`). Several groups in one setting are several campaigns, and two groups playing the same campaign are that campaign **copied**.

### 5.1 The list — `/dashboard/<system>/campaign`

The campaign tile in the sidebar opens a list of the route system's campaigns that are not archived, one card each: title, synopsis, number of players, number of adventures. Each card opens that campaign's page. Below the cards, a form creates a campaign (the existing `CampaignForm`, system preselected from the route) and, when there are archived campaigns, a collapsed section lists them with a "Riattiva" action (§5.6). The list is the route system's, as everywhere (ADR-0013 rule 9): switching system shows that system's campaigns.

With no campaign the page shows what the campaign page shows today: the empty-state sentence and the create form.

### 5.2 A campaign's page — `/dashboard/<system>/campaign/<campaignId>`

What `/campaign` shows today for the one campaign, for the campaign in the address: header and edit form, the calendar link and upcoming events, the adventure ladder, the players section. The calendar is `…/campaign/<campaignId>/calendar`. A campaign of another system opened under this system's URL redirects to its own, keeping the locale — the rule the adventure page already follows. An unknown id is a 404.

The header gains two actions: "Copia campagna" (§5.5) and "Archivia" (§5.6). Each adventure in the ladder gains "Copia in…" (§5.4).

### 5.3 Creating a campaign

The existing form, unchanged: title, synopsis, number of players, system. It no longer refuses to exist once a campaign does. On success the DM lands on the new campaign's page.

### 5.4 Copying an adventure

From an adventure's row in the ladder, "Copia in…" asks for a destination: any non-archived campaign **of the adventure's rules system** (`fetchRulesSystem`), or "nessuna campagna" for a standalone adventure. The copy is appended at the end of the destination's ladder and opens when it is made.

- **Copied:** the adventure's own fields (title, synopsis, target level, targets) and its scenes, creatures and loot in position order, with every link to a catalogue or the world kept (NPC, adversary, place, magic item, treasure, weapon, armor, loot).
- **Reset:** `status` to `planned`; every `awarded`, `taken` and `milestone` to false; Battle Point adjustments kept, since they are part of how the fight is built.
- **Events:** the calendar events that belong to the adventure travel with it — those naming it, and a scene link repointed at the copy's scene — with their dates, repeat and hours unchanged; the DM re-dates them if the second group's story sits elsewhere in time. The setting's own events (world history) are not the adventure's and are not copied.
- **Title:** the original's, prefixed by "Copia di" in the DM's language when the destination is the same campaign (so two rows do not read the same), unchanged otherwise.

### 5.5 Copying a campaign

"Copia campagna" creates a new campaign in the same system: title "Copia di …", the synopsis and number of players, and a copy of every adventure as §5.4 makes it, in ladder order. It carries **no players, no reveals and no current day** — the new group starts seeing nothing, and has not reached a date. Each adventure's events come with it (§5.4); the setting's events are not the campaign's and no copy touches them. The DM lands on its page.

### 5.6 Archiving

"Archivia" on the campaign page sets `archivedAt`; "Riattiva" clears it. An archived campaign:

- is absent from the list's cards, shown in its collapsed section;
- is absent from every place that offers a campaign to pick: a record's "revealed to" field, a place's reveal dialog, the copy destinations;
- is not a campaign its players can be viewing: a player whose campaigns are all archived is in the position of a player in none (SPEC-022 §5: nothing of the setting until they are in a campaign; `playerSystems` lets them read the rules catalogues), and one who has others falls back to the first of those;
- stays reachable by its address, for the DM, with a banner that says it is archived. **Nothing in it becomes read-only**, and nothing in it is deleted — least of all its reveals (§9, _Risks_).

### Edge cases

| Situation                                                                                             | Expected behaviour                                                                                                                   |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| The system has no campaign                                                                            | The list shows the empty-state sentence and the create form.                                                                         |
| The system has one campaign                                                                           | The list shows one card; it does not open on its own.                                                                                |
| `/campaign/<id>` names a campaign of another system                                                   | Redirect to `/dashboard/<its system>/campaign/<id>`, locale kept.                                                                    |
| `/campaign/<id>` names nothing                                                                        | 404.                                                                                                                                 |
| A pre-SPEC-032 bookmark `/campaign/<adventureId>`                                                     | Read as a campaign id (§9, _Answered_): the wrong campaign, or a 404. The adventure moves; its old address is not kept.              |
| Copy destination of another system                                                                    | Not offered. A standalone adventure is 5e, so it is offered 5e campaigns only.                                                       |
| Copying an adventure with no scenes                                                                   | The header is copied; the copy has none.                                                                                             |
| An event of the adventure names one of its scenes                                                     | The copy's event names the copy's scene.                                                                                             |
| A campaign event names no adventure (SPEC-014 allows it)                                              | It belongs to nothing that is copied, so no copy carries it; it stays with its campaign (§9, _Answered_).                            |
| Copying while the original is being edited                                                            | One transaction reads a consistent snapshot; either every row of the copy exists or none does.                                       |
| Archiving a campaign a player is viewing                                                              | Their next request falls back (§5.6); the cookie is only a preference, and `getViewer` already ignores one that is not a membership. |
| Archived campaign's reveals when a record's reveal field is saved from a picker that does not list it | Preserved. A save changes the reveals of the campaigns it listed, and only those (§9, _Risks_).                                      |
| Two campaigns in one system with the same title                                                       | Allowed; the title is not a key.                                                                                                     |

## 6. Data model changes

```prisma
model campaign {
  // …
  // SPEC-032: null = active. A timestamp rather than a boolean so the list
  // can say when it was put away. Nothing is deleted or cascaded by it.
  archivedAt DateTime?
}
```

- **Backfill needed?** No. Every existing campaign is active, which is `null`.
- **Reversible?** Yes — dropping the column restores the schema; no row changes shape.
- **Not added:** a unique index on `(system)` was never there, and none is added; nor a `copiedFromId`, since a copy is independent (§3).

## 7. Metadata changes

None. A campaign is outside the metadata layer (ADR-0011): `campaignMeta` keeps declaring its scalar fields, and archive, restore and copy are actions, not fields. The copy-destination picker and the archived section are bespoke components under `app/ui/campaigns/`, like the rest of the campaign section. No new `PageType`.

## 8. Acceptance criteria

- [ ] `/campaign` lists every non-archived campaign of the route's system and offers the create form whether or not one exists
- [ ] Creating a second campaign in a system succeeds, and each has its own adventures, players, events and current day
- [ ] `/campaign/<id>` and `/campaign/<id>/calendar` show that campaign alone; another system's id redirects to its own; an unknown id is a 404
- [ ] No read of "the" campaign remains: `fetchCampaign(system)` and its `findFirst` are gone
- [ ] Copying an adventure produces the same scenes, creatures and loot in the same order with every `awarded`, `taken` and `milestone` false and `status` `planned`, and appends it to the destination's ladder; the original is untouched
- [ ] A copy destination of another rules system is rejected by the action, not only absent from the picker
- [ ] A copied event keeps its dates, repeat and hours and names the copy's adventure and scene; no copy creates, changes or duplicates a world-history event
- [ ] Copying a campaign produces one new campaign of the same system with copies of every adventure, their events included, and no members, reveals or current day
- [ ] Archiving removes the campaign from the list's cards, from every campaign picker, from `getViewer`'s, `playerSystems`'s and `selectCampaign`'s memberships; restoring puts it back
- [ ] **Saving a record's or a place's reveals never removes the reveal rows of an archived campaign**, tested against a fixture with one archived and one active campaign
- [ ] A player whose only campaign is archived sees none of the world, and falls back to a remaining campaign when they have one
- [ ] Every new mutation (`archiveCampaign`, `restoreCampaign`, `copyAdventure`, `copyCampaign`) calls `requireDm()` and rejects an unauthenticated or `player` request; each validates its ids and destination with Zod and answers field-level errors
- [ ] The campaign section stays the DM's alone: a player is refused `/campaign/<id>` by the proxy and by the layout
- [ ] Both catalogues carry every new key; no copy is hardcoded
- [ ] Coverage has not dropped

## 9. Implementation plan

**Files touched, in order**

| #   | File                                                                                                                                                                                         | Change                                                                                                                                                                                                                                                                                                    |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `app/[locale]/dashboard/[system]/campaign/[adventureId]/` → `adventure/[adventureId]/`                                                                                                       | T1: the adventure page moves out of the campaign segment, with its test and every `dashboardPath(…, "/campaign/<id>")` that names an adventure (`AdventureLadder`, the redirect in the page, scene and calendar links). A new `adventure/layout.tsx` carries `requireDmPage()`. Pure move, its own commit |
| 2   | `app/lib/data/campaigns/fetchCampaign.ts`                                                                                                                                                    | T2: replaced by `fetchCampaigns(system)` (cards) and `fetchCampaignById(id)`; `findFirst` and its "the product only shows the first" comments go                                                                                                                                                          |
| 3   | `campaign/page.tsx`, new `campaign/[campaignId]/page.tsx`                                                                                                                                    | T2: the list; the campaign's page (what `page.tsx` renders today)                                                                                                                                                                                                                                         |
| 4   | `campaign/calendar/page.tsx` → `campaign/[campaignId]/calendar/page.tsx`                                                                                                                     | T3: the calendar of the campaign in the address; back and "goToCampaign" links point at it                                                                                                                                                                                                                |
| 5   | `CampaignForm.tsx`, `AdventureHeader.tsx`, `UpcomingEvents.tsx`                                                                                                                              | links and the post-create navigation take a campaign id                                                                                                                                                                                                                                                   |
| 6   | `prisma/schema.prisma` + additive migration                                                                                                                                                  | T4: `archivedAt`                                                                                                                                                                                                                                                                                          |
| 7   | `app/lib/data/campaigns/archiveCampaign.ts`, `restoreCampaign.ts`                                                                                                                            | T4: the two mutations                                                                                                                                                                                                                                                                                     |
| 8   | `app/lib/data/campaigns/activeCampaigns.ts` (new)                                                                                                                                            | T4: one `where` fragment, `{ archivedAt: null }`, so a read path cannot forget it by spelling it differently                                                                                                                                                                                              |
| 9   | `getViewer.ts`, `playerSystems.ts`, `selectCampaign.ts`, `fetchFieldOptions.ts` (`"campaign"`, `"dnd5eCampaign"`), `fetchPlaceReveals.ts`, `checkRevealCampaigns.ts`, `addCampaignMember.ts` | T4: each campaign read goes through the fragment                                                                                                                                                                                                                                                          |
| 10  | `app/lib/data/campaigns/copyAdventure.ts`, `copyCampaign.ts`, `buildAdventureCopy.ts`                                                                                                        | T5, T6: one pure builder (an adventure with its scenes, creatures, loot and events → the rows of its copy), two mutations, in one interactive transaction                                                                                                                                                 |
| 11  | `app/ui/campaigns/CampaignList.tsx`, `CopyAdventureDialog.tsx`, `CampaignActions.tsx`                                                                                                        | the list's cards and archived section; the destination picker; copy and archive buttons                                                                                                                                                                                                                   |
| 12  | `messages/{it,en}.json`                                                                                                                                                                      | `campaign.list.*`, `campaign.copy.*`, `campaign.archive.*`                                                                                                                                                                                                                                                |
| 13  | `e2e/campaign-calendar.spec.ts`, `campaign-players.spec.ts`, `daggerheart-campaign.spec.ts`, `a11y.spec.ts`                                                                                  | new addresses; a spec that creates two campaigns                                                                                                                                                                                                                                                          |

**Risks**

- **A reveal edit can silently drop an archived campaign's rows.** The reveal fields write a set of campaigns, and a picker that hides archived campaigns hands back a set without them; an assignment that replaces the whole relation then deletes the hidden rows, and unarchiving finds the campaign blind. This is the string-keyed-leak failure `CLAUDE.md` records, in the opposite direction: nothing errors. The writes must be additive and subtractive only for the campaigns the form listed, and the acceptance criterion above names the test. Read how `revealedTo` is written (`setPlaceReveal`, the metadata layer's relation fields) before choosing the mechanism.
- **A read path that forgets the archive.** `getViewer`, `playerSystems`, `selectCampaign`, the option list, the reveal dialogs and `addCampaignMember` each read campaigns on their own. The one fragment in file 8, and a test per reader against a fixture with an archived campaign, are what keep a new eighth one from leaking.
- **The adventure address moves.** `/campaign/<n>` meant an adventure and now means a campaign (§9, _Answered_). One DM and no outside links, but internal ones are many: `grep` for `dashboardPath(` with `/campaign/` and the E2E `goto`s, and rely on `dashboardPaths.test.ts` for the rest.
- **A copy is an interactive transaction, not one nested create.** An event names the new adventure and the new scene, whose ids exist only once those rows do: the copy creates the adventure with its scenes, creatures and loot nested, reads the new scene ids back by position, then writes the events pointed at them. Twenty adventures of ten scenes each is a few hundred rows; the transaction's `timeout` is set explicitly and timed on the E2E world before T6 closes.
- **Reading the campaign cookie.** A player's cookie may name an archived campaign; `getViewer` already treats a non-membership as a preference to ignore, and archived must be treated the same way, not as an error.

**Answered by the DM on 2026-10-12**

- _Same adventures for both groups, or each their own?_ **A copy per group.** Each campaign has its own rows, and an adventure or a whole campaign can be copied with progress reset. Shared adventures with per-campaign progress were weighed and not chosen (§3).
- _How does the DM move between campaigns?_ **A list, and a page per campaign**, each with its own address (§5.1, §5.2), not a selector in the sidebar.
- _Should the calendar show every campaign's events together?_ **No — separate.** Each campaign has its events and its "today"; the world history stays the shared timeline.
- _What becomes of a campaign whose group stops playing?_ **Archive**, reversible; not deletion, and not nothing.

**Answered by the DM on 2026-10-12, on the first review**

- _The route shape?_ **The move**: adventures go to `/adventure/<id>`, as a first, pure-move task, and an old adventure bookmark is not kept.
- _What does a copied campaign leave behind?_ **Players, reveals and the current day.** Events are not left behind: they belong to the adventure and travel with it (§5.4). The setting's own — the feasts of the deities, which repeat each year — are the world's, not a campaign's, and are never copied.
- _Do an archived campaign's players lose sight of the world at once?_ **Yes.**
- _A campaign event that names no adventure?_ **Left as SPEC-014 has it.** Nothing in this spec copies one, and nothing forbids creating one; making the adventure required would be its own item, not part of this.
- _The model_ (§5.0): a setting holds campaigns, each typed by game system; two groups on the same story are that campaign copied. The question of a system's single campaign opening without the list was not answered in so many words; §5.1 keeps the list, and a shortcut is a small change if the DM wants it.

**Open questions**

None.

## 10. Task breakdown

One task, one PR, merged before the next (`docs/AGENT_WORKFLOW.md`).

- [x] **T1** — Move the adventure page to `/adventure/[adventureId]`, with its layout guard, its references and its tests. No behaviour change. _(test: `dashboardPaths.test.ts`; the adventure page tests at the new path; `campaign-players`/`daggerheart-campaign` specs green)_
- [x] **T2** — Campaigns by id: `fetchCampaigns`, `fetchCampaignById`, the list at `/campaign`, the campaign page at `/campaign/[campaignId]`; remove `fetchCampaign`. _(test: list, redirect to another system, 404; a second campaign is created and kept apart; E2E with two campaigns)_
      _T2 handoff (2026-10-13):_ shipped. The calendar page is still at `/campaign/calendar`, so it reads the system's oldest campaign through `readFirstCampaign` (a bridge, in `campaign/calendar/page.tsx`), and the campaign page's calendar link and `UpcomingEvents`' link still point at it — with two campaigns they open the first one's calendar until T3 moves the page under `[campaignId]` and deletes the bridge. The calendar's "back to campaign" link and `AdventureHeader`'s already take the campaign id. E2E helper `ensureCampaignPath` returns a campaign's page path.
- [x] **T3** — The campaign calendar under the campaign's address; back links, upcoming-events link and post-create navigation. _(test: `campaign-calendar.spec.ts` against two campaigns, each with its own events)_
      _T3 handoff (2026-10-13):_ shipped. The calendar is `/campaign/[campaignId]/calendar`; `readFirstCampaign` is gone, an unknown id is a 404 and another system's campaign redirects to its own address. `UpcomingEvents` takes `campaignId`; the `calendar.campaign.noCampaign`/`goToCampaign` keys went with the "no campaign" branch, which an id cannot reach. `revalidateDashboard`'s domain is `campaign/[campaignId]/calendar`. E2E: `campaign-calendar.spec.ts` creates two campaigns with an event each and checks they stay apart.
- [x] **T4** — Archive and restore: migration, `activeCampaigns`, the two mutations, the list's archived section, every campaign read through the fragment. _(test: one per reader against an archived fixture; the reveal-preservation test of §8; a player whose only campaign is archived)_
      _T4 handoff (2026-10-13):_ shipped. `archivedAt` and `activeCampaigns` (one `{ archivedAt: null }` fragment) are in; `getViewer`, `playerSystems`, `selectCampaign`, `fetchFieldOptions`, `fetchPlaceReveals`, `checkRevealCampaigns` and `fetchCampaigns` spread it, and `fetchArchivedCampaigns` feeds the list's collapsed section. `fetchCampaignById` deliberately does not filter: an archived campaign opens by address under a banner. **Reveal preservation:** `revealedToUpdate` is now async and never `set`s — it connects the listed ids and disconnects only the active campaigns left out; `revealedToInclude` reads active reveals only, so a form never holds an archived id. The admin list therefore does not name an archived campaign among a record's reveals. Callers `await` it. Deliberately not filtered: `addCampaignMember`/`removeCampaignMember` and `setPlaceReveal` (§5.6 says nothing in an archived campaign becomes read-only, and the DM can reach its page). The copy destinations (T5) must use `activeCampaigns`. E2E: `campaigns.spec.ts` archives, edits reveals, restores. The test database needs `prisma migrate deploy` for the new migration.
- [ ] **T5** — Copy an adventure: `buildAdventureCopy`, `copyAdventure`, the destination dialog. _(test: the builder is pure and exhaustive over the columns; progress reset; events copied with their scene links repointed; destination of another rules system refused; original untouched)_
- [ ] **T6** — Copy a campaign, built on T5's builder. _(test: no members, reveals or current day; each adventure's events travel with it and world history is untouched; the transaction is all or nothing)_

## 11. Outcome

_Fill in at close._

- Shipped: —
- Deviations from spec and why: —
- Follow-up debt created: —
