import { Fragment } from "react";
import { Checkbox, Field } from "@headlessui/react";
import clsx from "clsx";

import Icon from "../../components/Icon";
import FormLabel from "./FormLabel";
import IconType from "../../buttons/BaseButton/IconType";
import ButtonSize from "../../buttons/BaseButton/ButtonSize";
import isValidString from "@/app/lib/utils/validators/isValidString";

interface CheckboxInputProps {
  label: string;
  value: boolean;
  onChange: (checked: boolean) => void;
}

const CheckboxInput = ({ label, value, onChange }: CheckboxInputProps) => {
  return (
    <Field className="flex w-full">
      <div className="flex w-[30px] shrink-0 items-center">
        <Checkbox checked={value === true} onChange={onChange} as={Fragment}>
          {({ checked, disabled }) => (
            <span
              className={clsx("block size-4 rounded border", {
                "bg-white": !checked,
                "bg-blue-500": checked && !disabled,
                "bg-gray-500": checked && disabled,
                "cursor-not-allowed opacity-50": disabled,
              })}
            >
              <Icon
                iconType={IconType.checked}
                size={ButtonSize.small}
                className={clsx("stroke-white", {
                  "opacity-100": checked,
                  "opacity-0": !checked,
                })}
              />
            </span>
          )}
        </Checkbox>
      </div>
      <div className="flex-1 items-center">
        {isValidString(label) && <FormLabel label={label} />}
      </div>
    </Field>
  );
};

export default CheckboxInput;
