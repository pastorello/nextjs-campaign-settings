import { describe, expect, it } from "vitest";

import renderFieldValue from "./renderFieldValue";
import MagicItemMetaField from "@/app/lib/definitions/enums/magicitem/MagicItemMetaField";
import PatronoMetaField from "@/app/lib/definitions/enums/deities/PatronoMetaField";
import SpellMetaField from "@/app/lib/definitions/enums/spells/SpellMetaField";

/**
 * These cover the one type assertion in the codebase's rendering path (see the
 * file's own comment). The compiler cannot check that a dynamic key and its
 * value agree, so these assert it at runtime instead — for each shape of
 * `getDatum` the metadata declares.
 */
describe("renderFieldValue", () => {
  it("renders an integer field through its options list", () => {
    expect(renderFieldValue(SpellMetaField.livello, 3)).toBe("3° Livello");
  });

  it("renders an array field as a joined list of labels", () => {
    // classi 1 and 4 are Chierico and Paladino — the pairing the seeded
    // "Aiuto" carries.
    expect(renderFieldValue(SpellMetaField.classi, [1, 4])).toBe(
      "Chierico, Paladino"
    );
  });

  it("renders a boolean field as Italian yes/no", () => {
    expect(renderFieldValue(MagicItemMetaField.sintonia, true)).toBe("Sì");
    expect(renderFieldValue(MagicItemMetaField.sintonia, false)).toBe("No");
  });

  it("renders a string field that has options through its label", () => {
    // Worth one test on its own: `gittata` is stored as a string but is still
    // a lookup — the row holds "30" and the user must see "9 Metri". Passing
    // the label instead of the value renders nothing.
    expect(renderFieldValue(SpellMetaField.gittata, "30")).toBe("9 Metri");
  });

  it("renders a string field without options unchanged", () => {
    expect(renderFieldValue(SpellMetaField.nome, "Dardo Incantato")).toBe(
      "Dardo Incantato"
    );
  });

  it("returns an empty label for a value outside the options list", () => {
    // The behaviour that made the deities list's wrong column silent rather
    // than loud: an id with no matching option renders as nothing at all.
    expect(renderFieldValue(PatronoMetaField.residenza, 999)).toBe("");
  });
});
