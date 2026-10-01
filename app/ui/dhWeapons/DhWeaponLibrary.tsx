"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import pageMetaFields from "@/app/lib/config/pageMetaFields";
import DhWeaponMetaField from "@/app/lib/definitions/enums/daggerheart/DhWeaponMetaField";
import DhWeapon from "@/app/lib/definitions/interfaces/daggerheart/DhWeapon";
import resolveFieldValue from "@/app/lib/utils/data/resolveFieldValue";
import RecordThumbnail from "../components/RecordThumbnail";
import CardListViewSwitch, {
  cardListView,
  VIEW_PARAM,
} from "../daggerheart/CardListViewSwitch";
import DhWeaponCard from "./DhWeaponCard";

/**
 * The weapon list (SPEC-029 T2): rows by default, or the cards with
 * `?view=cards`.
 */
export default function DhWeaponLibrary(props: { items: DhWeapon[] }) {
  const t = useTranslations();
  const view = cardListView(useSearchParams().get(VIEW_PARAM));
  const show = (field: DhWeaponMetaField, value: string | number) =>
    resolveFieldValue(pageMetaFields[field], value, t);

  return (
    <div className="w-full pt-5">
      <div className="mb-4 flex justify-end">
        <CardListViewSwitch />
      </div>
      {view === "cards" ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {props.items.map((item) => (
            <DhWeaponCard key={item.id} weapon={item} headingLevel="h2" />
          ))}
        </div>
      ) : (
        <ul
          data-testid="dh-weapon-rows"
          className="divide-y divide-gray-200 rounded-lg bg-white"
        >
          {props.items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center gap-x-6 gap-y-1 px-4 py-3 text-sm"
            >
              <RecordThumbnail image={item.image} name={item.name} />
              <span className="min-w-40 flex-1 font-semibold">{item.name}</span>
              <span>{show(DhWeaponMetaField.tier, item.tier)}</span>
              <span>{show(DhWeaponMetaField.slot, item.weaponSlot)}</span>
              <span>{show(DhWeaponMetaField.trait, item.weaponTrait)}</span>
              <span>{show(DhWeaponMetaField.range, item.weaponRange)}</span>
              <span>{show(DhWeaponMetaField.origin, item.origin)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
