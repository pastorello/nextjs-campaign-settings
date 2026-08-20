/**
 * `zone`'s grid-configuration fields (SPEC-015 §7). Only the two grid
 * scalars: zone has no list page or header filters of its own, so it is
 * not a metadata-layer domain (ADR-0011's test) — this enum exists for the
 * bespoke configuration panel and `updateZoneGrid` to share one spelling
 * of each key, not for `pagesConfig` composition.
 */
enum ZoneGridMetaField {
  gridColumns = "gridColumns",
  gridScale = "gridScale",
}

export default ZoneGridMetaField;
