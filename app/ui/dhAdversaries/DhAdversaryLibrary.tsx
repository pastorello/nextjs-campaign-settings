"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import pageMetaFields from "@/app/lib/config/pageMetaFields";
import DhAdversaryMetaField from "@/app/lib/definitions/enums/daggerheart/DhAdversaryMetaField";
import DhAdversary from "@/app/lib/definitions/interfaces/daggerheart/DhAdversary";
import resolveFieldValue from "@/app/lib/utils/data/resolveFieldValue";
import RecordThumbnail from "../components/RecordThumbnail";
import CardListViewSwitch, {
  cardListView,
  VIEW_PARAM,
} from "../daggerheart/CardListViewSwitch";
import DhAdversaryStatBlock from "./DhAdversaryStatBlock";

/**
 * The adversary list (SPEC-028 T2): rows by default, or the stat blocks
 * with `?view=cards`, as SPEC-027's catalogues do.
 */
export default function DhAdversaryLibrary(props: { items: DhAdversary[] }) {
  const t = useTranslations();
  const view = cardListView(useSearchParams().get(VIEW_PARAM));
  const show = (field: DhAdversaryMetaField, value: string | number) =>
    resolveFieldValue(pageMetaFields[field], value, t);

  return (
    <div className="w-full pt-5">
      <div className="mb-4 flex justify-end">
        <CardListViewSwitch />
      </div>
      {view === "cards" ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {props.items.map((item) => (
            <DhAdversaryStatBlock
              key={item.id}
              adversary={item}
              headingLevel="h2"
            />
          ))}
        </div>
      ) : (
        <ul
          data-testid="dh-adversary-rows"
          className="divide-y divide-gray-200 rounded-lg bg-white"
        >
          {props.items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center gap-x-6 gap-y-1 px-4 py-3 text-sm"
            >
              <RecordThumbnail image={item.image} name={item.name} />
              <span className="min-w-40 flex-1 font-semibold">{item.name}</span>
              <span>{show(DhAdversaryMetaField.tier, item.tier)}</span>
              <span>
                {show(DhAdversaryMetaField.adversaryType, item.adversaryType)}
              </span>
              <span>
                {t("daggerheart.fields.difficulty.label")} {item.difficulty}
              </span>
              <span>{show(DhAdversaryMetaField.origin, item.origin)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
