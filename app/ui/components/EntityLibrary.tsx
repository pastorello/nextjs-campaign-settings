import { ReactNode } from "react";

import PageType from "@/app/lib/definitions/types/PageType";
import { SearchParamsInput } from "@/app/lib/data/validateParams";

import { fetchFilteredDeities } from "@/app/lib/data/deities/fetchFilteredDeities";
import { fetchFilteredMagicItems } from "@/app/lib/data/magicitems/fetchFilteredMagicItems";
import { fetchFilteredNpc } from "@/app/lib/data/npc/fetchFilteredNpc";
import { fetchFilteredSpells } from "@/app/lib/data/spells/fetchFilteredSpells";
import { fetchFilteredFactions } from "@/app/lib/data/faction/fetchFilteredFactions";
import fetchFactionRosters from "@/app/lib/data/faction/fetchFactionRosters";
import { fetchFilteredTreasures } from "@/app/lib/data/treasure/fetchFilteredTreasures";
import { fetchFilteredDhDomains } from "@/app/lib/data/dhDomains/fetchFilteredDhDomains";
import { fetchFilteredDhDomainCards } from "@/app/lib/data/dhDomainCards/fetchFilteredDhDomainCards";
import { fetchFilteredDhClasses } from "@/app/lib/data/dhClasses/fetchFilteredDhClasses";
import fetchFieldOptions from "@/app/lib/data/options/fetchFieldOptions";

import fetchDerivedAncestry from "@/app/lib/data/maps/fetchDerivedAncestry";
import { toDerivedPlacements } from "@/app/modules/maps/lib/utils/deriveEntityAncestry";
import type { LinkableEntityType } from "@/app/modules/maps/types/poi";

import DeityLibrary from "../deities/DeityLibrary";
import MagicItemLibrary from "../magicitems/MagicItemLibrary";
import NpcLibrary from "../npc/NpcLibrary";
import SpellLibrary from "../spells/SpellLibrary";
import FactionLibrary from "../factions/FactionLibrary";
import TreasureLibrary from "../treasures/TreasureLibrary";
import DhDomainLibrary from "../dhDomains/DhDomainLibrary";
import DhDomainCardLibrary from "../dhDomainCards/DhDomainCardLibrary";
import DhClassLibrary from "../dhClasses/DhClassLibrary";
import ResolvedRecordLinks from "../richText/ResolvedRecordLinks";
import richTextValuesOf from "@/app/lib/utils/richText/richTextValuesOf";

/**
 * Where each record sits in the world tree (SPEC-004 T5a), resolved here
 * because the libraries below are client components and cannot await.
 * Reduced to plain strings before it crosses that boundary — see
 * `toDerivedPlacements`.
 */
const placementsFor = async (linkedType: LinkableEntityType) =>
  toDerivedPlacements(await fetchDerivedAncestry(linkedType));

/**
 * Fetches a domain's rows and hands them to its card library (TD-30).
 *
 * **This exists so the `<Suspense>` around it can actually trigger.** The four
 * public list pages used to await the query themselves and then wrap the
 * resolved array in a boundary — nothing inside suspended, so the fallback was
 * unreachable and the page simply blocked until every row was ready. With a
 * 361-spell library that is the whole page waiting on the whole table.
 *
 * The libraries are client components (they own the filter controls), so they
 * cannot await anything themselves. This is the server half: it suspends on
 * the query, and the client half renders once the rows land — the same split
 * `EntityList` already uses on the admin side.
 */
export default async function EntityLibrary(props: {
  pageType: PageType;
  /** The route's game system: record links resolve within it (SPEC-019). */
  system: string;
  searchParams?: SearchParamsInput | undefined;
}) {
  // The fetch happens inside each branch rather than once above it: the four
  // functions return four different domain types, and a single call site would
  // have to widen them to `ListItem[]` and cast back. This way every branch is
  // exactly typed and there is no assertion anywhere in the file.
  const searchParams = props.searchParams ?? {};
  const { pageType, system } = props;

  // The cards render formatted descriptions: their record links resolve in
  // one batch over the rows shown (SPEC-019 T5).
  const withRecordLinks = (items: readonly object[], library: ReactNode) => (
    <ResolvedRecordLinks
      values={richTextValuesOf(pageType, items)}
      system={system}
    >
      {library}
    </ResolvedRecordLinks>
  );

  switch (pageType) {
    case PageType.Spell: {
      const items = await fetchFilteredSpells(searchParams);
      return withRecordLinks(items, <SpellLibrary items={items} />);
    }
    case PageType.Npc: {
      const items = await fetchFilteredNpc(searchParams);
      return withRecordLinks(
        items,
        <NpcLibrary
          items={items}
          placements={await placementsFor("npc")}
          optionBundle={{ faction: await fetchFieldOptions("faction") }}
        />
      );
    }
    case PageType.Deity:
      return (
        <DeityLibrary
          items={await fetchFilteredDeities(searchParams)}
          placements={await placementsFor("deity")}
        />
      );
    case PageType.MagicItem: {
      const items = await fetchFilteredMagicItems(searchParams);
      return withRecordLinks(items, <MagicItemLibrary items={items} />);
    }
    case PageType.Faction: {
      const items = await fetchFilteredFactions(searchParams);
      return withRecordLinks(
        items,
        <FactionLibrary items={items} rosters={await fetchFactionRosters()} />
      );
    }
    case PageType.Treasure: {
      const items = await fetchFilteredTreasures(searchParams);
      return withRecordLinks(items, <TreasureLibrary items={items} />);
    }
    case PageType.DhDomain: {
      const items = await fetchFilteredDhDomains(searchParams);
      return withRecordLinks(items, <DhDomainLibrary items={items} />);
    }
    case PageType.DhDomainCard: {
      const items = await fetchFilteredDhDomainCards(searchParams);
      return withRecordLinks(items, <DhDomainCardLibrary items={items} />);
    }
    case PageType.DhClass: {
      const items = await fetchFilteredDhClasses(searchParams);
      return withRecordLinks(
        items,
        <DhClassLibrary
          items={items}
          optionBundle={{ dhDomain: await fetchFieldOptions("dhDomain") }}
        />
      );
    }
    // No public list: a subclass is shown on its class's page (SPEC-021 T6).
    case PageType.DhSubclass:
      return null;
  }
}
