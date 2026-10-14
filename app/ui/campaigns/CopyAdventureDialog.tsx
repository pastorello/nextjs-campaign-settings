"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import copyAdventure from "@/app/lib/data/campaigns/copyAdventure";
import { notifyError, notifySuccess } from "@/app/lib/notifications/notify";
import { resolveFirstFieldError } from "@/app/lib/utils/i18n/resolveFieldErrors";
import { dashboardPath } from "@/i18n/dashboardPath";
import { useRouter } from "@/i18n/navigation";
import type GameSystem from "@/app/lib/definitions/GameSystem";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonSize from "@/app/ui/buttons/BaseButton/ButtonSize";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";
import Modal from "@/app/ui/components/Modal";
import Select from "@/app/ui/forms/inputs/Select";

const STANDALONE = "standalone";

export interface CopyDestination {
  id: number;
  title: string;
}

interface CopyAdventureDialogProps {
  adventure: { id: number; title: string };
  /** The non-archived campaigns of the adventure's rules system. */
  destinations: CopyDestination[];
  /** Standalone adventures are 5e's, so only a 5e adventure may go there. */
  allowStandalone: boolean;
  system: GameSystem;
  onClose: () => void;
}

/**
 * "Copia in…" (SPEC-032 §5.4): asks which campaign of the adventure's rules
 * system receives the copy — or none, for a standalone adventure — and opens
 * the copy once it is made. The picker is a convenience; `copyAdventure`
 * refuses a destination of another system on its own.
 */
export default function CopyAdventureDialog({
  adventure,
  destinations,
  allowStandalone,
  system,
  onClose,
}: CopyAdventureDialogProps) {
  const t = useTranslations("campaign.copy");
  const tRoot = useTranslations();
  const router = useRouter();

  const options = [
    ...destinations.map((d) => ({ value: String(d.id), label: d.title })),
    ...(allowStandalone ? [{ value: STANDALONE, label: t("standalone") }] : []),
  ];
  const [choice, setChoice] = useState(options[0]?.value ?? "");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      const result = await copyAdventure({
        adventureId: adventure.id,
        destinationCampaignId: choice === STANDALONE ? null : Number(choice),
      });
      if (!result.ok) {
        notifyError(
          resolveFirstFieldError(result.errors, tRoot) ?? t("failed")
        );
        return;
      }
      notifySuccess(t("copied"));
      onClose();
      router.push(dashboardPath(system, `/adventure/${result.id}`));
    } catch (error) {
      console.error("Copying an adventure failed:", error);
      notifyError(t("failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      isOpen
      setIsOpen={(next) => {
        if (!next) onClose();
      }}
      title={t("title", { title: adventure.title })}
      description={t("description")}
      size="small"
    >
      {options.length === 0 ? (
        <p>{t("noDestination")}</p>
      ) : (
        <Select
          label={t("destination")}
          value={choice}
          options={options}
          onChange={(value) => setChoice(String(value))}
        />
      )}
      <div className="mt-4 flex justify-end gap-2">
        <BaseButton
          onClick={onClose}
          size={ButtonSize.small}
          variant={ButtonVariant.secondary}
        >
          {tRoot("common.form.cancel")}
        </BaseButton>
        <BaseButton
          onClick={() => void submit()}
          disabled={busy || options.length === 0}
          size={ButtonSize.small}
        >
          {busy ? t("copying") : t("confirm")}
        </BaseButton>
      </div>
    </Modal>
  );
}
