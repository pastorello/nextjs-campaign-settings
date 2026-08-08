import MetaConfigKey from "../../types/MetaConfigKey";

/**
 * One column of a domain's admin list.
 *
 * `fieldKey` does double duty, and that is deliberate rather than a shortcut:
 * a metadata key, the database column and the property on a fetched row are all
 * the same lowercase string (`PngMetaField.dominioAllineamento` is
 * `"dominioallineamento"`), so one key both looks up the `PageMeta` that knows
 * how to render the value and reads the value itself.
 */
interface ListColumn {
  fieldKey: MetaConfigKey;

  /**
   * Header text, as a message key — usually the same key as the field's own
   * `PageMeta.labelKey`, since a column header and a form label are normally
   * the same word. Declared separately rather than read off `PageMeta`
   * because the two do occasionally diverge (magic items' `attuned` column
   * reads "Sintonia", the form field "Richiede sintonia").
   */
  labelKey: string;

  /**
   * Whether the header is a sort control. Defaults to true; `false` renders
   * plain text, for a column there is no point ordering by.
   */
  sortable?: boolean;

  /**
   * Whether `SortableHeader` renders its built-in, `PageMeta.options`-driven
   * filter select. Defaults to true. `false` for a column whose filter UI is
   * bespoke and lives elsewhere on the page instead — SPEC-008 T6's
   * "Location" column, whose Zone/POI picker needs an async-fetched,
   * cascading list `PageMeta.options`'s static shape cannot express.
   */
  isFiltrable?: boolean;

  /** Rendered beneath the value in the same cell — the NPC list's `titolo`. */
  subtitleField?: MetaConfigKey;
}

export default ListColumn;
