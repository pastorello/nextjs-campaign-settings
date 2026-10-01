"use client";

import { Fieldset } from "@headlessui/react";
import { useTranslations } from "next-intl";

import EntityForm from "@/app/ui/forms/EntityForm";
import createDhLoot from "@/app/lib/data/dhLoot/createDhLoot";
import updateDhLoot from "@/app/lib/data/dhLoot/updateDhLoot";
import DhLoot from "@/app/lib/definitions/interfaces/daggerheart/DhLoot";
import DhLootMetaField from "@/app/lib/definitions/enums/daggerheart/DhLootMetaField";
import PageType from "@/app/lib/definitions/types/PageType";

const F = DhLootMetaField;

/** Creates or edits a piece of Daggerheart loot (SPEC-029 §5.3). */
export default function DhLootForm({
  formData,
  onCancel,
  onSaveFinished,
}: {
  formData?: DhLoot;
  onCancel: () => void;
  onSaveFinished: (page: DhLoot) => void;
}) {
  const t = useTranslations("dhLoot.form");

  return (
    <EntityForm<DhLoot>
      pageType={PageType.DhLoot}
      formData={formData}
      mutations={{ create: createDhLoot, update: updateDhLoot }}
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
            <div className="flex min-w-[140px]">{field(F.kind)}</div>
            <div className="flex min-w-[140px]">{field(F.rarity)}</div>
            <div className="flex w-48">{field(F.rollValue)}</div>
          </div>
          <div className="flex w-full">{field(F.effectText)}</div>
          <div className="flex w-full flex-wrap gap-4">
            <div className="flex min-w-[160px]">{field(F.origin)}</div>
            <div className="flex flex-1">{field(F.imageId)}</div>
          </div>
        </Fieldset>
      )}
    </EntityForm>
  );
}
