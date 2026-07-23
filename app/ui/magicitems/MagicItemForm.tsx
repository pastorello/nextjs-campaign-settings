"use client";

import Form from "next/form";
import { useState } from "react";
import FormErrorSummary from "@/app/ui/components/FormErrorSummary";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";
import { Fieldset } from "@headlessui/react";
import MagicItemMetaField from "@/app/lib/definitions/enums/magicitem/MagicItemMetaField";
import InputComponent from "@/app/ui/forms/inputs/InputComponent";
import useMagicItemPageManager from "@/app/lib/hooks/magicitems/useMagicItemPageManager";
import createMagicItem from "@/app/lib/data/magicitems/createMagicItem";
import MagicItem from "@/app/lib/definitions/interfaces/magicitem/MagicItem";
import isValidFunction from "@/app/lib/utils/validators/isValidFunction";
import isValidDataObject from "@/app/lib/utils/validators/isValidDataObject";
import ListItem from "@/app/lib/definitions/interfaces/ListItem";
import updateMagicItem from "@/app/lib/data/magicitems/updateMagicItem";

interface MagicItemFormProps {
  magicItem?: MagicItem;
  onCancel: () => void;
  onSaveFinished: (page: MagicItem) => void;
}

export default function MagicItemForm({
  magicItem,
  onCancel,
  onSaveFinished,
}: MagicItemFormProps) {
  const pageManagerSettings: ListItem = {};
  const isEditMode = isValidDataObject(magicItem);

  if (isEditMode) {
    pageManagerSettings.magicItem = magicItem;
  }

  const { page, setField, getField, editedFields } =
    useMagicItemPageManager(pageManagerSettings);

  const [errors, setErrors] = useState<Record<string, string[] | undefined>>(
    {}
  );

  const FormComponent = (aField: MagicItemMetaField) => (
    <InputComponent
      fieldName={aField}
      setField={setField}
      value={getField(aField)}
    />
  );

  const onSubmit = async () => {
    let result;

    if (isEditMode) {
      result = await updateMagicItem(
        editedFields.reduce(
          (acc: MagicItem, item: MagicItemMetaField) => ({
            ...acc,
            [item]: getField(item),
          }),
          { id: page.id }
        )
      );
    } else {
      result = await createMagicItem(page);
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
        {isEditMode ? "Modifica" : "Crea nuovo"} oggetto magico
      </h1>
      <Form action={onSubmit} className="space-y-6">
        <FormErrorSummary errors={errors} />
        <Fieldset className="flex w-full flex-wrap">
          <div className="flex w-full flex-wrap">
            <div className="flex w-[40%] flex-col p-2">
              <div className="mb-2 flex w-full">
                {FormComponent(MagicItemMetaField.nome)}
              </div>
              <div className="mb-2 flex w-full gap-4">
                <div className="mb-2 flex w-[50%]">
                  {FormComponent(MagicItemMetaField.tipo)}
                </div>
                <div className="mb-2 flex w-[50%]">
                  {FormComponent(MagicItemMetaField.rarita)}
                </div>
              </div>
              <div className="mb-2 flex w-full">
                {FormComponent(MagicItemMetaField.sintonia)}
              </div>
            </div>
            <div className="mb-2 flex w-[60%] p-2">
              {FormComponent(MagicItemMetaField.descrizione)}
            </div>
          </div>
        </Fieldset>
        <div className="flex justify-end gap-2">
          <BaseButton>
            {isEditMode ? "Modifica" : "Crea"} oggetto magico
          </BaseButton>
          <BaseButton onClick={onCancel} variant={ButtonVariant.secondary}>
            {"Annulla"}
          </BaseButton>
        </div>
      </Form>
    </div>
  );
}
