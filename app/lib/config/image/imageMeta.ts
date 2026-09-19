import type FieldErrorKey from "@/app/lib/definitions/types/FieldErrorKey";
import z from "zod";

import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";
import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";

/**
 * A record's one image (SPEC-020 T3), declared once and composed into every
 * owning domain: `pageMetaFields` carries it as `imageId` for NPCs, deities,
 * magic items, treasures and factions, and `zoneMeta` for places, whose edit
 * panel and create flow sit outside the metadata layer (ADR-0011) but
 * consume this same declaration. SPEC-021's Daggerheart domains add it the
 * same way.
 *
 * The value is a `recordImage` id — the upload route creates the row and the
 * field submits its id — or `null` for "no image". The validator checks the
 * shape only; whether the id names an existing image no other record holds
 * is `checkRecordImageReference`'s job, in the action, because Zod cannot
 * ask the database. What happens to a replaced or removed image is the
 * actions' job too (`releaseReplacedRecordImage`).
 *
 * `getDatum` is the bare id for now: rendering the image in cards and lists
 * is SPEC-020 T4.
 */
const imageMeta = {
  metaField: "imageId",
  labelKey: "common.fields.image.label",
  defaultValue: null,
  fieldType: FieldType.integer,
  controlType: ControlType.Image,
  validator: z
    .number({ message: "imageNotFound" satisfies FieldErrorKey })
    .int({ message: "imageNotFound" satisfies FieldErrorKey })
    .positive({ message: "imageNotFound" satisfies FieldErrorKey })
    .nullable()
    .optional(),
  getDatum: (datum: number | null) => datum,
} satisfies PageMeta;

export default imageMeta;
