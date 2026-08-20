/**
 * The four map scales a grid square can represent (SPEC-015 §6). Stored
 * directly as `zone.gridScale`'s raw `String` value — same reasoning as
 * `AdventureStatus`: the column is a `String`, so this enum's values are
 * what gets written to it. The metres each scale assigns to one square
 * live in `app/lib/config/geography/grid-scales.ts`, not here — correcting
 * a scale's distance must stay a one-line config change, never a data
 * migration.
 */
enum GridScale {
  Dungeon = "dungeon",
  Province = "province",
  Kingdom = "kingdom",
  Continent = "continent",
}

export default GridScale;
