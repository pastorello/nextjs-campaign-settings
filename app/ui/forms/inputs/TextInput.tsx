import { Field, Input } from "@headlessui/react";

import IconType from "../../buttons/BaseButton/IconType";
import Icon from "../../components/Icon";
import FormLabel from "./FormLabel";
import isValidString from "@/app/lib/utils/validators/isValidString";

interface TextInputProps {
  value: string;
  label?: string;
  onChange: Function;
  placeholder: string;
  icon: IconType;
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
          value={value}
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
