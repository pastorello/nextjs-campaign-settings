"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";

import type { ViewerCampaign } from "@/app/lib/auth/Viewer";
import selectCampaign from "@/app/lib/auth/selectCampaign";
import { notifyError } from "@/app/lib/notifications/notify";
import { dashboardPath } from "@/i18n/dashboardPath";
import { useRouter } from "@/i18n/navigation";

/**
 * A player's choice of the campaign they are viewing (SPEC-022 §9), in the
 * place the DM's system switch takes. Shown only with two campaigns or more.
 * The choice is a cookie the server checks on every read; picking one opens
 * that campaign's map, under its system, since a place deep-linked in one
 * campaign may be hidden in the other.
 */
export default function CampaignSelector({
  campaigns,
  currentId,
}: {
  campaigns: ViewerCampaign[];
  currentId: number | null;
}) {
  const t = useTranslations("common.nav");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="w-full">
      <select
        aria-label={t("campaignSelector")}
        value={currentId ?? ""}
        disabled={isPending}
        className="w-full rounded-md bg-gray-50 p-2 text-sm font-medium hover:bg-sky-100 hover:text-blue-600"
        onChange={(event) => {
          const campaignId = Number(event.target.value);
          startTransition(async () => {
            const result = await selectCampaign({ campaignId });
            if (result.ok) {
              router.push(dashboardPath(result.system, "/geography"));
              return;
            }
            // Taken out of that campaign since the page rendered: the
            // refresh drops it from the list.
            notifyError(t("campaignUnavailable"));
            router.refresh();
          });
        }}
      >
        {campaigns.map((campaign) => (
          <option key={campaign.id} value={campaign.id}>
            {campaign.title}
          </option>
        ))}
      </select>
    </div>
  );
}
