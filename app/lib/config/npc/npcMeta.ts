import firstOptionValue from "../firstOptionValue";
import NpcMetaField from "@/app/lib/definitions/enums/npc/NpcMetaField";
import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";
import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";
import optionValueValidator from "@/app/lib/utils/validators/optionValueValidator";
import z from "zod";

import alignmentDomains from "./alignmentDomains";
import alignments from "./alignments";
import factions from "./factions";
import renderRichText from "../../utils/data/renderRichText";

const npcMeta = {
  [NpcMetaField.title]: {
    labelKey: "npc.fields.title.label",
    defaultValue: "",
    placeholderKey: "npc.fields.title.placeholder",
    metaField: "title",
    fieldType: FieldType.string,
    controlType: ControlType.Text,
    validator: z.string().optional(),
    getDatum: (datum: string) => datum,
  },
  [NpcMetaField.alignment]: {
    labelKey: "npc.fields.alignment.label",
    defaultValue: firstOptionValue(alignments),
    metaField: NpcMetaField.alignment,
    fieldType: FieldType.integer,
    options: alignments,
    controlType: ControlType.Select,
    validator: optionValueValidator(alignments),
  },
  [NpcMetaField.alignmentDomain]: {
    labelKey: "npc.fields.alignmentDomain.label",
    defaultValue: firstOptionValue(alignmentDomains),
    metaField: NpcMetaField.alignmentDomain,
    fieldType: FieldType.integer,
    options: alignmentDomains,
    controlType: ControlType.Select,
    validator: optionValueValidator(alignmentDomains),
  },
  [NpcMetaField.position]: {
    labelKey: "npc.fields.position.label",
    defaultValue: "",
    metaField: NpcMetaField.position,
    fieldType: FieldType.string,
    controlType: ControlType.Text,
    placeholderKey: "npc.fields.position.placeholder",
    validator: z.string().optional(),
    getDatum: (datum: string) => datum,
  },
  [NpcMetaField.faction]: {
    labelKey: "npc.fields.faction.label",
    defaultValue: firstOptionValue(factions),
    metaField: NpcMetaField.faction,
    fieldType: FieldType.integer,
    options: factions,
    controlType: ControlType.Select,
    validator: optionValueValidator(factions),
  },
  [NpcMetaField.appearance]: {
    labelKey: "npc.fields.appearance.label",
    defaultValue: "",
    metaField: NpcMetaField.appearance,
    fieldType: FieldType.string,
    controlType: ControlType.Textarea,
    placeholderKey: "npc.fields.appearance.placeholder",
    validator: z.string().optional(),
    getDatum: (datum: string) => renderRichText(datum),
  },
  [NpcMetaField.personality]: {
    labelKey: "npc.fields.personality.label",
    defaultValue: "",
    metaField: NpcMetaField.personality,
    fieldType: FieldType.string,
    controlType: ControlType.Textarea,
    placeholderKey: "npc.fields.personality.placeholder",
    validator: z.string().optional(),
    getDatum: (datum: string) => renderRichText(datum),
  },
  [NpcMetaField.motivations]: {
    labelKey: "npc.fields.motivations.label",
    defaultValue: "",
    metaField: NpcMetaField.motivations,
    fieldType: FieldType.string,
    controlType: ControlType.Textarea,
    placeholderKey: "npc.fields.motivations.placeholder",
    validator: z.string().optional(),
    getDatum: (datum: string) => renderRichText(datum),
  },
  [NpcMetaField.secrets]: {
    labelKey: "npc.fields.secrets.label",
    defaultValue: "",
    metaField: NpcMetaField.secrets,
    fieldType: FieldType.string,
    controlType: ControlType.Textarea,
    placeholderKey: "npc.fields.secrets.placeholder",
    validator: z.string().optional(),
    getDatum: (datum: string) => renderRichText(datum),
  },
} satisfies Record<string, PageMeta>;

export default npcMeta;
