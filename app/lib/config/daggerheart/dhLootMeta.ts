import { z } from "zod";

import firstOptionValue from "../firstOptionValue";
import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";
import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";
import DhLootKind from "@/app/lib/definitions/enums/daggerheart/DhLootKind";
import DhLootMetaField from "@/app/lib/definitions/enums/daggerheart/DhLootMetaField";
import DhRarity from "@/app/lib/definitions/enums/daggerheart/DhRarity";
import renderRichText from "@/app/lib/utils/data/renderRichText";
import richTextValidator from "@/app/lib/utils/validators/richTextValidator";

import dhLootKinds from "./dhLootKinds";
import dhRarities from "./dhRarities";

/**
 * A piece of Daggerheart loot (SPEC-029 §5). `name`, `imageId` and
 * `origin` are shared declarations in `pageMetaFields`. The roll value is
 * the entry it answers to on the DM's own table; the app rolls nothing.
 */
const dhLootMeta = {
  [DhLootMetaField.kind]: {
    metaField: DhLootMetaField.kind,
    labelKey: "dhLoot.fields.kind.label",
    defaultValue: firstOptionValue(dhLootKinds),
    fieldType: FieldType.string,
    options: dhLootKinds,
    controlType: ControlType.Select,
    validator: z.nativeEnum(DhLootKind),
  },
  [DhLootMetaField.rarity]: {
    metaField: DhLootMetaField.rarity,
    labelKey: "dhLoot.fields.rarity.label",
    defaultValue: firstOptionValue(dhRarities),
    fieldType: FieldType.string,
    options: dhRarities,
    controlType: ControlType.Select,
    validator: z.nativeEnum(DhRarity),
  },
  // Optional and positive: a blank box is `null`, not `0` (TD-130).
  [DhLootMetaField.rollValue]: {
    metaField: DhLootMetaField.rollValue,
    labelKey: "dhLoot.fields.rollValue.label",
    placeholderKey: "dhLoot.fields.rollValue.placeholder",
    defaultValue: null,
    fieldType: FieldType.integer,
    controlType: ControlType.Text,
    validator: z.preprocess(
      (raw) => (raw === "" || raw === undefined ? null : raw),
      z.coerce.number().int().min(1).nullable()
    ),
    getDatum: (datum: number | null) => (datum === null ? "—" : datum),
  },
  // Formatted, and required: sanitised first, so `.min(1)` judges what
  // would be stored.
  [DhLootMetaField.effectText]: {
    metaField: DhLootMetaField.effectText,
    labelKey: "dhLoot.fields.effectText.label",
    defaultValue: "",
    fieldType: FieldType.string,
    controlType: ControlType.RichText,
    validator: richTextValidator().pipe(z.string().min(1)),
    getDatum: (datum: string) => renderRichText(datum),
    tall: true,
  },
} satisfies Record<string, PageMeta>;

export default dhLootMeta;
