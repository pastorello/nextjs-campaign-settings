/**
 * A new class's first feature, sent beside its fields to `createDhClass`. A
 * class has at least one feature (SPEC-021 §5), so it is created with one,
 * in the same write; `deleteDhClassFeatureById` refuses to remove the last.
 * Flat keys, so a refusal names which of the two was wrong.
 */
interface FirstDhClassFeature {
  firstFeatureName?: string;
  firstFeatureText?: string;
}

export default FirstDhClassFeature;
