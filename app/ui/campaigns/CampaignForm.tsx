"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import createCampaign from "@/app/lib/data/campaigns/createCampaign";
import updateCampaign from "@/app/lib/data/campaigns/updateCampaign";
import campaignMeta from "@/app/lib/config/campaigns/campaignMeta";
import CampaignMetaField from "@/app/lib/definitions/enums/campaign/CampaignMetaField";
import Campaign from "@/app/lib/definitions/interfaces/campaign/Campaign";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import TextInput from "@/app/ui/forms/inputs/TextInput";
import TextareaInput from "@/app/ui/forms/inputs/TextareaInput";
import BespokeFormErrorSummary from "@/app/ui/forms/BespokeFormErrorSummary";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";
import ButtonState from "@/app/ui/buttons/BaseButton/ButtonState";

interface CampaignFormProps {
  campaign?: Campaign | undefined;
  onCancel?: (() => void) | undefined;
  onSaved?: (() => void) | undefined;
}

/**
 * The DM's one campaign: created once from the empty state (SPEC-013 §5.1),
 * edited afterwards from `CampaignHeader`. Outside the metadata layer
 * (ADR-0011) — a hand-rolled form, the same shape `CreateWorldForm` already
 * uses for SPEC-004's other single-record "root" entity, rather than
 * `EntityForm`/`usePageManager`, which resolve fields through `PageType` and
 * `campaign` never registers for one. Field labels still come from
 * `campaignMeta`, per the ADR's "shared either way."
 */
export default function CampaignForm({
  campaign,
  onCancel,
  onSaved,
}: CampaignFormProps) {
  // Global, not namespaced: `campaignMeta`'s `labelKey`s are full paths
  // (ADR-0007), the same resolution `InputComponent`/`FormErrorSummary` use.
  const t = useTranslations();
  const router = useRouter();
  const isEditMode = campaign !== undefined;

  const [title, setTitle] = useState(campaign?.title ?? "");
  const [synopsis, setSynopsis] = useState(campaign?.synopsis ?? "");
  const [partySize, setPartySize] = useState(
    String(
      campaign?.partySize ??
        campaignMeta[CampaignMetaField.partySize].defaultValue
    )
  );
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>(
    {}
  );
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    const payload = {
      ...(isEditMode ? { id: campaign.id } : {}),
      title,
      synopsis: synopsis.trim() === "" ? null : synopsis,
      partySize: Number(partySize),
    } as Campaign;

    const result: MutationResult = isEditMode
      ? await updateCampaign(payload)
      : await createCampaign(payload);

    setIsSaving(false);

    if (!result.ok) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    router.refresh();
    onSaved?.();
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="max-w-md space-y-4"
    >
      <BespokeFormErrorSummary errors={errors} meta={campaignMeta} />
      <TextInput
        label={t(campaignMeta[CampaignMetaField.title].labelKey ?? "")}
        value={title}
        onChange={(value) => setTitle(String(value))}
      />
      <TextareaInput
        label={t(campaignMeta[CampaignMetaField.synopsis].labelKey ?? "")}
        value={synopsis}
        onChange={(value) => setSynopsis(String(value))}
      />
      <TextInput
        label={t(campaignMeta[CampaignMetaField.partySize].labelKey ?? "")}
        value={partySize}
        onChange={(value) => setPartySize(String(value))}
      />
      <div className="flex justify-end gap-2">
        <BaseButton
          buttonState={isSaving ? ButtonState.Loading : ButtonState.Default}
        >
          {isEditMode
            ? t("campaign.form.editButton")
            : t("campaign.form.createButton")}
        </BaseButton>
        {onCancel && (
          <BaseButton
            onClick={onCancel}
            variant={ButtonVariant.secondary}
            buttonState={isSaving ? ButtonState.Disabled : ButtonState.Default}
          >
            {t("common.form.cancel")}
          </BaseButton>
        )}
      </div>
    </form>
  );
}
