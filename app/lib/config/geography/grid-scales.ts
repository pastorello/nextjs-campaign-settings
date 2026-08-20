import GridScale from "@/app/lib/definitions/enums/geography/GridScale";

/**
 * SPEC-015 §6 — what one grid square means at each scale, in metres. The
 * database stores only the scale's name (`zone.gridScale`); these figures
 * are the single place the app knows their distances, so correcting one is
 * a one-line change rather than a data migration — the same reasoning as
 * SPEC-013's stored-silver/displayed-gold currency rule. The metric values
 * are the campaign's own; the source system's imperial equivalents are
 * documented in `docs/domain/`, deliberately not here.
 */
interface GridScaleObject {
  value: GridScale;
  labelKey: string;
  metersPerSquare: number;
}

const gridScales: GridScaleObject[] = [
  {
    value: GridScale.Dungeon,
    labelKey: "geography.gridScales.dungeon",
    metersPerSquare: 1.5,
  },
  {
    value: GridScale.Province,
    labelKey: "geography.gridScales.province",
    metersPerSquare: 1_500,
  },
  {
    value: GridScale.Kingdom,
    labelKey: "geography.gridScales.kingdom",
    metersPerSquare: 9_000,
  },
  {
    value: GridScale.Continent,
    labelKey: "geography.gridScales.continent",
    metersPerSquare: 90_000,
  },
];

export default gridScales;
