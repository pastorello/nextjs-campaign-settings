# ADR-0017: Record images — a nullable unique `imageId` on each owner, processed with `sharp`, stored beside the maps

- **Status:** Accepted
- **Date:** 2026-09-19
- **Deciders:** the maintainer (DM), with Claude Code
- **Related:** [SPEC-020](../specs/020-record-images.md) (this ADR is its T1), [ADR-0008](./0008-map-image-storage.md) (the store and access rule reused here), [ADR-0007](./0007-message-key-resolution-boundary.md) (refusals as message keys), [ADR-0009](./0009-world-tree-as-one-polymorphic-table.md) (the one polymorphic table this project does have), [SPEC-021](../specs/021-daggerheart-domains-and-classes.md)

## Context

SPEC-020 gives seven kinds of record — NPCs, deities, magic items, treasures, factions, places (`zone`) and SPEC-021's Daggerheart domains — one image each, shown large on the record, as a thumbnail in lists and, for NPCs and deities, on their map pins. The spec leaves four things to this ADR:

1. **How a record references its image.** Seven owner tables, one image table.
2. **What processes the upload.** The spec requires decoding (not trusting the extension or the claimed MIME type), stripping EXIF — a phone photo carries GPS coordinates — resizing to a 1600 px display version and a 256 px square thumbnail, and not keeping the original.
3. **Where the files live and who can read them.** ADR-0008 already answers this for maps: a filesystem directory under `UPLOAD_DIR`, behind a small store interface, read through an authenticated route handler.
4. **What format the stored files are in.**

Constraints that shape the answers: one maintainer; a self-hosted, single-DM app with no CDN; a few hundred KB per record; Next 16 already depends on `sharp` transitively for `next/image`; a Server Action's request body is capped at 1 MB by default while the spec allows 10 MB uploads.

## Decision

**We will reference record images through a nullable, unique `imageId` foreign key on each owning table, process uploads with `sharp` as a direct and exactly pinned dependency, store the results as WebP through ADR-0008's store in `UPLOAD_DIR/records/`, and serve them only through an authenticated route handler.**

In detail:

1. **Reference.** A `recordImage` row holds the two storage keys, the MIME type and the display size (SPEC-020 §6). Each owner table gains `imageId Int? @unique` with `onDelete: SetNull`. The table and columns land in SPEC-020 T2; T1 ships the shape they will hold, `StoredRecordImage`.
2. **Pipeline** (`app/lib/storage/processRecordImage.ts`). Refuses more than 10 MB, then reads the header with `sharp` and accepts only what libvips _detects_ as `png`, `jpeg` or `webp` — a GIF renamed `.png`, or a PHP file sent as `image/jpeg`, is refused whatever it claims. It refuses a header declaring more than 64 MP before decoding anything (a small file can declare an enormous flat image — a decompression bomb). It then decodes with `failOn: "error"`, applies the EXIF orientation, and writes a **display version** (longest side at most 1600 px, never enlarged) and a **thumbnail** (256 × 256, `fit: cover`, centred). `sharp` writes no metadata unless asked to, so EXIF (GPS included), XMP and ICC are gone from both. The original is not kept. Every refusal is a `FieldErrorKey` (`imageTooLarge`, `imageUnsupportedType`, `imageUndecodable`, `imageStoreFailed`, `imageRequired`), resolved at the render boundary per ADR-0007.
3. **Format: WebP for both versions, whatever came in.** PNG emblems keep their transparency (JPEG would flatten it), and a photographic portrait is a fraction of its PNG size. One output format also means one content type per row and one code path. Every browser the app supports displays WebP.
4. **Storage.** ADR-0008's `MapImageStore` becomes `ImageStore`, with `FilesystemImageStore` taking its directory explicitly. Maps keep their instance at `UPLOAD_DIR` (behaviour unchanged); record images get their own at `UPLOAD_DIR/records/`. The map route serves bare filenames from `UPLOAD_DIR` only, so it cannot reach a record image, and vice versa. `storeRecordImage` writes both files all-or-nothing: if the thumbnail write fails, the display file is deleted again.
5. **Access.** `POST /api/record-images` (upload) and `GET /api/record-images/[key]` (read) each call `requireApiSession()` first. Upload is a route handler, not a Server Action, because of the 1 MB default body cap — the same reason map uploads use `/api/maps/upload`. The read route addresses files by storage key, so it needs no database; a key names immutable bytes (a replacement is stored under new keys), so responses carry `Cache-Control: private, max-age=31536000, immutable` — cached by the browser, never by a shared cache that would serve it without a session — and `X-Content-Type-Options: nosniff`.

