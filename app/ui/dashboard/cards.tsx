import {
  UserGroupIcon,
  BuildingLibraryIcon,
  BookOpenIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";
import { lusitana } from "@/app/ui/fonts";
import { fetchCardData } from "@/app/lib/data";

const iconMap = {
  magicitems: TrophyIcon,
  png: UserGroupIcon,
  spells: BookOpenIcon,
  deities: BuildingLibraryIcon,
};

export default async function CardWrapper() {
  const { numberOfmagicItems, numberOfPng, numberOfSpells, numberOfDeities } =
    await fetchCardData();

  return (
    <>
      <Card title="Magic Items" value={numberOfmagicItems} type="magicitems" />
      <Card title="Png" value={numberOfPng} type="png" />
      <Card title="Spells" value={numberOfSpells} type="spells" />
      <Card title="Deities" value={numberOfDeities} type="deities" />
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
  type: "magicitems" | "png" | "spells" | "deities";
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
