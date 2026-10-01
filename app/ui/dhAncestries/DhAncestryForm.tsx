"use client";

import { Fieldset } from "@headlessui/react";
import { useTranslations } from "next-intl";

import EntityForm from "@/app/ui/forms/EntityForm";
import createDhAncestry from "@/app/lib/data/dhAncestries/createDhAncestry";
import updateDhAncestry from "@/app/lib/data/dhAncestries/updateDhAncestry";
import DhAncestry from "@/app/lib/definitions/interfaces/daggerheart/DhAncestry";
import DhAncestryMetaField from "@/app/lib/definitions/enums/daggerheart/DhAncestryMetaField";
import PageType from "@/app/lib/definitions/types/PageType";

interface DhAncestryFormProps {
  formData?: DhAncestry;
  onCancel: () => void;
  onSaveFinished: (page: DhAncestry) => void;
}

/** A Daggerheart ancestry's form (SPEC-027 T2): its two features in order. */
export default function DhAncestryForm({
  formData,
  onCancel,
  onSaveFinished,
}: DhAncestryFormProps) {
  const t = useTranslations("dhAncestries.form");

  return (
    <EntityForm<DhAncestry>
      pageType={PageType.DhAncestry}
      formData={formData}
      mutations={{ create: createDhAncestry, update: updateDhAncestry }}
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
        <Fieldset className="flex w-full flex-wrap">
          <div className="flex w-full flex-col p-2 md:w-[40%]">
            <div className="mb-2 flex w-full">
              {field(DhAncestryMetaField.name)}
            </div>
            <div className="mb-2 flex w-full">
              {field(DhAncestryMetaField.origin)}
            </div>
          </div>
          <div className="mb-2 flex w-full p-2 md:w-[60%]">
            {field(DhAncestryMetaField.description)}
          </div>
          <div className="flex w-full flex-col p-2 md:w-1/2">
            <div className="mb-2 flex w-full">
              {field(DhAncestryMetaField.featureAName)}
            </div>
            <div className="mb-2 flex w-full">
              {field(DhAncestryMetaField.featureAText)}
            </div>
          </div>
          <div className="flex w-full flex-col p-2 md:w-1/2">
            <div className="mb-2 flex w-full">
              {field(DhAncestryMetaField.featureBName)}
            </div>
            <div className="mb-2 flex w-full">
              {field(DhAncestryMetaField.featureBText)}
            </div>
          </div>
          <div className="mb-2 flex w-full p-2">
            {field(DhAncestryMetaField.imageId)}
          </div>
        </Fieldset>
      )}
    </EntityForm>
  );
}
