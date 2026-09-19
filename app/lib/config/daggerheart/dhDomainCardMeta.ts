import { z } from "zod";

import firstOptionValue from "../firstOptionValue";
import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";
import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";
import DhDomainCardType from "@/app/lib/definitions/enums/daggerheart/DhDomainCardType";
import DhDomainCardMetaField from "@/app/lib/definitions/enums/daggerheart/DhDomainCardMetaField";
import renderRichText from "@/app/lib/utils/data/renderRichText";
import optionValueValidator from "@/app/lib/utils/validators/optionValueValidator";
import richTextValidator from "@/app/lib/utils/validators/richTextValidator";

import dhDomainCardLevels from "./dhDomainCardLevels";
import dhDomainCardTypes from "./dhDomainCardTypes";

/**
 * A domain card's own fields (SPEC-021 T3). `name` and `origin` are shared
 * declarations in `pageMetaFields`.
 */
const dhDomainCardMeta = {
  // Table-backed, like `npc.faction`: the FK checks membership, so the
  // validator is a plain integer. Required — a card always has a domain —
  // but with no default, since a fresh installation has no first domain.
  [DhDomainCardMetaField.domainId]: {
    metaField: "domainId",
    labelKey: "dhDomainCards.fields.domainId.label",
    defaultValue: null,
    fieldType: FieldType.integer,
    optionTable: "dhDomain",
    controlType: ControlType.Select,
    validator: z.number().int().positive(),
  },
  // 1–10 (SPEC-021 §5), the `level` column's CHECK as options.
  [DhDomainCardMetaField.cardLevel]: {
    metaField: "cardLevel",
    labelKey: "dhDomainCards.fields.cardLevel.label",
    defaultValue: firstOptionValue(dhDomainCardLevels),
    fieldType: FieldType.integer,
    options: dhDomainCardLevels,
    controlType: ControlType.Select,
    validator: optionValueValidator(dhDomainCardLevels),
  },
  // Stress spent to recall the card, ≥ 0 — typed, so coerced from the
  // text box's string.
  [DhDomainCardMetaField.recallCost]: {
    metaField: "recallCost",
    labelKey: "dhDomainCards.fields.recallCost.label",
    defaultValue: 0,
    fieldType: FieldType.integer,
    controlType: ControlType.Text,
    validator: z.coerce.number().int().gte(0),
    getDatum: (datum: number) => datum,
  },
  [DhDomainCardMetaField.cardType]: {
    metaField: "cardType",
    labelKey: "dhDomainCards.fields.cardType.label",
    defaultValue: firstOptionValue(dhDomainCardTypes),
    fieldType: FieldType.string,
    options: dhDomainCardTypes,
    controlType: ControlType.Select,
    validator: z.nativeEnum(DhDomainCardType),
  },
  // Formatted (SPEC-019), and required: sanitised first, so `.min(1)` judges
  // what would be stored — markup with no words in it is refused like `""`.
  [DhDomainCardMetaField.featureText]: {
    metaField: "featureText",
    labelKey: "dhDomainCards.fields.featureText.label",
    defaultValue: "",
    fieldType: FieldType.string,
    controlType: ControlType.RichText,
    validator: richTextValidator().pipe(z.string().min(1)),
    getDatum: (datum: string) => renderRichText(datum),
    tall: true,
  },
} satisfies Record<string, PageMeta>;

export default dhDomainCardMeta;
