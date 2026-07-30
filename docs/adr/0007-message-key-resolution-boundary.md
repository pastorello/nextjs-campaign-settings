# ADR-0007: Resolve message keys at the render boundary, not inside the metadata layer

- **Status:** Accepted
- **Date:** 2026-07-30
- **Deciders:** Turu
- **Related:** [ADR-0006](./0006-bilingual-ui.md), [ADR-0003](./0003-metadata-driven-domain-configuration.md), [TD-21](../TECH_DEBT.md), [TD-08](../TECH_DEBT.md), [TD-31](../TECH_DEBT.md)

## Context

[ADR-0006](./0006-bilingual-ui.md) decided the app ships in Italian and English, with UI chrome and SRD domain labels moving to `messages/it.json` and `messages/en.json`. It named the consequence but not the mechanism: `label: "Livello"` becomes a message key, "which touches every entry in `app/lib/config/**` and every consumer that reads `label`."

That mechanism is the decision this ADR makes, because the obvious version of it does not work.

**What the metadata layer looks like today.** Each field declares `label`, optionally `placeholder`, optionally `options: SelectOption[]`, and a `getDatum(value)` that turns a stored value into display text. Option-backed fields implement `getDatum` by calling `getDataLabel(options, value)`, which filters the options list and joins the matching `label`s.

**Measured, not estimated** (counted 2026-07-30 against `app/lib/config/**`):

- **39** `getDatum` declarations. **22** of them are exactly `(datum) => getDataLabel(someOptions, datum)`, where `someOptions` is the same array already declared as that field's `options`. The remaining 17 split between `renderRichText`, identity passthrough, and boolean formatting.
- **7** sites read `SelectOption.label` (`Select/index.tsx` ×3, `SelectButtonery.tsx` ×2, `sortSelectOptions.ts`, `getDataLabel.ts`).
- **4** sites read `PageMeta.label` (`InputComponent.tsx`, `EntityList.tsx` ×2, `FormErrorSummary.tsx`).

**Three constraints rule out the intuitive answer.** The intuitive answer — have `getDatum` return a small React component that translates its key at render time — fails on all three:

1. **Sorting happens before render.** [`sortSelectOptions.ts`](../../app/lib/utils/data/sortSelectOptions.ts) orders options with `a.label.localeCompare(b.label)`. A translation key sorts by the key, which is meaningless, and correct alphabetical order genuinely differs between locales. Resolution must precede the sort.
2. **Some labels are string attributes, not nodes.** `InputComponent`'s `placeholder` prop and the text content of `<option>` elements need a `string`. A `ReactNode` cannot fill either.
3. **Both Server and Client Components consume this.** `next-intl` exposes `useTranslations` (client) and `await getTranslations` (server). A plain function that accepts a `t` works under both; a component works only inside a render tree.

**A latent hazard this touches.** `getDataLabel`'s third parameter is `customLabel?: string`, used as `getDataLabel(levels, datum, useShortLabel ? "shortLabel" : "label")` — a string-keyed property lookup guarded by `isKeyOfItem`. Renaming the property silently turns the guard false and falls through to `undefined` with no type error. This is the failure mode `CLAUDE.md` warns about, and it is live in the code today.

## Decision

**Split the authored shape from the render-ready shape, and bridge them with one pure function.**

```ts
// Authored, in app/lib/config/** — no framework import, no i18n dependency
interface SelectOption<TValue> { labelKey: string; shortLabelKey?: string; value: TValue }

// Render-ready
interface ResolvedOption<TValue> { label: string; shortLabel?: string; value: TValue }

// The only bridge. Pure, so it works under useTranslations and getTranslations alike.
resolveOptions(options: SelectOption[], t): ResolvedOption[]
```

Consequences of that split, all of them mechanical once the types exist:

- `sortSelectOptions` and `getDataLabel` keep their present logic unchanged, but accept **only** `ResolvedOption[]`. Every site that forgot to resolve becomes a type error rather than an `undefined` at runtime.
- `getDataLabel`'s string-keyed `customLabel?: string` becomes a typed `useShort?: boolean`, closing the hazard above.
- **The 22 redundant `getDatum` closures are deleted.** They restate an invariant the metadata already carries: a field with `options` displays by looking its value up in those options. One generic function applies that rule; `getDatum` survives only where a field genuinely formats (rich text, booleans).
- **Every option list keeps a single `labelKey`,** with no exceptions and no second shape. The setting's own lists — `tarotCards`, `factions`, `locationList` — **are translated** like any other option list (decided 2026-07-30): their names are descriptive rather than invented proper nouns, so they have real English renderings and are not a category-3 exception under [ADR-0006](./0006-bilingual-ui.md). Confirm `celestialBodies` the same way when extraction reaches it; it was not covered by that decision.

