import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { notFound } from "next/navigation";

import { isGameSystem } from "@/app/lib/definitions/GameSystem";
import fetchCampaigns from "@/app/lib/data/campaigns/fetchCampaigns";
import CampaignForm from "@/app/ui/campaigns/CampaignForm";
import CampaignList from "@/app/ui/campaigns/CampaignList";
import PageTitle from "@/app/ui/typography/PageTitle";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("campaign.page");
  return { title: t("title") };
}

/**
 * The campaign list (SPEC-032 §5.1): one card per campaign of the route
 * system, each opening its own page, and the form that creates another.
 * With none, the empty-state sentence above the same form. Outside the
 * metadata layer (ADR-0011), like the campaign page.
 *
 * A system with one campaign still shows the list; it does not open on
 * its own (§5.1's edge cases).
 */
export default async function CampaignListPage({
  params,
}: PageProps<"/[locale]/dashboard/[system]/campaign">) {
  const { system } = await params;
  // `[system]/layout.tsx` has already 404ed this; the guard narrows the type.
  if (!isGameSystem(system)) notFound();

  const [t, campaigns] = await Promise.all([
    getTranslations("campaign"),
    fetchCampaigns(system),
  ]);

  return (
    <div>
      <PageTitle className="mb-4">{t("page.title")}</PageTitle>
      {campaigns.length === 0 ? (
        <p className="mb-4">{t("emptyState.description")}</p>
      ) : (
        <CampaignList campaigns={campaigns} system={system} />
      )}
      <h2 className="mb-2 mt-6 text-lg font-semibold">{t("list.create")}</h2>
      <CampaignForm />
    </div>
  );
}
