/**
 * An adversary's type (SPEC-028 §5, `daggerheart.md` §5): the ten the
 * Battle Point costs are read from, stored as `dhAdversary.adversaryType`.
 */
enum DhAdversaryType {
  Bruiser = "bruiser",
  Horde = "horde",
  Leader = "leader",
  Minion = "minion",
  Ranged = "ranged",
  Skulk = "skulk",
  Social = "social",
  Solo = "solo",
  Standard = "standard",
  Support = "support",
}

export default DhAdversaryType;
