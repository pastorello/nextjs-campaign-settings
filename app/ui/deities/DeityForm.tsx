"use client";

import { Fieldset } from "@headlessui/react";

import EntityForm from "@/app/ui/forms/EntityForm";
import createDeity from "@/app/lib/data/deities/createDeity";
import updateDeity from "@/app/lib/data/deities/updateDeity";
import PageType from "@/app/lib/definitions/types/PageType";
import Deity from "@/app/lib/definitions/interfaces/deities/Deity";
import DeityMetaField from "@/app/lib/definitions/enums/deities/DeityMetaField";

// All user-facing copy for this form, in one place for TD-21.
const COPY = {
  createTitle: "Crea nuova Divinità",
  editTitle: "Modifica Divinità",
  createButton: "Crea Divinità",
  editButton: "Modifica Divinità",
};

interface DeityFormProps {
  formData?: Deity;
  onCancel: () => void;
  onSaveFinished: (page: Deity) => void;
}

export default function DeityForm({
  formData,
  onCancel,
  onSaveFinished,
}: DeityFormProps) {
  return (
    <EntityForm<Deity>
      pageType={PageType.Deity}
      formData={formData}
      mutations={{ create: createDeity, update: updateDeity }}
      copy={COPY}
      onCancel={onCancel}
      onSaveFinished={onSaveFinished}
    >
      {(field) => (
        <Fieldset className="flex w-full flex-wrap">
          <div className="flex w-full flex-wrap">
            <div className="box-border w-full p-2 lg:w-[30%]">
              {field(DeityMetaField.name)}
              {field(DeityMetaField.deityTitle)}
              {field(DeityMetaField.deityRank)}
              {field(DeityMetaField.deityType)}
            </div>
            <div className="box-border w-full p-2 lg:w-[15%]">
              {field(DeityMetaField.alignment)}
              {field(DeityMetaField.alignmentDomain)}
              {field(DeityMetaField.residence)}
              {field(DeityMetaField.location)}
            </div>
            <div className="box-border w-full p-2 lg:w-[15%]">
              {field(DeityMetaField.celestialBody)}
              {field(DeityMetaField.tarotCard)}
              {field(DeityMetaField.meaning)}
              {field(DeityMetaField.holidays)}
            </div>
            <div className="box-border w-full p-2 lg:w-[40%]">
              {field(DeityMetaField.color)}
              {field(DeityMetaField.element)}
              {field(DeityMetaField.tradition)}
              {field(DeityMetaField.deityClass)}
            </div>
          </div>
        </Fieldset>
      )}
    </EntityForm>
  );
}
