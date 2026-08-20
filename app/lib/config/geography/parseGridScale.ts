import zoneGridMeta from "@/app/lib/config/geography/zoneGridMeta";
import type GridScale from "@/app/lib/definitions/enums/geography/GridScale";
import ZoneGridMetaField from "@/app/lib/definitions/enums/geography/ZoneGridMetaField";

/**
 * Narrows a stored raw `gridScale` string through the meta's own declared
 * validator (ADR-0011: bespoke map controls consume the validator rather
 * than restating it), falling back to `null`: an unparseable scale means
 * the map has no usable grid, and nothing downstream may guess (SPEC-015
 * §5's edge-case table). Shared by the grid overlay and the measure tool;
 * `MapGridConfigPanel` keeps its own default-value fallback instead — a
 * form needs something to select, a reader needs to refuse.
 */
export default function parseGridScale(value: string | null): GridScale | null {
  const parsed =
    zoneGridMeta[ZoneGridMetaField.gridScale].validator.safeParse(value);
  return parsed.success ? parsed.data : null;
}
