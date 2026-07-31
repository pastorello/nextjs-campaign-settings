import { describe, expect, it } from "vitest";

import renderFieldValue from "./renderFieldValue";
import MagicItemMetaField from "@/app/lib/definitions/enums/magicitem/MagicItemMetaField";
import SpellMetaField from "@/app/lib/definitions/enums/spells/SpellMetaField";
import itMessages from "@/messages/it.json";

/**
 * A dot-path lookup over the real catalogue, not a mock. Every `labelKey`
 * declared in `app/lib/config/**` must resolve against `messages/it.json` —
 * using the actual file here means a missing key fails this test rather than
 * only failing at render time.
 */
const t = (key: string): string => {
  const value: unknown = key
    .split(".")
    .reduce<unknown>(
      (node, segment) =>
        typeof node === "object" && node !== null
          ? (node as Record<string, unknown>)[segment]
          : undefined,
      itMessages
    );
  if (typeof value !== "string") {
    throw new Error(`Missing message for key "${key}"`);
  }
  return value;
};

/**
 * These cover the one type assertion in the codebase's rendering path (see the
 * file's own comment). The compiler cannot check that a dynamic key and its
 * value agree, so these assert it at runtime instead — for each shape of
 * `getDatum` the metadata declares.
 */
describe("renderFieldValue", () => {
  it("renders an integer field through its options list", () => {
    expect(renderFieldValue(SpellMetaField.level, 3, t)).toBe("3° Livello");
  });

  it("renders an array field as a joined list of labels", () => {
    // classi 1 and 4 are Chierico and Paladino — the pairing the seeded
    // "Aiuto" carries.
    expect(renderFieldValue(SpellMetaField.classes, [1, 4], t)).toBe(
      "Chierico, Paladino"
    );
  });

  it("renders a boolean field as Italian yes/no", () => {
    expect(renderFieldValue(MagicItemMetaField.attuned, true, t)).toBe("Sì");
    expect(renderFieldValue(MagicItemMetaField.attuned, false, t)).toBe("No");
  });

  it("renders a string field that has options through its label", () => {
    // Worth one test on its own: `gittata` is stored as a string but is still
    // a lookup — the row holds "30" and the user must see "9 Metri". Passing
    // the label instead of the value renders nothing.
    expect(renderFieldValue(SpellMetaField.range, "30", t)).toBe("9 Metri");
  });

  it("renders a string field without options unchanged", () => {
    expect(renderFieldValue(SpellMetaField.name, "Dardo Incantato", t)).toBe(
      "Dardo Incantato"
    );
  });

  it("returns an empty label for a value outside the options list", () => {
    // The behaviour that made the deities list's wrong column silent rather
    // than loud: an id with no matching option renders as nothing at all.
    expect(renderFieldValue(SpellMetaField.level, 999, t)).toBe("");
  });
});
