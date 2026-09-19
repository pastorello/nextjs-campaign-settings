import { describe, expect, it } from "vitest";

import it_ from "./it.json";
import en from "./en.json";

/**
 * TD-21 step 7: a missing key in one catalogue silently falls back to
 * printing the dotted key itself (see MISSING_MESSAGE in next-intl) rather
 * than failing a build — the same "compiler won't catch what you miss"
 * hazard CLAUDE.md names for the metadata layer, just at the translation
 * boundary. This runs in the existing `test` CI job, no new workflow needed.
 */
function flattenKeys(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) {
    return [prefix];
  }

  return Object.entries(value).flatMap(([key, nested]) =>
    flattenKeys(nested, prefix ? `${prefix}.${key}` : key)
  );
}

/**
 * Collects `[key, value]` pairs for every string leaf whose dotted key path
 * has a `form` segment and ends in `Title` or `Button` — the shape TD-142
 * found inconsistently capitalised (`spells.form.createTitle`,
 * `deities.form.editButton`, ...).
 */
function flattenFormTitleButtonEntries(
  value: unknown,
  path: string[] = []
): [string, string][] {
  if (typeof value === "string") {
    const key = path.join(".");
    return /\.form\..*(Title|Button)$/.test(key) ? [[key, value]] : [];
  }
  if (typeof value !== "object" || value === null) return [];

  return Object.entries(value).flatMap(([key, nested]) =>
    flattenFormTitleButtonEntries(nested, [...path, key])
  );
}

// A capitalised word that isn't a run of ALL CAPS (an acronym like "PNG",
// which stays uppercase legitimately) — the Title Case pattern TD-142 flags.
const TITLE_CASE_WORD = /^[A-Z][a-zàèéìòù]/;

describe("message catalogues", () => {
  it("it.json and en.json declare the same set of keys", () => {
    const itKeys = new Set(flattenKeys(it_));
    const enKeys = new Set(flattenKeys(en));

    const missingFromEn = [...itKeys].filter((key) => !enKeys.has(key));
    const missingFromIt = [...enKeys].filter((key) => !itKeys.has(key));

    expect(
      missingFromEn,
      "keys present in it.json but missing from en.json"
    ).toEqual([]);
    expect(
      missingFromIt,
      "keys present in en.json but missing from it.json"
    ).toEqual([]);
  });

  /**
   * TD-142: `spells.form.*` and `deities.form.*` used Title Case
   * ("Crea nuovo Incantesimo") while every other domain's form copy used
   * sentence case ("Crea nuovo oggetto magico"). This keeps it that way —
   * the first word of a value is allowed to be capitalised (sentence-
   * initial), but no later word may be, unless it's an all-caps acronym
   * like "PNG".
   */
  it("it.json's form.*Title/*Button values use sentence case, not Title Case", () => {
    const entries = flattenFormTitleButtonEntries(it_);

    const offenders = entries.filter(([, value]) =>
      value
        .split(" ")
        .slice(1)
        .some((word) => TITLE_CASE_WORD.test(word))
    );

    expect(offenders).toEqual([]);
  });
});

/**
 * SPEC-019 T5: every form with a description now carries the formatted-text
 * toolbar, whose buttons are named by `common.richText`. A toolbar name that
 * contains a field label or a form button's name (or is contained in one)
 * makes that label ambiguous — Italian "Titolo" for the heading button broke
 * every `getByLabel("Titolo")` in the e2e suite, and so would a screen-reader
 * user's "go to Titolo". Field labels and the buttons that share a form with
 * the editor must never overlap the toolbar's names.
 */
describe("formatted-text toolbar names", () => {
  function stringLeaves(value: unknown, prefix = ""): [string, string][] {
    if (typeof value === "string") return [[prefix, value]];
    if (typeof value !== "object" || value === null) return [];
    return Object.entries(value).flatMap(([key, nested]) =>
      stringLeaves(nested, prefix ? `${prefix}.${key}` : key)
    );
  }

  const SHARES_A_FORM =
    /(\.fields\.[^.]+\.label|\.form\.[A-Za-z]*|\.poiPanel\.(back|close|save\.[a-z]+)|zoneEdit\.[A-Za-z.]+)$/;

  it.each([
    ["it", it_],
    ["en", en],
  ] as const)(
    "do not overlap a field label or form button in %s",
    (_locale, catalogue) => {
      const toolbar = Object.entries(catalogue.common.richText).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string"
      );
      const others = stringLeaves(catalogue).filter(
        ([key]) => !key.startsWith("common.richText") && SHARES_A_FORM.test(key)
      );

      const overlaps = toolbar.flatMap(([toolKey, toolName]) =>
        others
          .filter(([, name]) => {
            const a = toolName.toLowerCase();
            const b = name.toLowerCase();
            return a.includes(b) || b.includes(a);
          })
          .map(([key, name]) => `${toolKey} "${toolName}" ~ ${key} "${name}"`)
      );

      expect(overlaps).toEqual([]);
    }
  );
});
