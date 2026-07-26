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
   * Header text. Not taken from `PageMeta.label`, which is unreliable for
   * display — several are raw field names (`label: "tipoPatrono"`). TD-21
   * replaces these with catalogue keys.
   */
  label: string;

  /**
   * Whether the header is a sort control. Defaults to true; `false` renders
   * plain text, for a column there is no point ordering by.
   */
  sortable?: boolean;

  /** Rendered beneath the value in the same cell — the NPC list's `titolo`. */
  subtitleField?: MetaConfigKey;
}

export default ListColumn;
