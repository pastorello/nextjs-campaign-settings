"use client";

import { Fieldset } from "@headlessui/react";
import { useTranslations } from "next-intl";

import EntityForm from "@/app/ui/forms/EntityForm";
import createDhSubclass from "@/app/lib/data/dhSubclasses/createDhSubclass";
import updateDhSubclass from "@/app/lib/data/dhSubclasses/updateDhSubclass";
import DhSubclass from "@/app/lib/definitions/interfaces/daggerheart/DhSubclass";
import DhSubclassMetaField from "@/app/lib/definitions/enums/daggerheart/DhSubclassMetaField";
import PageType from "@/app/lib/definitions/types/PageType";
import OptionBundle from "@/app/lib/definitions/types/OptionBundle";

import DhSubclassFeatureList from "./DhSubclassFeatureList";

interface DhSubclassFormProps {
  formData?: DhSubclass;
  optionBundle?: OptionBundle | undefined;
  onCancel: () => void;
  onSaveFinished: (page: DhSubclass) => void;
}

/**
 * Creates or edits a Daggerheart subclass (SPEC-021 §5.5). Its tiered
 * features are ADR-0011's inline collection, shown under the form when
 * editing — each feature saves on its own.
 */
export default function DhSubclassForm({
  formData,
  optionBundle,
  onCancel,
  onSaveFinished,
}: DhSubclassFormProps) {
  const t = useTranslations("dhSubclasses.form");

  return (
    <>
      <EntityForm<DhSubclass>
        pageType={PageType.DhSubclass}
        formData={formData}
        mutations={{ create: createDhSubclass, update: updateDhSubclass }}
        copy={{
          createTitle: t("createTitle"),
          editTitle: t("editTitle"),
          createButton: t("createButton"),
          editButton: t("editButton"),
        }}
        optionBundle={optionBundle}
        onCancel={onCancel}
        onSaveFinished={onSaveFinished}
      >
        {(field) => (
          <Fieldset className="flex w-full flex-col gap-2 p-2">
            <div className="flex w-full flex-wrap gap-4">
              <div className="flex min-w-[200px] flex-1">
                {field(DhSubclassMetaField.name)}
              </div>
              <div className="flex min-w-[160px] flex-1">
                {field(DhSubclassMetaField.classId)}
              </div>
            </div>
            <div className="flex w-full flex-wrap gap-4">
              <div className="flex min-w-[160px] flex-1">
                {field(DhSubclassMetaField.spellcastTrait)}
              </div>
              <div className="flex min-w-[160px] flex-1">
                {field(DhSubclassMetaField.origin)}
              </div>
            </div>
            <div className="flex w-full">
              {field(DhSubclassMetaField.description)}
            </div>
          </Fieldset>
        )}
      </EntityForm>
      {formData !== undefined && (
        <DhSubclassFeatureList
          subclassId={formData.id}
          features={formData.features ?? []}
        />
      )}
    </>
  );
}