## Alternatives considered

### Thread a translator through the metadata layer

Give `getDatum` and `getDataLabel` a `t` parameter, so they keep returning finished text.

Fair case for it: `getDatum`'s name stays honest — value in, display text out — and each consumer changes at exactly one call site. It is the smaller conceptual leap.

Rejected because it inverts the dependency that makes the metadata layer worth having. `app/lib/config/**` is declarative data: field names, types, validators, option values. Threading `t` makes 22 closures — closures that carry no information in the first place — depend on `next-intl`'s types, and makes the config files untestable without a translation context. ADR-0003 justifies the metadata layer as a single declarative source; a translator parameter in every declaration is the opposite of declarative. The split above achieves the same result while _removing_ those 22 closures rather than complicating them.

### A resolver component returned from `getDatum`

Have option-backed `getDatum` return `<OptionLabel optionKey={…} />`, which calls `useTranslations` itself.

This was the direction recorded in TD-21's handoff note and it is wrong. It fails on all three constraints in the Context above: it cannot sort (resolution happens too late), it cannot fill a `placeholder` attribute (a node is not a string), and it does not work in Server Components without a client boundary at every label. Recorded here rather than silently dropped, because it looks reasonable until you check what the consumers actually do with the value.

### Keep one type and mutate it in place

Leave `SelectOption.label`, and have the resolution step overwrite each `label` with translated text before render.

Rejected on the strength of [TD-31](../TECH_DEBT.md), which was this bug: `sortSelectOptions` mutated the shared `PageMeta.options` array in place, corrupting every other consumer for the life of the server process and producing a hydration mismatch. In-place resolution repeats that mistake with worse consequences — a request in one locale would poison the options array for the next request in the other. Two types make it impossible to express.

### A union: `{ labelKey }` for translated options, `{ label }` for setting proper nouns

Model the "do not translate the DM's world" boundary in the type system, so a faction name is structurally distinct from an SRD rarity.

Genuinely tempting when it looked as though the setting's own lists would stay untranslated. Rejected twice over. First on flexibility: with a union, deciding later that a faction _should_ be translated is a code change in a config file plus a shape change, where a uniform `labelKey` makes it a catalogue edit with no code movement. Then on fact — the setting lists turned out to be translatable (see Decision), so the boundary this union exists to model does not run through the option lists at all. It would have encoded a distinction that is not there.

## Consequences

**Positive**

- The metadata layer stays framework-free declarative data, which is the property ADR-0003 justifies it on.
- Forgetting to resolve is a compile error. This matters more than usual here: `CLAUDE.md` records that the metadata layer's string-keyed corners are exactly where TD-19's near-misses lived, and this change converts one of them (`customLabel`) into a typed parameter.
- Net **less** code. 22 of 39 `getDatum` declarations disappear; nothing is added to replace them.
- Locale-correct sorting becomes possible for the first time — `localeCompare` can take the active locale, which the current key-free code could not have done.
- One shape for every option list. No per-list exception to remember, and no second code path.

**Negative**

- Two shapes to keep straight when reading the code, and a resolution step that authors must remember exists. Mitigated by the compiler: the wrong one does not type-check.
- The setting's own lists now need real English renderings written for them, which is authoring work `ADR-0006` did not anticipate. It is bounded — three lists — and unlike SRD terms there is no rulebook to check against, so the DM's judgement is the only source.
- `resolveOptions` runs per render for each option-backed field. Not measured, and not worth measuring before there is a complaint — the largest option list in the app is ~20 entries.

**Neutral / follow-up work**

- The `shortLabelKey` field exists solely for spell levels (`0°`, `1°`…). If a second field ever needs it, revisit whether it belongs on the option or on the field.
- Campaign content in Postgres is untouched by all of this — ADR-0006's category-3 boundary is unchanged. What moved is only where the _config_ lists fall, and they fall on the translated side.

## Revisit when

`resolveOptions` shows up in a profile. It runs per render per option-backed field, which is fine at the current scale (largest list ~20 entries) and would be the first thing to memoise if a list ever grew by an order of magnitude.

Or if a future option list genuinely cannot be translated — an invented proper noun with no English rendering, unlike the three settled above. One such list is a catalogue entry repeated across locales; several would reopen the union alternative.
