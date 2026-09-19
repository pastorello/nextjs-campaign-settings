# SPEC-020: Images on records

- **Status:** Shipped 2026-09-19 — agreed the same day from an interview with the DM; T5 revised by the DM on 2026-09-19 (§5.5)
- **Date:** 2026-09-19
- **Phase:** 5 (pulled forward: a prerequisite of SPEC-018 T4, see [SPEC-021](./021-daggerheart-domains-and-classes.md))
- **Related:** [ADR-0008](../adr/0008-map-image-storage.md) (map images: filesystem store behind an authenticated route — reused here) · ROADMAP Phase 5 "Image uploads" · [SPEC-019](./019-formatted-text.md) · [SPEC-021](./021-daggerheart-domains-and-classes.md) · [ADR-0017](../adr/0017-record-images.md) (how records reference images; the pipeline and routes)

---

## 1. Problem

The DM wants to see the people, gods, objects and places of the setting, not
only read about them: an NPC's portrait, an item's illustration, a faction's
emblem, a picture of a place. Only maps can have an image today.

## 2. Goal

NPCs, deities, magic items, treasures, factions, places and Daggerheart domains
can each carry one image, shown large on the record, small in lists, and — for
NPCs and deities — beside their names in a place's popover on the map (§5.5,
revised 2026-09-19).

## 3. Non-goals

- **Galleries.** One image per record (decided 2026-09-19).
- **Images inside formatted text** (SPEC-019 excludes them).
- **Cropping or editing in the app.** The DM uploads a prepared image; the app only
  resizes.
- **Spells, campaigns, adventures, scenes, calendar events.** Not asked for.
- **Public or player-visible images.** Same access rule as maps (ADR-0008): only
  a logged-in session can fetch them, and ADR-0008's warning about future player
  accounts applies unchanged.

## 4. User stories

- As a DM, I want to upload a portrait for an NPC or a deity so that I can show it
  to the players at the table.
- As a DM, I want an illustration on a magic item or a treasure, an emblem on a
  faction or a Daggerheart domain, and a picture of a place.
- As a DM, I want to recognise records at a glance in lists and on the map.

## 5. Behaviour

**Main flow**

1. The form of each record type in §2 has an **image field**: upload (file picker
   or drag and drop), a preview, replace, remove.
2. Accepted: PNG, JPEG, WebP, up to 10 MB. On upload the server strips metadata
   (EXIF, including location), and stores a display version (longest side 1600 px)
   and a thumbnail (256 px square, centred). The original is not kept.
3. **Detail / card view:** the display version, with the record's name as its
   text alternative.
4. **Lists:** a small thumbnail in each row (admin tables, the phone rows, public
   card lists); a neutral placeholder where there is none.
5. **On the map:** in a place's popover, the list of who is there (the NPCs and
   deities attached to the zone or landmark) shows each one's portrait thumbnail
   beside the name, with the neutral placeholder when there is none; the
   thumbnail's text alternative is the name. Markers are unchanged. A place's
   own picture shows in its popover and edit panel.

   > **Revised 2026-09-19 by the DM — §9 open question 2, option (b).** The
   > original text below was written against the pre-SPEC-008 map: since
   > SPEC-008 T8 an NPC or deity has no marker of its own, only an attachment
   > to a landmark or a zone, so there was no pin to put a portrait on. The DM
   > chose to show portraits in the popover's entity list instead of on any
   > marker. Original text, kept deliberately:
   >
   > _"**Map pins:** an NPC or deity pin shows the portrait's thumbnail in a
   > circle in place of today's icon; without a portrait the icon stays. Places
   > keep their current markers; a place's picture shows in its popover and edit
   > panel."_

6. Removing the image, or deleting the record, deletes the stored files.

**Edge cases**

| Situation                         | Expected behaviour                                    |
| --------------------------------- | ----------------------------------------------------- |
| Wrong type or over 10 MB          | Field error; nothing stored                           |
| A file that claims to be an image | Decoded by the server; rejected if it does not decode |
| Replace                           | New files stored, then the old ones deleted           |
| Record deleted                    | Its image files deleted in the same action            |
| Storage write fails               | Field error; the record's previous image unchanged    |
| Very tall / wide images           | Scaled to fit; thumbnail centre-cropped to a square   |
| Not logged in                     | Image routes answer 401, like map images              |

