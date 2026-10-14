"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import archiveCampaign from "@/app/lib/data/campaigns/archiveCampaign";
import copyCampaign from "@/app/lib/data/campaigns/copyCampaign";
import restoreCampaign from "@/app/lib/data/campaigns/restoreCampaign";
import { notifyError, notifySuccess } from "@/app/lib/notifications/notify";
import { resolveFirstFieldError } from "@/app/lib/utils/i18n/resolveFieldErrors";
import { dashboardPath } from "@/i18n/dashboardPath";
import { useRouter } from "@/i18n/navigation";
import type GameSystem from "@/app/lib/definitions/GameSystem";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonSize from "@/app/ui/buttons/BaseButton/ButtonSize";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";

interface CampaignActionsProps {
  campaignId: number;
  archived: boolean;
  system: GameSystem;
}

/**
 * The campaign page's actions: archive (SPEC-032 §5.6) — "Archivia" while the
 * campaign is active, "Riattiva" once it is not; reversible and it deletes
 * nothing, so it asks no confirmation, and the DM stays on the campaign — and
 * "Copia campagna" (§5.5), after which the DM lands on the copy's page.
 */
export default function CampaignActions({
  campaignId,
  archived,
  system,
}: CampaignActionsProps) {
  const t = useTranslations("campaign.archive");
  const tCopy = useTranslations("campaign.copy");
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

  async function copy() {
    setBusy(true);
    try {
      const result = await copyCampaign({ campaignId });
      if (!result.ok) {
        notifyError(
          resolveFirstFieldError(result.errors, tRoot) ??
            tCopy("campaignFailed")
        );
        return;
      }
      notifySuccess(tCopy("campaignCopied"));
      router.push(dashboardPath(system, `/campaign/${result.id}`));
    } catch (error) {
      console.error("Copying a campaign failed:", error);
      notifyError(tCopy("campaignFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex gap-2">
      <BaseButton
        onClick={() => void copy()}
        disabled={busy}
        size={ButtonSize.small}
        variant={ButtonVariant.secondary}
      >
        {tCopy("campaignButton")}
      </BaseButton>
      <BaseButton
        onClick={() => void toggle()}
        disabled={busy}
        size={ButtonSize.small}
        variant={ButtonVariant.secondary}
      >
        {archived ? t("restore") : t("archive")}
      </BaseButton>
    </div>
  );
}
