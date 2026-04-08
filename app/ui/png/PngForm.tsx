"use client";

import Form from "next/form";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";
import { Fieldset } from "@headlessui/react";
import InputComponent from "@/app/ui/forms/inputs/InputComponent";
import isValidFunction from "@/app/lib/utils/validators/isValidFunction";
import isValidDataObject from "@/app/lib/utils/validators/isValidDataObject";
import ListItem from "@/app/lib/definitions/interfaces/ListItem";
import PngMetaField from "@/app/lib/definitions/enums/png/PngMetaField";
import PngItem from "@/app/lib/definitions/interfaces/png/PngItem";
import usePngPageManager from "@/app/lib/hooks/png/usePngPageManager";
import createPng from "@/app/lib/data/png/createPng";
import updatePng from "@/app/lib/data/png/updatePng";

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
  const pageManagerSettings: ListItem = {};
  const isEditMode = isValidDataObject(formData);

  if (isEditMode) {
    pageManagerSettings.pageItem = formData;
  }

  const { page, setField, getField, editedFields } =
    usePngPageManager(pageManagerSettings);

  const FormComponent = (aField: PngMetaField) => (
    <InputComponent
      fieldName={aField}
      setField={setField}
      value={getField(aField)}
    />
  );

  const onSubmit = async () => {
    if (isEditMode) {
      await updatePng(
        editedFields.reduce(
          (acc: PngItem, item: PngMetaField) => ({
            ...acc,
            [item]: getField(item),
          }),
          { id: page.id } as PngItem
        )
      );
    } else {
      await createPng(page);
    }
    if (isValidFunction(onSaveFinished)) {
      onSaveFinished(page);
    }
  };

  return (
    <div className="w-[900px] mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">
        {isEditMode ? "Modifica" : "Crea nuovo"} PNG
      </h1>
      <Form action={onSubmit} className="space-y-6">
        <Fieldset className="flex w-full flex-col">
          <div className="flex w-full gap-2">
            <div className="mb-2 w-[30%]">
              <div className="mb-2 flex w-full">
                {FormComponent(PngMetaField.nome)}
              </div>
            </div>
            <div className="mb-2 w-[15%]">
              <div className="mb-2 flex w-full">
                {FormComponent(PngMetaField.allineamento)}
              </div>
            </div>
            <div className="mb-2 w-[25%]">
              <div className="mb-2 flex w-full">
                {FormComponent(PngMetaField.fazione)}
              </div>
            </div>
            <div className="mb-2 w-[30%]">
              <div className="mb-2 flex w-full">
                {FormComponent(PngMetaField.luogo)}
              </div>
            </div>
          </div>
          <div className="flex w-full gap-2">
            <div className="mb-2 w-[30%]">
              <div className="mb-2 flex w-full">
                {FormComponent(PngMetaField.titolo)}
              </div>
            </div>
            <div className="mb-2 w-[15%]">
              <div className="mb-2 flex w-full">
                {FormComponent(PngMetaField.dominioAllineamento)}
              </div>
            </div>
            <div className="mb-2 w-[55%]">
              <div className="mb-2 flex w-full">
                {FormComponent(PngMetaField.mansione)}
              </div>
            </div>
          </div>
          <div className="mb-2 flex w-full flex-col p-2">
            <div className="grid grid-cols-4 gap-2">
              <div className="mb-2 flex w-full">
                {FormComponent(PngMetaField.aspetto)}
              </div>
              <div className="mb-2 flex w-full">
                {FormComponent(PngMetaField.motivazioni)}
              </div>
              <div className="mb-2 flex w-full">
                {FormComponent(PngMetaField.personalita)}
              </div>
              <div className="mb-2 flex w-full">
                {FormComponent(PngMetaField.segreti)}
              </div>
            </div>
            <div className="mb-2 flex w-full">
              {FormComponent(PngMetaField.descrizione)}
            </div>
          </div>
        </Fieldset>
        <div className="flex justify-end gap-2">
          <BaseButton disabled={!isValidDataObject(editedFields)}>
            {isEditMode ? "Modifica" : "Crea"} PNG
          </BaseButton>
          <BaseButton onClick={onCancel} variant={ButtonVariant.secondary}>
            {"Annulla"}
          </BaseButton>
        </div>
      </Form>
    </div>
  );
}
