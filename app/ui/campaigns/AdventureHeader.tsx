"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { dashboardPath } from "@/i18n/dashboardPath";
import useGameSystem from "@/app/lib/hooks/useGameSystem";
import adventureMeta from "@/app/lib/config/campaigns/adventureMeta";
import AdventureMetaField from "@/app/lib/definitions/enums/campaign/AdventureMetaField";
import Adventure from "@/app/lib/definitions/interfaces/campaign/Adventure";
import { CurrencyUnit } from "@/app/lib/utils/currency/convertCurrency";
import PageTitle from "@/app/ui/typography/PageTitle";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonSize from "@/app/ui/buttons/BaseButton/ButtonSize";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";

import AdventureInfoForm from "./AdventureInfoForm";
import renderRichText from "@/app/lib/utils/data/renderRichText";

interface AdventureHeaderProps {
  adventure: Adventure;
}

/**
 * The adventure's own fields (title, target level, synopsis, budget
 * targets), read-only until the DM asks to edit them (SPEC-013 §5.3, T8) —
 * same "read-only until asked" shape `CampaignHeader` uses. `position`/
 * `status` are deliberately absent — `AdventureLadder` owns those. The
 * budget panel (target vs. assigned vs. found) is T9's, not this header's.
 * The free-text `timeline` field this used to show, with a note to move it
 * into calendar events, was dropped in SPEC-014 T8 — see that spec's §10.
 */
export default function AdventureHeader({ adventure }: AdventureHeaderProps) {
  const t = useTranslations();
  const system = useGameSystem();
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <AdventureInfoForm
        adventure={adventure}
        onCancel={() => setIsEditing(false)}
        onSaved={() => setIsEditing(false)}
      />
    );
  }

  const currencyUnit = (adventure.currencyUnit ?? "silver") as CurrencyUnit;

  return (
    <div>
      <Link
        href={dashboardPath(system, "/campaign")}
        className="mb-2 inline-block text-sm text-blue-600 underline"
      >
        {t("adventure.backToCampaign")}
      </Link>
      <PageTitle className="mb-2">{adventure.title}</PageTitle>
      <p className="mb-2 text-sm text-gray-600">
        {t(adventureMeta[AdventureMetaField.targetLevel].labelKey ?? "")}:{" "}
        {adventure.targetLevel}
      </p>
      {adventure.synopsis && (
        <div className="mb-2 text-gray-700">
          {renderRichText(adventure.synopsis)}
        </div>
      )}
      <p className="mb-4 text-sm text-gray-600">
        {t(adventureMeta[AdventureMetaField.currencyUnit].labelKey ?? "")}:{" "}
        {t(`adventure.currencyUnits.${currencyUnit}`)}
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
