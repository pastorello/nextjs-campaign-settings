"use client";

import Form from "next/form";
import { useState } from "react";
import FormErrorSummary from "@/app/ui/components/FormErrorSummary";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";
import { Fieldset } from "@headlessui/react";
import InputComponent from "@/app/ui/forms/inputs/InputComponent";
import isValidFunction from "@/app/lib/utils/validators/isValidFunction";
import isValidDataObject from "@/app/lib/utils/validators/isValidDataObject";

import PatronoMetaField from "@/app/lib/definitions/enums/deities/PatronoMetaField";
import Patrono from "@/app/lib/definitions/interfaces/deities/Patrono";
import usePageManager from "@/app/lib/hooks/usePageManager";
import PageType from "@/app/lib/definitions/types/PageType";
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
  const isEditMode = isValidDataObject(formData);

  const { page, setField, getField, editedFields } = usePageManager(
    PageType.Deity,
    formData
  );

  const [errors, setErrors] = useState<Record<string, string[] | undefined>>(
    {}
  );

  const FormComponent = (aField: PatronoMetaField) => (
    <InputComponent
      fieldName={aField}
      setField={setField}
      value={getField(aField)}
    />
  );

  const onSubmit = async () => {
    let result;

    if (isEditMode) {
      result = await updateDeity(
        editedFields.reduce<Patrono>(
          (acc, item) => ({ ...acc, [item]: getField(item) }),
          { id: page.id } as Patrono
        )
      );
    } else {
      result = await createDeity(page);
    }
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
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
        <FormErrorSummary errors={errors} />
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
