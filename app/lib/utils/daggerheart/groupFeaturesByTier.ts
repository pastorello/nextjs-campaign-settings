import DhSubclassFeatureTier from "@/app/lib/definitions/enums/daggerheart/DhSubclassFeatureTier";

/**
 * A subclass's features grouped foundation / specialization / mastery, each
 * group in position order (SPEC-021 §5.5). Every tier is present, empty or
 * not, in that order — the inline editor shows all three, and the class page
 * (T6) shows them the same way. A feature whose stored tier is outside the
 * vocabulary is left out rather than guessed into one.
 */
export default function groupFeaturesByTier<
  T extends { tier: string; position: number },
>(features: readonly T[]): [DhSubclassFeatureTier, T[]][] {
  return Object.values(DhSubclassFeatureTier).map((tier) => {
    // The stored tier is a raw string column; compare it as one.
    const storedValue: string = tier;
    return [
      tier,
      features
        .filter((feature) => feature.tier === storedValue)
        .sort((a, b) => a.position - b.position),
    ];
  });
}