> **ADR-0008's warning about player accounts applies here unchanged.** "Authenticated" still means "the DM" only because the DM is the only account. A logged-in player would satisfy `requireApiSession()` and could fetch any record image by key — including the portrait of an NPC the party has not met. The visibility spec must list `/api/record-images/[key]` among its read paths, beside the map route, and the guard must become an authorisation check on the owning record, not a session check. Keys are random UUIDs, which makes them hard to guess but is not access control.

## Alternatives considered

### A polymorphic owner on the image (`ownerType` + `ownerId` on `recordImage`)

One table, no column added to seven owners, and "every image of every record" is one query. It is the shape ADR-0009 chose for the world tree. Rejected because here it gives up the database's help for no matching gain: `ownerId` cannot be a foreign key to seven tables, so nothing stops an image pointing at a deleted NPC or at an id of the wrong type, and deleting a record would need application code (or a trigger per owner) to clean up rows the database would otherwise refuse or null. ADR-0009's case was different — every node of the tree _is_ the same kind of thing, with one parent edge. Here the owners are unrelated tables that each happen to want one image, and the query the polymorphic shape makes easy ("all images") is one nobody has asked for. `imageId @unique` gives real referential integrity, one image per record enforced by the schema, and a plain `include: { image: true }` on the reads SPEC-020 T4 needs.

### A join table per owner, or a many-to-many

Right for galleries; SPEC-020 §3 rules galleries out (one image per record). Revisit with galleries.

### Storing the image keys directly on each owner (`imageDisplayKey`, `imageThumbKey`, … × 7 tables)

No new table, but five columns repeated on seven tables, and the width/height/MIME type duplicated with them. A separate row keeps the image's facts in one place and lets T3's field treat an image as one value.

### Resize with the browser, or with `next/image`

Client-side resizing trusts the client to strip EXIF, which is the one thing the server must guarantee. `next/image`'s optimiser resizes on request and caches the result, but it serves from public URLs or configured remote patterns, and its cache would hold copies of images outside the authenticated route. Neither strips at upload time, so the original with its GPS tags would still be stored.

### Another image library (`jimp`, ImageMagick via a child process)

`jimp` is pure JavaScript — no native binary — but it is much slower, handles WebP poorly, and would be a second image stack beside the `sharp` Next already installs. Shelling out to ImageMagick needs a system binary the app does not otherwise require and a larger attack surface on untrusted input. `sharp` is already in the lockfile through Next, has prebuilt binaries for macOS and Linux, and is the library Next itself uses.

### Keeping the uploaded format instead of converting to WebP

Saves one re-encode choice, but a JPEG upload would still have to be re-encoded to strip metadata and resize, so the format is being chosen either way. Keeping it would mean three content types and three extensions per version, and PNG portraits several times larger than needed.

### Keeping the original

Would allow re-deriving sizes later. Rejected by the spec (§5.2): it doubles storage, and it is the one copy that carries the EXIF the pipeline exists to remove.

## Consequences

**Positive**

- Real foreign keys: a record cannot point at a missing image, and a deleted image nulls its owner's reference.
- The stored files cannot leak location or camera metadata; the test suite checks it on generated JPEGs carrying GPS tags.
- Maps and record images share one store implementation and one access rule; swapping the backend (ADR-0008's alternatives) still replaces one class.
- Upload, processing and storage have no database dependency, so T2 only adds the row and T3 only wires the field.

**Negative**

- `sharp` is a native dependency. It installs prebuilt binaries per platform (`pnpm.onlyBuiltDependencies` already lists it for Next), so a new platform — an Alpine container, say — needs the matching binary. Pinned exactly (`0.35.4`, the version Next already resolved) so a `pnpm update` cannot move it silently; bump it deliberately.
- Seven owner tables each gain a column and a relation, and every new image-bearing domain must add its own.
- Processing runs in the request: a 10 MB, 64 MP upload takes a noticeable fraction of a second of CPU. Irrelevant for one DM uploading one image at a time.
- WebP re-encoding is lossy (quality 82). A DM who wants a pixel-exact emblem gets a near-exact one.
- Still two things to back up (ADR-0008): the database and `UPLOAD_DIR`, now including `records/`.

**Neutral / follow-up work**

- SPEC-020 T2 adds `recordImage` and the seven `imageId` columns, and has the upload create the row from `StoredRecordImage` (deleting both files if the insert fails).
- SPEC-020 T3 deletes the files when an image is replaced or its record deleted — "new files stored, then the old ones deleted" (§5). Until then an uploaded but unused image is an orphan on disk.
- `UPLOAD_DIR`'s default is `~/.campaign-settings/storage/maps`, so record images default to `…/storage/maps/records`. The name is historical; renaming the default would move existing maps, which is not worth doing for a label.

## Revisit when

Any one of: player accounts ship (the access rule must become per-record authorisation — see the warning above); galleries are specified (the one-to-one reference becomes a join); images move to object storage (ADR-0008's revisit conditions); or `sharp` stops shipping a binary for a platform the app must run on.
