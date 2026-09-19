import { z } from "zod";

import firstOptionValue from "../firstOptionValue";
import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";
import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";
import DhDomainColour from "@/app/lib/definitions/enums/daggerheart/DhDomainColour";
import DhDomainMetaField from "@/app/lib/definitions/enums/daggerheart/DhDomainMetaField";

import dhDomainColours from "./dhDomainColours";

/**
 * A Daggerheart domain's own fields (SPEC-021 T2). `name`, `description`,
 * `imageId` (the emblem) and `origin` are shared declarations in
 * `pageMetaFields`.
 */
const dhDomainMeta = {
  // A palette key, not free hex: the palette is what guarantees the card
  // band's contrast (`dhDomainColours.ts`).
  [DhDomainMetaField.colour]: {
    metaField: "colour",
    labelKey: "dhDomains.fields.colour.label",
    defaultValue: firstOptionValue(dhDomainColours),
    fieldType: FieldType.string,
    options: dhDomainColours,
    controlType: ControlType.Select,
    validator: z.nativeEnum(DhDomainColour),
  },
} satisfies Record<string, PageMeta>;

export default dhDomainMeta;
