import pageMetaFields from "../../config/pageMetaFields";

/**
 * The name of a declared field — the union of `pageMetaFields`' real keys.
 *
 * The template literal is load-bearing. Domain metas key their entries by enum
 * member (`[SpellMetaField.level]`), so a bare `keyof` yields *enum member*
 * types, and string enums are nominal: `PatronoMetaField.allineamento` and
 * `PngMetaField.allineamento` are different types despite both being
 * `"allineamento"`. Collapsing to the string values makes the union the set of
 * field names it was always meant to be, and accepts a member of either enum
 * as well as a plain literal.
 */
type MetaConfigKey = `${keyof typeof pageMetaFields}`;

export default MetaConfigKey;
