"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import pageMetaFields from "@/app/lib/config/pageMetaFields";
import DhEnvironmentMetaField from "@/app/lib/definitions/enums/daggerheart/DhEnvironmentMetaField";
import DhEnvironment from "@/app/lib/definitions/interfaces/daggerheart/DhEnvironment";
import resolveFieldValue from "@/app/lib/utils/data/resolveFieldValue";
import RecordThumbnail from "../components/RecordThumbnail";
import CardListViewSwitch, {
  cardListView,
  VIEW_PARAM,
} from "../daggerheart/CardListViewSwitch";
import DhEnvironmentStatBlock from "./DhEnvironmentStatBlock";

/**
 * The environment list (SPEC-028 T3): rows by default, or the stat blocks
 * with `?view=cards`.
 */
export default function DhEnvironmentLibrary(props: {
  items: DhEnvironment[];
}) {
  const t = useTranslations();
  const view = cardListView(useSearchParams().get(VIEW_PARAM));
  const show = (field: DhEnvironmentMetaField, value: string | number) =>
    resolveFieldValue(pageMetaFields[field], value, t);

  return (
    <div className="w-full pt-5">
      <div className="mb-4 flex justify-end">
        <CardListViewSwitch />
      </div>
      {view === "cards" ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {props.items.map((item) => (
            <DhEnvironmentStatBlock
              key={item.id}
              environment={item}
              headingLevel="h2"
            />
          ))}
        </div>
      ) : (
        <ul
          data-testid="dh-environment-rows"
          className="divide-y divide-gray-200 rounded-lg bg-white"
        >
          {props.items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center gap-x-6 gap-y-1 px-4 py-3 text-sm"
            >
              <RecordThumbnail image={item.image} name={item.name} />
              <span className="min-w-40 flex-1 font-semibold">{item.name}</span>
              <span>{show(DhEnvironmentMetaField.tier, item.tier)}</span>
              <span>
                {show(
                  DhEnvironmentMetaField.environmentType,
                  item.environmentType
                )}
              </span>
              <span>
                {t("daggerheart.fields.difficulty.label")} {item.difficulty}
              </span>
              <span>{show(DhEnvironmentMetaField.origin, item.origin)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
