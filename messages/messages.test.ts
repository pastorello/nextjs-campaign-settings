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
});
