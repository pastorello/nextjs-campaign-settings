"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import archiveCampaign from "@/app/lib/data/campaigns/archiveCampaign";
import restoreCampaign from "@/app/lib/data/campaigns/restoreCampaign";
import { notifyError, notifySuccess } from "@/app/lib/notifications/notify";
import { resolveFirstFieldError } from "@/app/lib/utils/i18n/resolveFieldErrors";
import { useRouter } from "@/i18n/navigation";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonSize from "@/app/ui/buttons/BaseButton/ButtonSize";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";

interface CampaignActionsProps {
  campaignId: number;
  archived: boolean;
}

/**
 * The campaign page's archive action (SPEC-032 §5.6): "Archivia" while the
 * campaign is active, "Riattiva" once it is not. Reversible and it deletes
 * nothing, so it asks no confirmation. The page refreshes to show or drop
 * its banner; the DM stays on the campaign.
 */
export default function CampaignActions({
  campaignId,
  archived,
}: CampaignActionsProps) {
  const t = useTranslations("campaign.archive");
  const tRoot = useTranslations();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      const result = archived
        ? await restoreCampaign({ campaignId })
        : await archiveCampaign({ campaignId });
      if (!result.ok) {
        notifyError(
          resolveFirstFieldError(result.errors, tRoot) ??
            tRoot("accounts.failed")
        );
        return;
      }
      notifySuccess(archived ? t("restored") : t("archived"));
      router.refresh();
    } catch (error) {
      console.error("Archiving or restoring a campaign failed:", error);
      notifyError(tRoot("accounts.failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <BaseButton
      onClick={() => void toggle()}
      disabled={busy}
      size={ButtonSize.small}
      variant={ButtonVariant.secondary}
    >
      {archived ? t("restore") : t("archive")}
    </BaseButton>
  );
}
