"use client";

import { Fieldset } from "@headlessui/react";

import EntityForm from "@/app/ui/forms/EntityForm";
import createDeity from "@/app/lib/data/deities/createDeity";
import updateDeity from "@/app/lib/data/deities/updateDeity";
import PageType from "@/app/lib/definitions/types/PageType";
import Patrono from "@/app/lib/definitions/interfaces/deities/Patrono";
import PatronoMetaField from "@/app/lib/definitions/enums/deities/PatronoMetaField";

// All user-facing copy for this form, in one place for TD-21.
const COPY = {
  createTitle: "Crea nuova Divinità",
  editTitle: "Modifica Divinità",
  createButton: "Crea Divinità",
  editButton: "Modifica Divinità",
};

interface DeityFormProps {
  formData?: Patrono;
  onCancel: () => void;
  onSaveFinished: (page: Patrono) => void;
}

export default function DeityForm({
  formData,
  onCancel,
  onSaveFinished,
}: DeityFormProps) {
  return (
    <EntityForm<Patrono>
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
              {field(PatronoMetaField.nome)}
              {field(PatronoMetaField.titoloPatrono)}
              {field(PatronoMetaField.gradoPatrono)}
              {field(PatronoMetaField.tipoPatrono)}
            </div>
            <div className="box-border w-full p-2 lg:w-[15%]">
              {field(PatronoMetaField.allineamento)}
              {field(PatronoMetaField.dominioAllineamento)}
              {field(PatronoMetaField.residenza)}
              {field(PatronoMetaField.luogo)}
            </div>
            <div className="box-border w-full p-2 lg:w-[15%]">
              {field(PatronoMetaField.astri)}
              {field(PatronoMetaField.card)}
              {field(PatronoMetaField.significato)}
              {field(PatronoMetaField.festivita)}
            </div>
            <div className="box-border w-full p-2 lg:w-[40%]">
              {field(PatronoMetaField.colore)}
              {field(PatronoMetaField.elemento)}
              {field(PatronoMetaField.tradizione)}
              {field(PatronoMetaField.classe)}
            </div>
          </div>
        </Fieldset>
      )}
    </EntityForm>
  );
}
