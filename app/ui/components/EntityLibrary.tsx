import PageType from "@/app/lib/definitions/types/PageType";
import { SearchParamsInput } from "@/app/lib/data/validateParams";

import { fetchFilteredDeities } from "@/app/lib/data/deities/fetchFilteredDeities";
import { fetchFilteredMagicItems } from "@/app/lib/data/magicitems/fetchFilteredMagicItems";
import { fetchFilteredNpc } from "@/app/lib/data/npc/fetchFilteredNpc";
import { fetchFilteredSpells } from "@/app/lib/data/spells/fetchFilteredSpells";

import DeityLibrary from "../deities/DeityLibrary";
import MagicItemLibrary from "../magicitems/MagicItemLibrary";
import NpcLibrary from "../npc/NpcLibrary";
import SpellLibrary from "../spells/SpellLibrary";

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
  searchParams?: SearchParamsInput | undefined;
}) {
  // The fetch happens inside each branch rather than once above it: the four
  // functions return four different domain types, and a single call site would
  // have to widen them to `ListItem[]` and cast back. This way every branch is
  // exactly typed and there is no assertion anywhere in the file.
  const searchParams = props.searchParams ?? {};

  switch (props.pageType) {
    case PageType.Spell:
      return <SpellLibrary items={await fetchFilteredSpells(searchParams)} />;
    case PageType.Npc:
      return <NpcLibrary items={await fetchFilteredNpc(searchParams)} />;
    case PageType.Deity:
      return <DeityLibrary items={await fetchFilteredDeities(searchParams)} />;
    case PageType.MagicItem:
      return (
        <MagicItemLibrary items={await fetchFilteredMagicItems(searchParams)} />
      );
  }
}
