import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";
import DhAncestryMetaField from "@/app/lib/definitions/enums/daggerheart/DhAncestryMetaField";

import { featureName, featureText } from "./dhFeatureFields";

/**
 * A Daggerheart ancestry's own fields (SPEC-027). `name`, `description`,
 * `imageId` and `origin` are shared declarations in `pageMetaFields`. An
 * ancestry has exactly two features (SPEC-018 §6), so all four fields are
 * required: one feature alone is refused field by field.
 */
const dhAncestryMeta = {
  [DhAncestryMetaField.featureAName]: featureName(
    "dhAncestries.fields.featureAName.label",
    DhAncestryMetaField.featureAName
  ),
  [DhAncestryMetaField.featureAText]: featureText(
    "dhAncestries.fields.featureAText.label",
    DhAncestryMetaField.featureAText
  ),
  [DhAncestryMetaField.featureBName]: featureName(
    "dhAncestries.fields.featureBName.label",
    DhAncestryMetaField.featureBName
  ),
  [DhAncestryMetaField.featureBText]: featureText(
    "dhAncestries.fields.featureBText.label",
    DhAncestryMetaField.featureBText
  ),
} satisfies Record<string, PageMeta>;

export default dhAncestryMeta;
