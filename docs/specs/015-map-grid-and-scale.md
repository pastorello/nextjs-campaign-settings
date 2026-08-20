# SPEC-015: Map grids, scale and measurement

- **Status:** **Shipped 2026-08-20** — T1–T8 all landed the same day the spec was agreed (PRs #202–#209); see §11. _(Agreed 2026-08-20: both §9 open questions decided with the DM — the grid toggle's state is not persisted, and the legend also shows the map's total size. Written 2026-08-18 from the DM's own description of the grid model.)_
- **Date:** 2026-08-18
- **Phase:** ROADMAP Phase 4 (Session tooling)
- **Related:** [`docs/ROADMAP.md`](../ROADMAP.md) "Decided on 2026-08-18 — making the map measurable" (**this spec supersedes its scale design**) · **TD-94** (the measurement bug; superseded by this spec rather than patched) · **TD-81** (map framing — fixed separately, deliberately) · [SPEC-004](./004-world-model.md) (the world tree) · [SPEC-009](./009-zones-as-areas.md) (footprints) · [ADR-0008](../adr/0008-map-image-storage.md) · [ADR-0011](../adr/0011-inline-collections-outside-the-metadata-layer.md) (the boundary §7 applies)

---

## 1. Problem

The maps are `CRS.Simple` — a pixel space with no notion of distance. The app can
tell that two points are 340 pixels apart and nothing more.

So the DM cannot answer, from the map, the two questions a map exists to answer:
_how far is that_, and _how long does it take_. The measurement tool that exists
today makes this worse rather than better: it feeds pixel coordinates to a
haversine formula meant for latitude and longitude, and reports a confident
number of metres that is meaningless (**TD-94**). A wrong distance is worse than
no distance, because the DM might believe it.

There is also no visual sense of scale at all. Two maps sit side by side in the
tree — a dungeon and a continent — and look alike.

## 2. Goal

Every map carries a grid of squares whose side is a known real distance, so the
DM can read distance straight off the map, and measure between two points in the
campaign's own units.

## 3. Non-goals

- **Not hexes.** The DM's reference scales come from a system whose overworld
  travel is hex-based, and one of them is quoted in hexes per day. This app uses
  **squares** — "quadretti" — throughout, as the DM specified. The travel figure
  still holds because the distances are the same (three 9 km squares is 27 km);
  only the shape differs. Do not introduce a hex mode.
- **Not travel time.** The app reports distance. It computes no journey duration,
  no pace, no encumbrance, no terrain cost. Those are rules, and this app is
  deliberately not a rules engine (the same line SPEC-013 §3 draws).
- **Not a free-form scale.** The roadmap's earlier design — a per-map "50 pixel =
  4.5 km" entered by hand — is superseded. See §6.
- **Not geographic.** No projection, no real-world coordinates, no lat/lng
  reinterpretation. `CRS.Simple` stays.
- **Not per-square content.** No terrain painting, no fog of war, no pathfinding,
  no snapping markers to squares. The grid is a readable overlay, nothing more.
- **Not retroactive.** Existing maps get no grid until the DM configures one. A
  map without a grid keeps working exactly as it does today.
- **Not a change to how maps are framed.** TD-81 fixes aspect-ratio framing and
  zoom separately and ships first. This spec assumes a correctly framed map.

## 4. User stories

- As a DM, I want to say how many squares wide a map is, so that the app can
  translate pixels into distance without me measuring anything by hand.
- As a DM, I want to pick the scale from the four I actually use, so that a
  dungeon corridor and a continental crossing are each measured in units that
  make sense for them.
- As a DM, I want a grid I can switch on over the map, so that I can eyeball a
  distance without measuring it at all.
- As a DM, I want to measure between two points and get an answer in campaign
  units, so that I can tell the party how far it is.

## 5. Behaviour

**Main flow — configuring a map**

1. The DM opens a place's map and clicks the **edit** control in the bottom-right
   control stack.
2. A configuration panel offers two things: **how many squares across the map's
   width**, and **which scale** — one of the four in §6.
3. The **height in squares is derived**, never asked: the image's aspect ratio
   fixes it once the width is chosen. The panel shows the derived figure as a
   read-only value so the DM can sanity-check it.
4. Saving stores the two values against that place. Nothing else about the map
   changes.

**Main flow — reading**

5. A **grid toggle** sits beside zoom in and zoom out. Switched on, the grid is
   drawn over the map; switched off, the map is exactly as it is today.
6. A legend states what one square means — "1 quadretto = 9 km" — and the map's
   total size — "36 × 24 quadretti — 324 × 216 km". _(The total-size line was
   §9's second open question, decided 2026-08-20.)_

**Main flow — measuring**

7. The DM clicks once to start. The track draws in red as the mouse moves. A
   second click ends it, drops a marker, and labels it with the distance in the
   map's units. _(This interaction is the DM's own proposal, recorded in the
   roadmap; it replaces the current panel-driven flow.)_

**Edge cases**

| Situation                                    | Expected behaviour                                                                                                                              |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Map has no grid configured                   | The grid toggle is present but inert, and offers to configure one. Measurement is **unavailable**, with a one-line explanation — never a guess. |
| Place has no map image at all                | No edit control, no grid, no measurement. The configuration surface does not exist.                                                             |
| Width in squares is zero, negative or absent | Rejected by the validator with a field-level error. A grid of zero squares is not a grid.                                                       |
| Width in squares is very large               | Capped, with the cap stated in the error. Drawing ten thousand lines over a map is a performance bug waiting to be filed.                       |
| Image aspect ratio not yet known             | The derived height renders as `—`, not `0`. The same rule SPEC-013 §5 applies to unset budget targets.                                          |
| The map image is later replaced              | The width in squares is kept; the derived height recomputes from the new image. The DM is not asked to re-enter what they already decided.      |
| The scale is changed                         | Nothing stored is rewritten. Only the displayed distances change — the same principle as SPEC-013's currency unit.                              |
| Measuring while zoomed in or out             | The reported distance is identical. Distance is a property of the map, not of the view.                                                         |
| A child map and its parent                   | Each map carries its own grid and its own scale. Nothing is inherited down the tree; a city inside a continent is not at continental scale.     |
| Unauthenticated request to save a grid       | Rejected, as everywhere else.                                                                                                                   |

## 6. Data model changes

Two nullable columns on `zone`. Both unset means the map has no grid, which is
the state every existing map starts in.

```prisma
model zone {
  // …unchanged…
  gridColumns Int?    // squares across the image's width; height is derived
  gridScale   String? // dungeon | province | kingdom | continent
}
```

**The four scales**, as the DM specified them:

| Scale                        | One square | Used for                                                        |
| ---------------------------- | ---------- | --------------------------------------------------------------- |
| **Dungeon / tattica**        | 1,5 m      | Combat, dungeon crawling, building interiors, tactical areas    |
| **Provinciale** (province)   | 1,5 km     | Local maps — a single settlement and its immediate surroundings |
| **Regionale** (kingdom)      | 9 km       | Kingdoms and whole regions; the standard overworld travel scale |
| **Continentale** (continent) | 90 km      | Continental land masses, or the whole world                     |

_(The DM's source system states these as 5 feet, 1 mile, 6 miles and 60 miles.
The metric figures are the campaign's own and are what the app stores and shows;
the imperial equivalents belong in `docs/domain/`, not in the code.)_

**Store the scale's name, not its metres.** `gridScale` holds `"kingdom"`, and
the metres-per-square live as static options in code. Correcting a scale's value
later is then a one-line change rather than a data migration — the same reasoning
SPEC-013 §6 used for storing silver and displaying gold.

- **Backfill needed?** No. Every existing map starts with both columns null,
  which is the documented no-grid state.
- **Reversible?** Yes. Dropping the two columns restores the previous schema
  exactly; nothing else references them.

**What this supersedes.** `docs/ROADMAP.md` proposed a free-form scale — "50
pixel = 4.5 km", typed per map. The DM's grid model replaces it, and is better
on three counts: the DM already thinks in squares, four named scales cannot be
mistyped the way a pixel ratio can, and a grid the DM can see is self-checking in
a way a stored ratio never is. The roadmap entry carries a dated supersession
note rather than being rewritten.

## 7. Metadata changes

`gridColumns` and `gridScale` are two ordinary scalar fields on `zone` and each
gets its `PageMeta` — `gridColumns` an integer, `gridScale` option-backed against
the four static options, exactly the shape `magicitems.type` has.

The **configuration panel itself is a bespoke map control**, not a metadata-driven
form: it lives inside the map view, has no list page and no header filter. That
is precisely the split [ADR-0011](../adr/0011-inline-collections-outside-the-metadata-layer.md)
draws, and the half it says is shared applies here — the panel **consumes** the
declared validator and label key rather than restating them. This is the first
case to exercise that boundary since the ADR was written; if it turns out to be
awkward, that is evidence worth recording, not worked around silently.

## 8. Acceptance criteria

- [x] A map's grid can be configured with a width in squares and one of the four scales.
- [x] The height in squares is derived from the image's aspect ratio and never asked for.
- [x] A width of zero, a negative width, or one past the cap is rejected with a field-level error.
- [x] The grid overlay can be toggled from the map controls and is off by default.
- [x] The legend states what one square means, in the map's own scale, and the map's total size in squares and in units.
- [x] A map with no grid configured offers configuration and reports no distances at all.
- [x] Measuring reports the same distance regardless of the current zoom level.
- [x] Measurement uses the map's own pixel space, not a haversine formula — TD-94 cannot recur.
- [x] Changing a map's scale rewrites no stored value.
- [x] A child map's grid is independent of its parent's.
- [x] Replacing the map image keeps the configured width and recomputes the derived height.
- [x] Every new mutation rejects an unauthenticated request.
- [x] Every new mutation rejects invalid input with field-level errors.
- [x] Every new user-facing string exists in both `messages/it.json` and `messages/en.json`.
- [x] axe reports zero violations on the configuration panel, and it is completable with the keyboard alone.
- [x] Coverage has not dropped.

## 9. Implementation plan

**Files touched, in order**

| #   | File                                                   | Change                                                              |
| --- | ------------------------------------------------------ | ------------------------------------------------------------------- |
| 1   | `prisma/schema.prisma` + migration                     | `zone.gridColumns`, `zone.gridScale`                                |
| 2   | `app/lib/definitions/**`, `app/lib/config/**`          | `GridScale` vocabulary, its static options, the two `PageMeta`      |
| 3   | `app/lib/data/maps/**`                                 | Read and save the grid config, auth-guarded and validated           |
| 4   | `app/modules/maps/lib/utils/**`                        | Pixels → squares → distance, and the derived-height helper          |
| 5   | `app/modules/maps/components/map/**`                   | The configuration panel behind the edit control                     |
| 6   | `app/modules/maps/components/map/**`, `hooks/**`       | The grid overlay and its toggle                                     |
| 7   | `app/modules/maps/hooks/useMeasurement.ts` + its panel | Rebuild measurement on the new primitive; retire the haversine call |
| 8   | `messages/{it,en}.json`                                | Both catalogues, same key set                                       |
| 9   | `docs/ROADMAP.md`, `docs/TECH_DEBT.md`                 | Supersession note; TD-94 closed by this spec rather than patched    |

**Risks**

- **The conversion helper is the whole feature.** Pixels → squares → metres is
  four lines and every visible number depends on them. It is also the one part
  that is trivially unit-testable, so test it first and hard.
- **TD-81 must land first.** Deriving a height from an aspect ratio is meaningless
  while maps are framed with a square default that stretches the image.
- **The grid overlay is a rendering-performance question**, not a correctness one.
  A cap on the width in squares is the mitigation, and §5 requires it.
- **Measurement is a visual interaction** — click, drag, click — and unit tests
  will not tell you it feels right at the table.

**Open questions — both decided 2026-08-20**

- Should the grid toggle's state persist per map, per session, or not at all?
  **Decided: not persisted.** The grid starts off on every load, as §5 and the
  acceptance criteria already state; revisit only if it proves annoying at the
  table. No client state, no extra column.
- Should the legend show the map's total size ("36 × 24 quadretti — 324 × 216 km")?
  **Decided: yes.** One computed line from values the legend already holds
  (columns, derived height, scale), and a free sanity check — a wrong scale
  announces itself as an absurd total. §5 and §8 carry it now.

## 10. Task breakdown

- [x] **T1** — Schema + migration: `gridColumns`, `gridScale`. _(test: migration applies to an empty database; both columns nullable)_
- [x] **T2** — `GridScale` vocabulary and its four static options. _(test: membership validator; metres-per-square values)_
- [x] **T3** — The conversion helpers: derived height from aspect ratio, pixels → squares → distance. _(test: each scale round-trips; a zoom change does not alter the result)_
- [x] **T4** — `PageMeta` for both fields, and the validated, auth-guarded save. _(test: unauthenticated rejection; zero/negative/over-cap rejection)_
- [x] **T5** — The configuration panel behind the map's edit control. _(test: derived height renders as `—` when unknown; keyboard-completable)_
- [x] **T6** — The grid overlay and its toggle. _(test: off by default; inert with no grid configured)_
- [x] **T7** — Measurement rebuilt on the new primitive, retiring the haversine call. _(test: TD-94's regression — a pixel-space map never reports a haversine metre)_
- [x] **T8** — i18n both catalogues, a11y pass, docs update. _(test: catalogue key-set check in CI, axe at zero)_

## 11. Outcome

- **Shipped:** everything in §5, 2026-08-20, as eight tasks / eight PRs
  ([#202](https://github.com/pastorello/nextjs-campaign-settings/pull/202)–[#209](https://github.com/pastorello/nextjs-campaign-settings/pull/209)):
  schema, `GridScale` vocabulary, the conversion helpers, the `PageMeta` pair
  with the auth-guarded save, the configuration panel, the overlay + legend
  with the toggle beside zoom, and measurement rebuilt click–track–click on
  `measureDistanceInMeters` (closing **TD-94**, whose regression test pins that
  a pixel-space map never again reports a haversine metre).
- **Deviations from spec and why:**
  - **§7's ADR-0011 boundary was _not_ awkward** — recorded here because §7
    asked for evidence either way. The panel, the overlay and the measure tool
    all consume `zoneGridMeta`'s validators and label keys without restating
    them (`parseGridScale` wraps the declared validator for the two readers);
    nothing about the split fought back. First exercise of the boundary since
    the ADR, and it held.
  - **Area measurement was removed with the vendored panel.** §5 never
    specified area; the panel's area mode ran the shoelace formula with
    Earth's radius on pixel coordinates — TD-94's disease in a second shape —
    so retiring the haversine path took it too. If area-on-the-grid is ever
    wanted, it is a new roadmap item, not a revert.
  - **The full click–track–click interaction is not driven end-to-end.** The
    e2e fixture image (`world.setup.ts`) is a deliberately undecodable 8-byte
    PNG, so the image never reports a natural size and e2e can only exercise
    the measurement-unavailable path (which it does). The interaction itself
    is covered in `MapMeasureTool.test.tsx` against a mocked map. Driving it
    e2e needs a decodable fixture image — noted below as debt.
- **Follow-up debt created:**
  - No grid-removal flow: a configured grid can be edited but not unset
    (noted in [PR #206](https://github.com/pastorello/nextjs-campaign-settings/pull/206)).
    Cheap once wanted — `updateZoneGrid` already validates; it needs a
    "remove" affordance and a nulling write.
  - A decodable e2e fixture map image, so the measurement interaction and the
    grid overlay can be exercised end-to-end rather than only against mocks.
