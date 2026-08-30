/**
 * `zone`'s editable scalar fields (TD-104). Only the two the DM can write
 * after creation: zone has no list page or header filters of its own, so it
 * is not a metadata-layer domain (ADR-0011's test) — this enum exists for
 * the bespoke edit panel and `updateZoneDetails` to share one spelling of
 * each key, not for `pagesConfig` composition. Sibling of
 * `ZoneGridMetaField`, which does the same for the grid scalars.
 */
enum ZoneMetaField {
  title = "title",
  description = "description",
}

export default ZoneMetaField;
