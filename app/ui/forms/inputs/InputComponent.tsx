import PrimiviteValue from "@/app/lib/definitions/types/PrimitiveValue";
import ControlType from "@/app/lib/definitions/types/ControlType";
import isValidString from "@/app/lib/utils/validators/isValidString";
import pageMetaFields from "@/app/lib/config/pageMetaFields";
import FormField from "@/app/lib/definitions/interfaces/forms/FormField";

import controlComponents from "./controlComponents";
import MetaConfigKey from "@/app/lib/definitions/types/MetaConfigKey";

interface InputComponentProps {
  fieldName: MetaConfigKey;
  setField: Function;
  value: PrimiviteValue | number[] | string[];
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
      onChange: (aValue: number) => setField(fieldName, aValue),
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
      result.placeholder = isValidString(pageMetaFields[fieldName].placeholder)
        ? pageMetaFields[fieldName].placeholder
        : "";
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
