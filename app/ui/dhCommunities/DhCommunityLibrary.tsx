"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import pageMetaFields from "@/app/lib/config/pageMetaFields";
import DhCommunityMetaField from "@/app/lib/definitions/enums/daggerheart/DhCommunityMetaField";
import DhCommunity from "@/app/lib/definitions/interfaces/daggerheart/DhCommunity";
import resolveFieldValue from "@/app/lib/utils/data/resolveFieldValue";
import RecordThumbnail from "../components/RecordThumbnail";
import CardListViewSwitch, {
  cardListView,
  VIEW_PARAM,
} from "../daggerheart/CardListViewSwitch";
import DhCommunityCardView from "./DhCommunityCardView";

/**
 * The public community list (SPEC-027 T3): rows by default, or a grid of
 * card views with `?view=cards`.
 */
export default function DhCommunityLibrary(props: { items: DhCommunity[] }) {
  const t = useTranslations();
  const view = cardListView(useSearchParams().get(VIEW_PARAM));

  return (
    <div className="w-full pt-5">
      <div className="mb-4 flex justify-end">
        <CardListViewSwitch />
      </div>
      {view === "cards" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {props.items.map((item) => (
            <DhCommunityCardView
              key={item.id}
              community={item}
              headingLevel="h2"
            />
          ))}
        </div>
      ) : (
        <ul
          data-testid="dh-community-rows"
          className="divide-y divide-gray-200 rounded-lg bg-white"
        >
          {props.items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center gap-x-6 gap-y-1 px-4 py-3 text-sm"
            >
              <RecordThumbnail image={item.image} name={item.name} />
              <span className="min-w-40 flex-1 font-semibold">{item.name}</span>
              <span>{item.communityFeatureName}</span>
              <span>
                {(item.places ?? []).map((place) => place.name).join(", ")}
              </span>
              <span>
                {resolveFieldValue(
                  pageMetaFields[DhCommunityMetaField.origin],
                  item.origin,
                  t
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
