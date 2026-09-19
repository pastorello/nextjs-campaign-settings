import {
  UserGroupIcon,
  BuildingLibraryIcon,
  BookOpenIcon,
  TrophyIcon,
  MapIcon,
  FlagIcon,
} from "@heroicons/react/24/outline";
import { getTranslations } from "next-intl/server";
import { lusitana } from "@/app/ui/fonts";
import { Link } from "@/i18n/navigation";
import { dashboardPath } from "@/i18n/dashboardPath";
import type GameSystem from "@/app/lib/definitions/GameSystem";
import fetchCardData from "@/app/lib/data/fetchCardData";
import isPageInSystem from "@/app/lib/config/isPageInSystem";
import PageType from "@/app/lib/definitions/types/PageType";

type CardType =
  "magicitems" | "npc" | "spells" | "deities" | "places" | "factions";

const iconMap: Record<CardType, typeof TrophyIcon> = {
  magicitems: TrophyIcon,
  npc: UserGroupIcon,
  spells: BookOpenIcon,
  deities: BuildingLibraryIcon,
  places: MapIcon,
  factions: FlagIcon,
};

// Places live under the "geography" route (TD-92) — the domain's list page
// predates this card and was never renamed to match.
const pathMap: Record<CardType, `/${string}`> = {
  magicitems: "/magicitems",
  npc: "/npc",
  spells: "/spells",
  deities: "/deities",
  places: "/geography",
  factions: "/factions",
};

const cardPage: Record<CardType, PageType | null> = {
  magicitems: PageType.MagicItem,
  npc: PageType.Npc,
  spells: PageType.Spell,
  deities: PageType.Deity,
  places: null,
  factions: PageType.Faction,
};

export default async function CardWrapper({ system }: { system: GameSystem }) {
  const t = await getTranslations("common.cards");
  const {
    numberOfmagicItems,
    numberOfNpc,
    numberOfSpells,
    numberOfDeities,
    numberOfPlaces,
    numberOfFactions,
  } = await fetchCardData();

  const cards: { type: CardType; title: string; value: number }[] = [
    { type: "magicitems", title: t("magicItems"), value: numberOfmagicItems },
    { type: "npc", title: t("npc"), value: numberOfNpc },
    { type: "spells", title: t("spells"), value: numberOfSpells },
    { type: "deities", title: t("deities"), value: numberOfDeities },
    { type: "places", title: t("places"), value: numberOfPlaces },
    { type: "factions", title: t("factions"), value: numberOfFactions },
  ];

  return (
    <>
      {cards
        .filter(({ type }) => isCardInSystem(type, system))
        .map(({ type, title, value }) => (
          <Card
            key={type}
            title={title}
            value={value}
            type={type}
            system={system}
          />
        ))}
    </>
  );
}

/**
 * A card links to a list page, so it is shown only where that page exists
 * (ADR-0013 rule 4): the 5e catalogues' counts are not on Daggerheart's
 * overview. Places have no `pagesConfig` page; they are the world, shared.
 */
function isCardInSystem(type: CardType, system: GameSystem): boolean {
  const page = cardPage[type];
  return page === null || isPageInSystem(page, system);
}

export function Card({
  title,
  value,
  type,
  system,
}: {
  title: string;
  value: number | string;
  type: CardType;
  system: GameSystem;
}) {
  const Icon = iconMap[type];

  return (
    <Link
      href={dashboardPath(system, pathMap[type])}
      className="block rounded-xl bg-gray-50 p-2 shadow-sm transition-colors hover:bg-gray-100"
    >
      <div className="flex p-4">
        {Icon ? <Icon className="h-5 w-5 text-gray-700" /> : null}
        <h2 className="ml-2 text-sm font-medium">{title}</h2>
      </div>
      <p
        className={`${lusitana.className}
          truncate rounded-xl bg-white px-4 py-8 text-center text-2xl`}
      >
        {value}
      </p>
    </Link>
  );
}
