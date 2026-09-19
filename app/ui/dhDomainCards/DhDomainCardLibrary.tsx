"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import pageMetaFields from "@/app/lib/config/pageMetaFields";
import DhDomainCardMetaField from "@/app/lib/definitions/enums/daggerheart/DhDomainCardMetaField";
import DhDomainCard from "@/app/lib/definitions/interfaces/daggerheart/DhDomainCard";
import resolveFieldValue from "@/app/lib/utils/data/resolveFieldValue";
import SelectButtonery from "../buttons/SelectButtonery";
import DhDomainCardView from "./DhDomainCardView";
import DhDomainCardViewSwitch, {
  dhDomainCardListView,
  VIEW_PARAM,
} from "./DhDomainCardViewSwitch";

/**
 * The public domain card list (SPEC-021 T3): level and type filters, and a
 * switch between compact rows and a grid of card views, kept in the URL.
 */
export default function DhDomainCardLibrary(props: { items: DhDomainCard[] }) {
  const t = useTranslations();
  const view = dhDomainCardListView(useSearchParams().get(VIEW_PARAM));

  return (
    <div className="w-full pt-5">
      <div className="mb-2 grid grid-cols-6 gap-2 lg:grid-cols-11">
        <SelectButtonery fieldKey={DhDomainCardMetaField.cardLevel} />
      </div>
      <div className="mb-4 grid grid-cols-4 gap-2">
        <SelectButtonery fieldKey={DhDomainCardMetaField.cardType} />
      </div>
      <div className="mb-4 flex justify-end">
        <DhDomainCardViewSwitch />
      </div>
      {view === "cards" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {props.items.map(
            (item) =>
              item.domain && (
                <DhDomainCardView
                  key={item.id}
                  card={item}
                  domain={item.domain}
                  headingLevel="h2"
                />
              )
          )}
        </div>
      ) : (
        <ul
          data-testid="dh-domain-card-rows"
          className="divide-y divide-gray-200 rounded-lg bg-white"
        >
          {props.items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center gap-x-6 gap-y-1 px-4 py-3 text-sm"
            >
              <span className="min-w-40 flex-1 font-semibold">{item.name}</span>
              <span>{item.domain?.name}</span>
              <span>
                {t("dhDomainCards.card.level", { level: item.cardLevel })}
              </span>
              <span>
                {resolveFieldValue(
                  pageMetaFields[DhDomainCardMetaField.cardType],
                  item.cardType,
                  t
                )}
              </span>
              <span>
                {t("dhDomainCards.fields.recallCost.label")}: {item.recallCost}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
