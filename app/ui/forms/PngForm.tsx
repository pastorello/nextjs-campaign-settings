import { Fieldset } from "@headlessui/react";

import PageForm from "./PageForm";
import InputComponent from "./inputs/InputComponent";
import ListItem from "@/app/lib/definitions/interfaces/ListItem";
import usePngPageManager from "@/app/lib/hooks/png/usePngPageManager";
import PngMetaField from "@/app/lib/definitions/enums/png/PngMetaField";
import MagicItemMetaField from "@/app/lib/definitions/enums/magicitem/MagicItemMetaField";
import pageMetaFields from "@/app/lib/config/pageMetaFields";

interface PngFormProps {
  onCancel: Function;
  onSaveFinished: (anItem: ListItem) => void;
  pageId?: number;
}

const PngForm = ({ onCancel, onSaveFinished, pageId }: PngFormProps) => {
  const { page, setField, savePage, lastError, isSaving } = usePngPageManager({
    pageId,
    onComplete: onSaveFinished,
  });

  const FormComponent = (aField: PngMetaField) => (
    <InputComponent
      fieldName={aField}
      setField={setField}
      value={page[aField]}
    />
  );

  const theProps = {
    hasEdits:
      page[MagicItemMetaField.nome] !==
      pageMetaFields[MagicItemMetaField.nome].defaultValue,
    onSaveFinished: savePage,
    onCancel,
    lastError,
    isSaving,
  };

  return (
    <PageForm {...theProps}>
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
    </PageForm>
  );
};

export default PngForm;
