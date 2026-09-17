import { getTranslations } from "next-intl/server";
import { Metadata } from "next";

import fetchCampaign from "@/app/lib/data/campaigns/fetchCampaign";
import fetchAdventureSceneProgress from "@/app/lib/data/campaigns/fetchAdventureSceneProgress";
import CampaignForm from "@/app/ui/campaigns/CampaignForm";
import CampaignHeader from "@/app/ui/campaigns/CampaignHeader";
import AdventureLadder from "@/app/ui/campaigns/AdventureLadder";
import PageTitle from "@/app/ui/typography/PageTitle";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("campaign.page");
  return { title: t("title") };
}

/**
 * The campaign page (SPEC-013 §5.1/§5.2, T7): an empty state that creates
 * the DM's one campaign, or the campaign's own fields plus its adventure
 * ladder once it exists. Outside the metadata layer (ADR-0011) — bespoke
 * components under `app/ui/campaigns/`, the same "root exists?" shape
 * `world/page.tsx` already uses for SPEC-004's single root place.
 */
export default async function CampaignPage() {
  const t = await getTranslations("campaign");
  const campaign = await fetchCampaign();

  if (!campaign) {
    return (
      <div>
        <PageTitle className="mb-4">{t("page.title")}</PageTitle>
        <p className="mb-4">{t("emptyState.description")}</p>
        <CampaignForm />
      </div>
    );
  }

  const progress = await fetchAdventureSceneProgress(
    campaign.adventures.map((adventure) => adventure.id)
  );

  return (
    <div>
      <CampaignHeader campaign={campaign} />
      <AdventureLadder
        campaignId={campaign.id}
        adventures={campaign.adventures}
        progress={progress}
      />
    </div>
  );
}
