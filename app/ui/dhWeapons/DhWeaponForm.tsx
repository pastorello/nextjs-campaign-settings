"use client";

import { Fieldset } from "@headlessui/react";
import { useTranslations } from "next-intl";

import EntityForm from "@/app/ui/forms/EntityForm";
import createDhWeapon from "@/app/lib/data/dhWeapons/createDhWeapon";
import updateDhWeapon from "@/app/lib/data/dhWeapons/updateDhWeapon";
import DhWeapon from "@/app/lib/definitions/interfaces/daggerheart/DhWeapon";
import DhWeaponMetaField from "@/app/lib/definitions/enums/daggerheart/DhWeaponMetaField";
import PageType from "@/app/lib/definitions/types/PageType";

const F = DhWeaponMetaField;

/** Creates or edits a Daggerheart weapon (SPEC-029 §5.1). */
export default function DhWeaponForm({
  formData,
  onCancel,
  onSaveFinished,
}: {
  formData?: DhWeapon;
  onCancel: () => void;
  onSaveFinished: (page: DhWeapon) => void;
}) {
  const t = useTranslations("dhWeapons.form");

  return (
    <EntityForm<DhWeapon>
      pageType={PageType.DhWeapon}
      formData={formData}
      mutations={{ create: createDhWeapon, update: updateDhWeapon }}
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
            <div className="flex min-w-[140px]">{field(F.slot)}</div>
          </div>
          <div className="flex w-full flex-wrap gap-4">
            <div className="flex min-w-[140px]">{field(F.trait)}</div>
            <div className="flex min-w-[140px]">{field(F.range)}</div>
            <div className="flex w-36">{field(F.damageDie)}</div>
            <div className="flex w-36">{field(F.damageBonus)}</div>
            <div className="flex min-w-[120px]">{field(F.damageType)}</div>
            <div className="flex min-w-[140px]">{field(F.burden)}</div>
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
