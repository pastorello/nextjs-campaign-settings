import { describe, expect, it } from "vitest";

import PageType from "@/app/lib/definitions/types/PageType";
import ControlType from "@/app/lib/definitions/types/ControlType";
import { fieldMeta } from "@/app/lib/config/pageMetaFields";
import {
  buildCreateSchema,
  buildResultSchema,
  buildUpdateSchema,
  entityFieldKeys,
} from "./buildEntitySchema";

const types = [
  PageType.Spell,
  PageType.MagicItem,
  PageType.Npc,
  PageType.Deity,
] as const;

// A create payload built from each field's declared defaultValue. If the
// validators match reality, this must pass every domain's create schema — the
// test that catches a validator that never matched the data it guards, since
// TD-02 is the first time any validator actually runs.
function defaultPayload(pageType: PageType): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const key of entityFieldKeys(pageType)) {
    payload[key] = fieldMeta[key]?.defaultValue;
  }
  return payload;
}

describe("entityFieldKeys", () => {
  describe.each(types)("%s", (pageType) => {
    it("every key resolves to a declared validator", () => {
      for (const key of entityFieldKeys(pageType)) {
        expect(fieldMeta[key], `missing meta for "${key}"`).toBeDefined();
        expect(fieldMeta[key]?.validator).toBeDefined();
      }
    });
  });
});

describe("buildCreateSchema", () => {
  describe.each(types)("%s", (pageType) => {
    it("accepts a payload of the declared default values", () => {
      const result = buildCreateSchema(pageType).safeParse(
        defaultPayload(pageType)
      );

      // Surface which field failed, so a mismatch is diagnosable at a glance.
      expect(result.success ? null : result.error.flatten().fieldErrors).toBe(
        null
      );
    });

    it("rejects an empty payload (required fields missing)", () => {
      expect(buildCreateSchema(pageType).safeParse({}).success).toBe(false);
    });

    it("ignores a stray id rather than failing on it", () => {
      const result = buildCreateSchema(pageType).safeParse({
        ...defaultPayload(pageType),
        id: 999,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toHaveProperty("id");
      }
    });
  });
});

describe("buildResultSchema", () => {
  describe.each(types)("%s", (pageType) => {
    it("accepts a row with the declared default values plus an id", () => {
      const result = buildResultSchema(pageType).safeParse({
        ...defaultPayload(pageType),
        id: 1,
      });

      expect(result.success ? null : result.error.flatten().fieldErrors).toBe(
        null
      );
    });

    it("falls back to the field's default for a column the DB allows null (TD-02b)", () => {
      const payload = defaultPayload(pageType);
      const nullableKey = entityFieldKeys(pageType)[0]!;
      const result = buildResultSchema(pageType).safeParse({
        ...payload,
        [nullableKey]: null,
        id: 1,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[nullableKey]).toEqual(
          fieldMeta[nullableKey]?.defaultValue
        );
      }
    });

    it("rejects a row missing its id", () => {
      expect(
        buildResultSchema(pageType).safeParse(defaultPayload(pageType)).success
      ).toBe(false);
    });

    it("rejects a row where a field's type has drifted", () => {
      const wrongTypeKey = entityFieldKeys(pageType)[0]!;
      const result = buildResultSchema(pageType).safeParse({
        ...defaultPayload(pageType),
        [wrongTypeKey]: Symbol("drifted"),
        id: 1,
      });

      expect(result.success).toBe(false);
    });
  });
});

describe("buildResultSchema's image keys (SPEC-020 T4)", () => {
  const image = {
    displayKey: "display-key.webp",
    thumbKey: "thumb-key.webp",
    width: 800,
    height: 600,
  };
  const withImage = [
    PageType.Npc,
    PageType.Deity,
    PageType.MagicItem,
    PageType.Treasure,
    PageType.Faction,
  ] as const;

  it.each(withImage)(
    "keeps the image relation's keys for %s, or its null",
    (pageType) => {
      const schema = buildResultSchema(pageType);
      const row = { ...defaultPayload(pageType), id: 1 };

      expect(schema.parse({ ...row, image })).toMatchObject({ image });
      expect(schema.parse({ ...row, image: null })).toMatchObject({
        image: null,
      });
    }
  );

  it("rejects image keys that have drifted", () => {
    const result = buildResultSchema(PageType.Npc).safeParse({
      ...defaultPayload(PageType.Npc),
      id: 1,
      image: { ...image, thumbKey: 7 },
    });

    expect(result.success).toBe(false);
  });

  it("strips an image from a domain without an image field", () => {
    const parsed = buildResultSchema(PageType.Spell).parse({
      ...defaultPayload(PageType.Spell),
      id: 1,
      image,
    });

    expect(parsed).not.toHaveProperty("image");
  });
});

describe("buildUpdateSchema", () => {
  it("accepts a partial payload of one edited field plus the id", () => {
    const result = buildUpdateSchema(PageType.Spell).safeParse({
      id: 3,
      nome: "Palla di Fuoco",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an update with no id", () => {
    expect(
      buildUpdateSchema(PageType.Spell).safeParse({ nome: "x" }).success
    ).toBe(false);
  });

  it("rejects a non-positive id", () => {
    expect(
      buildUpdateSchema(PageType.Spell).safeParse({ id: 0, nome: "x" }).success
    ).toBe(false);
  });
});

describe("formatted-text fields sanitise on write (SPEC-019 T5)", () => {
  const dirty =
    '<p onclick="x()">A <strong>bold</strong> word<script>alert(1)</script>' +
    ' <a href="https://example.com">web</a></p>';
  const clean = "<p>A <strong>bold</strong> word web</p>";

  const richTextFields = Object.values(PageType).flatMap((pageType) =>
    entityFieldKeys(pageType)
      .filter((key) => fieldMeta[key]?.controlType === ControlType.RichText)
      .map((key) => [pageType, key] as const)
  );

  it("covers every description-like field of every domain", () => {
    expect(richTextFields).toEqual(
      expect.arrayContaining([
        [PageType.Spell, "description"],
        [PageType.Spell, "upcast"],
        [PageType.MagicItem, "description"],
        [PageType.Npc, "description"],
        [PageType.Npc, "appearance"],
        [PageType.Npc, "personality"],
        [PageType.Npc, "motivations"],
        [PageType.Npc, "secrets"],
        [PageType.Faction, "description"],
        [PageType.Treasure, "description"],
      ])
    );
  });

  it.each(richTextFields)(
    "%s.%s is sanitised by the update schema",
    (pageType, key) => {
      const parsed = buildUpdateSchema(pageType).parse({ id: 1, [key]: dirty });
      expect(parsed[key]).toBe(clean);
    }
  );
});
