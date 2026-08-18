# SPEC-012: Publishing this app on a public domain

- **Status:** Draft — the audit in §5 is verified against the repo; every choice in §9 needs the DM's agreement before anything is bought
- **Date:** 2026-08-18
- **Phase:** 4
- **Related:** [ADR-0008](../adr/0008-map-image-storage.md) (map image storage — its access rule is one of the findings), the accounts/roles/visibility block in [`ROADMAP.md`](../ROADMAP.md), [`PROJECT_STATE.md`](../PROJECT_STATE.md) §5

---

## 1. Problem

The app runs on the DM's own machine. The DM wants it on a domain of their own —
`campaignsettings.com` or similar — reachable from anywhere, at a cost
proportionate to a portfolio project with no paying users.

**Everything about the current setup assumes a trusted single user on a trusted
network**, and that assumption is not written down anywhere as an assumption — it
is simply how each piece was built. Publishing does not "add security concerns"
so much as **remove the thing that was quietly doing the security work**: nobody
else could reach the app. §5 is the inventory of what that removal exposes.

The DM has said plainly they are not a backend, sysadmin or security specialist,
and asked for the audit and the plan rather than a recommendation to trust. This
spec is written to be read by someone who will make the decisions but not the
configuration.

## 2. Goal

**One instance, on the DM's own domain, safe to leave running unattended.**

Three properties, in priority order:

1. **Nothing reachable that should not be.** The app on 443, and nothing else.
2. **Nothing lost.** Uploaded maps and the campaign database survive a deploy, a
   disk failure and a mistake — years of the DM's writing.
3. **Cheap.** Target under €10/month all-in, plus the domain.

## 3. Non-goals

- **Multi-tenancy and subscriptions.** The DM raised hosting ~10 DMs with their
  own campaigns, and charging for it. **Not built here, and not designed here** —
  it is a data-model change (per-campaign ownership on every table and every
  query) far larger than this spec. What this spec owes it is only that the
  choices below do not make it harder later; §9 flags the two that could.
- **Billing, invoicing, VAT registration.** The DM mentioned opening a _partita
  IVA_ if paying users appear. That is a business and tax decision requiring an
  accountant, and nothing in this repository should be read as advice on it.
- **A CI/CD pipeline.** Out of scope; deploying by hand is fine at this size and
  a pipeline built before the first manual deploy encodes guesses.
- **Rewriting the app for the cloud.** §9's recommended path is chosen partly
  because it needs **no application code change at all** for storage.

## 4. User stories

- _As the DM_, I open `campaignsettings.com` from a friend's house and my
  campaign is there.
- _As the DM_, I want to know that a stranger who finds the URL cannot read my
  secret locations, create accounts, or reach my database.
- _As the DM_, I want to be able to restore everything if the server dies.

## 5. Behaviour — the audit

**Ten findings, each verified against this repository on 2026-08-18** (file and
line given so every one can be re-checked). Severity is stated _as of the day the
app becomes publicly reachable_ — most are harmless today.

### Blocking — do not expose the app until these are done

| #      | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **F1** | **`docker-compose.yaml` publishes Postgres to every interface** — `ports: "${POSTGRES_PORT}:${POSTGRES_PORT}"` binds `0.0.0.0` by default. Deployed as written, **the database is directly reachable from the internet**, protected only by its password. Postgres is scanned for constantly. The app talks to it over the compose network and does not need the port published at all.                                                 |
| **F2** | **Adminer is published on `:8080`** — a full database administration console, on the internet, in front of the campaign. Its only gate is the same Postgres password. It is a development convenience and must not exist on a public host.                                                                                                                                                                                              |
| **F3** | **Every logged-in user can edit everything.** `authConfig.authorized` returns `!!auth?.user`, and that is the whole model (`auth.config.ts`; `PROJECT_STATE.md` §5 says the same). Authentication exists; **authorisation does not.** Harmless while the DM is the only account — and the accounts work already planned creates the second account. This is the roles item in `ROADMAP.md`, and publishing makes it a prerequisite.     |
| **F4** | **Map images are gated on a session, not on a role** ([ADR-0008](../adr/0008-map-image-storage.md), `app/api/maps/[id]/image/route.ts`). The ADR's stated purpose is keeping secret maps from players. Once players have accounts, **every player can fetch every map by URL** — the check passes. Already annotated in the ADR; repeated here because it is the one finding that silently defeats a protection the DM believes exists. |
| **F5** | **No rate limiting anywhere.** Not on login (credential stuffing against a Credentials provider), not on the sign-up form the DM asked for (their own worry — "mi potrebbero creare 10000 account"), not on upload. Nothing in the app counts attempts, and there is no reverse proxy in front to do it.                                                                                                                                |

