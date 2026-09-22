# Technical Debt Register

**Last updated:** 2026-09-22
**What this file is for:** deciding what to work on next. It carries the summary table and the write-ups of items that are **still open** — nothing else. Every closed item's full write-up lives in [`TECH_DEBT_ARCHIVE.md`](./TECH_DEBT_ARCHIVE.md), which is where to look for whether something was already tried and rejected.

**One item is open: TD-133**, and only its second half — the map's keyboard entry points shipped on 2026-09-17, typed coordinates are specified as [SPEC-025](./specs/025-typed-coordinates.md) and wait on it. Everything else this register ever carried is closed and archived.

**Scope note.** TD-01 – TD-22 came out of the 2026-07-22 audit; TD-23 onward were found while doing the work, which is why the numbering is chronological rather than thematic. Each item is sized to be completable in one focused session.

**TD-47 – TD-57 and TD-60 have no write-up here, and that is not an oversight to fix.** Three different situations, verified 2026-08-08:

- **TD-47 – TD-55: nothing to transcribe.** A 2026-08-06 merge commit ("docs: record TD-47 – TD-57 from the 2026-08-04 audit pass", PR #80) claimed to record them; its actual diff added only `.env.example` and `dependabot.yml`. No PR, commit or doc anywhere in this repo's history says what these nine were about — most likely an external audit session (a Cowork pass, per `CLAUDE.md`'s "Bringing research into the codebase") whose findings were never committed.
- **TD-56 and TD-57 shipped as code but never got an entry.** They are the `.env.example` and `dependabot.yml` work in that same PR. The fixes are live; only the register entry is missing, and reconstructing one after the fact would be a guess.
- **TD-60 was never claimed by anything** — a skipped number.

**Do not re-litigate any of this by writing entries**, and do not reuse these IDs for new items; skip to the next free number, so a rediscovered write-up (if one ever surfaces) has an unambiguous home.

---

## Legend

| Severity    | Meaning                                                                    |
| ----------- | -------------------------------------------------------------------------- |
| 🔴 Critical | Security hole, data loss risk, or the project does not build/run correctly |
| 🟠 High     | Breaks something a normal five-minute walkthrough of the app would hit     |
| 🟡 Medium   | Real quality problem, not immediately visible                              |
| 🟢 Low      | Polish                                                                     |

Effort: **S** ≈ under 1h · **M** ≈ 1–3h · **L** ≈ half a day or more.

---

## Summary

| ID     | Title                                                                  | Severity       | Effort | Phase |
| ------ | ---------------------------------------------------------------------- | -------------- | ------ | ----- |
| TD-133 | The map has no keyboard path to create a place or open an existing one | 🟠 High — part | L      | 4     |

**The 133 closed rows moved to the archive on 2026-09-22**, with the write-ups they
index — see [`TECH_DEBT_ARCHIVE.md`](./TECH_DEBT_ARCHIVE.md)'s _Index of every closed
item_. This table is the work queue, not a history of the project.

---

## Closed items — TD-01 through TD-146

Everything the 2026-07-22 audit found, plus everything found while doing the work through 2026-09-19, is closed: correctness, security, dead code, formatting, CI, accessibility, the metadata-layer types, the identifier rename, the bilingual UI, the migration drift, the E2E harness, the coverage sweep that crossed Phase 2's 70% gate, the whole SPEC-004 map/world-tree run, the clean-checkout `pnpm test` gap, the metadata layer's unguarded field-name collision, description fields rendering as unsanitised HTML, the entity-location read path duplication, the deity/magic-item/faction mutation coverage gap, SPEC-016/017's map work, and the September 2026 quality, accessibility and copy sweep (TD-112 – TD-146). The archive's _Index of every closed item_ carries the summary row for each.

**Each item's full write-up — what was found, why, the fix — is in [`TECH_DEBT_ARCHIVE.md`](./TECH_DEBT_ARCHIVE.md)**, moved there in six passes (TD-01–TD-36 on 2026-08-01, TD-37–TD-75 on 2026-08-08, TD-76 and TD-77 on 2026-08-13, TD-80 on 2026-08-17, TD-81–TD-102 on 2026-08-31, and the remaining fifty on 2026-09-22). Nothing was deleted; the archive keeps every "(original)" problem framing exactly as recorded, per the policy in [`docs/README.md`](./README.md#keeping-them-honest).

---

## Open items

### TD-133 — The map has no keyboard path to create a place or open an existing one — **keyboard entry points DONE (2026-09-17); typed coordinates need a spec**

**Severity:** 🟠 High · **Effort:** L · **Found:** 2026-09-17, accessibility review (WCAG 2.1.1)

On `/geography`, "Aggiungi luogo" opens only on right-click:
`useMapContextMenu.ts:158` listens only to Leaflet's `contextmenu` mouse event.
The POI panel's "Add" button doesn't help: until a location is set, its form
offers only "Click to select location on map" (`MapPOIPanel.tsx:673-696`),
with no fields for typing coordinates. Existing markers are `L.divIcon` `<div>`s
with no `tabIndex` (`useNavigableChildren.ts:249-252`), so Tab never reaches
them. A keyboard-only user can neither add a place nor open one.
**The fix, in shape:** add a Tab-reachable "new place here" entry point (at the
map centre, or via Shift+F10 / the context-menu key); let coordinates be typed
before any click; give markers `tabIndex=0` and an Enter/Space handler that
opens the same popover a click does. Because this touches SPEC-level
interaction, it may need a short spec. **Related:** TD-15, TD-123.

**Resolution:** The finding's marker half was partly wrong: Leaflet 1.9's
`keyboard` option (default `true`) already gives a marker's icon
`tabindex="0"` and `role="button"`. What was missing was a name and an action —
Leaflet only answers Enter through `bindPopup`, and these markers have none.
`app/modules/maps/lib/utils/keyboardActivation.ts` fills that: it sets
`aria-label` to the place/landmark title and runs the click callback on
Enter/Space through Leaflet's own `keydown` dispatch (no second DOM listener).
`useNavigableChildren` uses it for pins _and_ SPEC-009 area rectangles (which it
also makes focusable), `usePOIManager` for landmarks (same server-id guard as the
click); the emoji inside each icon is `aria-hidden`. `useMapContextMenu` now
opens the menu at the map's centre on ContextMenu or Shift+F10 while the map
container itself has focus, swallows the browser's own `contextmenu` echo of that
press, and advertises the keys with `aria-keyshortcuts`. `MapContextMenu` focuses
its first enabled entry on open, moves with Arrow/Home/End, and on close (Escape
already closed it) returns focus to where it was unless something else took it.
A keyboard activation also hands the activated element to `onPlaceClick` /
`onPOIClick` (a click passes nothing — a mouse click focuses the marker too, so
`document.activeElement` cannot tell them apart); `usePlacePopover` keeps it as
`returnFocusTo`, and `PlacePopover` then moves focus to its first action
("Collega personaggio", not the close button) and, on close — Escape already
closed it — returns focus to the marker unless an action moved focus elsewhere
(e.g. into the edit panel). A click-opened popover leaves focus alone.
No new copy. Tests: unit tests for each piece, and `e2e/map-keyboard.spec.ts`
(Shift+F10 → Aggiungi luogo → Tab to the new marker → Enter opens its popover
with focus on its first action → Escape returns focus to the marker).
**Left:** typed coordinates before any click — **specced on 2026-09-22 as
[SPEC-025](./specs/025-typed-coordinates.md)** (draft). This item stays open, and
open in one direction only: it closes when that spec ships, not before, and
nothing else about TD-133 is outstanding.
