"use client";

import { Fieldset } from "@headlessui/react";
import { useTranslations } from "next-intl";

import EntityForm from "@/app/ui/forms/EntityForm";
import createDhEnvironment from "@/app/lib/data/dhEnvironments/createDhEnvironment";
import updateDhEnvironment from "@/app/lib/data/dhEnvironments/updateDhEnvironment";
import DhEnvironment from "@/app/lib/definitions/interfaces/daggerheart/DhEnvironment";
import DhEnvironmentMetaField from "@/app/lib/definitions/enums/daggerheart/DhEnvironmentMetaField";
import PageType from "@/app/lib/definitions/types/PageType";
import OptionBundle from "@/app/lib/definitions/types/OptionBundle";

import DhEnvironmentFeatureList from "./DhEnvironmentFeatureList";

const F = DhEnvironmentMetaField;

/**
 * Creates or edits a Daggerheart environment (SPEC-028 §5.2): its stat
 * block's fields, the adversaries it may bring and the places it
 * describes. Its features are ADR-0011's inline rows, shown under the
 * form once the environment exists.
 */
export default function DhEnvironmentForm({
  formData,
  optionBundle,
  onCancel,
  onSaveFinished,
}: {
  formData?: DhEnvironment;
  /** The adversaries and places it may link to (`dhAdversary`, `zone`). */
  optionBundle?: OptionBundle | undefined;
  onCancel: () => void;
  onSaveFinished: (page: DhEnvironment) => void;
}) {
  const t = useTranslations("dhEnvironments.form");

  return (
    <>
      <EntityForm<DhEnvironment>
        pageType={PageType.DhEnvironment}
        formData={formData}
        mutations={{
          create: createDhEnvironment,
          update: updateDhEnvironment,
        }}
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
              <div className="flex min-w-[200px] flex-1">{field(F.name)}</div>
              <div className="flex w-32">{field(F.tier)}</div>
              <div className="flex min-w-[160px]">
                {field(F.environmentType)}
              </div>
              <div className="flex w-28">{field(F.difficulty)}</div>
            </div>
            <div className="flex w-full">{field(F.description)}</div>
            <div className="flex w-full">{field(F.impulses)}</div>
            <div className="flex w-full flex-wrap gap-4">
              <div className="flex min-w-[200px] flex-1">
                {field(F.adversaryIds)}
              </div>
              <div className="flex min-w-[200px] flex-1">
                {field(F.otherAdversaries)}
              </div>
            </div>
            <div className="flex w-full">{field(F.placeIds)}</div>
            <div className="flex w-full flex-wrap gap-4">
              <div className="flex min-w-[160px]">{field(F.origin)}</div>
              <div className="flex flex-1">{field(F.imageId)}</div>
            </div>
          </Fieldset>
        )}
      </EntityForm>
      {formData !== undefined && (
        <DhEnvironmentFeatureList
          environmentId={formData.id}
          features={formData.features ?? []}
        />
      )}
    </>
  );
}
