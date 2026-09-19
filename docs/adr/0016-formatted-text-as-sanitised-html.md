# ADR-0016: Formatted text as a sanitised HTML fragment, edited with Tiptap

- **Status:** Accepted
- **Date:** 2026-09-19
- **Deciders:** DM (maintainer), with Claude Code
- **Related:** [SPEC-019](../specs/019-formatted-text.md) · TD-76 · [SPEC-011](../specs/011-cross-entity-search.md) · [ADR-0003](./0003-metadata-driven-domain-configuration.md) · [ADR-0013](./0013-game-systems.md)

## Context

SPEC-019 turns every multi-line description into formatted text: bold, italic,
bulleted and numbered lists, two heading levels, and links to other records in
the app — nothing else (no web links, images, tables, colours). The DM chose a
toolbar editor over typed Markdown on 2026-09-19. Three things need deciding:
the **editor library**, the **stored format**, and the **sanitiser** that keeps
the stored value harmless.

Forces:

- **Every existing row is plain text** in a `text` column, rendered today by
  `renderRichText` as escaped text in a `whitespace-pre-wrap` div (TD-76). The
  spec forbids a migration: old rows must render exactly as now until edited.
- **The value is rendered in client components too.** `renderRichText` is a
  `PageMeta.getDatum`, and the `*Library` list components that call it are
  `"use client"`. Whatever runs at render time must run in the browser and
  during SSR, synchronously, with no database access.
- **Content reaches the database by more than one route**: the forms, but also
  `pnpm db:import` (a JSON file from disk) and hand edits in `psql`. TD-76
  existed because rendering trusted the stored string. The fix must not trust it
  again.
- **Record links must survive URL changes.** Pages live under
  `/[locale]/dashboard/[system]/…` (ADR-0013), and the destinations SPEC-011's
  results use (`/npc?query=<name>`, `/geography?place=<id>`) depend on the
  record's _current_ name. A stored URL would rot on every rename or route move.
- One maintainer, dependencies kept few, no deployment pipeline to absorb an
  unmaintained library.

## Decision

**We will store formatted text as a restricted HTML fragment in the existing
text columns, edited with Tiptap 3 (MIT) and cleaned by `sanitize-html` (MIT) on
every write and again on every render.**

### Stored format

- Allowed elements: `p`, `br`, `strong`, `em`, `ul`, `ol`, `li`, `h3`, `h4`,
  and `a` — no attributes on anything but `a`.
- A record link is an anchor carrying the record's domain and id, **never a
  URL**:

  ```html
  <a data-record-domain="npc" data-record-id="42">Mira</a>
  ```

  The domain vocabulary is SPEC-011's six searchable domains — `spells`,
  `magicItems`, `npc`, `deities`, `factions`, `places` — declared once as
  `RECORD_LINK_DOMAINS` (`app/lib/definitions/types/RecordLinkDomain.ts`).
  _(2026-09-19: SPEC-021 T7 added `dhDomains`, `dhDomainCards`, `dhClasses`
  and `dhSubclasses`, searched and resolved under `daggerheart` only.)_
  These strings are now **stored data**: renaming one breaks every link that
  uses it, so they change only with a data migration. The id is a positive
  integer that fits a Postgres `integer`. An anchor with an unknown domain, a
  malformed id, or no record attributes is **unwrapped** — its text stays, the
  link goes. `href` is never kept, so `javascript:` URLs and web links cannot be
  stored at all.

- **Plain text vs HTML** is told apart by the first tag: a value whose first
  non-blank characters open one of the block elements (`p`, `ul`, `ol`, `h3`,
  `h4`) is HTML; anything else is legacy plain text and renders exactly as
  today. The editor always emits a block element first, so every saved value
  is recognised. A legacy row that happens to begin with `<p>` is rendered as
  (sanitised) HTML — harmless, and most likely what its author meant, since the
  renderer before TD-76 treated it as HTML too.
- Empty formatted text is stored as empty/null, as an empty textarea is today
  (SPEC-019 §5 edge cases; the editor input normalises `<p></p>`, T3).

### Sanitiser

`sanitize-html` with an explicit allowlist (`app/lib/utils/richText/`):
everything not listed is dropped — `script`/`style` with their contents, other
elements unwrapped to their text, every attribute but the two record-link ones,
every event handler. `b`/`i` from pasted content map to `strong`/`em`. It runs:

1. **On write**, inside the field's Zod validator (SPEC-019 §7, T5) — so
   non-negotiable rule 2 is where sanitising happens.
2. **On render**, before the stored value is parsed. The sanitised string is
   then parsed with `htmlparser2` and turned into **React elements** through a
   second allowlist (a tag-to-element map); `dangerouslySetInnerHTML` is not
   used. Record links become a client `RecordLink` component that resolves the
   destination from the current locale and system.