## 6. Data model changes

```prisma
// proposed — ADR-0017 finalises
model recordImage {
  id          Int      @id @default(autoincrement())
  displayKey  String   // storage key of the 1600 px version
  thumbKey    String   // storage key of the 256 px thumbnail
  mimeType    String
  width       Int
  height      Int
  createdAt   DateTime @default(now())
}

// each owning table gains:
//   imageId Int? @unique
//   image   recordImage? @relation(fields: [imageId], references: [id], onDelete: SetNull)
// on: npc, deities, magicitems, treasure, faction, zone, and SPEC-021's domain table
```

- One nullable, unique `imageId` per owning table keeps real foreign keys (the
  alternative, a polymorphic `ownerType`/`ownerId` on the image, loses them —
  ADR-0017 records the choice).
- Files live in the ADR-0008 store under `UPLOAD_DIR/records/`, served by an
  authenticated route.
- Backfill: none. Reversible: yes (drop the columns and table; delete the folder).

## 7. Metadata changes

A new `ControlType.Image` (with its input in `app/ui/forms/inputs/`) and an
`image` field declared once and composed into the metas of the seven owning
domains, placed per `pagesConfig`. Its `getDatum` renders the display image; the
list column renders the thumbnail.

## 8. Acceptance criteria

- [x] Each of the seven record types can upload, replace and remove one image _(six today — SPEC-021's domain table does not exist yet and adds the column when it lands; `ownerImageLifecycle.test.ts`, `ImageInput.test.tsx`, `e2e/record-images.spec.ts`)_
- [x] Only PNG/JPEG/WebP under 10 MB that actually decode are accepted _(`processRecordImage.test.ts`, `imageUploadRules.test.ts`, `app/api/record-images/route.test.ts`)_
- [x] Stored images carry no EXIF metadata _(`processRecordImage.test.ts`, GPS included)_
- [x] Display (≤1600 px) and thumbnail (256 px) versions are generated; the original is not kept _(`processRecordImage.test.ts`, `storeRecordImage.test.ts`)_
- [x] Deleting a record or its image removes the files _(`ownerImageLifecycle.test.ts`, `recordImageHelpers.test.ts`)_
- [x] Image routes refuse unauthenticated requests _(the three `app/api/record-images/**/route.test.ts`)_
- [x] Thumbnails appear in lists; ~~NPC/deity pins show the portrait, falling back to the icon~~ NPC/deity portraits appear beside their names in the place popover's entity list, falling back to the placeholder _(revised 2026-09-19, §5.5; `EntityList.test.tsx`, `cardImages.test.tsx`, `PlaceEntityList.test.tsx`, `fetchEntitiesAtPlace.test.ts`, `e2e/record-images.spec.ts`)_
- [x] Every image has a text alternative _(the record's name; `RecordThumbnail.test.tsx`, `PlaceEntityList.test.tsx`; axe in `e2e/a11y.spec.ts` and `e2e/record-images.spec.ts`)_
- [x] New UI copy lands in both `messages/it.json` and `messages/en.json` _(`messages.test.ts` parity; T6 audit)_
- [x] Every new mutation rejects an unauthenticated request _(`ownerImageLifecycle.test.ts`, `app/api/record-images/route.test.ts`)_
- [x] Every new mutation rejects invalid input with field-level errors _(`ownerImageLifecycle.test.ts`, `imageMeta.test.ts`)_
- [x] Coverage has not dropped _(measured 2026-09-19, `vitest --coverage` on the commit before T1 (`3ab336e`) vs this close: statements 84.89% → 85.30%, branches 82.23% → 82.62%, functions 83.09% → 83.23%, lines 85.66% → 86.10%. Functions had first measured 82.92%; T6 added the missing tests — see §11)_

## 9. Implementation plan

**Risks**

- **`sharp`** is already a (transitive) dependency of Next; making it direct and
  using it on the server is the proposal. ADR-0017 records it.
- **Map pins** are raw HTML in Leaflet; the `<img>` must be built with Tailwind
  classes (CLAUDE.md rule 8) and an authenticated same-origin URL.
- **Disk growth** is small (two files per record, a few hundred KB).

**Decided on 2026-09-19**

1. NPCs, deities, magic items, treasures, factions, places and Daggerheart domains.
2. One image per record.
3. Shown in detail/card views, list thumbnails and NPC/deity map pins — the last revised the same day to the place popover's entity list (§5.5).

**Open questions**

1. None blocking.
2. **Closed 2026-09-19 — the DM chose (b).** _Was: blocks T5 (found 2026-09-19)._ §5.5's "NPC or deity pin" no longer exists — since SPEC-008 T8 an NPC or deity sits _at_ a landmark or in a zone and has no marker of its own. The options, for the DM: (a) a landmark's marker shows the portrait of the one NPC/deity attached to it (what if several? and it contradicts "places keep their current markers"); (b) the portraits appear in the place popover's entity list instead of on the map; (c) drop map portraits from this spec.

## 10. Task breakdown

- [x] **T1** — ADR-0017. Generalise ADR-0008's store for record images; the resize/strip pipeline; the authenticated read route and the upload action. _(test: pipeline, type/size/decode rejections, auth)_
  - _Done 2026-09-19._ `MapImageStore` → `ImageStore`/`FilesystemImageStore` (maps unchanged, at `UPLOAD_DIR`; records at `UPLOAD_DIR/records`). `processRecordImage` sniffs PNG/JPEG/WebP by decoding, refuses >10 MB and >64 MP headers, auto-orients, strips all metadata and writes WebP (1600 px display, 256 px centre-cropped thumbnail); `storeRecordImage` writes both all-or-nothing and returns a `StoredRecordImage` — the seam T2 persists. Upload is a route (`POST /api/record-images`), not an action: Server Actions cap bodies at 1 MB. `GET /api/record-images/[key]` serves by storage key, `private` + `immutable`. `sharp` pinned at 0.35.4.
- [x] **T2** — Schema: `recordImage`, `imageId` on the owning tables. Additive migration. _(test: migration additive)_
  - _Done 2026-09-19._ `recordImage` plus a nullable `@unique` `imageId` (`onDelete: SetNull`) on `npc`, `deities`, `magicitems`, `treasure`, `faction` and `zone`. SPEC-021's domain table does not exist yet and adds the same column when it lands. The migration is exactly `prisma migrate diff` output; `prisma/spec020RecordImageSchema.test.ts` pins it as additive.
- [x] **T3** — `ControlType.Image` input and the shared `image` field in the seven metas; replace/remove; delete-with-record. _(test: actions; file cleanup)_
  - _Done 2026-09-19._ The upload route now also creates the `recordImage` row (deleting both files if the insert fails) and answers its `id`; `ImageInput` (file picker, drag and drop, preview, replace, remove) uploads on choice and sets that id as the field value. The field is `imageMeta` (`app/lib/config/image/`), composed as `imageId` into `pageMetaFields` for the five metadata-driven domains and into `zoneMeta` for places, whose `ZoneEditPanel` and `MapPOIPanel` create flow use the same input. Every create/update checks the id exists and no other record holds it (`checkRecordImageReference`); a replace or remove deletes the old row and files after the save commits, and every delete (the five route-backed `delete*ById` and `deletePlace`) deletes the record's image after the record. Previews read a new authenticated `GET /api/record-images/by-id/[id]`. **Orphans:** an upload whose form is abandoned, or superseded by a second upload before saving, leaves an unowned row and its files — see ADR-0017; no cleanup yet. The root place has no edit surface, so no picture either.
- [x] **T4** — Display: detail/card views and list thumbnails. _(test: render with/without image)_
  - _Done 2026-09-19._ The five list fetches select the image's keys and display size through the `image` relation in the row query (`recordImageKeysInclude`), and `buildResultSchema` keeps them for the domains that declare `imageId`. `RecordThumbnail` (40/56 px, `lazy`, a neutral placeholder when absent) sits in `EntityList`'s table and phone rows and in each card's header — beside the disclosure button, never inside it, so its alt text stays out of the button's name; `RecordDisplayImage` (stored width/height, no placeholder) opens with the card's panel. Both use `next/image` with `unoptimized`, i.e. a plain `<img>` on the authenticated same-origin key route: the optimizer would fetch without the viewer's cookie, and the pipeline has already sized both files. The place popover shows a zone's picture by id (`by-id?size=display`, one request, in a fixed box); `ZoneEditPanel` already shows it through the image field's preview (T3), so it gains nothing more. `imageMeta.getDatum` stays the bare id: rendering needs the keys and the record's name, which the field value does not carry. E2E: `record-images.spec.ts` (upload on create, list and card thumbnails, remove).
- [x] **T5** — ~~NPC/deity map pins with portraits. _(test: marker HTML uses the thumbnail; icon fallback)_~~ **Revised by the DM 2026-09-19 (§9 open question 2, option b):** NPC/deity portraits in the place popover's entity list. _(test: row with and without a portrait)_
  - _Done 2026-09-19._ `fetchEntitiesAtPlace` selects each NPC's and deity's image keys through the `image` relation in the same query as the rows (`recordImageKeysInclude`, no per-row fetch), and `EntityAtPlace` carries them as `image`. `PlaceEntityList` renders T4's `RecordThumbnail` beside each name — outside the detach button, so the alt (the name) stays out of its accessible name — with the placeholder when there is none; the list's scroll box grew from `max-h-32` to `max-h-48` for the taller rows. Markers unchanged.
  - _Was, 2026-09-19 — blocked on a DM decision (§9 open question 2)._ There are no NPC or deity pins to put a portrait on: SPEC-008 T8 removed them (`useLinkedEntityMarkers` is gone, `PlaceKind` lost `npc`/`deity`), and an NPC or deity is now attached to a landmark (`poiId`) or a zone (`zoneId`), rendering at the landmark's own marker or nowhere. §5.5 was written against the old map. Nothing was built for T5.
- [x] **T6** — i18n, a11y, e2e: upload a portrait, see it on the card, the list and ~~the map pin~~ a place popover's list, remove it. _(test: e2e)_
  - _Done 2026-09-19._ **i18n** — `ImageInput`, `RecordThumbnail`, `RecordDisplayImage` and the error paths read only `common.fields.image.*` and `common.fieldErrors.image*`, present key-for-key in both catalogues; the placeholder is `aria-hidden` and has no copy; alt text is the record's name (content, not copy). Nothing to add. **a11y** — `PAGES` only ever saw the field before an upload and placeholder thumbnails, so `a11y.spec.ts` gains a test that scans the field with a preview and both NPC lists with a loaded thumbnail; `record-images.spec.ts` scans the popover with a populated entity list. **e2e** — `record-images.spec.ts`'s second test creates an NPC with a portrait and a landmark, attaches the NPC through the popover's "Collega personaggio", and sees the loaded thumbnail in the list; both specs clean up in `finally` (NPC first: `npc.poiId` is `onDelete: Restrict`). The PNG generator moved to `e2e/helpers/portraitPng.ts`. **Coverage** — function coverage had dropped against the pre-T1 commit; tests for the drop zone's drag handlers, the picker button, `imageMeta` and `createRecordImage`'s failed cleanup brought it back above (§8).

## 11. Outcome

Shipped 2026-09-19, T1–T6, in one day. NPCs, deities, magic items, treasures,
factions and places each carry one image — uploaded through `ControlType.Image`,
stripped and resized server-side (`sharp`), stored under `UPLOAD_DIR/records`
behind authenticated routes ([ADR-0017](../adr/0017-record-images.md)) — shown
at display size on cards, as thumbnails in list rows and card headers, and, for
NPCs and deities, beside their names in a place popover's list of who is there.

**Deviations from the agreed text**

- **T5 revised by the DM.** §5.5's NPC/deity map pins no longer existed
  (SPEC-008 T8); the DM chose option (b), portraits in the popover's entity
  list. Markers are unchanged. §5.5 keeps the original text as a dated note.
- **`next/image` runs unoptimised (T4).** Thumbnails and display images are
  plain `<img>`s on the same-origin key route: the optimizer fetches
  server-side without the viewer's session cookie and would get a 401, and the
  pipeline has already sized both files.
- **Orphan uploads.** An upload whose form is abandoned, or superseded by a
  second upload before saving, leaves an unowned `recordImage` row and its
  files. Recorded in ADR-0017; no sweep exists yet.
- **The root place has no picture.** It has no edit surface, so the image field
  never renders for it.
- **Six owners, not seven.** SPEC-021's Daggerheart domain table does not exist
  yet; it adds `imageId` the same way when it lands.

**Coverage** (vs `3ab336e`, the commit before T1): statements 84.89% → 85.30%,
branches 82.23% → 82.62%, functions 83.09% → 83.23%, lines 85.66% → 86.10%.
