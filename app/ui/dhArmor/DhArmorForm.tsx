"use client";

import { Fieldset } from "@headlessui/react";
import { useTranslations } from "next-intl";

import EntityForm from "@/app/ui/forms/EntityForm";
import createDhArmor from "@/app/lib/data/dhArmor/createDhArmor";
import updateDhArmor from "@/app/lib/data/dhArmor/updateDhArmor";
import DhArmor from "@/app/lib/definitions/interfaces/daggerheart/DhArmor";
import DhArmorMetaField from "@/app/lib/definitions/enums/daggerheart/DhArmorMetaField";
import PageType from "@/app/lib/definitions/types/PageType";

const F = DhArmorMetaField;

/** Creates or edits a Daggerheart armor (SPEC-029 §5.2). */
export default function DhArmorForm({
  formData,
  onCancel,
  onSaveFinished,
}: {
  formData?: DhArmor;
  onCancel: () => void;
  onSaveFinished: (page: DhArmor) => void;
}) {
  const t = useTranslations("dhArmor.form");

  return (
    <EntityForm<DhArmor>
      pageType={PageType.DhArmor}
      formData={formData}
      mutations={{ create: createDhArmor, update: updateDhArmor }}
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
          </div>
          <div className="flex w-full flex-wrap gap-4">
            <div className="flex w-48">{field(F.major)}</div>
            <div className="flex w-48">{field(F.severe)}</div>
            <div className="flex w-40">{field(F.armorScore)}</div>
          </div>
          <div className="flex w-full">{field(F.featureName)}</div>
          <div className="flex w-full">{field(F.featureText)}</div>
          <div className="flex w-full flex-wrap gap-4">
            <div className="flex min-w-[160px]">{field(F.origin)}</div>
            <div className="flex flex-1">{field(F.imageId)}</div>
          </div>
        </Fieldset>
      )}
    </EntityForm>
  );
}
