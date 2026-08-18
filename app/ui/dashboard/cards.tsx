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
import fetchCardData from "@/app/lib/data/fetchCardData";

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

export default async function CardWrapper() {
  const t = await getTranslations("common.cards");
  const {
    numberOfmagicItems,
    numberOfNpc,
    numberOfSpells,
    numberOfDeities,
    numberOfPlaces,
    numberOfFactions,
  } = await fetchCardData();

  return (
    <>
      <Card
        title={t("magicItems")}
        value={numberOfmagicItems}
        type="magicitems"
      />
      <Card title={t("npc")} value={numberOfNpc} type="npc" />
      <Card title={t("spells")} value={numberOfSpells} type="spells" />
      <Card title={t("deities")} value={numberOfDeities} type="deities" />
      <Card title={t("places")} value={numberOfPlaces} type="places" />
      <Card title={t("factions")} value={numberOfFactions} type="factions" />
    </>
  );
}

export function Card({
  title,
  value,
  type,
}: {
  title: string;
  value: number | string;
  type: CardType;
}) {
  const Icon = iconMap[type];

  return (
    <div className="rounded-xl bg-gray-50 p-2 shadow-sm">
      <div className="flex p-4">
        {Icon ? <Icon className="h-5 w-5 text-gray-700" /> : null}
        <h3 className="ml-2 text-sm font-medium">{title}</h3>
      </div>
      <p
        className={`${lusitana.className}
          truncate rounded-xl bg-white px-4 py-8 text-center text-2xl`}
      >
        {value}
      </p>
    </div>
  );
}
