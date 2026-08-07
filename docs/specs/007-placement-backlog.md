# SPEC-007: Finding the records nobody has placed yet

- **Status:** Draft — not agreed, not started. **Small**; sized deliberately, see §3.
- **Date:** 2026-08-08
- **Phase:** 3
- **Related:** created by [SPEC-004](./004-world-model.md) T5b (dropping the location columns makes the pin the only source); consumes T4/T5a's derived location; adjacent to [SPEC-005](./005-place-repositioning.md) (positioning a place that already has a parent) and TD-71's `useUnplacedChildren`

---

## 1. Problem

Once SPEC-004 T5b lands, **an NPC's location comes only from where their pin sits in the world tree**, and the creation form no longer has a location field. The DM creates Dexter Nemrod, saves, and Dexter exists nowhere in the world until someone goes to the Skreebars map and pins him. That much is by design (SPEC-004 §5.6).

**What is not by design is that nothing tells the DM which records are waiting.**

There is already an unplaced list, and it does not cover this case. `useUnplacedChildren` (TD-71) shows the children _of the place you are currently looking at_ that have no coordinates — a record that has a parent but has not been dragged onto the map yet. A record created through the form has **no pin at all**, so it is not a child of anything, and it appears in that list nowhere, on any map. It is invisible to the entire geography page.

The information is not completely hidden: the admin list's "Location (map)" column (T4) is blank for such a record. But that column is `sortable: false` and has no filter, so finding the unplaced ones among 119 NPCs means eyeballing every row across every page of the table. In practice the DM will forget, and the record will sit locationless indefinitely — which after T5b means it has no location anywhere in the app, not merely a blank cell.

The only thing that currently reports this reliably is `app/seed/verifyDerivedLocationsT5.ts`, which is a hand-run CLI script written as a migration gate, not a feature.

## 2. Goal

The DM can see at a glance which NPCs and deities have no pin, and get from that list to placing one.

## 3. Non-goals

**This spec is deliberately small, and the temptation it must resist is becoming a workflow feature.** It is a findability gap created by a sequencing decision, not a new capability.

- **No bulk placement.** Placing records one at a time is fine; the count is small and each one needs the DM to decide where it goes.
- **No new placement mechanism.** `MapPOIPanel` already creates an `npc`/`deity` pin under the current place with the cascading entity select (SPEC-004 M5). This spec routes the DM to that, it does not replace it.
- **No "assign a default location on create".** That reintroduces exactly the stored-location second source of truth SPEC-004 §6 removed, one indirection further away.
- **No notification, reminder or nag.** A list the DM chooses to look at, nothing that interrupts them.
- **Not a general saved-filter or query-builder feature** on the admin lists. If a filter is the chosen shape, it is one filter for one condition.

## 4. User stories

- As a DM, I want to **see which NPCs and deities I have not placed yet**, so none of them silently ends up with no location in my world.
- As a DM looking at that list, I want to **get to the map and place one**, without hunting for the right map first.

## 5. Behaviour

**Main flow**

1. The DM opens the NPC (or deities) admin list.
2. A control filters the list to records with no pin. The count is visible without applying it — "3 not placed" is the useful signal; opening the list is the action.
3. Filtering shows those records, each identifiable by name as usual.
4. From a row, the DM reaches the geography page to place that record.

**Edge cases**

| Situation                                           | Expected behaviour                                                                                                                                                                         |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Every record is placed                              | The control reports zero and applying it shows the ordinary empty state. Not hidden — "zero unplaced" is information the DM wants.                                                         |
| No world tree exists yet (empty installation)       | Every record is unplaced, and that is correct rather than alarming. The list should not imply something is broken before a world exists.                                                   |
| A record is pinned, then its place is deleted       | Cannot happen — `onDelete: Restrict` refuses to delete a place with children (SPEC-004 §6).                                                                                                |
| A record is pinned at the root with no ancestors    | It **is** placed. "Unplaced" means no pin, not an empty ancestor chain — the distinction `deriveEntityAncestry` already draws between an absent map entry and an empty one (SPEC-004 T5a). |
| The DM places a record and returns to the list      | It is gone from the filtered view on the next request. No optimistic state.                                                                                                                |
| Filtering by "unplaced" combined with other filters | Composes with them like any other filter — it is not a mode.                                                                                                                               |

## 6. Data model changes

**None.** "Has no pin" is `poi.linkedType`/`linkedId` having no row for this record, which SPEC-004's `@@unique([linkedType, linkedId])` already indexes.

## 7. Metadata changes

**This is the design question the spec exists to settle, and it is not obvious.**

"Unplaced" is not a column, so it is not a `PageMeta` field, and the metadata layer's filter path (`queryFields` → `getQuery` → a Prisma `where`) cannot express it as a declaration. This is the same shape of problem that made SPEC-004 T5b drop the location filter rather than rebuild it — and the reason that decision was acceptable there does **not** apply here: the map cannot answer "who is unplaced", because an unplaced record is precisely the thing the map cannot show.

Two candidate shapes, to be decided before implementation:

**A. Resolve to an id list, then filter normally.** Read the pinned `linkedId`s for the domain (one query — the same read `fetchDerivedAncestry` already performs), then pass `where: { id: { notIn: [...] } }` into the existing query path. Pagination and the count stay correct because `getQuery` still builds them, and TD-12's "rows and count cannot disagree" guarantee is preserved. Costs one extra query per request and keeps the filter outside the metadata layer, as a special case the layer does not have to learn about.

**B. Teach the metadata layer about derived predicates.** More general, and the wrong trade at this size: it would be a new concept in the project's core abstraction bought for exactly one condition. Rejected unless a second derived filter appears — at which point this decision should be revisited, not extended by accident.

**A is the recommendation**, on the same reasoning ADR-0009 used for keeping `navigable` derived: prefer a special case that is honest over a generalisation nothing else needs. Either way the control itself is not a `SelectButtonery` over `PageMeta.options` — it is a boolean toggle, and where it renders (beside the search box, or as a count badge above the table) is a UI decision, not a metadata one.

## 8. Acceptance criteria

- [ ] The NPC and deities admin lists show how many records have no pin, without the DM applying anything.
- [ ] Applying the filter lists exactly those records, and the header count agrees with the rows shown (TD-12's invariant).
- [ ] A record pinned at the tree root counts as placed, not unplaced.
- [ ] The filter composes with the existing filters and with pagination.
- [ ] Placing a record removes it from the filtered view on the next request.
- [ ] On an installation with no world tree, the list reports every record as unplaced without presenting it as an error.
- [ ] Coverage has not dropped.

## 9. Implementation plan

_Fill in once §7's A-versus-B question is settled._

**Risks**

- **Scope creep into a placement workflow.** §3 is the guard. If this starts growing a queue, bulk actions or a wizard, stop and re-scope it as its own feature.
- **The extra query is on the list path**, which TD-30 made stream deliberately. It should ride along with the existing `fetchDerivedAncestry` read rather than becoming a second round trip — they want the same rows.

**Open questions**

1. §7's A versus B.
2. Where the control lives: a toggle beside the search box, or a count badge above the table that filters when clicked. The second is fewer clicks and surfaces the number without interaction; the first is more conventional.
3. Does the row link straight to the correct map, or just to the geography page? Straight to the map requires knowing where the record _should_ go, which is the DM's decision and not knowable — so the honest answer is probably the geography page, with the record preselected in the placement panel if that is cheap.

## 10. Task breakdown

_Fill in once §7 and the open questions are settled — the tasks depend on which shape is chosen._

## 11. Outcome

_Fill in at close._
