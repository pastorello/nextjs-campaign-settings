import MetaValue from "@/app/lib/definitions/types/MetaValue";
import MetaConfigKey from "@/app/lib/definitions/types/MetaConfigKey";
import ControlType from "@/app/lib/definitions/types/ControlType";
import isValidString from "@/app/lib/utils/validators/isValidString";
import pageMetaFields, { fieldMeta } from "@/app/lib/config/pageMetaFields";
import FormField from "@/app/lib/definitions/interfaces/forms/FormField";

import controlComponents from "./controlComponents";

interface InputComponentProps {
  fieldName: MetaConfigKey;
  setField: (field: MetaConfigKey, value: MetaValue) => void;
  // MetaValue is what the metadata layer actually produces; the narrower
  // union here rejected the mixed arrays it allows.
  value: MetaValue;
}

const InputComponent = ({
  fieldName,
  setField,
  value,
}: InputComponentProps) => {
  const getFieldConfig = (): FormField => {
    const result: FormField = {
      label: pageMetaFields[fieldName].label ?? "",
      value: value,
      onChange: (aValue: MetaValue) => setField(fieldName, aValue),
      type: pageMetaFields[fieldName].controlType,
    };

    if (
      pageMetaFields[fieldName].controlType === ControlType.Multiselect ||
      pageMetaFields[fieldName].controlType === ControlType.Select
    ) {
      result.options = pageMetaFields[fieldName].options;
      if (pageMetaFields[fieldName].controlType === ControlType.Multiselect) {
        result.multiple = true;
      }
    }
    if (
      pageMetaFields[fieldName].controlType === ControlType.Text ||
      pageMetaFields[fieldName].controlType === ControlType.Textarea
    ) {
      const declared = fieldMeta[fieldName]?.placeholder;

      result.placeholder = isValidString(declared) ? declared : "";
    }
    return result;
  };

  const field = getFieldConfig();

  if (!field) {
    throw new Error(`Tipo non supportato: ${fieldName}`);
  }

  const Component = controlComponents[field.type];
  return (
    <Component {...field} name={fieldName} id={fieldName} key={fieldName} />
  );
};

export default InputComponent;
