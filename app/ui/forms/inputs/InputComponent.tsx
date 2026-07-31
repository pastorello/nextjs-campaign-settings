"use client";

import { useTranslations } from "next-intl";

import MetaValue from "@/app/lib/definitions/types/MetaValue";
import MetaConfigKey from "@/app/lib/definitions/types/MetaConfigKey";
import ControlType from "@/app/lib/definitions/types/ControlType";
import isValidString from "@/app/lib/utils/validators/isValidString";
import pageMetaFields, { fieldMeta } from "@/app/lib/config/pageMetaFields";
import FormField from "@/app/lib/definitions/interfaces/forms/FormField";
import resolveOptions from "@/app/lib/utils/data/resolveOptions";

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
  const t = useTranslations();

  const getFieldConfig = (): FormField => {
    const labelKey = pageMetaFields[fieldName].labelKey;
    const result: FormField = {
      label: labelKey ? t(labelKey) : "",
      value: value,
      onChange: (aValue: MetaValue) => setField(fieldName, aValue),
      type: pageMetaFields[fieldName].controlType,
    };

    if (
      pageMetaFields[fieldName].controlType === ControlType.Multiselect ||
      pageMetaFields[fieldName].controlType === ControlType.Select
    ) {
      const declaredOptions = pageMetaFields[fieldName].options;
      if (declaredOptions !== undefined) {
        // The full union of every domain's options array is too wide for
        // TValue to infer (mixes string- and number-valued option lists);
        // FormField.options only ever needs the string | number default.
        result.options = resolveOptions<string | number>(declaredOptions, t);
      }
      if (pageMetaFields[fieldName].controlType === ControlType.Multiselect) {
        result.multiple = true;
      }
    }
    if (
      pageMetaFields[fieldName].controlType === ControlType.Text ||
      pageMetaFields[fieldName].controlType === ControlType.Textarea
    ) {
      const placeholderKey = fieldMeta[fieldName]?.placeholderKey;

      result.placeholder = isValidString(placeholderKey)
        ? t(placeholderKey)
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
