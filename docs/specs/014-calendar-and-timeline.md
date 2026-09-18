# SPEC-014: The calendar and the timeline

- **Status:** Agreed 2026-09-18 — written from an interview with the DM the same day; read through by the DM, who changed only the moon's cycle to 28 days (§5.3)
- **Date:** 2026-09-18
- **Phase:** 4
- **Related:** [SPEC-013](./013-campaign-management.md) (campaigns, adventures, scenes; its provisional `adventure.timeline` field, which this supersedes) · [`campaign-design-method.md`](../domain/campaign-design-method.md) §5 (planned events) · [SPEC-018](./018-game-systems.md) / [ADR-0013](../adr/0013-game-systems.md) (the calendar is world-level, shared by every game system) · [ADR-0011](../adr/0011-inline-collections-outside-the-metadata-layer.md) (where bespoke editors are allowed) · ADR-0015 (to be written in T1: time as a universal day number)

---

## 1. Problem

The DM plans a campaign partly as a calendar: what the antagonists do on each
day while the party does something else. The world also has a history — a
cataclysm, wars, the founding of cities — dated in more than one way, the way
real cultures count years from different events. Today the only place for any
of this is one free-text `timeline` field per adventure. It cannot be sorted,
cannot tell the DM what is coming up next in-world, knows nothing about the
setting's months, weekdays, moon or zodiac, and has nowhere to put history
that belongs to the world rather than to one adventure.

## 2. Goal

The DM can define how the world counts time, date every planned event and every
historical event on one shared timeline, and see both as a list and as a month
grid, with the campaign's current in-world day marking what is past and what is
still to come.

## 3. Non-goals

- **A session diary** (what actually happened, written after play). Distinct from
  this, per `campaign-design-method.md` §5; a future spec.
- **Leap years.** Every year has 365 days (decided 2026-09-18).
- **More than one moon.** One moon on a fixed cycle (decided 2026-09-18).
- **DM-defined month lengths or zodiac ranges.** Month lengths are the Gregorian
  ones and the zodiac is the astronomical thirteen, both fixed in code; a date
  system changes names and the year count, not the shape of the year.
- **Minutes.** An event's time is an hour, 0–23 (decided 2026-09-18).
- **Players seeing the calendar.** Player-facing views are Phase 5 and need the
  authorisation model that does not exist yet.
