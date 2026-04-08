"use client";

import Form from "next/form";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";
import { Fieldset } from "@headlessui/react";
import InputComponent from "@/app/ui/forms/inputs/InputComponent";
import isValidFunction from "@/app/lib/utils/validators/isValidFunction";
import isValidDataObject from "@/app/lib/utils/validators/isValidDataObject";
import ListItem from "@/app/lib/definitions/interfaces/ListItem";
import Spell from "@/app/lib/definitions/interfaces/spells/Spell";
import SpellMetaField from "@/app/lib/definitions/enums/spells/SpellMetaField";

import PatronoMetaField from "@/app/lib/definitions/enums/deities/PatronoMetaField";
import Patrono from "@/app/lib/definitions/interfaces/deities/Patrono";
import useDeityPageManager from "@/app/lib/hooks/deities/useDeityPageManager";
import updateDeity from "@/app/lib/data/deities/updateDeity";
import createDeity from "@/app/lib/data/deities/createDeity";

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
  const pageManagerSettings: ListItem = {};
  const isEditMode = isValidDataObject(formData);

  if (isEditMode) {
    pageManagerSettings.pageItem = formData;
  }

  const { page, setField, getField, editedFields } =
    useDeityPageManager(pageManagerSettings);

  const FormComponent = (aField: PatronoMetaField) => (
    <InputComponent
      fieldName={aField}
      setField={setField}
      value={getField(aField)}
    />
  );

  const onSubmit = async () => {
    if (isEditMode) {
      await updateDeity(
        editedFields.reduce(
          (acc: Patrono, item: PatronoMetaField) => ({
            ...acc,
            [item]: getField(item),
          }),
          { id: page.id } as Patrono
        )
      );
    } else {
      await createDeity(page);
    }
    if (isValidFunction(onSaveFinished)) {
      onSaveFinished(page);
    }
  };

  return (
    <div className="w-[900px] mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">
        {isEditMode ? "Modifica" : "Crea nuova"} Divinità
      </h1>
      <Form action={onSubmit} className="space-y-6">
        <Fieldset className="flex w-full flex-wrap">
          <div className="flex w-full flex-wrap">
            <div className="box-border w-full p-2 lg:w-[30%]">
              {FormComponent(PatronoMetaField.nome)}
              {FormComponent(PatronoMetaField.titoloPatrono)}
              {FormComponent(PatronoMetaField.gradoPatrono)}
              {FormComponent(PatronoMetaField.tipoPatrono)}
            </div>
            <div className="box-border w-full p-2 lg:w-[15%]">
              {FormComponent(PatronoMetaField.allineamento)}
              {FormComponent(PatronoMetaField.dominioAllineamento)}
              {FormComponent(PatronoMetaField.residenza)}
              {FormComponent(PatronoMetaField.luogo)}
            </div>
            <div className="box-border w-full p-2 lg:w-[15%]">
              {FormComponent(PatronoMetaField.astri)}
              {FormComponent(PatronoMetaField.card)}
              {FormComponent(PatronoMetaField.significato)}
              {FormComponent(PatronoMetaField.festivita)}
            </div>
            <div className="box-border w-full p-2 lg:w-[40%]">
              {FormComponent(PatronoMetaField.colore)}
              {FormComponent(PatronoMetaField.elemento)}
              {FormComponent(PatronoMetaField.tradizione)}
              {FormComponent(PatronoMetaField.classe)}
            </div>
          </div>
        </Fieldset>
        <div className="flex justify-end gap-2">
          <BaseButton disabled={!isValidDataObject(editedFields)}>
            {isEditMode ? "Modifica" : "Crea"} Divinità
          </BaseButton>
          <BaseButton onClick={onCancel} variant={ButtonVariant.secondary}>
            {"Annulla"}
          </BaseButton>
        </div>
      </Form>
    </div>
  );
}