### Important — before the app carries anything the DM would miss

| #      | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **F6** | **No backups exist.** The compose volume is the only copy of the campaign, and the uploaded maps are a directory on the same disk. A VPS disk failure ends the project. **An untested backup is not a backup** — the restore has to be performed once, deliberately.                                                                                                                                                                                                                                                  |
| **F7** | **No security headers.** `next.config.ts` is four lines (`reactStrictMode` only): no HSTS, no CSP, no `X-Content-Type-Options`, no frame-ancestors policy. Individually minor, collectively the difference between "a browser helps you" and "a browser helps an attacker".                                                                                                                                                                                                                                           |
| **F8** | **Uploads trust the client's declared content type.** `app/api/maps/upload/route.ts` checks `file.type` against an allowlist and the size against 10 MB, but **never inspects the bytes**, and the serving route returns them with no `X-Content-Type-Options: nosniff`. A file whose content is not an image can be stored as `image/png` and served from the app's own origin. The upload rules' 10 MB cap is justified in a comment "at this app's single-DM scale" — a justification that expires on publication. |

### Worth doing, low urgency

| #       | Finding                                                                                                                                                                                                                                                                                      |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **F9**  | **`postgres:latest` is unpinned** in compose. A rebuild can silently move major version and refuse to start on the old data directory. Pin it, and note that the volume mounts `/var/lib/postgresql` rather than the conventional `/data` subdirectory — check that before any version move. |
| **F10** | **Nobody reads the logs.** `logServerIssue` writes to the server console, which on a VPS goes nowhere anyone looks. Deployed, an error is only an error if someone finds out.                                                                                                                |

**What the audit did _not_ find, and that is worth stating.** Every mutation
already checks a session and validates with Zod (TD-01/TD-02); passwords are
bcrypt-hashed; stored rich text is sanitised (TD-76); `.env` is gitignored and
`.env.test` is separated from it (TD-65); dependencies are watched by Dependabot.
**The application layer is in better shape than the infrastructure around it.**
Nothing in §9 is a rewrite.

## 6. Data model changes

**None.** Roles, party accounts and per-entity visibility each carry their own
model changes and belong to their own specs — see `ROADMAP.md`. This spec is
infrastructure plus configuration, and deliberately does not smuggle in a schema
change.

## 7. Metadata changes

None.

## 8. Acceptance criteria

- [ ] The app answers on `https://<the DM's domain>` with a valid certificate that
      renews without anyone remembering to renew it.
- [ ] A port scan of the host shows 443 (and whatever SSH policy the DM chooses).
      **Postgres and Adminer are not reachable from the internet.**
- [ ] A deploy leaves previously uploaded maps in place, verified by uploading a
      map, deploying, and reloading it.
- [ ] A database backup runs automatically, is copied off the host, and **has been
      restored once into a scratch database** — the restore is the criterion, not
      the backup.
- [ ] Login and sign-up are rate-limited, and sign-up requires passing a human
      check before it creates anything.
- [ ] Security headers are present (HSTS, `nosniff`, frame-ancestors, a CSP the
      app actually runs under).
- [ ] `pnpm test`, `pnpm test:e2e`, `pnpm typecheck`, `pnpm lint` all still pass —
      none of the above is allowed to be "fixed" by weakening a check.

## 9. Implementation plan

### The choice that determines everything else

**Recommended: one small VPS running the existing `docker-compose`, behind a
reverse proxy that terminates TLS.**

The reason is [ADR-0008](../adr/0008-map-image-storage.md). Uploaded maps live on
a filesystem path (`UPLOAD_DIR`). **On a platform with an ephemeral filesystem —
Vercel, and most PaaS free tiers — those files disappear at the next deploy,
silently, while the database keeps rows pointing at them.** A VPS has a real
disk, so ADR-0008 stays exactly as it is and **no application code changes**.