- **Rules content.** Nothing here is system-specific; the calendar is shared by
  every game system (ADR-0013's world layer).

## 4. User stories

- As a DM, I want to define my world's ways of counting years — a universal count
  from the dawn of time, and a "human" count before and after the Cataclysm — so
  that dates read the way my world's people would write them.
- As a DM, I want to name the twelve months and seven weekdays of each date system
  so that the calendar speaks my setting's language.
- As a DM, I want to date a planned event in a campaign, optionally tie it to an
  adventure and a scene, so that I know what the antagonists are doing while the
  party acts.
- As a DM, I want to set the campaign's current in-world day so that I can see at a
  glance what has already happened and what is coming.
- As a DM, I want a world history, independent of any campaign, whose events can
  name the places, NPCs, deities and factions involved.
- As a DM, I want a month grid showing each day's weekday, moon phase and zodiac
  sign, and the events on it, so that I can plan around a full moon or a sign.

## 5. Behaviour

### 5.1 How time is counted

- **One absolute timeline.** Every date is stored as a **universal day number**:
  day 0 is the first day of year 0 of the universal count, the dawn of time.
  Nothing precedes it.
- **The year** has 365 days in twelve months of the Gregorian lengths
  (31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31). No leap years.
- **The week** has seven days, and the cycle runs unbroken from day 0: universal
  day _n_ is weekday _n_ mod 7 in every date system. Because 365 is not a multiple
  of 7, a month starts on a different weekday each year, as it does in reality.
- **An hour**, 0–23, is optional on a date, shown as "14:00".
- **Day 0 is the first weekday** in every system; there is no setting for it.

### 5.2 Date systems

- **The universal count is built in.** It always exists and cannot be deleted; its
  year 0 is the dawn of time. The DM names it (e.g. "dall'alba dei tempi") and its
  months and weekdays, but cannot re-anchor it.
- **The DM adds other date systems.** Each has:
  - a name ("Calendario umano");
  - an anchor event and the universal year it happened in ("Cataclisma", 5770);
  - the labels for years after and before the anchor, full and abbreviated
    ("Dopo Cataclisma" / "d.C.", "Avanti Cataclisma" / "a.C.");
  - twelve month names and seven weekday names.
- **Year numbering:** a year in a system is the universal year minus the anchor
  year. **Year 0 exists**: the anchor event's year is year 0, the year before is
  −1. Labels use the absolute value: year −330 reads "330 a.C.", year 1230 reads
  "1230 d.C.", and year 0 reads "0 d.C.". Only the year differs between
  systems; a given day is the same day and month everywhere, with that system's
  names.
- **One date system is the default** for the whole world (decided 2026-09-18).
  Every date is shown in it, and every view has a toggle to show dates in another
  system instead. The toggle is a per-viewer preference, not stored per campaign.
- **Changing a system's anchor** re-labels every date's year in that system; no
  event moves, because events are stored as universal days. The edit form says so.
- **Deleting a date system** is allowed unless it is the universal count or the
  current default (pick another default first).

### 5.3 The moon and the zodiac

- **One moon** on an exact 28-day cycle — a fantasy world needs no astronomical
  precision (the DM, 2026-09-18). The DM sets one reference new moon
  (a universal day) in the calendar settings; every day's phase is computed from
  it, as one of eight phases (new, waxing crescent, first quarter, waxing
  gibbous, full, waning gibbous, last quarter, waning crescent), each 3½ days
  long. Until a
  reference is set, no phase is shown.
- **The zodiac** is the thirteen astronomical signs, Ophiuchus included, with the
  real sun-in-constellation ranges mapped onto the 365-day year (Ophiuchus ≈ 29
  November – 17 December). The table lives in code; its exact boundaries are
  recorded in `docs/domain/` in T1. Sign names are UI copy, in both catalogues.

### 5.4 Events

An event has a title, an optional description, a **start** (date, optional hour)
and an optional **end** (date, optional hour). An event can **repeat yearly** (a
festival, a holy day): it then appears on the same day and month in every year
from its start year on. The list shows a repeating event once, marked as yearly;
the grid shows it on every year's page; for "past/upcoming", its next occurrence
after the campaign's today counts. A repeating event may not span more than a
year. There are two kinds of event, by owner:

- **Campaign events** belong to a campaign and may name one of its adventures and
  one scene. The scene, if given, must belong to that adventure (or, with no
  adventure named, to one of the campaign's adventures — the adventure is then
  set from the scene).
- **World history events** belong to no campaign. They may link any number of
  places (world tree zones), NPCs, deities and factions.

Both kinds are shown on one timeline where that makes sense: a campaign's calendar
shows its own events and, visually distinct, the world history events that fall
inside the range shown.

### 5.5 The campaign's "today"

A campaign has an optional **current day** (a universal day), which the DM sets
and advances by hand. On that campaign's views, events ending before today read as
past (dimmed), the event(s) spanning today are highlighted, and later ones are
upcoming. The campaign's page shows the **next three** upcoming events. With no current
day set, nothing is marked past.

### 5.6 Views

- **Chronological list** — events in order of start, grouped by year and month in
  the displayed date system. A campaign's list filters by adventure. The world
  history list filters by linked place, NPC, deity or faction.
- **Month grid** — one month at a time, seven columns headed by the system's
  weekday names, each day showing its number, moon phase and zodiac sign and the
  events on it; a multi-day event spans its days. Previous/next month, and a
  jump-to-date (and jump-to-today, for a campaign).

### 5.7 Pages

All shared pages under ADR-0013 (the calendar is world-level, like geography):

- `/world/calendar` — the date systems panel: the universal count's names, the
  other systems (create, edit, delete), the default, the moon's reference day.
- `/world/history` — world history: list and grid, create/edit/delete.
- `/campaign/calendar` — the current campaign's events: list and grid, the
  current-day control, create/edit/delete. Filtered by the URL's game system like
  every campaign page (SPEC-018 T3).

### 5.8 Entering a date

A date input shows the default system (switchable in the input): year (a number in
that system, negative allowed where the system has years before its anchor), month
(by name), day (1 to the month's length), and an optional hour. It converts to a
universal day on save. The saved value is always re-displayed through the same
conversion, so what the DM typed is what they see.

### Edge cases

| Situation                                          | Expected behaviour                                                    |
| -------------------------------------------------- | --------------------------------------------------------------------- |
| No date systems but the universal count            | Everything works in the universal count; the panel invites adding one |
| Date before the dawn of time                       | Rejected with a field error                                           |
| End before start                                   | Rejected with a field error; equal start and end is a one-day event   |
| Day 31 in a 30-day month                           | Rejected with a field error                                           |
| Scene from another campaign or adventure           | Rejected with a field error                                           |
| A linked scene, adventure, place or NPC is deleted | The link is cleared (or removed from the list); the event stays       |
| A campaign is deleted                              | Its events go with it                                                 |
| No reference new moon set                          | No moon phase shown anywhere                                          |
| Anchor year edited                                 | Years re-label in that system; no event moves; the form warns first   |
| Deleting the default date system                   | Refused until another default is chosen                               |
| Very long history (thousands of events)            | The list pages by year; the grid only loads the month shown           |

## 6. Data model changes

```prisma
// proposed
model dateSystem {
  id              Int      @id @default(autoincrement())
  isUniversal     Boolean  @default(false) // exactly one row, created by the migration
  isDefault       Boolean  @default(false) // exactly one row; enforced in the actions
  name            String
  anchorEvent     String?  // null for the universal count
  anchorYear      Int      @default(0) // universal year of the anchor; 0 for the universal count
  afterLabel      String   // "Dopo Cataclisma"
  afterAbbrev     String   // "d.C."
  beforeLabel     String?  // null for the universal count, which has no "before"
  beforeAbbrev    String?
  monthNames      String[] // exactly 12
  weekdayNames    String[] // exactly 7
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model calendarSettings {
  id              Int  @id @default(1) // singleton
  moonNewMoonDay  Int? // a universal day; null = no phases shown
}

model calendarEvent {
  id          Int       @id @default(autoincrement())
  title       String
  description String?
  startDay    Int       // universal day
  startHour   Int?      // 0–23
  endDay      Int?
  endHour     Int?
  repeatsYearly Boolean @default(false)

  campaignId  Int?      // null = world history
  campaign    campaign?  @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  adventureId Int?
  adventure   adventure? @relation(fields: [adventureId], references: [id], onDelete: SetNull)
  sceneId     Int?
  scene       scene?     @relation(fields: [sceneId], references: [id], onDelete: SetNull)

  zones    zone[]     // world history only
  npcs     npc[]
  deities  deities[]
  factions faction[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([campaignId, startDay])
  @@index([startDay])
}

// campaign gains:
//   currentDay Int? // universal day; the campaign's "today"
```

- **Migration:** additive only — new tables, the implicit many-to-many join
  tables, `campaign.currentDay`. The migration also inserts the universal count
  (Italian placeholder names the DM then edits) as the default, and the settings
  singleton. No backfill of existing rows.
- **`adventure.timeline`** is not touched by this migration. It is dropped in T8,
  after the DM has moved its text into events — a separate migration that needs
  explicit confirmation (CLAUDE.md rule 6).
- **Reversible?** Yes until T8: dropping the new tables and column loses only
  calendar data.
- New column names are English, as on the other SPEC-013 tables.

## 7. Metadata changes

- **Events are a domain** by ADR-0011's test for world history (a list page with
  filters of its own), and an inline collection for campaigns. Both use the same
  `calendarEventMeta.ts` for their scalar fields — `title`, `description`, and the
  date fields through a new `controlType` for a world date (year/month/day/hour in
  a chosen system, stored as a universal day). T4 decides whether that control is a
  new `PageMeta` control type or a bespoke editor consuming the metas' validators;
  ADR-0011 is the test.
- **Date systems** are a settings panel, not a domain: no list page with filters.
  A bespoke editor under `app/ui/calendar/`, whose scalar fields (`name`,
  `anchorEvent`, `anchorYear`, labels) still declare `PageMeta` validators and
  label keys, per ADR-0011.

## 8. Acceptance criteria

- [ ] Converting a date in any system to a universal day and back returns the same date, for every day of a year, across the anchor (years −1, 0, 1)
- [ ] Weekday, moon phase and zodiac sign of a universal day are computed in pure functions, unit-tested against hand-worked examples
- [ ] The universal count exists after the migration, is the default, and cannot be deleted
- [ ] A date system with fewer or more than 12 month names or 7 weekday names is rejected
- [ ] The default date system cannot be deleted
- [ ] A campaign event's scene must belong to its adventure / campaign
- [ ] A world history event can link places, NPCs, deities and factions; a campaign event cannot
- [ ] Events before the campaign's current day are shown as past on that campaign's views
- [ ] A yearly event appears on the same day of every year from its start year on, and its next occurrence counts as upcoming
- [ ] Year −330 reads "330 a.C.", year 0 reads "0 d.C."
- [ ] The toggle shows every date in another system without changing stored data
- [ ] The month grid shows weekday names, moon phase and zodiac sign for each day
- [ ] `adventure.timeline`'s text stays visible until T8
- [ ] New UI copy lands in both `messages/it.json` and `messages/en.json`
- [ ] Every new mutation rejects an unauthenticated request
- [ ] Every new mutation rejects invalid input with field-level errors
- [ ] Coverage has not dropped

## 9. Implementation plan

_Filled in per task once agreed._

**Risks**

- **Off-by-one arithmetic** across year 0 and negative years. Mitigation: T1 is
  pure functions with exhaustive round-trip tests before any UI exists.
- **The month grid is the largest UI piece.** It is one task (T7) and shared by
  both timelines; building it last keeps the list views shippable on their own.
- **The metadata layer and a composite date control.** See §7; ADR-0011 decides.

**Decided on 2026-09-18** (the interview's last round)

1. Day 0 is the first weekday; no setting.
2. Signed years, labelled by absolute value: "330 a.C.", "0 d.C.", "1230 d.C.".
3. Yearly recurring events are in this spec (§5.4).
4. Hours read "14:00".
5. The campaign page shows the next three upcoming events.

## 10. Task breakdown

- [ ] **T1** — ADR-0015 (time as a universal day number). `app/lib/calendar/`: pure conversions (universal day ↔ date in a system), weekday, moon phase, zodiac table; the zodiac boundaries recorded in `docs/domain/`. _(test: exhaustive round-trips, hand-worked examples)_
- [x] **T2** — Schema and migration: `dateSystem` with the seeded universal count, `calendarSettings`, `calendarEvent` and its links, `campaign.currentDay`. _(test: migration is additive; seeded rows exist)_
      _Done 2026-09-18 (`20260918090000_spec014_calendar_schema`)._ Beyond §6: DB guards in raw SQL — partial unique indexes (one universal, one default), CHECKs for 12/7 names, the settings singleton, `startDay >= 0`, `endDay >= startDay`, hours 0–23 — and indexes on `adventureId`/`sceneId`. Placeholder names: "Calendario universale", "dall'alba dei tempi" / "a.T.", Italian months and weekdays. Checked against a throwaway Postgres: every guard rejects its bad row, and Prisma's diff ignores them rather than proposing a drop. `prisma/spec014CalendarSchema.test.ts`. The seed only adds rows, so it needed no change.
- [ ] **T3** — The date systems panel at `/world/calendar`: universal count names, create/edit/delete systems, default, moon reference. _(test: actions — auth, validation, universal/default undeletable)_
- [ ] **T4** — The date input and date display components, and the per-viewer system toggle. _(test: input round-trip; display in two systems)_
- [ ] **T5** — World history at `/world/history`: CRUD with links, chronological list with filters. _(test: actions; list order; filters)_
- [ ] **T6** — Campaign calendar at `/campaign/calendar`: CRUD with adventure/scene and yearly repeat, current day, past/upcoming, adventure filter, the next three upcoming events on the campaign page. _(test: scene/adventure consistency; past/upcoming)_
- [ ] **T7** — The month grid, shared by T5 and T6. _(test: weekday alignment across a year boundary; multi-day events; e2e for one month)_
- [ ] **T8** — `adventure.timeline`: shown read-only with a "move into events" note from T6 on; dropped by a separate migration **only after the DM confirms** its text has been moved. _(test: migration; nothing reads the column)_
- [ ] **T9** — i18n audit, a11y pass (grid keyboard navigation, axe), docs.

## 11. Outcome

_Fill in at close._
