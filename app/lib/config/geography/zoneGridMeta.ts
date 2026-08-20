import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";
import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";
import GridScale from "@/app/lib/definitions/enums/geography/GridScale";
import ZoneGridMetaField from "@/app/lib/definitions/enums/geography/ZoneGridMetaField";
import firstOptionValue from "../firstOptionValue";
import z from "zod";

import gridScales from "./grid-scales";

/**
 * SPEC-015 §5 — the cap on a grid's width in squares. The grid overlay
 * draws one line per column plus one per derived row; at 200 columns a
 * typical map image is already down to squares a few pixels wide, where
 * the grid is noise and the line count a rendering cost. The DM's real
 * scales run tens of squares across (§9's example legend is 36), so the
 * cap is far from any legitimate map. Stated in the field-level error the
 * validator produces, as §5 requires.
 */
export const GRID_COLUMNS_MAX = 200;

/**
 * The two grid scalars on `zone` (SPEC-015 §7) — outside the metadata
 * layer's page composition (ADR-0011: the configuration panel is a bespoke
 * map control, not a metadata-driven form), but declared as `PageMeta` all
 * the same so the panel and `updateZoneGrid` consume one validator and one
 * label key each rather than restating them.
 */
const zoneGridMeta = {
  [ZoneGridMetaField.gridColumns]: {
    metaField: "gridColumns",
    labelKey: "geography.fields.gridColumns.label",
    defaultValue: null,
    fieldType: FieldType.integer,
    controlType: ControlType.Text,
    validator: z.coerce.number().int().positive().max(GRID_COLUMNS_MAX),
  },
  [ZoneGridMetaField.gridScale]: {
    metaField: "gridScale",
    labelKey: "geography.fields.gridScale.label",
    defaultValue: firstOptionValue(gridScales),
    fieldType: FieldType.string,
    options: gridScales,
    controlType: ControlType.Select,
    validator: z.nativeEnum(GridScale),
  },
} satisfies Record<string, PageMeta>;

export default zoneGridMeta;
