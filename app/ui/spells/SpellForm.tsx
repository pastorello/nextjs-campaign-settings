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
import updateSpell from "@/app/lib/data/spells/updateSpell";
import createSpell from "@/app/lib/data/spells/createSpell";
import useSpellPageManager from "@/app/lib/hooks/spells/useSpellPageManager";

interface SpellFormProps {
  formData?: Spell;
  onCancel: () => void;
  onSaveFinished: (page: Spell) => void;
}

export default function SpellForm({
  formData,
  onCancel,
  onSaveFinished,
}: SpellFormProps) {
  const pageManagerSettings: ListItem = {};
  const isEditMode = isValidDataObject(formData);

  if (isEditMode) {
    pageManagerSettings.pageItem = formData;
  }

  const { page, setField, getField, editedFields } =
    useSpellPageManager(pageManagerSettings);

  const FormComponent = (aField: SpellMetaField) => (
    <InputComponent
      fieldName={aField}
      setField={setField}
      value={getField(aField)}
    />
  );

  const onSubmit = async () => {
    if (isEditMode) {
      await updateSpell(
        editedFields.reduce(
          (acc: Spell, item: SpellMetaField) => ({
            ...acc,
            [item]: getField(item),
          }),
          { id: page.id } as Spell
        )
      );
    } else {
      await createSpell(page);
    }
    if (isValidFunction(onSaveFinished)) {
      onSaveFinished(page);
    }
  };

  return (
    <div className="w-[900px] mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">
        {isEditMode ? "Modifica" : "Crea nuovo"} Incantesimo
      </h1>
      <Form action={onSubmit} className="space-y-6">
        <Fieldset className="flex w-full flex-wrap">
          <div className="flex w-full flex-wrap">
            <div className="box-border w-full p-2 lg:w-[30%]">
              {FormComponent(SpellMetaField.nome)}
            </div>
            <div className="box-border w-full p-2 lg:w-[15%]">
              {FormComponent(SpellMetaField.livello)}
            </div>
            <div className="box-border w-full p-2 lg:w-[15%]">
              {FormComponent(SpellMetaField.classi)}
            </div>
            <div className="box-border w-full p-2 lg:w-[40%]">
              {FormComponent(SpellMetaField.circolo)}
            </div>
          </div>

          <div className="flex w-full flex-wrap">
            <div className="box-border w-full p-2 lg:w-[20%]">
              {FormComponent(SpellMetaField.tempoDiLancio)}
            </div>
            <div className="box-border w-full p-2 lg:w-[20%]">
              {FormComponent(SpellMetaField.gittata)}
            </div>
            <div className="box-border w-full p-2 lg:w-[15%]">
              {FormComponent(SpellMetaField.componenti)}
            </div>
            <div className="box-border w-full p-2 lg:w-[25%]">
              {FormComponent(SpellMetaField.durata)}
            </div>
            <div className="box-border w-full p-2 pt-7 lg:w-[20%]">
              {FormComponent(SpellMetaField.rituale)}
            </div>
          </div>

          <div className="flex w-full flex-wrap">
            <div className="box-border w-full p-2 lg:w-[50%]">
              {FormComponent(SpellMetaField.descrizione)}
            </div>
            <div className="box-border w-full p-2 lg:w-[50%]">
              {FormComponent(SpellMetaField.intensificato)}
            </div>
          </div>
        </Fieldset>
        <div className="flex justify-end gap-2">
          <BaseButton disabled={!isValidDataObject(editedFields)}>
            {isEditMode ? "Modifica" : "Crea"} Incantesimo
          </BaseButton>
          <BaseButton onClick={onCancel} variant={ButtonVariant.secondary}>
            {"Annulla"}
          </BaseButton>
        </div>
      </Form>
    </div>
  );
}
