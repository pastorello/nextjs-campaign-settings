# ADR-0008: Store map images on a local filesystem volume, served through an authenticated route

- **Status:** Proposed
- **Date:** 2026-08-06
- **Deciders:** the maintainer (DM), with Claude Code
- **Related:** [SPEC-004](../specs/004-world-model.md) §9 question 1 (this ADR unblocks it), TD-36 (why `.jpg` bypasses the auth gate today), TD-01 (`requireApiSession` on route handlers), [ADR-0004](./0004-server-actions-over-rest-api.md)

## Context

[SPEC-004](../specs/004-world-model.md) turns this app into a tool for building worlds, where the DM uploads a map for every navigable place. Today four maps are committed to `public/maps/` and listed in a source file; the DM has roughly sixty more in Inkarnate. Uploaded images therefore need somewhere to live.

**Two questions get conflated here, and separating them is most of the decision.**

1. _Where do the bytes live?_ — object storage, a rented host, the local filesystem.
2. _Who is allowed to read them?_ — anyone with the URL, or only an authenticated session.

The DM's stated concern is entirely the second: publishing maps where players can reach them would reveal secret locations. That rules out a public Inkarnate gallery and a plain public URL, but it says nothing about where the file is stored.

**The current setup already fails that test, quietly.** `proxy.ts`'s matcher is

```
"/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg)$).*)"
```

which excludes every `.png`/`.jpg`/`.jpeg` from the auth and i18n gate — TD-36 made it so, because the gate was blocking Leaflet's tile requests. Combined with the files sitting in `public/`, **the four existing maps are served to anyone who knows the URL, with no session.** They are unlinked, not protected. Anything left in `public/` is public by definition; Next.js serves it statically and the proxy is configured not to see it.

Other constraints that matter:

- The app is **self-hosted, single-DM**. `docker-compose.yml` runs Postgres and Adminer; the Next.js app itself is **not containerised** — there is no Dockerfile, and `pnpm dev` runs on the host.
- Cost is a real constraint. Paid object storage for one DM's sixty images is not proportionate.
- Volume is small: ~60 images, a few MB each — a few hundred MB total, growing slowly.
- The project is in a hardening phase where `CLAUDE.md` asks to prefer deleting over adding. A new always-on service needs to earn its place.

## Decision

**We will store uploaded map images on the local filesystem, at a path given by an `UPLOAD_DIR` environment variable, and serve them through an authenticated route handler rather than from `public/`.**

Three parts:

1. **Storage.** Files land under `UPLOAD_DIR` (dev: a gitignored `./storage/maps`; production: the same path backed by a named Docker volume once the app is containerised). Because the path comes from the environment, dev and production run the same code.
2. **Access.** A route handler at `app/api/maps/[id]/image/route.ts` calls `requireApiSession()` — the guard TD-01 established for every route handler — then streams the file. No unauthenticated path to a map exists. The existing four maps move out of `public/maps/` in the same change, which closes the current exposure.
3. **An interface, not a hard-coded `fs` call.** A small `MapImageStore` (`put`, `get`, `delete`) with a filesystem implementation. Swapping to S3, MinIO or a rented host later replaces one file and an env var, not the call sites.

Leaflet needs no changes: `imageOverlay` fetches the image with an ordinary same-origin `<img>` request, so the session cookie is sent automatically.

## Alternatives considered

### Object storage (AWS S3, Cloudflare R2, Backblaze B2)

The industry default, and genuinely better at this job: durability, offsite by construction, presigned URLs, no disk to fill. R2 and B2 both have free tiers that would comfortably hold sixty images, so "not free" is not quite right — but a cloud account is still an external dependency, a set of credentials to manage, and a bill that can start existing later. For a self-hosted single-user tool it buys durability the DM can get from a directory backup, and presigned URLs are actively the wrong tool here: the whole point is that no URL should work without a session.

Worth revisiting the moment images stop being small and few, or the app runs somewhere without persistent disk.

### MinIO in `docker-compose.yml`

Self-hosted, S3-compatible, free. Attractive because it makes an eventual move to real S3 a config change. Rejected for now because the `MapImageStore` interface already gives that portability at a fraction of the cost, and MinIO is a second stateful service to run, secure, and back up alongside Postgres — for sixty files. It is the natural upgrade if the filesystem ever becomes limiting, and this decision is deliberately shaped to make that swap cheap.

### A rented host (the DM's Aruba domain), uploading by hand and storing the URL

The lowest-effort option, and it needs no upload feature at all — the model would just hold a URL string. Rejected on two grounds. First, it fails the secrecy requirement: a URL on a public web host is readable by anyone who has it, which is what the DM explicitly does not want for secret locations. Second, manual upload does not survive contact with the use case — SPEC-004's flow has the DM creating a place and giving it a map in the same gesture, which cannot mean "alt-tab to an FTP client". It remains viable as a **storage backend** behind the same interface if it ever gains authenticated access, but not as the access model.

### Making the maps public on Inkarnate

Rejected by the DM: players would discover secret locations. Recorded here so it is not re-proposed.

### Storing images in Postgres as `bytea`

Backups and transactions come free, and the DB is already the thing being backed up. Rejected because multi-megabyte binaries in row storage bloat the database, slow logical dumps, and push image bytes through the connection pool for every read. The gain — one thing to back up instead of two — is real but does not pay for that.

## Consequences

**Positive**

- No new service, no account, no bill. `docker-compose up` still starts exactly what it starts today.
- **Closes the current unauthenticated exposure of the four existing maps** — a real fix, not just a policy for future ones.
- Backup and restore of images is copying a directory.
- The storage interface keeps every alternative above one file away.
- Works offline, which suits a tool used at a table with unreliable wifi.

**Negative**

- **Two things to back up instead of one**: the Postgres volume and the image directory. A DM who backs up only the database gets a world of broken images. This must be said plainly in the README.
- Images are served by Node rather than by a static file server, which is slower. Irrelevant at this scale — one image per map view, one user — but it is a real ceiling if the app ever serves players directly.
- Local disk has no redundancy. A dead disk loses the maps unless the DM has copied the directory somewhere.
- An upload endpoint is a new attack surface: it needs a size limit, a content-type allowlist, and filenames generated by the app rather than taken from the client.

**Neutral / follow-up work**

- The app is not containerised yet (no Dockerfile). Until it is, `UPLOAD_DIR` is a host directory and the "Docker volume" half of this decision is a plan, not a running configuration. Containerising the app is separate work, not blocked by this.
- `proxy.ts`'s `.png|.jpg|.jpeg` matcher exclusion stays — it is still needed for genuine static assets — but it stops applying to maps once they leave `public/`. Worth a comment there explaining why the exclusion no longer implies "maps are public".
- `.env.example` gains `UPLOAD_DIR`; `.gitignore` gains the dev storage directory.
- Deleting a place should delete its image. Orphaned files otherwise accumulate silently.

## Revisit when

Any one of: the app is deployed somewhere with ephemeral disk (a PaaS container, a serverless target); total image size passes a few GB or upload traffic becomes non-trivial; a player-facing read-only view is built, which turns image serving into a public-facing concern with real load and a genuine need for a CDN; or a second person needs to author the same world from another machine, which makes a shared object store simpler than a shared disk.
