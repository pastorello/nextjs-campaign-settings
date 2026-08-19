"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import campaignMeta from "@/app/lib/config/campaigns/campaignMeta";
import CampaignMetaField from "@/app/lib/definitions/enums/campaign/CampaignMetaField";
import Campaign from "@/app/lib/definitions/interfaces/campaign/Campaign";
import PageTitle from "@/app/ui/typography/PageTitle";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonSize from "@/app/ui/buttons/BaseButton/ButtonSize";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";

import CampaignForm from "./CampaignForm";

interface CampaignHeaderProps {
  campaign: Campaign;
}

/**
 * The campaign's own fields (title, synopsis, party size), read-only until
 * the DM asks to edit them — `updateCampaign` (T6) has no other caller in
 * the app. Outside the metadata layer (ADR-0011), same as `CampaignForm`.
 */
export default function CampaignHeader({ campaign }: CampaignHeaderProps) {
  const t = useTranslations();
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <CampaignForm
        campaign={campaign}
        onCancel={() => setIsEditing(false)}
        onSaved={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div>
      <PageTitle className="mb-2">{campaign.title}</PageTitle>
      {campaign.synopsis && (
        <p className="mb-2 whitespace-pre-line text-gray-700">
          {campaign.synopsis}
        </p>
      )}
      <p className="mb-4 text-sm text-gray-600">
        {t(campaignMeta[CampaignMetaField.partySize].labelKey ?? "")}:{" "}
        {campaign.partySize}
      </p>
      <BaseButton
        onClick={() => setIsEditing(true)}
        size={ButtonSize.small}
        variant={ButtonVariant.secondary}
      >
        {t("common.table.edit")}
      </BaseButton>
    </div>
  );
}
