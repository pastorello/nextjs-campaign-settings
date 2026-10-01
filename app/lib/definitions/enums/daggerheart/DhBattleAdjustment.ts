/**
 * The Battle Point adjustments a DM ticks on a fight (SPEC-030 §5,
 * `daggerheart.md` §5), stored as `scene.battleAdjustments` keys. Each one's
 * points are `DH_BATTLE_ADJUSTMENT_POINTS`'.
 */
enum DhBattleAdjustment {
  EasierOrShorter = "easierOrShorter",
  TwoOrMoreSolos = "twoOrMoreSolos",
  BoostedDamage = "boostedDamage",
  LowerTierAdversary = "lowerTierAdversary",
  NoHeavyHitters = "noHeavyHitters",
  HarderOrLonger = "harderOrLonger",
}

export default DhBattleAdjustment;
