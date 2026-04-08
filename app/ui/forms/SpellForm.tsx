import { Fieldset } from "@headlessui/react";

import PageForm from "../forms/PageForm";
import ListItem from "@/app/lib/definitions/interfaces/ListItem";
import useSpellPageManager from "@/app/lib/hooks/spells/useSpellPageManager";
import SpellMetaField from "@/app/lib/definitions/enums/spells/SpellMetaField";
import InputComponent from "./inputs/InputComponent";
import pageMetaFields from "@/app/lib/config/pageMetaFields";

interface SpellFormProps {
  onCancel: Function;
  onSaveFinished: (spell: ListItem) => void;
  pageId?: number;
}

const SpellForm = ({ onCancel, onSaveFinished, pageId }: SpellFormProps) => {
  const { page, setField, savePage, lastError, isSaving } = useSpellPageManager(
    { pageId, onComplete: onSaveFinished }
  );

  const FormComponent = (aField: SpellMetaField) => (
    <InputComponent
      fieldName={aField}
      setField={setField}
      value={page[aField]}
    />
  );

  const theProps = {
    hasEdits:
      page[SpellMetaField.nome] !==
      pageMetaFields[SpellMetaField.nome].defaultValue,
    onSaveFinished: savePage,
    onCancel,
    lastError,
    isSaving,
  };

  return (
    <PageForm {...theProps}>
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
    </PageForm>
  );
};

export default SpellForm;
