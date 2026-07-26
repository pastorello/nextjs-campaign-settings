"use client";

import { Fieldset } from "@headlessui/react";

import EntityForm from "@/app/ui/forms/EntityForm";
import createPng from "@/app/lib/data/png/createPng";
import updatePng from "@/app/lib/data/png/updatePng";
import PageType from "@/app/lib/definitions/types/PageType";
import PngItem from "@/app/lib/definitions/interfaces/png/PngItem";
import PngMetaField from "@/app/lib/definitions/enums/png/PngMetaField";

// All user-facing copy for this form, in one place for TD-21.
const COPY = {
  createTitle: "Crea nuovo PNG",
  editTitle: "Modifica PNG",
  createButton: "Crea PNG",
  editButton: "Modifica PNG",
};

interface PngFormProps {
  formData?: PngItem;
  onCancel: () => void;
  onSaveFinished: (page: PngItem) => void;
}

export default function PngForm({
  formData,
  onCancel,
  onSaveFinished,
}: PngFormProps) {
  return (
    <EntityForm<PngItem>
      pageType={PageType.Png}
      formData={formData}
      mutations={{ create: createPng, update: updatePng }}
      copy={COPY}
      onCancel={onCancel}
      onSaveFinished={onSaveFinished}
    >
      {(field) => (
        <Fieldset className="flex w-full flex-col">
          <div className="flex w-full gap-2">
            <div className="mb-2 w-[30%]">
              <div className="mb-2 flex w-full">{field(PngMetaField.nome)}</div>
            </div>
            <div className="mb-2 w-[15%]">
              <div className="mb-2 flex w-full">
                {field(PngMetaField.allineamento)}
              </div>
            </div>
            <div className="mb-2 w-[25%]">
              <div className="mb-2 flex w-full">
                {field(PngMetaField.fazione)}
              </div>
            </div>
            <div className="mb-2 w-[30%]">
              <div className="mb-2 flex w-full">
                {field(PngMetaField.luogo)}
              </div>
            </div>
          </div>
          <div className="flex w-full gap-2">
            <div className="mb-2 w-[30%]">
              <div className="mb-2 flex w-full">
                {field(PngMetaField.titolo)}
              </div>
            </div>
            <div className="mb-2 w-[15%]">
              <div className="mb-2 flex w-full">
                {field(PngMetaField.dominioAllineamento)}
              </div>
            </div>
            <div className="mb-2 w-[55%]">
              <div className="mb-2 flex w-full">
                {field(PngMetaField.mansione)}
              </div>
            </div>
          </div>
          <div className="mb-2 flex w-full flex-col p-2">
            <div className="grid grid-cols-4 gap-2">
              <div className="mb-2 flex w-full">
                {field(PngMetaField.aspetto)}
              </div>
              <div className="mb-2 flex w-full">
                {field(PngMetaField.motivazioni)}
              </div>
              <div className="mb-2 flex w-full">
                {field(PngMetaField.personalita)}
              </div>
              <div className="mb-2 flex w-full">
                {field(PngMetaField.segreti)}
              </div>
            </div>
            <div className="mb-2 flex w-full">
              {field(PngMetaField.descrizione)}
            </div>
          </div>
        </Fieldset>
      )}
    </EntityForm>
  );
}
