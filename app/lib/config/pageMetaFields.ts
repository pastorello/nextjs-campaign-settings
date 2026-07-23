import z from "zod";

import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";
import FieldType from "@/app/lib/definitions/types/FieldType";
import ControlType from "@/app/lib/definitions/types/ControlType";

import pngMeta from "./png/pngMeta";
import spellsMeta from "./spells/SpellsMeta";
import magicItemsMeta from "./magicitem/magicItemMeta";
import deitiesMeta from "./deity/deityMeta";
import renderRichText from "../utils/data/renderRichText";

const pageMetaFields = {
  //GENERAL
  descrizione: {
    metaField: "descrizione",
    label: "Descrizione",
    defaultValue: "",
    fieldType: FieldType.string,
    controlType: ControlType.Textarea,
    placeholder: "Inserisci qui la descrizione",
    validator: z.string(),
    getDatum: (datum: string) => renderRichText(datum),
  },
  id: {
    metaField: "id",
    label: "ID",
    defaultValue: 0,
    fieldType: FieldType.integer,
    controlType: ControlType.Text,
    placeholder: "Inserisci L'ID",
    validator: z.coerce
      .number()
      .gt(-1, { message: "Please enter a positive amount" }),
    getDatum: (datum: number) => datum,
  },
  nome: {
    metaField: "nome",
    label: "Nome",
    defaultValue: "",
    placeholder: "Inserisci nome",
    fieldType: FieldType.string,
    controlType: ControlType.Text,
    validator: z.string(),
    getDatum: (datum: string) => datum,
  },
  ...deitiesMeta,
  ...spellsMeta,
  ...magicItemsMeta,
  ...pngMeta,
} satisfies Record<string, PageMeta>;

/**
 * The same registry seen through the `PageMeta` interface.
 *
 * `pageMetaFields` deliberately keeps its inferred literal type — that is what
 * lets `MetaConfigKey` be the union of the real field names. The cost is that
 * indexing it yields one specific declaration, whose optional `options` and
 * `placeholder` may simply not be there. Read through this view when you need
 * the declared shape rather than a particular field's.
 */
export const fieldMeta: Record<string, PageMeta> = pageMetaFields;

export default pageMetaFields;
