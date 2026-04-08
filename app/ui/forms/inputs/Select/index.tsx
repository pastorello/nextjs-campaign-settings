import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
  Field,
} from "@headlessui/react";

import FormLabel from "../FormLabel";
import Icon from "../../../components/Icon";
import IconType from "../../../buttons/BaseButton/IconType";
import SelectValueType from "@/app/lib/definitions/types/SelectValueType";
import SelectOption from "@/app/lib/definitions/types/SelectOption";
import isValidDataArray from "@/app/lib/utils/validators/isValidDataArray";
import isValidString from "@/app/lib/utils/validators/isValidString";
import sortSelectOptions from "@/app/lib/utils/data/sortSelectOptions";
import clsx from "clsx";

interface SelectProps {
  label?: string;
  value: SelectValueType;
  onChange: (value: SelectValueType) => void;
  options: SelectOption[];
  multiple?: boolean;
}

const Select = ({ label, value, onChange, options, multiple }: SelectProps) => {
  const selectedOption = options.find((item) => {
    const currentValue = isValidDataArray(value) ? value[0] : value;
    return String(item.value) === String(currentValue);
  });

  const getDefaultLabel = (): string => {
    const defaultLabel =
      multiple === true || !isValidDataArray(options)
        ? "Seleziona..."
        : options[0].label;

    const valueLabel = selectedOption
      ? `${selectedOption.label}${
          isValidDataArray(value) && value.length > 1
            ? ` +${value.length - 1}`
            : ``
        }`
      : defaultLabel;

    return valueLabel;
  };

  return (
    <Field className="w-full" data-testid="form-select">
      {isValidString(label) && <FormLabel label={label} />}
      <Listbox value={value} onChange={onChange} multiple={multiple === true}>
        <div className="relative">
          <ListboxButton className="flex w-full rounded-md border focus:ring-indigo-500">
            <div className="flex h-[32px] flex-1 items-center truncate px-[5px]">
              {getDefaultLabel()}
            </div>
            <div className="flex h-[32px] w-[28px] items-center px-[5px]">
              <Icon iconType={IconType.chevronDown} />
            </div>
          </ListboxButton>
          <ListboxOptions className="absolute z-10 m-1 mt-1 max-h-60 w-full min-w-38 overflow-auto rounded-md bg-gray-300 p-[3px]">
            {sortSelectOptions(options).map((item) => (
              <ListboxOption
                key={item.value}
                value={item.value}
                className={clsx(
                  "relative cursor-default py-2 pr-9 pl-3 select-none data-focus:bg-white",
                  {
                    "bg-blue-500":
                      multiple === true &&
                      isValidDataArray(value) &&
                      value.some(
                        (item2) => String(item2) === String(item.value)
                      ),
                  }
                )}
              >
                {item.label}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </div>
      </Listbox>
    </Field>
  );
};

export default Select;
