# SPEC-020: Images on records

- **Status:** Agreed 2026-09-19 — written from an interview with the DM the same day, read through and agreed without changes
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
NPCs and deities — on their map pins.

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
5. **Map pins:** an NPC or deity pin shows the portrait's thumbnail in a circle in
   place of today's icon; without a portrait the icon stays. Places keep their
   current markers; a place's picture shows in its popover and edit panel.
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

- [ ] Each of the seven record types can upload, replace and remove one image
- [ ] Only PNG/JPEG/WebP under 10 MB that actually decode are accepted
- [ ] Stored images carry no EXIF metadata
- [ ] Display (≤1600 px) and thumbnail (256 px) versions are generated; the original is not kept
- [ ] Deleting a record or its image removes the files
- [ ] Image routes refuse unauthenticated requests
- [ ] Thumbnails appear in lists; NPC/deity pins show the portrait, falling back to the icon
- [ ] Every image has a text alternative
- [ ] New UI copy lands in both `messages/it.json` and `messages/en.json`
- [ ] Every new mutation rejects an unauthenticated request
- [ ] Every new mutation rejects invalid input with field-level errors
- [ ] Coverage has not dropped

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
3. Shown in detail/card views, list thumbnails and NPC/deity map pins.

**Open questions**

1. None blocking.

## 10. Task breakdown

- [x] **T1** — ADR-0017. Generalise ADR-0008's store for record images; the resize/strip pipeline; the authenticated read route and the upload action. _(test: pipeline, type/size/decode rejections, auth)_
  - _Done 2026-09-19._ `MapImageStore` → `ImageStore`/`FilesystemImageStore` (maps unchanged, at `UPLOAD_DIR`; records at `UPLOAD_DIR/records`). `processRecordImage` sniffs PNG/JPEG/WebP by decoding, refuses >10 MB and >64 MP headers, auto-orients, strips all metadata and writes WebP (1600 px display, 256 px centre-cropped thumbnail); `storeRecordImage` writes both all-or-nothing and returns a `StoredRecordImage` — the seam T2 persists. Upload is a route (`POST /api/record-images`), not an action: Server Actions cap bodies at 1 MB. `GET /api/record-images/[key]` serves by storage key, `private` + `immutable`. `sharp` pinned at 0.35.4.
- [x] **T2** — Schema: `recordImage`, `imageId` on the owning tables. Additive migration. _(test: migration additive)_
  - _Done 2026-09-19._ `recordImage` plus a nullable `@unique` `imageId` (`onDelete: SetNull`) on `npc`, `deities`, `magicitems`, `treasure`, `faction` and `zone`. SPEC-021's domain table does not exist yet and adds the same column when it lands. The migration is exactly `prisma migrate diff` output; `prisma/spec020RecordImageSchema.test.ts` pins it as additive.
- [x] **T3** — `ControlType.Image` input and the shared `image` field in the seven metas; replace/remove; delete-with-record. _(test: actions; file cleanup)_
  - _Done 2026-09-19._ The upload route now also creates the `recordImage` row (deleting both files if the insert fails) and answers its `id`; `ImageInput` (file picker, drag and drop, preview, replace, remove) uploads on choice and sets that id as the field value. The field is `imageMeta` (`app/lib/config/image/`), composed as `imageId` into `pageMetaFields` for the five metadata-driven domains and into `zoneMeta` for places, whose `ZoneEditPanel` and `MapPOIPanel` create flow use the same input. Every create/update checks the id exists and no other record holds it (`checkRecordImageReference`); a replace or remove deletes the old row and files after the save commits, and every delete (the five route-backed `delete*ById` and `deletePlace`) deletes the record's image after the record. Previews read a new authenticated `GET /api/record-images/by-id/[id]`. **Orphans:** an upload whose form is abandoned, or superseded by a second upload before saving, leaves an unowned row and its files — see ADR-0017; no cleanup yet. The root place has no edit surface, so no picture either.
- [ ] **T4** — Display: detail/card views and list thumbnails. _(test: render with/without image)_
- [ ] **T5** — NPC/deity map pins with portraits. _(test: marker HTML uses the thumbnail; icon fallback)_
- [ ] **T6** — i18n, a11y, e2e: upload a portrait, see it on the card, the list and the map pin, remove it. _(test: e2e)_

## 11. Outcome

_Fill in at close._
