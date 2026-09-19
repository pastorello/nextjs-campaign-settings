"use client";

import { useState } from "react";
import { Fieldset } from "@headlessui/react";
import { useTranslations } from "next-intl";

import EntityForm from "@/app/ui/forms/EntityForm";
import BespokeFormErrorSummary from "@/app/ui/forms/BespokeFormErrorSummary";
import TextInput from "@/app/ui/forms/inputs/TextInput";
import RichTextInput from "@/app/ui/forms/inputs/RichTextInput";
import createDhClass from "@/app/lib/data/dhClasses/createDhClass";
import updateDhClass from "@/app/lib/data/dhClasses/updateDhClass";
import DhClass from "@/app/lib/definitions/interfaces/daggerheart/DhClass";
import DhClassMetaField from "@/app/lib/definitions/enums/daggerheart/DhClassMetaField";
import DhFeatureMetaField from "@/app/lib/definitions/enums/daggerheart/DhFeatureMetaField";
import dhClassFeatureMeta from "@/app/lib/config/daggerheart/dhClassFeatureMeta";
import PageType from "@/app/lib/definitions/types/PageType";
import OptionBundle from "@/app/lib/definitions/types/OptionBundle";
import type FieldErrors from "@/app/lib/definitions/types/FieldErrors";
import MutationResult from "@/app/lib/definitions/types/MutationResult";

import DhClassFeatureList from "./DhClassFeatureList";

interface DhClassFormProps {
  formData?: DhClass;
  optionBundle?: OptionBundle | undefined;
  onCancel: () => void;
  onSaveFinished: (page: DhClass) => void;
}

/** The first feature's inputs, keyed as `createDhClass` reports them. */
const firstFeatureMeta = {
  firstFeatureName: dhClassFeatureMeta[DhFeatureMetaField.name],
  firstFeatureText: dhClassFeatureMeta[DhFeatureMetaField.text],
};

/**
 * Splits a create's refusal: the first feature's errors belong to its own
 * block, whose labels `EntityForm`'s summary cannot resolve.
 */
function splitFirstFeatureErrors(errors: FieldErrors) {
  const feature: FieldErrors = {};
  const rest: FieldErrors = {};
  for (const [key, messages] of Object.entries(errors)) {
    if (key in firstFeatureMeta) feature[key] = messages;
    else rest[key] = messages;
  }
  return { feature, rest };
}

/**
 * Creates or edits a Daggerheart class (SPEC-021 §5.4). The fields are the
 * metadata layer's; the features are ADR-0011's inline collection. A class
 * has at least one feature, so creating one asks for its first feature
 * (sent with the class, in one write); editing one shows the feature list,
 * outside the form — each feature saves on its own.
 */
export default function DhClassForm({
  formData,
  optionBundle,
  onCancel,
  onSaveFinished,
}: DhClassFormProps) {
  const t = useTranslations();
  const isEditMode = formData !== undefined;

  const [firstFeatureName, setFirstFeatureName] = useState("");
  const [firstFeatureText, setFirstFeatureText] = useState("");
  const [firstFeatureErrors, setFirstFeatureErrors] = useState<FieldErrors>({});

  const create = async (page: DhClass): Promise<MutationResult> => {
    const result = await createDhClass({
      ...page,
      firstFeatureName,
      firstFeatureText,
    });
    if (result.ok) return result;
    const { feature, rest } = splitFirstFeatureErrors(result.errors);
    setFirstFeatureErrors(feature);
    return { ok: false, errors: rest };
  };

  return (
    <>
      <EntityForm<DhClass>
        pageType={PageType.DhClass}
        formData={formData}
        mutations={{ create, update: updateDhClass }}
        copy={{
          createTitle: t("dhClasses.form.createTitle"),
          editTitle: t("dhClasses.form.editTitle"),
          createButton: t("dhClasses.form.createButton"),
          editButton: t("dhClasses.form.editButton"),
        }}
        optionBundle={optionBundle}
        onCancel={onCancel}
        onSaveFinished={onSaveFinished}
      >
        {(field) => (
          <Fieldset className="flex w-full flex-col gap-2 p-2">
            <div className="flex w-full flex-wrap gap-4">
              <div className="flex min-w-[200px] flex-1">
                {field(DhClassMetaField.name)}
              </div>
              <div className="flex min-w-[160px]">
                {field(DhClassMetaField.origin)}
              </div>
            </div>
            <div className="flex w-full flex-wrap gap-4">
              <div className="flex min-w-[160px] flex-1">
                {field(DhClassMetaField.domainAId)}
              </div>
              <div className="flex min-w-[160px] flex-1">
                {field(DhClassMetaField.domainBId)}
              </div>
              <div className="flex w-32">
                {field(DhClassMetaField.startingEvasion)}
              </div>
              <div className="flex w-32">
                {field(DhClassMetaField.startingHp)}
              </div>
            </div>
            <div className="flex w-full">
              {field(DhClassMetaField.description)}
            </div>
            <div className="flex w-full">
              {field(DhClassMetaField.classItems)}
            </div>
            <fieldset className="flex w-full flex-col gap-2 rounded-md border p-3">
              <legend className="px-1 text-sm font-medium">
                {t("dhClasses.hopeFeature.legend")}
              </legend>
              {/* The cost is fixed, never stored (SPEC-021 §5.4). */}
              <p className="text-sm text-gray-600">
                {t("dhClasses.hopeFeature.cost")}
              </p>
              <div className="flex w-full">
                {field(DhClassMetaField.hopeFeatureName)}
              </div>
              <div className="flex w-full">
                {field(DhClassMetaField.hopeFeatureText)}
              </div>
            </fieldset>
            {!isEditMode && (
              <fieldset className="flex w-full flex-col gap-2 rounded-md border p-3">
                <legend className="px-1 text-sm font-medium">
                  {t("dhClasses.firstFeature.legend")}
                </legend>
                <p className="text-sm text-gray-600">
                  {t("dhClasses.firstFeature.hint")}
                </p>
                <BespokeFormErrorSummary
                  errors={firstFeatureErrors}
                  meta={firstFeatureMeta}
                />
                <TextInput
                  label={t(firstFeatureMeta.firstFeatureName.labelKey)}
                  value={firstFeatureName}
                  onChange={(value) => setFirstFeatureName(String(value))}
                />
                <RichTextInput
                  label={t(firstFeatureMeta.firstFeatureText.labelKey)}
                  value={firstFeatureText}
                  onChange={(value) => setFirstFeatureText(String(value))}
                />
              </fieldset>
            )}
          </Fieldset>
        )}
      </EntityForm>
      {isEditMode && (
        <DhClassFeatureList
          classId={formData.id}
          features={formData.features ?? []}
        />
      )}
    </>
  );
}
