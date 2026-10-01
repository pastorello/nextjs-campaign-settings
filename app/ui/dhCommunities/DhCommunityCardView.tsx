import { useTranslations } from "next-intl";

import pageMetaFields from "@/app/lib/config/pageMetaFields";
import DhCommunityMetaField from "@/app/lib/definitions/enums/daggerheart/DhCommunityMetaField";
import DhCommunity from "@/app/lib/definitions/interfaces/daggerheart/DhCommunity";
import useGameSystem from "@/app/lib/hooks/useGameSystem";
import { dashboardPath } from "@/i18n/dashboardPath";
import { Link } from "@/i18n/navigation";
import HeritageCardView from "../daggerheart/HeritageCardView";

/**
 * A community as a card (SPEC-027 §5.3): its adjectives, the places and
 * factions it belongs to as links into the world, then its feature.
 */
export default function DhCommunityCardView({
  community,
  headingLevel,
}: {
  community: DhCommunity;
  headingLevel?: "h2" | "h3" | "h4";
}) {
  const t = useTranslations("dhCommunities");
  const system = useGameSystem();
  const places = community.places ?? [];
  const factions = community.factions ?? [];

  return (
    <HeritageCardView
      name={community.name}
      image={community.image}
      imageAlt={t("card.imageAlt", { name: community.name })}
      testId="dh-community-card-view"
      {...(headingLevel && { headingLevel })}
      features={[
        {
          name: community.communityFeatureName,
          text: pageMetaFields[DhCommunityMetaField.featureText].getDatum(
            community.communityFeatureText
          ),
        },
      ]}
    >
      {community.adjectives && (
        <p className="italic text-gray-700">{community.adjectives}</p>
      )}
      {(places.length > 0 || factions.length > 0) && (
        <dl className="flex flex-col gap-1">
          {places.length > 0 && (
            <div className="flex flex-wrap gap-x-2">
              <dt className="font-medium text-gray-600">
                {t("fields.placeIds.label")}:
              </dt>
              {places.map((place) => (
                <dd key={place.id}>
                  <Link
                    href={dashboardPath(system, `/geography?place=${place.id}`)}
                    className="text-blue-700 underline"
                  >
                    {place.name}
                  </Link>
                </dd>
              ))}
            </div>
          )}
          {factions.length > 0 && (
            <div className="flex flex-wrap gap-x-2">
              <dt className="font-medium text-gray-600">
                {t("fields.factionIds.label")}:
              </dt>
              {factions.map((faction) => (
                <dd key={faction.id}>
                  <Link
                    href={dashboardPath(
                      system,
                      `/factions?query=${encodeURIComponent(faction.name)}`
                    )}
                    className="text-blue-700 underline"
                  >
                    {faction.name}
                  </Link>
                </dd>
              ))}
            </div>
          )}
        </dl>
      )}
    </HeritageCardView>
  );
}
