/**
 * Which of a subclass's three feature groups a feature belongs to (SPEC-021
 * §5), stored as `dhSubclassFeature.tier`. Features are ordered within their
 * tier.
 */
enum DhSubclassFeatureTier {
  Foundation = "foundation",
  Specialization = "specialization",
  Mastery = "mastery",
}

export default DhSubclassFeatureTier;
