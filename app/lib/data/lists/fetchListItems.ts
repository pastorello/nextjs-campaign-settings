import PageType from "@/app/lib/definitions/types/PageType";
import ListItem from "@/app/lib/definitions/interfaces/ListItem";
import { SearchParamsInput } from "@/app/lib/data/validateParams";

import { fetchFilteredDeities } from "@/app/lib/data/deities/fetchFilteredDeities";
import { fetchFilteredMagicItems } from "@/app/lib/data/magicitems/fetchFilteredMagicItems";
import { fetchFilteredNpc } from "@/app/lib/data/npc/fetchFilteredNpc";
import { fetchFilteredSpells } from "@/app/lib/data/spells/fetchFilteredSpells";
import { fetchFilteredFactions } from "@/app/lib/data/faction/fetchFilteredFactions";
import { fetchFilteredTreasures } from "@/app/lib/data/treasure/fetchFilteredTreasures";
import { fetchFilteredDhDomains } from "@/app/lib/data/dhDomains/fetchFilteredDhDomains";
import { fetchFilteredDhDomainCards } from "@/app/lib/data/dhDomainCards/fetchFilteredDhDomainCards";
import { fetchFilteredDhClasses } from "@/app/lib/data/dhClasses/fetchFilteredDhClasses";
import { fetchFilteredDhSubclasses } from "@/app/lib/data/dhSubclasses/fetchFilteredDhSubclasses";
import { fetchFilteredDhAncestries } from "@/app/lib/data/dhAncestries/fetchFilteredDhAncestries";
import { fetchFilteredDhCommunities } from "@/app/lib/data/dhCommunities/fetchFilteredDhCommunities";
import { fetchFilteredDhAdversaries } from "@/app/lib/data/dhAdversaries/fetchFilteredDhAdversaries";
import { fetchFilteredDhEnvironments } from "@/app/lib/data/dhEnvironments/fetchFilteredDhEnvironments";
import { fetchFilteredDhWeapons } from "@/app/lib/data/dhWeapons/fetchFilteredDhWeapons";
import { fetchFilteredDhArmor } from "@/app/lib/data/dhArmor/fetchFilteredDhArmor";
import { fetchFilteredDhLoot } from "@/app/lib/data/dhLoot/fetchFilteredDhLoot";

/**
 * One page of a domain's list, filtered by `searchParams` — the rows the
 * admin list shows (`EntityList`) and the Markdown export reads (SPEC-033
 * T1), through the same `fetchFiltered*` reader each domain declares.
 *
 * Kept as an explicit switch rather than a lookup table in `listConfig`. The
 * config lives in `app/lib/config/`, the fetches in `app/lib/data/`, and the
 * data layer already imports the config — pointing the config back at the data
 * layer would close that loop for no benefit.
 */
const fetchDomainItems = (
  pageType: PageType,
  searchParams: SearchParamsInput
) => {
  switch (pageType) {
    case PageType.Spell:
      return fetchFilteredSpells(searchParams);
    case PageType.Npc:
      return fetchFilteredNpc(searchParams);
    case PageType.Deity:
      return fetchFilteredDeities(searchParams);
    case PageType.MagicItem:
      return fetchFilteredMagicItems(searchParams);
    case PageType.Faction:
      return fetchFilteredFactions(searchParams);
    case PageType.Treasure:
      return fetchFilteredTreasures(searchParams);
    case PageType.DhDomain:
      return fetchFilteredDhDomains(searchParams);
    case PageType.DhDomainCard:
      return fetchFilteredDhDomainCards(searchParams);
    case PageType.DhClass:
      return fetchFilteredDhClasses(searchParams);
    case PageType.DhSubclass:
      return fetchFilteredDhSubclasses(searchParams);
    case PageType.DhAncestry:
      return fetchFilteredDhAncestries(searchParams);
    case PageType.DhCommunity:
      return fetchFilteredDhCommunities(searchParams);
    case PageType.DhAdversary:
      return fetchFilteredDhAdversaries(searchParams);
    case PageType.DhEnvironment:
      return fetchFilteredDhEnvironments(searchParams);
    case PageType.DhWeapon:
      return fetchFilteredDhWeapons(searchParams);
    case PageType.DhArmor:
      return fetchFilteredDhArmor(searchParams);
    case PageType.DhLoot:
      return fetchFilteredDhLoot(searchParams);
  }
};

/**
 * The rows widened to `ListItem`: each branch above is exactly typed, but a
 * consumer that reads fields by their metadata key cannot use seventeen
 * domain types, so the one widening happens here rather than at each caller.
 */
export default async function fetchListItems(
  pageType: PageType,
  searchParams: SearchParamsInput
): Promise<ListItem[]> {
  return (await fetchDomainItems(
    pageType,
    searchParams
  )) as unknown as ListItem[];
}
