"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import useMutationSubmit from "@/app/lib/hooks/useMutationSubmit";
import createCampaign from "@/app/lib/data/campaigns/createCampaign";
import updateCampaign from "@/app/lib/data/campaigns/updateCampaign";
import campaignMeta from "@/app/lib/config/campaigns/campaignMeta";
import CampaignMetaField from "@/app/lib/definitions/enums/campaign/CampaignMetaField";
import Campaign from "@/app/lib/definitions/interfaces/campaign/Campaign";
import GameSystem, { isGameSystem } from "@/app/lib/definitions/GameSystem";
import useGameSystem from "@/app/lib/hooks/useGameSystem";
import resolveOptions from "@/app/lib/utils/data/resolveOptions";
import { dashboardPath } from "@/i18n/dashboardPath";
import Select from "@/app/ui/forms/inputs/Select";
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
  // SPEC-018 T3: asked on create only, preselected from the route. A
  // campaign never switches systems, so edit mode neither shows nor sends it.
  const routeSystem = useGameSystem();
  const [system, setSystem] = useState<GameSystem>(routeSystem);
  const systemMeta = campaignMeta[CampaignMetaField.system];
  const systemOptions = resolveOptions(systemMeta.options, t);
  const { errors, isSaving, submit } = useMutationSubmit();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = {
      title,
      synopsis: synopsis.trim() === "" ? null : synopsis,
      partySize: Number(partySize),
    };

    const saved = await submit(() =>
      isEditMode
        ? updateCampaign({ ...fields, id: campaign.id })
        : createCampaign({ ...fields, id: 0, system })
    );
    if (!saved) return;

    // A campaign created for another system is listed only under that
    // system's URL, so go there rather than refresh into the empty state.
    if (!isEditMode && system !== routeSystem) {
      router.push(dashboardPath(system, "/campaign"));
    } else {
      router.refresh();
    }
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
      {!isEditMode && (
        <Select
          label={t(systemMeta.labelKey)}
          value={system}
          options={systemOptions}
          onChange={(value) => {
            if (isGameSystem(value)) setSystem(value);
          }}
        />
      )}
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
