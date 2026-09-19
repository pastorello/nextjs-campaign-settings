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
  // Daggerheart catalogues (SPEC-021 T4, T5), `system: "daggerheart"` in
  // `pagesConfig`. The value is the route segment under `[system]/admin/`.
  DhClass = "classes",
  DhSubclass = "subclasses",
}

export default PageType;
