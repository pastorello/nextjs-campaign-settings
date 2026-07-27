import { Field, Input } from "@headlessui/react";

import MetaValue from "@/app/lib/definitions/types/MetaValue";
import IconType from "../../buttons/BaseButton/IconType";
import Icon from "../../components/Icon";
import FormLabel from "./FormLabel";
import isValidString from "@/app/lib/utils/validators/isValidString";

interface TextInputProps {
  // MetaValue rather than string: the registry that renders this hands every
  // control the same shape (TD-08 step 4). A text field's value is a string in
  // practice, and String() keeps it one without asserting it.
  value: MetaValue;
  label?: string;
  onChange: (value: MetaValue) => void;
  placeholder?: string;
  icon?: IconType;
}

const TextInput = ({
  value,
  label,
  onChange,
  placeholder,
  icon,
}: TextInputProps) => {
  return (
    <Field className="w-full">
      {isValidString(label) && <FormLabel label={label} />}
      <div className="relative">
        <Input
          placeholder={isValidString(placeholder) ? placeholder : ""}
          className="flex h-[32px] w-full items-center truncate rounded-md border px-[5px] focus:ring-indigo-500"
          name="label"
          onChange={(event) => onChange(event.target.value)}
          value={String(value ?? "")}
        />
        {isValidString(icon) && (
          <Icon
            iconType={icon}
            className="absolute top-0 right-0 flex h-full items-center pr-3 text-gray-400"
          />
        )}
      </div>
    </Field>
  );
};

export default TextInput;
