enum PageType {
  MagicItem = "magicitems",
  Spell = "spells",
  Npc = "npc",
  Deity = "deities",
  Faction = "factions",
  Treasure = "treasures",
  // SPEC-021 — Daggerheart catalogues. The value is the route segment.
  DhDomain = "domains",
  DhDomainCard = "domain-cards",
}

export default PageType;
