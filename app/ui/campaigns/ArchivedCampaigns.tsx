"use client";

import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";

import restoreCampaign from "@/app/lib/data/campaigns/restoreCampaign";
import type { ArchivedCampaign } from "@/app/lib/data/campaigns/fetchArchivedCampaigns";
import { notifyError, notifySuccess } from "@/app/lib/notifications/notify";
import { resolveFirstFieldError } from "@/app/lib/utils/i18n/resolveFieldErrors";
import { dashboardPath } from "@/i18n/dashboardPath";
import { Link, useRouter } from "@/i18n/navigation";
import type GameSystem from "@/app/lib/definitions/GameSystem";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonSize from "@/app/ui/buttons/BaseButton/ButtonSize";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";

interface ArchivedCampaignsProps {
  campaigns: ArchivedCampaign[];
  system: GameSystem;
}

/**
 * The list's collapsed section of archived campaigns (SPEC-032 §5.1,
 * §5.6): each links to its page, says when it was put away and has a
 * "Riattiva" action. Renders nothing when none is archived.
 */
export default function ArchivedCampaigns({
  campaigns,
  system,
}: ArchivedCampaignsProps) {
  const t = useTranslations("campaign.list.archived");
  const tRoot = useTranslations();
  const format = useFormatter();
  const router = useRouter();
  const [busyId, setBusyId] = useState<number | null>(null);

  if (campaigns.length === 0) return null;

  async function restore(campaignId: number) {
    setBusyId(campaignId);
    try {
      const result = await restoreCampaign({ campaignId });
      if (!result.ok) {
        notifyError(
          resolveFirstFieldError(result.errors, tRoot) ??
            tRoot("accounts.failed")
        );
        return;
      }
      notifySuccess(t("restored"));
      router.refresh();
    } catch (error) {
      console.error("Restoring a campaign failed:", error);
      notifyError(tRoot("accounts.failed"));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <details className="mt-6" data-testid="archived-campaigns">
      <summary className="cursor-pointer text-lg font-semibold">
        {t("title", { count: campaigns.length })}
      </summary>
      <ul className="mt-2 divide-y divide-gray-100 rounded-md border border-gray-200">
        {campaigns.map((campaign) => (
          <li
            key={campaign.id}
            className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
          >
            <span>
              <Link
                href={dashboardPath(system, `/campaign/${campaign.id}`)}
                className="font-medium text-blue-700 underline"
              >
                {campaign.title}
              </Link>{" "}
              <span className="text-gray-600">
                {t("archivedOn", {
                  date: format.dateTime(campaign.archivedAt, {
                    dateStyle: "medium",
                  }),
                })}
              </span>
            </span>
            <BaseButton
              size={ButtonSize.small}
              variant={ButtonVariant.secondary}
              disabled={busyId !== null}
              onClick={() => void restore(campaign.id)}
            >
              {t("restore", { title: campaign.title })}
            </BaseButton>
          </li>
        ))}
      </ul>
    </details>
  );
}
