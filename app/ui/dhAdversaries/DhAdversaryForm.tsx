"use client";

import { Fieldset } from "@headlessui/react";
import { useTranslations } from "next-intl";

import EntityForm from "@/app/ui/forms/EntityForm";
import createDhAdversary from "@/app/lib/data/dhAdversaries/createDhAdversary";
import updateDhAdversary from "@/app/lib/data/dhAdversaries/updateDhAdversary";
import DhAdversary from "@/app/lib/definitions/interfaces/daggerheart/DhAdversary";
import DhAdversaryMetaField from "@/app/lib/definitions/enums/daggerheart/DhAdversaryMetaField";
import PageType from "@/app/lib/definitions/types/PageType";

import DhAdversaryExperienceList from "./DhAdversaryExperienceList";
import DhAdversaryFeatureList from "./DhAdversaryFeatureList";

const F = DhAdversaryMetaField;

/**
 * Creates or edits a Daggerheart adversary (SPEC-028 §5.1). The stat
 * block's fields are the metadata layer's; its experiences and features
 * are ADR-0011's inline rows, shown under the form once the adversary
 * exists — each row saves on its own.
 */
export default function DhAdversaryForm({
  formData,
  onCancel,
  onSaveFinished,
}: {
  formData?: DhAdversary;
  onCancel: () => void;
  onSaveFinished: (page: DhAdversary) => void;
}) {
  const t = useTranslations("dhAdversaries.form");

  return (
    <>
      <EntityForm<DhAdversary>
        pageType={PageType.DhAdversary}
        formData={formData}
        mutations={{ create: createDhAdversary, update: updateDhAdversary }}
        copy={{
          createTitle: t("createTitle"),
          editTitle: t("editTitle"),
          createButton: t("createButton"),
          editButton: t("editButton"),
        }}
        onCancel={onCancel}
        onSaveFinished={onSaveFinished}
      >
        {(field) => (
          <Fieldset className="flex w-full flex-col gap-2 p-2">
            <div className="flex w-full flex-wrap gap-4">
              <div className="flex min-w-[200px] flex-1">{field(F.name)}</div>
              <div className="flex w-32">{field(F.tier)}</div>
              <div className="flex min-w-[140px]">{field(F.adversaryType)}</div>
              <div className="flex min-w-[160px]">{field(F.hordeDensity)}</div>
            </div>
            <div className="flex w-full">{field(F.description)}</div>
            <div className="flex w-full">{field(F.motives)}</div>
            <div className="flex w-full flex-wrap gap-4">
              <div className="flex w-28">{field(F.difficulty)}</div>
              <div className="flex w-36">{field(F.majorThreshold)}</div>
              <div className="flex w-36">{field(F.severeThreshold)}</div>
              <div className="flex w-20">{field(F.hp)}</div>
              <div className="flex w-20">{field(F.stress)}</div>
              <div className="flex w-40">{field(F.attackModifier)}</div>
            </div>
            <div className="flex w-full flex-wrap gap-4">
              <div className="flex min-w-[180px] flex-1">
                {field(F.attackName)}
              </div>
              <div className="flex min-w-[140px]">{field(F.attackRange)}</div>
              <div className="flex w-40">{field(F.attackDamage)}</div>
              <div className="flex min-w-[120px]">{field(F.attackType)}</div>
            </div>
            <div className="flex w-full flex-wrap gap-4">
              <div className="flex min-w-[160px]">{field(F.origin)}</div>
              <div className="flex flex-1">{field(F.imageId)}</div>
            </div>
          </Fieldset>
        )}
      </EntityForm>
      {formData !== undefined && (
        <>
          <DhAdversaryExperienceList
            adversaryId={formData.id}
            experiences={formData.experiences ?? []}
          />
          <DhAdversaryFeatureList
            adversaryId={formData.id}
            features={formData.features ?? []}
          />
        </>
      )}
    </>
  );
}