### Record-link resolution

A link's destination and its "does the record still exist" check come from one
batched server read per page render (`fetchRecordLinkTargets`: one `findMany`
per linked domain, `id IN (…)`), handed to the client tree through a React
context. A link with no resolved target — deleted record, a catalogue not in the
current system, or no resolution provided — renders as its plain text.

### Editor (T3)

Tiptap 3 (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extensions`), all
MIT and open source: bold, italic, bullet/ordered lists, headings, link and
undo/redo are all in the free packages; the paid "Pro" extensions
(collaboration, comments, AI) are not needed. It supports React 17–19 as a peer
and renders client-side only (`immediatelyRender: false` under SSR). The editor
is configured with only the extensions above, so its own schema already drops
disallowed content on paste; the server-side sanitiser is still the boundary,
never the editor.

## Alternatives considered

### Lexical (Meta, MIT)

A capable editor framework, actively released (0.x). Not chosen: it is still
pre-1.0, its native format is a JSON editor state, and producing HTML on the
server needs `@lexical/html` with a DOM (jsdom) — so either we store JSON and
write a separate renderer for it, or we still need an HTML sanitiser. Its React
bindings need noticeably more assembly for the same toolbar. Tiptap gives the
same ProseMirror-class editing with HTML in and out and fewer moving parts.

### Markdown with a live preview

Store Markdown, render it with a Markdown library, sanitise its HTML output.
It would keep the columns human-readable and needs no editor library. **The DM
rejected it on 2026-09-19** in favour of a toolbar (SPEC-019 §3, decision 1): the
authoring experience was the point. Record links would also need a custom syntax
(`[Mira](record:npc/42)`), i.e. a Markdown extension we maintain.

### Tiptap's JSON document as the stored format

Lossless and structured, but unreadable in `psql`, useless to `contains` search
without extraction, and it ties the stored data to one editor's schema. The HTML
subset above is readable, editor-independent, and still a strict, checkable
shape.

### DOMPurify (via `isomorphic-dompurify`) instead of `sanitize-html`

DOMPurify is the reference browser sanitiser (MPL-2.0 or Apache-2.0) and is
excellent where a DOM exists. On the server it needs a DOM implementation —
`isomorphic-dompurify` pulls in `jsdom` as a **production** dependency, which is
heavy, slow to start, and has a history of bundling trouble in Next's server
runtime. Our sanitiser must run in a Server Action, in RSC, during SSR and in
the browser. `sanitize-html` is pure JavaScript on `htmlparser2`, works the same
in every one of those, is actively maintained (ApostropheCMS; last release
August 2026) and is configured by allowlist.

### A hand-written sanitiser over `htmlparser2`

Smaller, and the render-side walker already is an allowlist. Not chosen as the
_only_ line: a maintained sanitiser absorbs parser edge cases (malformed markup,
entity tricks, case games) we would otherwise rediscover one CVE at a time. The
walker stays as the second layer.

### Sanitise on write only

Cheaper at render. Rejected: TD-76 is exactly what happens when rendering
trusts what the database holds, and `db:import`/`psql` bypass every form.

## Consequences

**Positive**

- No schema change and no migration; plain-text rows keep working untouched.
- A stored value can only ever contain the ten allowed elements and the two
  record-link attributes, whoever wrote it.
- Links survive renames and route changes, and a deleted target degrades to
  text instead of a broken link.
- Nothing in the display path injects HTML into the DOM.

**Negative**

- Three runtime dependencies (`sanitize-html`, `htmlparser2`, and Tiptap in T3).
  `sanitize-html` ships to the browser with the list pages, because the
  renderer runs in client components; it depends on `postcss` for style
  parsing we never use. Measured cost is unknown until a production build is
  checked — acceptable for a self-hosted single-user app, and the reason for
  the second revisit condition below.
- `htmlparser2` is a direct dependency pinned to the major `sanitize-html`
  uses, so the two parse identically; they must be bumped together.
- The domain vocabulary in record links is persistent: renaming a search
  domain is now a data migration.
- Free-text search over these columns must ignore markup (SPEC-019 T6).

**Neutral / follow-up work**

- T3 adds `ControlType.RichText` and the Tiptap input; T5 switches the fields
  and mounts the record-link resolution on each page that renders them.
- `richTextToPlainText` exists for T6's search.

## Revisit when

1. The DM wants an element outside the allowlist (tables, images inside text,
   web links) — that is a spec change and an update to the allowlist here.
2. A production build shows the display-side bundle growth is a real cost —
   then move sanitising to the server read path and ship only the React walker.
3. Tiptap's free packages stop covering the toolbar, or its licence changes.
