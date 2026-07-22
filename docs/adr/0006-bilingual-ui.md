# ADR-0006: Bilingual UI (Italian + English), single-language content

- **Status:** Accepted
- **Date:** 2026-07-22
- **Deciders:** Turu
- **Related:** [TD-21](../TECH_DEBT.md), [TD-19](../TECH_DEBT.md), [ADR-0003](./0003-metadata-driven-domain-configuration.md), [ADR-0005](./0005-english-identifiers.md)

## Context

The product ships in Italian and English. No further locales are planned.

This is a change from the earlier assumption that Italian was the only user-facing language, and it makes i18n a feature that ships rather than groundwork that keeps an option open. That difference matters, because a bilingual product forces a decision the monolingual version could defer: **what exactly gets translated.**

Text in this app falls into three categories, not two:

| # | Category | Example | Lives in |
|---|---|---|---|
| 1 | UI chrome | "Salva", "Nessun risultato", "Inserisci il nome" | Components |
| 2 | SRD domain labels | `rarita: "Raro"`, `allineamento: "Caotico Neutrale"`, `circolo: "Evocazione"` | `PageMeta.label`, options arrays in `app/lib/config/**` |
| 3 | Campaign content | Spell names, descriptions, NPC biographies, secrets | **Postgres** |

Categories 1 and 2 are copy: finite, authored by the developer, and translatable once. Category 3 is user data. No i18n library touches it; making it bilingual is a schema question — translation columns or a `translations` table, dual inputs on every form, and fallback behaviour when one language is missing.

Category 2 is the interesting one and is easy to overlook. Roughly 150 SRD terms — rarities, alignments, schools of magic, casting times, patron ranks — already have canonical translations in the official rulebooks. They currently sit in `PageMeta.label` and in the options arrays, which makes them structurally UI copy even though they read as domain data. They are also where most of the perceived "is this app in English?" signal lives: an English UI wrapping a dropdown that still reads *Caotico Neutrale* is not a bilingual app.

## Decision

**Translate categories 1 and 2. Do not translate category 3.**

- UI chrome and SRD domain labels move to message catalogues: `messages/it.json` and `messages/en.json`.
- Campaign content stays in whatever language the DM wrote it. No schema change, no dual inputs.
- Library: **`next-intl`**.
- Routing: `localePrefix: "as-needed"` — Italian is the default and keeps unprefixed URLs (`/dashboard/spells`); English is served under `/en/dashboard/spells`.
- Shipped in Phase 2, in the same pass as TD-19.

An English-speaking reader therefore navigates an English application containing an Italian campaign world — which is how any setting wiki works, and is not experienced as a defect.

## Alternatives considered

### Translate campaign content too

Every text field becomes translatable via `name_it` / `name_en` columns or a `translations` table, with dual inputs on every form and fallback when a language is missing.

Rejected on data-entry cost, which is the decisive factor rather than implementation cost. A DM writing a homebrew world writes it once, in one language. Asking them to fill every field twice guarantees that the second language is left empty, which means the fallback path becomes the normal path — and you have paid for a schema, a UI and a fallback mechanism to arrive back where you started. It also roughly doubles the size of every form, in an app whose NPC form already has twelve fields.

Worth revisiting only if the app ever gains an audience that shares settings across language communities.

### Translate entity names but not descriptions

The middle option, and genuinely tempting for SRD spells: *Palla di Fuoco* and *Fireball* are the same spell, and a bilingual name field would let either name find it.

Rejected because it draws the line in the wrong place. The value is real only for official SRD content, which is a minority of what this app stores — the point of the tool is homebrew, and homebrew names have no official translation. It would add a translation column used meaningfully by a fraction of rows, while leaving the descriptions beside them monolingual. Inconsistent in the UI, and awkward to explain.

The underlying need — finding a spell by its English name — is better served later by an optional `searchAliases` string array, which costs one nullable column and no form redesign.

### A hand-rolled message catalogue instead of `next-intl`

For a single-locale app this is a defensible way to avoid a dependency, and it was the recommendation while Italian was the only language.

Rejected now that there are two. A second locale brings routing, locale detection, persistence of the user's choice, `Intl` number and date formatting, and pluralisation — all of which are load-bearing and all of which are where hand-rolled solutions accumulate bugs. `next-intl` is App Router-native, works in Server Components without prop-drilling a locale, and provides typed message keys so a missing translation is a compile error rather than a `[object Object]` in production.

### `localePrefix: "always"` (`/it/...` and `/en/...`)

More symmetric, and arguably clearer.

Rejected because it changes every existing URL for the default-language user, for symmetry's sake. `as-needed` keeps Italian URLs stable and still gives English a clean, shareable, unambiguous prefix.

## Consequences

**Positive**

- The project becomes readable to an international reviewer — the portfolio audience, and a direct benefit rather than an incidental one.
- Category 2 translation makes the app genuinely bilingual rather than superficially so.
- No schema change, no migration, no data risk.
- `next-intl`'s typed keys mean a missing translation fails the build.
- The extraction work overlaps almost entirely with TD-19's file coverage, so doing them together is close to free.

**Negative**

- **`PageMeta` changes shape.** `label: "Livello"` becomes a message key (`labelKey: "spells.level.label"`), which touches every entry in `app/lib/config/**` and every consumer that reads `label`. This makes TD-21 dependent on TD-08 — do not attempt it while `PageMeta` is still loosely typed.
- Two catalogues to keep in sync. Mitigated by typed keys, and by a CI check that the two files have identical key sets.
- Mixed-language experience for English users viewing an Italian campaign. Accepted deliberately; see above.
- `next-intl` is a dependency in a project that has been deliberately keeping them few.

**Neutral / follow-up**

- The `getDatum` functions in `PageMeta` return display labels via `getDataLabel(options, value)`. The options arrays carry the Italian strings today and must become key-based in the same change.
- Locale choice needs persisting — cookie, per `next-intl`'s default.
- A future `searchAliases` field would let English spell names find Italian records without any of the translation-column machinery. Logged in `ROADMAP.md`, not scheduled.

## Revisit when

A third locale is requested — the catalogue structure supports it, but the SRD label set would need sourcing from that language's rulebook, which is the real cost. Or if campaign content sharing across languages becomes a goal, which reopens the category-3 decision.