The alternative — a PaaS plus object storage — is not hard, and this codebase is
unusually ready for it: map storage sits behind a small interface
(`defaultMapImageStore`, with `FilesystemMapImageStore` as today's
implementation), so an S3-compatible store is a **drop-in second implementation**
rather than a refactor. It costs more per month and adds a moving part. Choose it
only if the DM wants managed infrastructure more than the saving.

**On AWS specifically** (the DM has used it at work): S3 is the reference
implementation of that interface and the knowledge transfers, but for this
workload its egress pricing is the wrong shape. **Cloudflare R2 speaks the same
S3 API with no egress fees**, so the same client library and the same mental
model apply at lower cost. This only matters if the object-storage path is
chosen at all — on the VPS path there is no object storage.

### Indicative monthly cost

| Item                                         | Cost                                     |
| -------------------------------------------- | ---------------------------------------- |
| Domain                                       | ~€10–15/year, any registrar              |
| Small VPS (2 vCPU / 4 GB, EU)                | ~€4–6/month                              |
| DNS + TLS + bot protection (Cloudflare free) | €0                                       |
| Off-host backup storage                      | ~€1/month at this size                   |
| **Total**                                    | **well under the DM's €10/month target** |

Prices are indicative and were not checked against a provider today — verify
before buying. **Do not prepay a year of anything until the first deploy works.**

### Order of work

**P0 — before the domain points at anything**

1. **A production compose file** that does not publish Postgres, and has no
   Adminer (F1, F2). Keep the current file for development; do not edit it into
   dual duty, or the development convenience will be one typo from production.
2. **A reverse proxy with automatic TLS** in front of the app (Caddy is the least
   configuration for this; nginx if the DM prefers it). This is also where rate
   limiting lands (F5) without application code.
3. **Roles and authorisation** (F3) and **the map route's authorisation check**
   (F4). These are the accounts block in `ROADMAP.md`, and this is the sequencing
   argument for doing them before publication rather than after.
4. **Security headers** (F7) — configuration in `next.config.ts`. CSP last and
   carefully: a CSP written from a checklist rather than from what the app loads
   will break Leaflet.

**P1 — before it holds anything the DM would miss**

5. **Backups with a rehearsed restore** (F6).
6. **Sign-up hardening** (F5): a human check plus rate limiting plus the DM's
   manual activation. **Cloudflare Turnstile is free and does not profile users**,
   which is the reason to prefer it to reCAPTCHA here. Note that manual activation
   alone does not solve the DM's stated worry — 10,000 pending rows is still
   10,000 rows, and still an email-address collection.
7. **Upload hardening** (F8): sniff the bytes, send `nosniff`, revisit the size
   cap now that its stated justification has expired.

**P2 — operability**

8. **Error visibility** (F10) and **the pinned image** (F9).

### Two decisions not to foreclose

- **Password reset needs transactional email**, which is a service and a domain
  configuration (SPF/DKIM), not a library. It is listed under the accounts block;
  flagged here because it is the one part of that work with an external
  dependency and a lead time.
- **Multi-tenancy**, if it ever happens, wants an ownership column on the domain
  tables from the start. Nothing in this spec should choose a host or a schema
  that makes that harder — but **do not add the column now**, on the strength of
  a maybe.

## 10. Task breakdown

| Task | Description                                                              | Depends on |
| ---- | ------------------------------------------------------------------------ | ---------- |
| T1   | Production compose: no published Postgres port, no Adminer, pinned image | —          |
| T2   | Reverse proxy, automatic TLS, rate limits on login/sign-up/upload        | T1         |
| T3   | Security headers in `next.config.ts`, CSP verified against the map pages | —          |
| T4   | Upload byte-sniffing, `nosniff` on the serving route, revisit the cap    | —          |
| T5   | Backup job, off-host copy, **and one rehearsed restore**                 | T1         |
| T6   | Human check + rate limit on sign-up                                      | T2, roles  |
| T7   | Error visibility and log retention                                       | T1         |

Roles, party accounts and per-entity visibility are **not** tasks here. They are
their own specs, and P0 step 3 above is a dependency on them, not a plan to do
them inside this one.

## 11. Outcome

_Not started._
