import { describe, expect, it } from "vitest";

import renderRecordMarkdown, { markdownFields } from "./renderRecordMarkdown";
import renderListMarkdown from "./renderListMarkdown";
import { escapeInline } from "./markdownText";
import pagesConfig from "@/app/lib/config/pagesConfig";
import listConfig from "@/app/lib/config/listConfig";
import { fieldMeta } from "@/app/lib/config/pageMetaFields";
import PageType from "@/app/lib/definitions/types/PageType";
import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";
import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";
import ListItem from "@/app/lib/definitions/interfaces/ListItem";
import OptionBundle from "@/app/lib/definitions/types/OptionBundle";
import validSpellFixture from "@/app/lib/data/spells/validSpellFixture";
import NpcMetaField from "@/app/lib/definitions/enums/npc/NpcMetaField";

// Labels come back as their keys, so the output names each field exactly.
const t = (key: string) => key;

const labelOf = (key: string) => `**${escapeInline(fieldMeta[key]!.labelKey!)}`;

/** A non-empty value of the field's own shape — what a filled form saves. */
function sampleValue(key: string, meta: PageMeta): unknown {
  const many = meta.fieldType === FieldType.array;
  if (meta.optionTable !== undefined) return many ? [1] : 1;
  const option = meta.options?.[0]?.value;
  if (option !== undefined) return many ? [option] : option;
  switch (meta.fieldType) {
    case FieldType.boolean:
      return true;
    case FieldType.integer:
      return 4;
    case FieldType.array:
      return [1];
    case FieldType.string:
      return meta.controlType === ControlType.RichText
        ? `<p>text of ${key}</p>`
        : `text of ${key}`;
  }
}

function filledRecord(pageType: PageType): {
  record: ListItem;
  bundle: OptionBundle;
} {
  const record: ListItem = { name: `A ${pageType}` };
  const bundle: OptionBundle = {};
  for (const key of pagesConfig[pageType].fields) {
    const meta = fieldMeta[key]!;
    record[key] = key === "name" ? record.name : sampleValue(key, meta);
    if (meta.optionTable !== undefined) {
      bundle[meta.optionTable] = [
        { value: 1, label: `one of ${meta.optionTable}` },
      ];
    }
  }
  return { record, bundle };
}

describe("renderRecordMarkdown (SPEC-033 T1)", () => {
  it("writes a spell: title, then its fields in page order", () => {
    const markdown = renderRecordMarkdown({
      pageType: PageType.Spell,
      record: { ...validSpellFixture },
      t,
    });

    expect(markdown.startsWith("# Aiuto\n\n")).toBe(true);
    expect(markdown).toContain(
      "**common.fields.description.label**\n\nBolsters allies' resolve."
    );
    expect(markdown).toContain("- **spells.fields.range.label:** ");
    // Empty fields are left out.
    expect(markdown).not.toContain("spells.fields.savingThrow.label");
    expect(markdown).not.toContain("spells.fields.upcast.label");
    // A false boolean is a value, not an empty field.
    expect(markdown).toContain("spells.fields.ritual.label");
    expect(markdown.endsWith("\n")).toBe(true);
  });

  it("resolves an option-backed value to its label, never its stored value", () => {
    const markdown = renderRecordMarkdown({
      pageType: PageType.Spell,
      record: { ...validSpellFixture },
      t,
    });
    const level = fieldMeta.level!.options![0]!;

    expect(markdown).toContain(
      `- **spells.fields.level.label:** ${escapeInline(level.labelKey)}`
    );
  });

  describe.each(Object.values(PageType))("every field of %s", (pageType) => {
    const { record, bundle } = filledRecord(pageType);
    const markdown = renderRecordMarkdown({ pageType, record, t, bundle });
    const fields = markdownFields(pageType);

    it("has a label key to print", () => {
      for (const key of fields) {
        expect(fieldMeta[key]!.labelKey, key).toBeDefined();
      }
    });

    // A field added to the page's metadata appears here with no change to
    // the export (SPEC-033 §8): the field list is the page's own.
    it("appears, in pagesConfig order", () => {
      const positions = fields.map((key) => markdown.indexOf(labelOf(key)));

      expect(
        positions.every((position) => position > 0),
        markdown
      ).toBe(true);
      expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    });

    it("leaves out the id, the image and the reveals", () => {
      for (const key of ["id", "imageId", "revealedTo", "revealedToDnd5e"]) {
        if (!pagesConfig[pageType].fields.includes(key as never)) continue;
        expect(markdown).not.toContain(labelOf(key));
      }
    });
  });

  it("includes a DM-only field: only the DM exports", () => {
    const { record, bundle } = filledRecord(PageType.Npc);

    const markdown = renderRecordMarkdown({
      pageType: PageType.Npc,
      record,
      t,
      bundle,
    });

    expect(markdown).toContain(labelOf(NpcMetaField.secrets));
    expect(markdown).toContain(labelOf(NpcMetaField.motivations));
  });

  it("writes a table-backed value through the page's option bundle", () => {
    const { record, bundle } = filledRecord(PageType.Npc);

    expect(
      renderRecordMarkdown({ pageType: PageType.Npc, record, t, bundle })
    ).toContain(`${labelOf(NpcMetaField.faction)}:** one of faction`);
  });

  it("escapes the name and the values", () => {
    const markdown = renderRecordMarkdown({
      pageType: PageType.Faction,
      record: { name: "The *Hand*", description: "<p>a_b</p>" },
      t,
    });

    expect(markdown).toBe(
      "# The \\*Hand\\*\n\n**common.fields.description.label**\n\na\\_b\n"
    );
  });
});

describe("renderListMarkdown (SPEC-033 T1)", () => {
  it("separates the records with a rule", () => {
    expect(
      renderListMarkdown({
        pageType: PageType.Faction,
        records: [{ name: "One" }, { name: "Two" }],
        t,
      })
    ).toBe("# One\n\n---\n\n# Two\n");
  });

  it("says the list is empty, in its page's words", () => {
    expect(
      renderListMarkdown({ pageType: PageType.Spell, records: [], t })
    ).toBe(`${listConfig[PageType.Spell].emptyMessageKey}\n`);
  });
});
