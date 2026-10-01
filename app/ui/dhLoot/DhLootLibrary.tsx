"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import pageMetaFields from "@/app/lib/config/pageMetaFields";
import DhLootMetaField from "@/app/lib/definitions/enums/daggerheart/DhLootMetaField";
import DhLoot from "@/app/lib/definitions/interfaces/daggerheart/DhLoot";
import resolveFieldValue from "@/app/lib/utils/data/resolveFieldValue";
import RecordThumbnail from "../components/RecordThumbnail";
import CardListViewSwitch, {
  cardListView,
  VIEW_PARAM,
} from "../daggerheart/CardListViewSwitch";
import DhLootCard from "./DhLootCard";

/**
 * The loot list (SPEC-029 T4): rows by default, or the cards with
 * `?view=cards`.
 */
export default function DhLootLibrary(props: { items: DhLoot[] }) {
  const t = useTranslations();
  const view = cardListView(useSearchParams().get(VIEW_PARAM));
  const show = (field: DhLootMetaField, value: string | number) =>
    resolveFieldValue(pageMetaFields[field], value, t);

  return (
    <div className="w-full pt-5">
      <div className="mb-4 flex justify-end">
        <CardListViewSwitch />
      </div>
      {view === "cards" ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {props.items.map((item) => (
            <DhLootCard key={item.id} loot={item} headingLevel="h2" />
          ))}
        </div>
      ) : (
        <ul
          data-testid="dh-loot-rows"
          className="divide-y divide-gray-200 rounded-lg bg-white"
        >
          {props.items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center gap-x-6 gap-y-1 px-4 py-3 text-sm"
            >
              <RecordThumbnail image={item.image} name={item.name} />
              <span className="min-w-40 flex-1 font-semibold">{item.name}</span>
              <span>{item.rollValue ?? "—"}</span>
              <span>{show(DhLootMetaField.kind, item.lootKind)}</span>
              <span>{show(DhLootMetaField.rarity, item.lootRarity)}</span>
              <span>{show(DhLootMetaField.origin, item.origin)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
