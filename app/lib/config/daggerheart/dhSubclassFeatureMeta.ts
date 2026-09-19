import { z } from "zod";

import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";
import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";
import DhFeatureMetaField from "@/app/lib/definitions/enums/daggerheart/DhFeatureMetaField";
import DhSubclassFeatureTier from "@/app/lib/definitions/enums/daggerheart/DhSubclassFeatureTier";

import dhClassFeatureMeta from "./dhClassFeatureMeta";
import dhSubclassFeatureTiers from "./dh-subclass-feature-tiers";

/**
 * A subclass feature's own scalar fields (SPEC-021 §6): a class feature's
 * three, plus the tier it belongs to. Outside the registry, like
 * `dhClassFeatureMeta` (ADR-0011). `position` is the feature's place within
 * its tier, not within the subclass.
 */
const dhSubclassFeatureMeta = {
  [DhFeatureMetaField.tier]: {
    metaField: "tier",
    labelKey: "dhFeature.fields.tier.label",
    defaultValue: DhSubclassFeatureTier.Foundation,
    fieldType: FieldType.string,
    options: dhSubclassFeatureTiers,
    controlType: ControlType.Select,
    validator: z.nativeEnum(DhSubclassFeatureTier),
  },
  ...dhClassFeatureMeta,
} satisfies Record<string, PageMeta>;

export default dhSubclassFeatureMeta;
