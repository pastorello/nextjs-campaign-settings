import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { dashboardPath } from "@/i18n/dashboardPath";
import type { CampaignCard } from "@/app/lib/data/campaigns/fetchCampaigns";
import type GameSystem from "@/app/lib/definitions/GameSystem";
import richTextToPlainText from "@/app/lib/utils/richText/richTextToPlainText";

interface CampaignListProps {
  campaigns: CampaignCard[];
  system: GameSystem;
}

/**
 * The campaign list's cards (SPEC-032 §5.1): title, synopsis, number of
 * players and of adventures, each card the link to that campaign's page.
 * The synopsis is formatted text (SPEC-019 T5), reduced to its words and
 * clamped — a card is a pointer, the page holds the full text.
 */
export default function CampaignList({ campaigns, system }: CampaignListProps) {
  const t = useTranslations("campaign.list");

  return (
    <ul className="grid gap-4 sm:grid-cols-2" data-testid="campaign-list">
      {campaigns.map((campaign) => (
        <li key={campaign.id}>
          <Link
            href={dashboardPath(system, `/campaign/${campaign.id}`)}
            className="block h-full rounded-md border border-gray-200 p-4 hover:border-blue-600"
          >
            <h2 className="text-lg font-semibold">{campaign.title}</h2>
            {campaign.synopsis && (
              <p className="mt-1 line-clamp-3 text-sm text-gray-700">
                {richTextToPlainText(campaign.synopsis)}
              </p>
            )}
            <p className="mt-2 text-sm text-gray-600">
              {t("players", { count: campaign.partySize })}
              {" · "}
              {t("adventures", { count: campaign.adventureCount })}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
